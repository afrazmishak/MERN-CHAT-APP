import jwt from "jsonwebtoken"
import { parse } from "cookie"

import User from "../models/User.js"
import { AUTH_COOKIE_NAME } from "../utils/token.js"

export async function authenticateSocket(scoket, next) {
    try {
        const cookieHeader = scoket.request.headers.cookie || "";
        const cookies = parse(cookieHeader);

        const token = cookies[AUTH_COOKIE_NAME];

        if (!token) {
            const error = new Error ("Authentication required");
            error.data = {
                code: "AUTHENTICATION_REQUIRED",
            };

            return next(error);
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decodedToken.userId).select(
            "_id name username email"
        );

        if (!user) {
            const error = new Error("User account not found");
            error.data = {
                code: "USER_NOT_FOUND",
            };

            return next(error);
        }

        scoket.user = {
            id: user._id.toString(),
            name: user.name,
            username: user.username,
            email: user.email,
        };

        return next();
    } catch {
        const error = new Error("Your session is invalid or has expired");
        error.data = {
            code: "INVALID_SESSION",
        };

        return next(error);
    }
}