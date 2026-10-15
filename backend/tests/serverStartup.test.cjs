/* eslint-env node */
/* eslint @typescript-eslint/no-var-requires: "off" */
const assert = require("node:assert/strict");
const { test, mock } = require("node:test");
const path = require("node:path");

require("ts-node").register({ project: path.join(__dirname, "../tsconfig.json") });
// Never load local credentials, connect to a database or open a real HTTP port.
mock.method(require("dotenv"), "config", () => ({}));
const mongoose = require("mongoose");
const unexpectedOperation = () => { throw new Error("Unmocked startup operation"); };
const connect = mock.method(mongoose, "connect", unexpectedOperation);
const listen = mock.method(require("express").application, "listen", unexpectedOperation);
const { startServer } = require("../src/server");

const testUrl = "mongodb://test-user:test-password@db.invalid/test-db";

function setup(t) {
  const previousUrl = process.env.MONGO_URL;
  const previousDatabase = process.env.DATABASE;
  const previousExitCode = process.exitCode;
  process.env.MONGO_URL = testUrl;
  process.env.DATABASE = "test-db";
  process.exitCode = undefined;
  connect.mock.resetCalls();
  listen.mock.resetCalls();
  listen.mock.mockImplementation((port, onListening) => onListening());
  const log = t.mock.method(console, "log", () => {});
  const error = t.mock.method(console, "error", () => {});
  t.after(() => {
    if (previousUrl === undefined) delete process.env.MONGO_URL;
    else process.env.MONGO_URL = previousUrl;
    if (previousDatabase === undefined) delete process.env.DATABASE;
    else process.env.DATABASE = previousDatabase;
    process.exitCode = previousExitCode;
    connect.mock.mockImplementation(unexpectedOperation);
    listen.mock.mockImplementation(unexpectedOperation);
  });
  return { log, error };
}

test("importing the server does not connect or listen", () => {
  assert.equal(connect.mock.callCount(), 0);
  assert.equal(listen.mock.callCount(), 0);
});

test("waits for MongoDB before listening exactly once and logging startup success", async (t) => {
  const { log, error } = setup(t);
  let resolveConnection;
  connect.mock.mockImplementation(() => new Promise((resolve) => { resolveConnection = resolve; }));
  const startup = startServer();
  assert.equal(connect.mock.callCount(), 1);
  assert.deepEqual(connect.mock.calls[0].arguments, [testUrl, { dbName: "test-db" }]);
  assert.equal(listen.mock.callCount(), 0);
  assert.equal(log.mock.callCount(), 0);

  resolveConnection(mongoose);
  await startup;
  assert.equal(listen.mock.callCount(), 1);
  assert.deepEqual(log.mock.calls.map((call) => call.arguments[0]), [
    "Connected to mongoDB!",
    `Server is listening on port: ${process.env.PORT}`,
  ]);
  assert.equal(error.mock.callCount(), 0);
  assert.equal(process.exitCode, undefined);
});

test("missing MONGO_URL skips connect/listen and sets a nonzero exit code", async (t) => {
  const { log, error } = setup(t);
  delete process.env.MONGO_URL;
  await startServer();
  assert.equal(connect.mock.callCount(), 0);
  assert.equal(listen.mock.callCount(), 0);
  assert.equal(log.mock.callCount(), 0);
  assert.equal(process.exitCode, 1);
  assert.deepEqual(error.mock.calls.map((call) => call.arguments), [
    ["Server startup failed:", "MONGO_URL is not configured."],
  ]);
});

test("connect rejection prevents listening and reports only a redacted error", async (t) => {
  const { log, error } = setup(t);
  connect.mock.mockImplementation(async () => {
    throw new Error(`Cannot connect to ${testUrl}; password=test-password`);
  });
  await startServer();
  assert.equal(connect.mock.callCount(), 1);
  assert.equal(listen.mock.callCount(), 0);
  assert.equal(log.mock.callCount(), 0);
  assert.equal(process.exitCode, 1);
  assert.deepEqual(error.mock.calls.map((call) => call.arguments), [
    ["Server startup failed:", "Initial MongoDB connection failed."],
  ]);
  const output = JSON.stringify(error.mock.calls.map((call) => call.arguments));
  assert.ok(!output.includes(testUrl));
  assert.ok(!output.includes("test-password"));
});
