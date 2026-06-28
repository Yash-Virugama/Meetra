import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import ApiError from "../utils/apiError.js";
import asyncHandler from "./asyncHandler.js";


const isLogin = asyncHandler(async (req, res, next) => {
    const token =
        req.headers.authorization?.replace("Bearer ", "") ||
        req.body?.token ||
        req.query?.token;

    if (!token) {
        throw new ApiError(401, "Authentication required");
    }

    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        throw new ApiError(401, "Invalid or expired token");
    }

    const user = await User.findById(decoded.id);

    if (!user) {
        throw new ApiError(401, "Invalid or expired token");
    }

    req.user = user;
    next();
});

export default isLogin;