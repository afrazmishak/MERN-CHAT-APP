import jwt from "jsonwebtoken"

import User from "../models/User.js"
import AppError from"../utils/AppError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { AUTH_COOKIE_NAME }  from "../utils/token.js"

export const protect = asyncHandler(async (request, response, next) => {
    const token = request.cookies[AUTH_COOKIE_NAME];

    if (!token) {
        throw new AppError("Authentication required", 401);
    }

    let decodedToken;

    try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        throw new AppError("Your session is invalid or has expired", 401);
    }

    const user = await User.findById(decodedToken.userId).select(
        "_id name username email createdAt"
    );

    if (!user) {
        throw new AppError("The account associated with this session no longer exists", 401);
    }

    request.user = user;

    next();
})