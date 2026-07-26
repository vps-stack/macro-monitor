"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productSchema = void 0;
const express_validator_1 = require("express-validator");
exports.productSchema = [
    (0, express_validator_1.body)("name")
        .exists().trim().isLength({ min: 2, max: 40 }).withMessage("The name must be between 2 and 40 characters long!"),
    (0, express_validator_1.body)("calories")
        .exists().trim().isNumeric().withMessage("Calories cannot be empty and must be a number!"),
    (0, express_validator_1.body)("carbohydrates")
        .exists().trim().isNumeric().withMessage("Carbohydrates cannot be empty and must be a number!"),
    (0, express_validator_1.body)("fat")
        .exists().trim().isNumeric().withMessage("Fat cannot be empty and must be a number!"),
    (0, express_validator_1.body)("protein")
        .exists().trim().isNumeric().withMessage("Protein cannot be empty and must be a number!"),
    (0, express_validator_1.body)("saturatedFat")
        .exists().trim().isNumeric().withMessage("Saturated fat cannot be empty and must be a number!"),
    (0, express_validator_1.body)("sugar")
        .exists().trim().isNumeric().withMessage("Sugar cannot be empty and must be a number!"),
    (0, express_validator_1.body)("salt")
        .exists().trim().isNumeric().withMessage("Salt cannot be empty and must be a number!"),
];
