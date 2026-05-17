export class AppError extends Error {
  constructor(name, message, statusCode, isOperational = true) {
    super(message);
    this.name = name;
    this.message = message;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super('ValidationError', message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message) {
    super('AuthenticationError', message, 401);
  }
}

export class NotFoundError extends AppError {
  constructor(message) {
    super('NotFoundError', message, 404);
  }
}
