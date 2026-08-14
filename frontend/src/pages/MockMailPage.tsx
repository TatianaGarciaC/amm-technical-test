/**
 * PurchaseFlow
 * Versión: 1.0
 * Copyright © 2026 Tatiana Garcia Contreras
 * Agrupa mensajes demostrativos y muestra el correo vigente de cada aprobador.
 */
import { useEffect, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { Loading } from "../components/Loading";
import { ApproverStatusBadge, getApproverVisualStatus, StatusBadge } from "../components/StatusBadge";
import { getMockMails, listPurchaseRequests, userFacingError } from "../services/api";
import type { Approver, MockMail, PurchaseRequest } from "../types/api";
import { formatDate } from "../utils/format";
import { useLanguage } from "../i18n";
import { ChevronLeft, ChevronRight, ExternalLink, EyeOff, Mail, RotateCcw } from "lucide-react";

interface MailGroup {
  request: PurchaseRequest;
  mails: MockMail[];
}

type MailboxStatusFilter = "ALL" | PurchaseRequest["status"];
type MailboxSort = "NEWEST" | "OLDEST" | "TITLE_ASC" | "TITLE_DESC";
const PAGE_SIZE = 5;

export function MockMailPage() {
  const { t } = useLanguage();
  const [groups, setGroups] = useState<MailGroup[]>([]);
  const [expandedMailIds, setExpandedMailIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MailboxStatusFilter>("ALL");
  const [sort, setSort] = useState<MailboxSort>("NEWEST");
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    let active = true;
    void Promise.all([getMockMails(), listPurchaseRequests()])
      .then(([mails, requests]) => {
        if (!active) return;
        const mailsByRequest = new Map<string, MockMail[]>();
        for (const mail of mails) {
          const requestMails = mailsByRequest.get(mail.purchaseRequestId) ?? [];
          requestMails.push(mail);
          mailsByRequest.set(mail.purchaseRequestId, requestMails);
        }
        setGroups(requests
          .filter((request) => mailsByRequest.has(request.id))
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
          .map((request) => ({ request, mails: mailsByRequest.get(request.id) ?? [] })));
      })
      .catch(() => active && setError(t("unableMailbox")))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [t]);

  function toggleMail(mailId: string) {
    setExpandedMailIds((current) => {
      const next = new Set(current);
      if (next.has(mailId)) next.delete(mailId); else next.add(mailId);
      return next;
    });
  }

  const filteredGroups = filterAndSortMailGroups(groups, search, status, sort);
  const pageCount = Math.max(1, Math.ceil(filteredGroups.length / PAGE_SIZE));
  const visibleGroups = filteredGroups.slice((pageNumber - 1) * PAGE_SIZE, pageNumber * PAGE_SIZE);
  const filtersActive = search.trim() !== "" || status !== "ALL" || sort !== "NEWEST";

  function clearFilters() {
    setSearch("");
    setStatus("ALL");
    setSort("NEWEST");
    setPageNumber(1);
  }

  return (
    <section>
      <div className="page-heading"><div><p className="eyebrow">{t("technicalDemo")}</p><h1>{t("mailboxTitle")}</h1><p>{t("mailboxSubtitle")}</p></div></div>
      <div className="alert alert-warning" role="alert"><strong>{t("demoOnly")}</strong> — {t("demoWarning")}</div>
      {!loading && !error && groups.length > 0 && <>
        <section className="card mailbox-filters" aria-label={t("mailboxFilters")}>
          <label className="field mailbox-search"><span>{t("search")}</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPageNumber(1); }} placeholder={t("mailboxSearchPlaceholder")} /></label>
          <label className="field"><span>{t("mailboxStatus")}</span><select value={status} onChange={(event) => { setStatus(event.target.value as MailboxStatusFilter); setPageNumber(1); }}><option value="ALL">{t("all")}</option><option value="PENDING">{t("mailboxPending")}</option><option value="COMPLETED">{t("mailboxCompleted")}</option><option value="REJECTED">{t("mailboxRejected")}</option></select></label>
          <label className="field"><span>{t("sortBy")}</span><select value={sort} onChange={(event) => { setSort(event.target.value as MailboxSort); setPageNumber(1); }}><option value="NEWEST">{t("sortNewest")}</option><option value="OLDEST">{t("sortOldest")}</option><option value="TITLE_ASC">{t("sortTitleAsc")}</option><option value="TITLE_DESC">{t("sortTitleDesc")}</option></select></label>
          <button type="button" className={`button button-secondary mailbox-clear${filtersActive ? " active" : ""}`} onClick={clearFilters} disabled={!filtersActive}><RotateCcw aria-hidden="true" /><span>{t("clearFilters")}</span></button>
        </section>
        <p className="results-count">{t("mailboxShowing", { shown: visibleGroups.length, total: filteredGroups.length })}</p>
      </>}
      {loading && <Loading label={t("loadingMail")} />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && groups.length === 0 && <EmptyState title={t("mailboxEmpty")}>{t("mailboxEmptyDescription")}</EmptyState>}
      {!loading && !error && groups.length > 0 && filteredGroups.length === 0 && <div className="empty-state"><h2>{t("mailboxNoMatches")}</h2><p>{t("mailboxChangeFilters")}</p><button type="button" className="button button-secondary" onClick={clearFilters}>{t("clearFilters")}</button></div>}
      <div className="mail-group-list">
        {visibleGroups.map(({ request, mails }) => (
          <article className="card mail-group-card" key={request.id} aria-label={`Purchase request ${request.title}`}>
            <div className="card-heading">
              <div><h2>{request.title}</h2><p className="mail-request-id">{t("requestPrefix")} <span className="mono">{request.id}</span></p></div>
              <StatusBadge status={request.status} />
            </div>
            <p className="mail-count">{t("approvalMessages", { count: request.approvers.length })}</p>
            <div className="mail-approver-list">
              {request.approvers.map((approver) => {
                const approverMails = mails.filter((mail) => mail.approverId === approver.id).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
                const mail = approverMails[0];
                if (!mail) return null;
                const expanded = expandedMailIds.has(mail.id);
                return <MailRow key={approver.id} mail={mail} messageCount={approverMails.length} approver={approver} request={request} expanded={expanded} onToggle={() => toggleMail(mail.id)} />;
              })}
            </div>
          </article>
        ))}
      </div>
      {!loading && !error && pageCount > 1 && <nav className="mailbox-pagination" aria-label={t("mailboxPagination")}>
        <button type="button" className="button button-secondary" disabled={pageNumber === 1} onClick={() => setPageNumber((current) => current - 1)}><ChevronLeft aria-hidden="true" /><span>{t("previous")}</span></button>
        <span>{t("pageOf", { page: pageNumber, total: pageCount })}</span>
        <button type="button" className="button button-secondary" disabled={pageNumber === pageCount} onClick={() => setPageNumber((current) => current + 1)}><span>{t("next")}</span><ChevronRight aria-hidden="true" /></button>
      </nav>}
    </section>
  );
}

