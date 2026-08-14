/**
 * Custom error classes for domain logic
 */

/**
 * Thrown when a requested resource is not found
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

/**
 * Thrown when authentication/authorization fails
 */
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Thrown when OTP has expired
 */
export class ExpiredOtpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpiredOtpError";
  }
}

/**
 * Thrown when operation conflicts with current state
 */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}
