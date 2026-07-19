export function sendSuccess(res, { statusCode = 200, message = "Success", data = null } = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    errors: null,
  });
}

export function sendError(res, { statusCode = 500, message = "Internal server error", errors = null } = {}) {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors: errors ?? [],
  });
}
