/**
 * PurchaseFlow
 * Versión: 1.0
 * Copyright © 2026 Tatiana Garcia Contreras
 * Formulario controlado para crear solicitudes con exactamente tres aprobadores.
 */
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorMessage } from "../components/ErrorMessage";
import { createPurchaseRequest, userFacingError } from "../services/api";
import type { CreateApproverInput, CreatePurchaseRequestInput } from "../types/api";
import { getRandomPurchaseRequestTestData, type PurchaseRequestTestData } from "../test-data/purchaseRequestTestData";
import { useLanguage, type TranslationKey } from "../i18n";
import { Save } from "lucide-react";

const emptyApprovers: [CreateApproverInput, CreateApproverInput, CreateApproverInput] = [
  { name: "", email: "", role: "" },
  { name: "", email: "", role: "" },
  { name: "", email: "", role: "" },
];

export function NewRequestPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [approvers, setApprovers] = useState(emptyApprovers);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lastTestData, setLastTestData] = useState<PurchaseRequestTestData>();

  function loadTestData() {
    const data = getRandomPurchaseRequestTestData(lastTestData);
    setTitle(data.title);
    setDescription(data.description);
    setAmount(String(data.amount));
    setRequestedBy(data.requestedBy);
    setApprovers(data.approvers.map((approver) => ({ ...approver })) as CreatePurchaseRequestInput["approvers"]);
    setErrors([]);
    setLastTestData(data);
  }

  function clearForm() {
    setTitle("");
    setDescription("");
    setAmount("");
    setRequestedBy("");
    setApprovers(emptyApprovers.map((approver) => ({ ...approver })) as CreatePurchaseRequestInput["approvers"]);
    setErrors([]);
  }

  function updateApprover(index: number, field: keyof CreateApproverInput, value: string) {
    setApprovers((current) => current.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item
    ) as [CreateApproverInput, CreateApproverInput, CreateApproverInput]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateForm({ title, description, amount, requestedBy, approvers }, t);
    if (validationErrors.length) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    setErrors([]);
    try {
      const payload: CreatePurchaseRequestInput = {
        title: title.trim(),
        description: description.trim(),
        amount: Number(amount),
        requestedBy: requestedBy.trim(),
        approvers: approvers.map((item) => ({
          name: item.name.trim(), email: item.email.trim(), role: item.role.trim(),
        })) as CreatePurchaseRequestInput["approvers"],
      };
      const created = await createPurchaseRequest(payload);
      navigate(`/requests/${created.id}`, { state: { created: true } });
    } catch (error: unknown) {
      setErrors([t("unableCreate")]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="narrow-page">
      <div className="page-heading"><div><p className="eyebrow">{t("newWorkflow")}</p><h1>{t("createTitle")}</h1><p>{t("createSubtitle")}</p></div></div>
      {errors.length > 0 && <ErrorMessage message={errors.join(" ")} />}
      <form className="stack" onSubmit={submit} noValidate>
        <div className="card form-section">
          <h2>{t("requestInformation")}</h2>
          <div className="form-grid">
            <label className="field field-wide">{t("title")}<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
            <label className="field field-wide">{t("description")}<textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required /></label>
            <label className="field">{t("amount")}<input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>
            <label className="field">{t("requestedByLabel")}<input value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} required /></label>
          </div>
        </div>
        <div className="card form-section">
          <div className="section-heading"><div><h2>{t("approvers")}</h2><p>{t("rolesDifferentHelp")}</p></div><span className="count-pill">{t("requiredThree")}</span></div>
          <div className="approver-form-list">
            {approvers.map((approver, index) => (
              <fieldset key={index}>
                <legend>{t("approverNumber", { number: index + 1 })}</legend>
                <div className="form-grid three-columns">
                  <label className="field">{t("name")}<input value={approver.name} onChange={(e) => updateApprover(index, "name", e.target.value)} required /></label>
                  <label className="field">{t("email")}<input type="email" value={approver.email} onChange={(e) => updateApprover(index, "email", e.target.value)} required /></label>
                  <label className="field">{t("role")}<input value={approver.role} onChange={(e) => updateApprover(index, "role", e.target.value)} placeholder={t("rolePlaceholder")} required /></label>
                </div>
              </fieldset>
            ))}
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="button" onClick={loadTestData} disabled={submitting}>{t("loadTestData")}</button>
          <button type="button" className="button" onClick={clearForm} disabled={submitting}>{t("clearForm")}</button>
          <button className="button button-primary" disabled={submitting}><Save aria-hidden="true" /><span>{submitting ? t("creating") : t("createRequest")}</span></button>
        </div>
      </form>
    </section>
  );
}

interface FormValues {
  title: string;
  description: string;
  amount: string;
  requestedBy: string;
  approvers: [CreateApproverInput, CreateApproverInput, CreateApproverInput];
}

function validateForm(values: FormValues, t: (key: TranslationKey, variables?: Record<string, string | number>) => string): string[] {
  const errors: string[] = [];
  if (!values.title.trim() || !values.description.trim() || !values.requestedBy.trim()) errors.push(t("validationRequestFields"));
  if (!Number.isFinite(Number(values.amount)) || Number(values.amount) <= 0) errors.push(t("validationAmount"));
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  values.approvers.forEach((approver, index) => {
    if (!approver.name.trim() || !approver.email.trim() || !approver.role.trim()) errors.push(t("validationApproverFields", { number: index + 1 }));
    else if (!emailPattern.test(approver.email)) errors.push(t("validationEmail", { number: index + 1 }));
  });
  const roles = values.approvers.map((approver) => approver.role.trim().toLowerCase());
  if (roles.every(Boolean) && new Set(roles).size !== 3) errors.push(t("validationRoles"));
  return errors;
}
