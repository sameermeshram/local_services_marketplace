import { AppError } from "../utils/AppError.js";
import { sendError } from "../utils/response.js";

export function notFound(req, res) {
  sendError(res, { statusCode: 404, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    const payload = { statusCode: err.statusCode, message: err.message };
    if (err.errors) payload.errors = err.errors;
    return sendError(res, payload);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? "field";
    return sendError(res, {
      statusCode: 409,
      message: `${field} already exists`,
    });
  }

  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return sendError(res, { statusCode: 400, message: "Validation failed", errors });
  }

  if (err.type === "entity.parse.failed") {
    return sendError(res, { statusCode: 400, message: "Invalid JSON body" });
  }

  if (err.name === "MulterError") {
    return sendError(res, {
      statusCode: err.code === "LIMIT_FILE_SIZE" ? 413 : 400,
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "Uploaded file exceeds the maximum allowed size"
          : "Invalid file upload",
    });
  }

  console.error(err);
  sendError(res, { statusCode: 500, message: "Internal server error" });
}
