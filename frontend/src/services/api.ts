/**
 * PurchaseFlow
 * Versión: 1.0
 * Copyright © 2026 Tatiana Garcia Contreras
 * Cliente HTTP tipado que centraliza serialización, errores seguros y rutas del backend.
 */
import type {
  ApproverCredentials,
  ApproverPurchaseRequest,
  CreatePurchaseRequestInput,
  MockMail,
  PurchaseRequest,
} from "../types/api";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = "The request could not be completed.";
    try {
      const payload = (await response.json()) as { message?: unknown };
      if (typeof payload.message === "string" && payload.message.trim()) message = payload.message;
    } catch {
      // Conserva el mensaje seguro cuando la respuesta no contiene JSON válido.
    }
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}

function decisionBody(credentials: ApproverCredentials): RequestInit {
  return { method: "POST", body: JSON.stringify(credentials) };
}

export function createPurchaseRequest(input: CreatePurchaseRequestInput): Promise<PurchaseRequest> {
  return request("/api/solicitudes", { method: "POST", body: JSON.stringify(input) });
}

export function listPurchaseRequests(): Promise<PurchaseRequest[]> {
  return request("/api/solicitudes");
}

export function getPurchaseRequest(id: string): Promise<PurchaseRequest> {
  return request(`/api/solicitudes/${encodeURIComponent(id)}`);
}

export function validateOtp(id: string, credentials: ApproverCredentials): Promise<ApproverPurchaseRequest> {
  return request(`/api/solicitudes/${encodeURIComponent(id)}/validate-otp`, decisionBody(credentials));
}

export function resendApproverOtp(id: string, approverToken: string): Promise<{ message: string }> {
  return request(`/api/solicitudes/${encodeURIComponent(id)}/resend-otp`, {
    method: "POST",
    body: JSON.stringify({ approverToken }),
  });
}

export function approvePurchaseRequest(id: string, credentials: ApproverCredentials): Promise<PurchaseRequest> {
  return request(`/api/solicitudes/${encodeURIComponent(id)}/approve`, decisionBody(credentials));
}

export function rejectPurchaseRequest(id: string, credentials: ApproverCredentials): Promise<PurchaseRequest> {
  return request(`/api/solicitudes/${encodeURIComponent(id)}/reject`, decisionBody(credentials));
}

export function getEvidenceUrl(id: string): string {
  return `${API_BASE_URL}/api/solicitudes/${encodeURIComponent(id)}/evidencia.pdf`;
}

export async function downloadEvidence(id: string): Promise<void> {
  const response = await fetch(getEvidenceUrl(id));
  if (!response.ok) throw new ApiError(response.status, "The evidence PDF is not available.");
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `purchase-request-${id}-evidence.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export function getMockMails(requestId?: string): Promise<MockMail[]> {
  const query = requestId ? `?requestId=${encodeURIComponent(requestId)}` : "";
  return request(`/mock-mail${query}`);
}

export function userFacingError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status >= 500) return "The service is temporarily unavailable. Please try again.";
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
