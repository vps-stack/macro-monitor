"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const foodRouter_1 = __importDefault(require("./routes/foodRouter"));
const optionsRouter_1 = __importDefault(require("./routes/optionsRouter"));
const consumptionRouter_1 = __importDefault(require("./routes/consumptionRouter"));
const archiveRouter_1 = __importDefault(require("./routes/archiveRouter"));
const authRouter_1 = __importDefault(require("./routes/authRouter"));
require("./utils/mongodb");
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const rate_limiter_1 = require("./middleware/rate-limiter");
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
const PORT = process.env.PORT;
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.set('trust proxy', 1);
app.use(rate_limiter_1.generalLimiter);
app.use("/api/", authRouter_1.default);
app.use("/api/", foodRouter_1.default);
app.use("/api/", optionsRouter_1.default);
app.use("/api/", consumptionRouter_1.default);
app.use("/api/", archiveRouter_1.default);
app.listen(PORT, () => {
    console.log(`Server is listening on port: ${PORT}`);
});
