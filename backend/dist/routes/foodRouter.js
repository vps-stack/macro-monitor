"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const food = __importStar(require("../controllers/nutrientsController"));
const newProductSchema_1 = require("../schemas/newProductSchema");
const schema_validation_1 = require("../middleware/schema-validation");
const auth_1 = require("../middleware/auth");
const foodRouter = (0, express_1.Router)();
foodRouter
    .post("/food", auth_1.authenticate, newProductSchema_1.productSchema, schema_validation_1.validateSchema, food.createFood)
    .get("/food", auth_1.authenticate, food.getAllFood)
    .put("/food/images/:id", auth_1.authenticate, food.uploadImage)
    .delete("/food", auth_1.authenticate, food.deleteFoodItem);
exports.default = foodRouter;
