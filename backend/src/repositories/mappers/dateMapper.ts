/**
 * Date Serialization Mapper
 * Handles conversion between JavaScript Date objects and ISO-8601 strings
 * for DynamoDB persistence
 */

import type { PurchaseRequest, Approver } from "../../models/index.js";
import { ApproverStatus, PurchaseRequestStatus } from "../../models/index.js";

/**
 * Persistent representation of an Approver for DynamoDB
 * All Date fields are stored as ISO-8601 strings
 */
export interface ApproverPersistent {
  id: string;
  name: string;
  email: string;
  role: string;
  accessToken: string;
  otp: string;
  otpExpiresAt: string; // ISO-8601 string
  status: string;
  signedAt: string | null; // ISO-8601 string or null
}

/**
 * Persistent representation of a PurchaseRequest for DynamoDB
 * All Date fields are stored as ISO-8601 strings
 */
export interface PurchaseRequestPersistent {
  id: string;
  title: string;
  description: string;
  amount: number;
  createdAt: string; // ISO-8601 string
  requestedBy: string;
  status: string;
  approvers: [ApproverPersistent, ApproverPersistent, ApproverPersistent];
}

/**
 * Convert a domain Approver to its persistent representation
 * Serializes Date objects to ISO-8601 strings
 */
export function approverToPersistent(approver: Approver): ApproverPersistent {
  return {
    id: approver.id,
    name: approver.name,
    email: approver.email,
    role: approver.role,
    accessToken: approver.accessToken,
    otp: approver.otp,
    otpExpiresAt: approver.otpExpiresAt.toISOString(),
    status: approver.status,
    signedAt: approver.signedAt ? approver.signedAt.toISOString() : null,
  };
}

/**
 * Convert a persistent Approver back to domain Approver
 * Deserializes ISO-8601 strings to Date objects
 */
export function approverFromPersistent(
  persistent: ApproverPersistent
): Approver {
  return {
    id: persistent.id,
    name: persistent.name,
    email: persistent.email,
    role: persistent.role,
    accessToken: persistent.accessToken,
    otp: persistent.otp,
    otpExpiresAt: new Date(persistent.otpExpiresAt),
    status: persistent.status as ApproverStatus,
    signedAt: persistent.signedAt ? new Date(persistent.signedAt) : null,
  };
}

/**
 * Convert a domain PurchaseRequest to its persistent representation
 * Serializes all Date objects to ISO-8601 strings
 */
export function purchaseRequestToPersistent(
  request: PurchaseRequest
): PurchaseRequestPersistent {
  return {
    id: request.id,
    title: request.title,
    description: request.description,
    amount: request.amount,
    createdAt: request.createdAt.toISOString(),
    requestedBy: request.requestedBy,
    status: request.status,
    approvers: request.approvers.map(approverToPersistent) as [
      ApproverPersistent,
      ApproverPersistent,
      ApproverPersistent
    ],
  };
}

/**
 * Convert a persistent PurchaseRequest back to domain PurchaseRequest
 * Deserializes ISO-8601 strings to Date objects
 */
export function purchaseRequestFromPersistent(
  persistent: PurchaseRequestPersistent
): PurchaseRequest {
  return {
    id: persistent.id,
    title: persistent.title,
    description: persistent.description,
    amount: persistent.amount,
    createdAt: new Date(persistent.createdAt),
    requestedBy: persistent.requestedBy,
    status: persistent.status as PurchaseRequestStatus,
    approvers: persistent.approvers.map(approverFromPersistent) as [
      Approver,
      Approver,
      Approver
    ],
  };
}
