class AppError extends Error {
    // second arg is optional: `new AppError('msg')` must not throw on destructure
    constructor(message, {statusCode=500, code='INTERNAL_ERROR', stack, details='', errors = ''} = {}) {
        super(message);
        this.success = false;
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.errors = errors;
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

// BadRequestError - 400
class BadRequestError extends AppError {
    constructor(message='Bad Request', details) {
        super(message, {statusCode: 400, code: 'BAD_REQUEST', details});
    }
}
// ValidationError - 422

class ValidationError extends AppError {
     constructor(message='Unprocessable Entity', details) {
        super(message, {statusCode: 422, code: 'UNPROCESSABLE_ENTITY', details});
    }
}
// NotFoundError - 404
class NotFoundError extends AppError {
     constructor(message='Not Found') {
        super(message, {statusCode: 404, code: 'NOT_FOUND'});
    }
}
// ForbiddenError - 403
class ForbiddenError extends AppError {
     constructor(message='Forbidden') {
        super(message, {statusCode: 403, code: 'FORBIDDEN'});
    }
}
// ConflictError - 409
class ConflictError extends AppError {
     constructor(message='Conflict') {
        super(message, {statusCode: 409, code: 'CONFLICT'});
    }
}
// UnauthorizedError - 401
class UnauthorizedError extends AppError {
     constructor(message='Unauthorized') {
        super(message, {statusCode: 401, code: 'UNAUTHORIZED'});
    }
}

export {
    AppError,
    BadRequestError,
    ForbiddenError,
    ConflictError,
    UnauthorizedError,
    ValidationError,
    NotFoundError
}