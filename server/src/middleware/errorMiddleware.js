export function errorMiddleware(error, request, response, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";

  if (error.name === "ValidationError") {
    statusCode = 400;

    message = Object.values(error.errors)
      .map((validationError) => validationError.message)
      .join(". ");
  }

  if (error.code === 11000) {
    statusCode = 409;

    const duplicateField = Object.keys(error.keyPattern || {})[0];

    if (duplicateField === "email") {
      message = "An account already exists with this email";
    } else if (duplicateField === "username") {
      message = "This username is already taken";
    } else {
      message = "A record with these details already exists";
    }
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  response.status(statusCode).json({
    success: false,
    message,
  });
}