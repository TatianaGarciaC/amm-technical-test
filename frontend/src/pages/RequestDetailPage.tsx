/**
 * PurchaseFlow
 * Versión: 1.0
 * Copyright © 2026 Tatiana Garcia Contreras
 * Consulta el estado de una solicitud y habilita la evidencia solo al completarse.
 */
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ErrorMessage } from "../components/ErrorMessage";
import { Loading } from "../components/Loading";
import { ApproverStatusBadge, getApproverVisualStatus, StatusBadge } from "../components/StatusBadge";
import { downloadEvidence, getPurchaseRequest, userFacingError } from "../services/api";
import type { PurchaseRequest } from "../types/api";
import { formatAmount, formatDate } from "../utils/format";
import { useLanguage } from "../i18n";
import { Download } from "lucide-react";
import { isFinalStatus } from "../utils/purchaseRequestStatus";

export function RequestDetailPage() {
  const { language, t } = useLanguage();
  const { id } = useParams();
  const location = useLocation();
  const [request, setRequest] = useState<PurchaseRequest>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) { setError(t("missingRequestId")); setLoading(false); return; }
    let active = true;
    getPurchaseRequest(id)
      .then((data) => active && setRequest(data))
      .catch(() => active && setError(t("unableLoadRequest")))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id, t]);

  async function download() {
    if (!id || downloading) return;
    setDownloading(true);
    setError("");
    try { await downloadEvidence(id); }
    catch (reason: unknown) { setError(userFacingError(reason)); }
    finally { setDownloading(false); }
  }

  if (loading) return <Loading label={t("loadingDetail")} />;
  if (!request) return <><ErrorMessage message={error || t("requestNotFound")} /><Link to="/" className="button button-secondary">{t("backDashboard")}</Link></>;

  const created = (location.state as { created?: boolean } | null)?.created === true;
  const signed = request.approvers.filter((approver) => approver.status === "SIGNED").length;
  return (
    <section>
      {created && <div className="alert alert-success">{t("createdSuccess")}</div>}
      {error && <ErrorMessage message={error} />}
      <div className="page-heading">
        <div><p className="eyebrow">{t("purchaseRequest")}</p><h1>{request.title}</h1><p>{t("created")} {formatDate(request.createdAt, language)}</p></div>
        <StatusBadge status={request.status} />
      </div>
      <div className="detail-layout">
        <article className="card form-section">
          <h2>{t("requestDetails")}</h2>
          <p className="description">{request.description}</p>
          <dl className="detail-list">
            <div><dt>{t("amount")}</dt><dd>{formatAmount(request.amount, language)}</dd></div>
            <div><dt>{t("requestedBy")}</dt><dd>{request.requestedBy}</dd></div>
            <div><dt>{t("createdAt")}</dt><dd>{formatDate(request.createdAt, language)}</dd></div>
            <div><dt>{t("requestId")}</dt><dd className="mono">{request.id}</dd></div>
          </dl>
          {isFinalStatus(request.status) && <button className="button button-primary" onClick={download} disabled={downloading}><Download aria-hidden="true" /><span>{downloading ? t("preparingPdf") : t("downloadPdf")}</span></button>}
        </article>
        <article className="card form-section">
          <div className="section-heading"><div><h2>{t("approvalProgressTitle")}</h2><p>{t("approvalsCompleted", { signed })}</p></div></div>
          <div className="approver-list">
            {request.approvers.map((approver) => (
              <div className="approver-row" key={approver.id}>
                <div className="avatar">{approver.name.slice(0, 1).toUpperCase()}</div>
                <div className="approver-info"><strong>{approver.name}</strong><span>{approver.email}</span><small>{approver.role}</small>{approver.signedAt && <small>{t("decided", { date: formatDate(approver.signedAt, language) })}</small>}{getApproverVisualStatus(approver.status, request.status) === "CANCELLED" && <small className="cancelled-message">{t("cancelledReason")}</small>}</div>
                <ApproverStatusBadge status={approver.status} requestStatus={request.status} />
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
