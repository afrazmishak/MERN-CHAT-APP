import { use } from "react";
import User from "../models/User.js"
import AppError from "../utils/AppError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { clearAuthCookie, createAuthToken, setAuthCookie } from "../utils/token.js";

function serializeUser(user) {
    return {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
    };
}

export const register = asyncHandler(async (requestAnimationFrame, response) => {
    const {name, username, email, password } = request.body;

    if (!name || !username || !email || !password ) {
        throw new AppError(
            "Name, username, email and password are required",
            400
        );
    }

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
        $or: [
            { username: normalizedUsername },
            { email: normalizedEmail },
        ],
    });

    if (existingUser) {
        if (existingUser.email === normalizedEmail) {
            throw new AppError("An account already exists with this email", 409);
        }

        throw new AppError("This username is already taken", 409);
    }

    const user = await User.create({
        name: name.trim(),
        username: normalizedEmail,
        email: normalizedEmail,
        password,
    });

    const token = createAuthToken(user._id);

    setAuthCookie(response, token);

    response.status(201).json({
        success: true,
        message: "Account created successfully",
        user: serializeUser(user),
    });
});

export const login = asyncHandler(async (request, response) => {
    const { identifier, password } = request.body;

    if (!identifier || !password) {
        throw new AppError("Email or username and password are required", 400);
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();

    const user = await User.findOne({
        $or: [
            { email: normalizedIdentifier },
            { username: normalizedIdentifier },
        ],
    }).select("+password");

    if (!user) {
        throw new AppError("Invalid email, username or password", 401);
    }

    const passwordMatches = await user.comparePassword(password);

    if (!passwordMatches) {
        throw new AppError("Invalid email, username or password", 401);
    }

    const token = createAuthToken(user._id);

    setAuthCookie(response, token);

    response.status(200).json({
        success: true,
        message: "Logged in successfully",
        user: serializeUser(user),
    });
});

export const logout = asyncHandler(async (request, response) => {
    clearAuthCookie(response);

    response.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
});

export const getCurrentUser = asyncHandler(async (request, response) => {
    response.status(200).json({
        success: true,
        user: serializeUser(request.user),
    });
});