/**
 * Validators for DTOs
 */

import type { CreatePurchaseRequestDTO } from "../models/index.js";
import { ValidationError } from "../errors/ValidationError.js";

/**
 * Validates an email address with a basic format check
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates that a string is not empty (and required)
 */
function isNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates CreatePurchaseRequestDTO
 * Throws ValidationError if validation fails
 */
export function validateCreatePurchaseRequestDTO(
  dto: unknown
): asserts dto is CreatePurchaseRequestDTO {
  if (!dto || typeof dto !== "object") {
    throw new ValidationError("Purchase request DTO must be a valid object");
  }

  const {
    title,
    description,
    amount,
    requestedBy,
    approvers,
  } = dto as Record<string, unknown>;

  // Validate title
  if (!isNonEmptyString(title)) {
    throw new ValidationError("Title is required and must not be empty");
  }

  // Validate description
  if (!isNonEmptyString(description)) {
    throw new ValidationError(
      "Description is required and must not be empty"
    );
  }

  // Validate amount
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    throw new ValidationError(
      "Amount must be a positive finite number greater than 0"
    );
  }

  // Validate requestedBy
  if (!isNonEmptyString(requestedBy)) {
    throw new ValidationError("Requested by is required and must not be empty");
  }

  // Validate approvers array
  if (!Array.isArray(approvers) || approvers.length !== 3) {
    throw new ValidationError("Exactly 3 approvers are required");
  }

  // Validate each approver
  for (let i = 0; i < approvers.length; i++) {
    const approver = approvers[i];

    if (!approver || typeof approver !== "object") {
      throw new ValidationError(
        `Approver ${i + 1} must be a valid object`
      );
    }

    const { name, email, role } = approver as Record<string, unknown>;

    if (!isNonEmptyString(name)) {
      throw new ValidationError(
        `Approver ${i + 1}: Name is required and must not be empty`
      );
    }

    if (!isNonEmptyString(email)) {
      throw new ValidationError(
        `Approver ${i + 1}: Email is required and must not be empty`
      );
    }

    if (!isValidEmail(email as string)) {
      throw new ValidationError(
        `Approver ${i + 1}: Email format is invalid`
      );
    }

    if (!isNonEmptyString(role)) {
      throw new ValidationError(
        `Approver ${i + 1}: Role is required and must not be empty`
      );
    }
  }

  // Validate that all roles are distinct (case-insensitive, trimmed)
  const normalizedRoles = approvers.map((a) =>
    ((a as Record<string, unknown>).role as string).trim().toLowerCase()
  );

  const uniqueRoles = new Set(normalizedRoles);
  if (uniqueRoles.size !== 3) {
    throw new ValidationError(
      "All approver roles must be distinct (case-insensitive)"
    );
  }
}
