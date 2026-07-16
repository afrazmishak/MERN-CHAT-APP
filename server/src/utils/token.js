import jwt from "jsonwebtoken"

export const AUTH_COOKIE_NAME = "chat_token";

function getCookieOptions() {
    const cookieDays = Number(process.env.COOKIE_EXPRESS_DAYS) || 7;
    const isProduction = process.env.NODE_ENV === "production";

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
        maxAge: cookieDays * 24 * 60 * 60 * 1000,
    };
}

export function createAuthToken(userId) {
    return jwt.sign(
        {
            userId: userId.toString(),
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        }
    );
}

export function setAuthCookie(response, token) {
    response.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());
}

export function clearAuthCookie(response){
    const {maxAge, ...clearOptions }= getCookieOptions();

    response.clearCookie(AUTH_COOKIE_NAME, clearOptions);
}