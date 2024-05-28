import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        fullName: {
            type: String,
            required: [true, "Full Name is required"],
            index: true,
            trim: true,
        },
        email: {
            type: String,
            lowercase: true,
            required: [true, "email is required"],
            unique: [true, "email is already taken"],
            trim: true,
        },
        userName: {
            type: String,
            trim: true,
            lowercase: true,
            required: [true, "Username is required"],
            unique: [true, "Username is already taken"],
            index: true,
        },
        avatar: {
            type: String,
            required: [true, "Profile pic is required"],
        },
        coverImage: {
            type: String,
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
            },
        ],
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    // if the password is modified then allow the hashed password otherwise do nothing

    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
    const accessToken = jwt.sign(
        {
            _id: this._id,
            username: this.username,
            email: this.email,
            fullName: this.fullName,
        },
        process.env.JWT_ACCESS_TOKEN_SECRET
        ,
        {
            expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY,
        }
    );
    return accessToken;
}

userSchema.methods.generateRefreshToken = function () {
    const refreshToken = jwt.sign(
        {
            _id: this._id,
        },
        process.env.JWT_REFRESH_TOKEN_SECRET
        ,
        {
            expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY,
        }
    );
    return refreshToken;
}

export const User = mongoose.model("User", userSchema);
