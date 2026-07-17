import jwt from "jsonwebtoken";
import * as cookie from "cookie";

import User from "../models/User.js";
import { AUTH_COOKIE_NAME } from "../utils/token.js";

export async function authenticateSocket(socket, next) {
  try {
    const cookieHeader = socket.request.headers.cookie || "";
    const cookies = cookie.parseCookie(cookieHeader);

    const token = cookies[AUTH_COOKIE_NAME];

    if (!token) {
      const error = new Error("Authentication required");

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

    socket.user = {
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
    };

    return next();
  } catch (error) {
    console.error("Socket authentication failed:", error.message);

    const socketError = new Error(
      "Your session is invalid or has expired"
    );

    socketError.data = {
      code: "INVALID_SESSION",
    };

    return next(error);
  }
}