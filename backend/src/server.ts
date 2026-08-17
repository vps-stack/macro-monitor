import express from "express";
import dotenv from "dotenv";
dotenv.config();
import foodRouter from "./routes/foodRouter";
import optionsRouter from "./routes/optionsRouter";
import consumptionRouter from "./routes/consumptionRouter";
import archiveRouter from "./routes/archiveRouter";
import authRouter from "./routes/authRouter";
import "./utils/mongodb";
import cors from "cors";
import cookieParser from "cookie-parser";
import { generalLimiter } from "./middleware/rate-limiter";
import helmet from "helmet";

const app = express();

app.use(helmet());
app.use(cookieParser());
const PORT = process.env.PORT;

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true 
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.set('trust proxy', 1);

app.use(generalLimiter);

app.use("/api/", authRouter);
app.use("/api/", foodRouter);
app.use("/api/", optionsRouter);
app.use("/api/", consumptionRouter);
app.use("/api/", archiveRouter);

app.listen(PORT, ()=>{
    console.log(`Server is listening on port: ${PORT}`);
});
