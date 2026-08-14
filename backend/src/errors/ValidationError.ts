/**
 * Custom error classes for domain logic
 */

/**
 * Thrown when DTO validation fails
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