export function filterAndSortMailGroups(groups: MailGroup[], search: string, status: MailboxStatusFilter, sort: MailboxSort): MailGroup[] {
  const query = search.trim().toLocaleLowerCase();
  return groups
    .filter(({ request }) => status === "ALL" || request.status === status)
    .filter(({ request }) => !query || [request.title, request.id, request.requestedBy, ...request.approvers.flatMap((approver) => [approver.name, approver.email])].some((value) => value.toLocaleLowerCase().includes(query)))
    .sort((left, right) => {
      if (sort === "OLDEST") return Date.parse(left.request.createdAt) - Date.parse(right.request.createdAt);
      if (sort === "TITLE_ASC") return left.request.title.localeCompare(right.request.title);
      if (sort === "TITLE_DESC") return right.request.title.localeCompare(left.request.title);
      return Date.parse(right.request.createdAt) - Date.parse(left.request.createdAt);
    });
}

function MailRow({ mail, messageCount, approver, request, expanded, onToggle }: {
  mail: MockMail;
  messageCount: number;
  approver: Approver;
  request: PurchaseRequest;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { language, t } = useLanguage();
  const approvalLink = extractApprovalLink(mail.body);
  return (
    <section className="mail-approver-row" aria-label={`${approver.name} approval message`}>
      <div className="mail-approver-summary">
        <div className="approver-info"><strong>{approver.name}</strong><span>{approver.email}</span><small>{approver.role}{messageCount > 1 ? ` · ${t("messageCount", { count: messageCount })}` : ""}</small>{getApproverVisualStatus(approver.status, request.status) === "CANCELLED" && <small className="cancelled-message">{t("cancelledReason")}</small>}</div>
        <ApproverStatusBadge status={approver.status} requestStatus={request.status} />
        <button type="button" className="button button-secondary mail-toggle" aria-expanded={expanded} onClick={onToggle}>{expanded ? <EyeOff aria-hidden="true" /> : <Mail aria-hidden="true" />}<span>{expanded ? t("hideEmail") : t("viewEmail")}</span></button>
      </div>
      {expanded && (
        <div className="mail-content">
          <div className="mail-meta"><div><span>{t("subject")}</span><strong>{mail.subject}</strong></div><time>{formatDate(mail.createdAt, language)}</time></div>
          <pre>{mail.body}</pre>
          <MailDecisionAction request={request} approver={approver} approvalLink={approvalLink} />
        </div>
      )}
    </section>
  );
}

function MailDecisionAction({ request, approver, approvalLink }: { request: PurchaseRequest; approver: Approver; approvalLink?: string }) {
  const { t } = useLanguage();
  if (request.status !== "PENDING") return <span className="mail-closed">{t("requestClosed")}</span>;
  if (approver.status === "SIGNED") return <span className="mail-decision approved">{t("approvedAction")}</span>;
  if (approver.status === "REJECTED") return <span className="mail-decision rejected">{t("rejectedAction")}</span>;
  return approvalLink ? <a className="button button-primary" href={approvalLink}><ExternalLink aria-hidden="true" /><span>{t("openApproval")}</span></a> : null;
}

function extractApprovalLink(body: string): string | undefined {
  return body.match(/https?:\/\/[^\s]+\/approve\?[^\s]+/)?.[0];
}
