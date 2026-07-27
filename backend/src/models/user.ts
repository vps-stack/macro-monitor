import { HydratedDocument, Schema, model } from "mongoose";
import bcrypt from "bcrypt";

export type UserData = {
    email: string;
    password: string;
    name?: string;
    createdAt: Date;
}

export type UserDocument = HydratedDocument<UserData>;

const userSchema = new Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    name: { type: String },
    createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        this.password = await bcrypt.hash(this.password, 12);
        next();
    } catch (error: unknown) {
        const passwordError = error instanceof Error ? error : new Error("Failed to hash password");
        next(passwordError);
    }
});

userSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
};

export const User = model<UserData>("User", userSchema);
