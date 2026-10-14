/* eslint-env node */
/* eslint @typescript-eslint/no-var-requires: "off" */
const assert = require("node:assert/strict");
const { test, mock } = require("node:test");
const path = require("node:path");

require("ts-node").register({ project: path.join(__dirname, "../tsconfig.json") });
// Do not load credentials or environment files in this isolated controller suite.
mock.method(require("dotenv"), "config", () => ({}));
const { cloudinary } = require("../src/cloudinary/cloudinary");
const { Food } = require("../src/models/nutrients");
// Fail closed if a test forgets to install its mocks. No network operations are allowed.
const unexpectedOperation = () => { throw new Error("Unmocked external operation"); };
mock.method(cloudinary.uploader, "upload", unexpectedOperation);
mock.method(cloudinary.uploader, "destroy", unexpectedOperation);
mock.method(Food, "findOne", unexpectedOperation);
mock.method(Food, "findOneAndUpdate", unexpectedOperation);
const { uploadImage } = require("../src/controllers/nutrientsController");

const userA = "aaaaaaaaaaaaaaaaaaaaaaaa";
const userB = "bbbbbbbbbbbbbbbbbbbbbbbb";
const foodA = { _id: "111111111111111111111111", userId: userA, image: "user-a/old-image" };
const foodB = { _id: "222222222222222222222222", userId: userB, image: "user-b/private-image" };
const newImage = "user-a/new-image";

function setup(t, options = {}) {
  const events = [];
  const find = t.mock.method(Food, "findOne", async (filter) => {
    events.push("find");
    if (options.readError) throw new Error("Database read failed");
    return [foodA, foodB].find((food) => food._id === filter._id && food.userId === filter.userId) || null;
  });
  const upload = t.mock.method(cloudinary.uploader, "upload", async () => {
    events.push("upload");
    if (options.uploadError) throw new Error("Upload failed");
    return { public_id: newImage };
  });
  const update = t.mock.method(Food, "findOneAndUpdate", async () => {
    events.push("update");
    if (options.updateError) throw new Error("Database write failed");
    return options.missingUpdate ? null : { ...foodA, image: newImage };
  });
  const destroy = t.mock.method(cloudinary.uploader, "destroy", async (id) => {
    events.push(`destroy:${id}`);
    if (options.destroyError) throw new Error("Destroy failed");
    return { result: "ok" };
  });
  const req = {
    userId: userA,
    params: { id: foodA._id },
    body: { image: "data:image/png;base64,test", previousImage: foodB.image },
  };
  const res = {
    statusCode: undefined,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    send(body) { this.body = body; return this; },
  };
  return { req, res, events, find, upload, update, destroy };
}

for (const [label, id] of [
  ["another user's food", foodB._id],
  ["unknown food", "333333333333333333333333"],
  ["invalid food ID", "invalid-id"],
]) {
  test(`${label} returns 404 without uploading, updating or deleting`, async (t) => {
    const { req, res, upload, update, destroy } = setup(t);
    req.params.id = id;
    await uploadImage(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(upload.mock.callCount(), 0);
    assert.equal(update.mock.callCount(), 0);
    assert.equal(destroy.mock.callCount(), 0);
  });
}

test("authorized replacement ignores a forged previousImage and deletes only the stored image", async (t) => {
  const { req, res, events, find, upload, update, destroy } = setup(t);
  await uploadImage(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.image, newImage);
  const filter = { _id: foodA._id, userId: userA };
  assert.deepEqual(find.mock.calls[0].arguments, [filter]);
  assert.equal(upload.mock.calls[0].arguments[0], req.body.image);
  assert.deepEqual(update.mock.calls[0].arguments, [filter, { image: newImage }, { new: true }]);
  assert.deepEqual(destroy.mock.calls.map((call) => call.arguments), [[foodA.image]]);
  assert.deepEqual(events, ["find", "upload", "update", `destroy:${foodA.image}`]);
});

test("stored old image is deleted even when previousImage is omitted", async (t) => {
  const { req, res, destroy } = setup(t);
  delete req.body.previousImage;
  await uploadImage(req, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(destroy.mock.calls[0].arguments, [foodA.image]);
});

test("first image upload does not delete the client-provided image", async (t) => {
  const { req, res, find, destroy } = setup(t);
  find.mock.mockImplementation(async () => ({ ...foodA, image: undefined }));
  await uploadImage(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(destroy.mock.callCount(), 0);
});

for (const [label, options] of [
  ["DB update rejects", { updateError: true }],
  ["DB update returns null", { missingUpdate: true }],
]) {
  test(`${label}: cleans up the new upload and preserves the old image`, async (t) => {
    const { req, res, destroy, events } = setup(t, options);
    await uploadImage(req, res);
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { msg: "Image update failed!" });
    assert.deepEqual(destroy.mock.calls.map((call) => call.arguments), [[newImage]]);
    assert.deepEqual(events, ["find", "upload", "update", `destroy:${newImage}`]);
  });
}

test("cleanup failure still returns a controlled error and never deletes the old image", async (t) => {
  const { req, res, destroy } = setup(t, { updateError: true, destroyError: true });
  const log = t.mock.method(console, "error", () => {});
  await uploadImage(req, res);
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { msg: "Image update failed!" });
  assert.deepEqual(destroy.mock.calls.map((call) => call.arguments), [[newImage]]);
  assert.equal(log.mock.callCount(), 1);
});

test("failed old-image deletion never cleans up the now-persisted new image", async (t) => {
  const { req, res, destroy } = setup(t, { destroyError: true });
  await uploadImage(req, res);
  assert.equal(res.statusCode, 500);
  assert.deepEqual(destroy.mock.calls.map((call) => call.arguments), [[foodA.image]]);
});

test("DB read failure causes no Cloudinary operations", async (t) => {
  const { req, res, upload, update, destroy } = setup(t, { readError: true });
  await uploadImage(req, res);
  assert.equal(res.statusCode, 500);
  assert.equal(upload.mock.callCount(), 0);
  assert.equal(update.mock.callCount(), 0);
  assert.equal(destroy.mock.callCount(), 0);
});

test("upload failure leaves the document and its old image untouched", async (t) => {
  const { req, res, update, destroy } = setup(t, { uploadError: true });
  await uploadImage(req, res);
  assert.equal(res.statusCode, 500);
  assert.equal(update.mock.callCount(), 0);
  assert.equal(destroy.mock.callCount(), 0);
});
