import { Request, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { User, UserDocument } from "../models/user";

export interface AuthRequest extends Request {
    userId: string;
    user?: UserDocument;
}

interface JwtPayload {
    userId: string;
}

export const generateToken = (payload: JwtPayload): string => {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || "1h";

    if (!secret) {
        throw new Error("JWT_SECRET is not defined");
    }

    return jwt.sign(payload, secret, {
        expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
    });
};

const verifyToken = (token: string): JwtPayload => {
    return jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
};

export const authenticate: RequestHandler = async (req, res, next) => {
    const authReq = req as AuthRequest;

    try {
        const token = req.cookies.jwt;

        if (!token) {
            return res.status(401).json({ msg: "Authentication failed!" });
        }

        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ msg: "User not found!" });
        }

        authReq.userId = decoded.userId;
        authReq.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ msg: "Authentication error!" });
    }
};
