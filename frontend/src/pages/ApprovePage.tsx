/**
 * PurchaseFlow
 * Versión: 1.0
 * Copyright © 2026 Tatiana Garcia Contreras
 * Presenta verificación OTP y decisiones consultando el estado vigente de la solicitud.
 */
import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { ErrorMessage } from "../components/ErrorMessage";
import { Loading } from "../components/Loading";
import { StatusBadge } from "../components/StatusBadge";
import {
  ApiError,
  approvePurchaseRequest,
  getPurchaseRequest,
  rejectPurchaseRequest,
  resendApproverOtp,
  userFacingError,
  validateOtp,
} from "../services/api";
import type { ApproverPurchaseRequest, PurchaseRequest } from "../types/api";
import { formatAmount, formatDate } from "../utils/format";
import { useLanguage, type TranslationKey } from "../i18n";
import { Check, RefreshCw, ShieldCheck, X } from "lucide-react";

export function ApprovePage() {
  const { language, t } = useLanguage();
  const [params] = useSearchParams();
  const requestId = params.get("solicitud_id")?.trim() ?? "";
  const approverToken = params.get("approver_token")?.trim() ?? "";
  const [otp, setOtp] = useState("");
  const [detail, setDetail] = useState<ApproverPurchaseRequest>();
  const [result, setResult] = useState<PurchaseRequest>();
  const [outcome, setOutcome] = useState<"approved" | "rejected">();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(Boolean(requestId && approverToken));
  const [alreadyRecorded, setAlreadyRecorded] = useState<"approved" | "rejected">();
  const [otpExpired, setOtpExpired] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!requestId || !approverToken) return;
    let active = true;
    void getPurchaseRequest(requestId)
      .then((request) => {
        if (active && request.status !== "PENDING") {
          setAlreadyRecorded(request.status === "REJECTED" ? "rejected" : "approved");
        }
      })
      .catch(() => { /* La validación OTP permanece como respaldo autoritativo. */ })
      .finally(() => active && setCheckingStatus(false));
    return () => { active = false; };
  }, [approverToken, requestId]);

  if (!requestId || !approverToken) {
    return <section className="approval-page"><div className="card verification-card"><p className="eyebrow">{t("approvalLink")}</p><h1>{t("invalidLink")}</h1><p>{t("invalidLinkDescription")}</p></div></section>;
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) { setError(t("codeIncomplete")); return; }
    setBusy(true); setError("");
    try {
      const validated = await validateOtp(requestId, { approverToken, otp });
      if (validated.approver.status !== "PENDING") {
        setAlreadyRecorded(validated.approver.status === "REJECTED" ? "rejected" : "approved");
      } else {
        setDetail(validated);
      }
    } catch (reason: unknown) {
      if (reason instanceof ApiError && reason.status === 409) {
        try {
          const request = await getPurchaseRequest(requestId);
          setAlreadyRecorded(request.status === "REJECTED" ? "rejected" : "approved");
        } catch {
          setAlreadyRecorded("approved");
        }
      } else if (reason instanceof ApiError && reason.status === 410) {
        setOtpExpired(true);
        setError("");
      } else {
        setError(approvalError(reason, t));
      }
    } finally { setBusy(false); }
  }

  async function resendOtp() {
    if (busy) return;
    setBusy(true); setError(""); setResendSuccess(false);
    try {
      await resendApproverOtp(requestId, approverToken);
      setOtp("");
      setOtpExpired(false);
      setResendSuccess(true);
    } catch (reason: unknown) {
      if (reason instanceof ApiError && reason.status === 409) setAlreadyRecorded("approved");
      else setError(approvalError(reason, t));
    } finally { setBusy(false); }
  }

  async function decide(action: "approve" | "reject") {
    if (busy || result) return;
    if (action === "reject" && !window.confirm(t("rejectConfirm"))) return;
    setBusy(true); setError("");
    try {
      const credentials = { approverToken, otp };
      const response = action === "approve"
        ? await approvePurchaseRequest(requestId, credentials)
        : await rejectPurchaseRequest(requestId, credentials);
      setResult(response);
      setOutcome(action === "approve" ? "approved" : "rejected");
    } catch (reason: unknown) {
      setError(approvalError(reason, t));
    } finally { setBusy(false); }
  }

  if (checkingStatus) return <Loading label={t("checkingStatus")} />;

  if (alreadyRecorded) {
    return (
      <section className="approval-page"><div className="card verification-card result-card">
        <div className={`result-icon ${alreadyRecorded}`}>{alreadyRecorded === "approved" ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}</div>
        <p className="eyebrow">{t("approvalLink")}</p><h1>{t("decisionAlready")}</h1>
        <p>{alreadyRecorded === "rejected" ? t("alreadyRejected") : t("alreadyApproved")}</p>
      </div></section>
    );
  }

  if (result && outcome) {
    return (
      <section className="approval-page"><div className="card verification-card result-card">
        <div className={`result-icon ${outcome}`}>{outcome === "approved" ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}</div>
        <p className="eyebrow">{t("decisionRecorded")}</p>
        <h1>{outcome === "approved" ? t("approvalSuccess") : t("rejectionSuccess")}</h1>
        <p>{t("savedDecision")}</p>
        <StatusBadge status={outcome === "approved" ? "APPROVED" : "REJECTED"} />
        {outcome === "approved" && <p className="result-context">{result.status === "COMPLETED" ? t("allApprovalsCompleted") : t("requestStillPending")}</p>}
      </div></section>
    );
  }

  if (!detail) {
    return (
      <section className="approval-page"><div className="card verification-card">
        <p className="eyebrow">{t("secureVerification")}</p><h1>{t("verificationTitle")}</h1>
        {otpExpired ? <><h2>{t("expiredTitle")}</h2><p>{t("expiredDescription")}<br />{t("requestNewCode")}</p></> : <p>{t("enterCode")}</p>}
        {resendSuccess && <div className="alert alert-success" role="status"><strong>{t("newCodeSent")}</strong><br />{t("checkMailbox")}</div>}
        {error && <ErrorMessage message={error} />}
        {otpExpired && <div className="otp-resend-actions">
          <button type="button" className="button button-primary button-block" disabled={busy} onClick={() => void resendOtp()}><RefreshCw aria-hidden="true" /><span>{busy ? t("sending") : t("resendOtp")}</span></button>
          <a className="button button-secondary button-block" href="/mock-mail">{t("openMailbox")}</a>
        </div>}
        <form onSubmit={verify} className="otp-form">
          <label className="field">{t("verificationCode")}
            <input className="otp-input" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" autoFocus />
          </label>
          <button className="button button-primary button-block" disabled={busy || otp.length !== 6}><ShieldCheck aria-hidden="true" /><span>{busy ? t("verifying") : t("verifyCode")}</span></button>
        </form>
      </div></section>
    );
  }

  return (
    <section className="approval-page"><div className="card approval-detail-card">
      <p className="eyebrow">{t("decisionRequired")}</p><h1>{detail.title}</h1><p className="description">{detail.description}</p>
      {error && <ErrorMessage message={error} />}
      <dl className="detail-list compact">
        <div><dt>{t("amount")}</dt><dd>{formatAmount(detail.amount, language)}</dd></div>
        <div><dt>{t("requestedBy")}</dt><dd>{detail.requestedBy}</dd></div>
        <div><dt>{t("created")}</dt><dd>{formatDate(detail.createdAt, language)}</dd></div>
      </dl>
      <div className="current-approver"><span>{t("approvingAs")}</span><strong>{detail.approver.name}</strong><small>{detail.approver.role} · {detail.approver.email}</small></div>
      <div className="decision-actions">
        <button className="button button-danger" disabled={busy} onClick={() => void decide("reject")}><X aria-hidden="true" /><span>{busy ? t("processing") : t("reject")}</span></button>
        <button className="button button-primary" disabled={busy} onClick={() => void decide("approve")}><Check aria-hidden="true" /><span>{busy ? t("processing") : t("approve")}</span></button>
      </div>
    </div></section>
  );
}

function approvalError(error: unknown, t: (key: TranslationKey) => string): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return t("invalidCredentials");
    if (error.status === 410) return t("expiredError");
    if (error.status === 409) return t("operationConflict");
  }
  return t("genericError");
}
