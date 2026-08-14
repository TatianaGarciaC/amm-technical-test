/**
 * Errors module - exports custom error classes
 */

export { ValidationError } from "./ValidationError.js";
export {
  NotFoundError,
  UnauthorizedError,
  ExpiredOtpError,
  ConflictError,
} from "./DomainErrors.js";
