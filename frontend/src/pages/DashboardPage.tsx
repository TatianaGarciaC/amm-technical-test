/**
 * PurchaseFlow
 * Versión: 1.0
 * Copyright © 2026 Tatiana Garcia Contreras
 * Resume solicitudes, estados y avance del flujo de aprobación.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { Loading } from "../components/Loading";
import { StatusBadge } from "../components/StatusBadge";
import { listPurchaseRequests, userFacingError } from "../services/api";
import type { PurchaseRequest } from "../types/api";
import { formatAmount, formatDate } from "../utils/format";
import { useLanguage } from "../i18n";
import { Eye, Filter, Plus, RotateCcw } from "lucide-react";

type RequestStatusFilter = "ALL" | PurchaseRequest["status"];
interface Filters { search: string; status: RequestStatusFilter; requestedBy: string; dateFrom: string; dateTo: string; }
const emptyFilters: Filters = { search: "", status: "ALL", requestedBy: "", dateFrom: "", dateTo: "" };

export function DashboardPage() {
  const { language, t } = useLanguage();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draftFilters, setDraftFilters] = useState<Filters>(emptyFilters);
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  useEffect(() => {
    let active = true;
    void listPurchaseRequests()
      .then(
        (data) => {
          if (active) {
            setRequests(data);
            setLoading(false);
          }
        },
        (reason: unknown) => {
          if (active) {
            setError(t("genericError"));
            setLoading(false);
          }
        }
      );
    return () => { active = false; };
  }, [t]);

  const filteredRequests = requests.filter((request) => matchesFilters(request, filters));

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setDraftFilters(emptyFilters);
    setFilters(emptyFilters);
  }

  return (
    <section>
      <div className="page-heading">
        <div><p className="eyebrow">{t("dashboardEyebrow")}</p><h1>{t("dashboardTitle")}</h1><p>{t("dashboardSubtitle")}</p></div>
        <Link className="button button-primary" to="/requests/new"><Plus aria-hidden="true" /><span>{t("newPurchaseRequest")}</span></Link>
      </div>
      {loading && <Loading label={t("loadingRequests")} />}
      <DashboardErrorState message={error} />
      {!loading && !error && requests.length === 0 && (
        <EmptyState title={t("noRequests")}>{t("noRequestsDescription")}</EmptyState>
      )}
      {!loading && !error && requests.length > 0 && <>
        <section className="card filters-card" aria-labelledby="filters-title">
          <h2 id="filters-title">{t("filters")}</h2>
          <div className="filters-grid">
            <label className="field filter-search">{t("search")}<input value={draftFilters.search} onChange={(event) => updateFilter("search", event.target.value)} placeholder={t("searchPlaceholder")} /></label>
            <label className="field">{t("requestStatus")}<select value={draftFilters.status} onChange={(event) => updateFilter("status", event.target.value as RequestStatusFilter)}><option value="ALL">{t("all")}</option><option value="PENDING">{t("statusPending")}</option><option value="COMPLETED">{t("statusCompleted")}</option><option value="REJECTED">{t("statusRejected")}</option></select></label>
            <label className="field">{t("requestedByFilter")}<input value={draftFilters.requestedBy} onChange={(event) => updateFilter("requestedBy", event.target.value)} placeholder={t("requestedByPlaceholder")} /></label>
            <label className="field">{t("dateFrom")}<input type="date" value={draftFilters.dateFrom} onChange={(event) => updateFilter("dateFrom", event.target.value)} /></label>
            <label className="field">{t("dateTo")}<input type="date" value={draftFilters.dateTo} onChange={(event) => updateFilter("dateTo", event.target.value)} /></label>
          </div>
          <div className="filter-actions"><button type="button" className="button button-secondary" onClick={clearFilters}><RotateCcw aria-hidden="true" /><span>{t("clearFilters")}</span></button><button type="button" className="button button-primary" onClick={() => setFilters(draftFilters)}><Filter aria-hidden="true" /><span>{t("applyFilters")}</span></button></div>
        </section>
        <p className="results-count">{filteredRequests.length === 0 ? t("noResults") : filteredRequests.length === 1 ? t("oneResult") : t("results", { count: filteredRequests.length })}</p>
        {filteredRequests.length === 0 ? <EmptyState title={t("noFilterMatches")}>{t("changeFilters")}</EmptyState> : <div className="request-grid">
          {filteredRequests.map((request) => {
            const signed = request.approvers.filter((approver) => approver.status === "SIGNED").length;
            const cancelled = request.status === "REJECTED" ? request.approvers.filter((approver) => approver.status === "PENDING").length : 0;
            return (
              <article className="card request-card" key={request.id}>
                <div className="card-heading"><h2>{request.title}</h2><StatusBadge status={request.status} /></div>
                <dl className="summary-list">
                  <div><dt>{t("amount")}</dt><dd>{formatAmount(request.amount, language)}</dd></div>
                  <div><dt>{t("requestedBy")}</dt><dd>{request.requestedBy}</dd></div>
                  <div><dt>{t("created")}</dt><dd>{formatDate(request.createdAt, language)}</dd></div>
                </dl>
                <div className="approval-summary">
                  <div><span>{t("approvalProgress")}</span><strong>{request.status === "REJECTED" ? t("rejectedProgress", { signed, cancelled }) : t("approvalsCount", { signed })}</strong></div>
                  <div className="progress-track"><span style={{ width: `${(signed / 3) * 100}%` }} /></div>
                </div>
                <Link className="button button-secondary button-block" to={`/requests/${request.id}`}><Eye aria-hidden="true" /><span>{t("viewDetails")}</span></Link>
              </article>
            );
          })}
        </div>}
      </>}
    </section>
  );
}

export function matchesFilters(request: PurchaseRequest, filters: Filters): boolean {
  const search = filters.search.trim().toLocaleLowerCase();
  const requester = filters.requestedBy.trim().toLocaleLowerCase();
  const created = new Date(request.createdAt);
  const from = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`) : undefined;
  const to = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59.999`) : undefined;
  return (!search || [request.title, request.description, request.id].some((value) => value.toLocaleLowerCase().includes(search)))
    && (filters.status === "ALL" || request.status === filters.status)
    && (!requester || request.requestedBy.toLocaleLowerCase().includes(requester))
    && (!from || created >= from)
    && (!to || created <= to);
}

export function DashboardErrorState({ message }: { message: string }) {
  return message ? <ErrorMessage message={message} /> : null;
}
