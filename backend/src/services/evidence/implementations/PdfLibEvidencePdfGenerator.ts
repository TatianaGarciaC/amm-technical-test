/**
 * PurchaseFlow
 * Versión: 1.0
 * Copyright © 2026 Tatiana Garcia Contreras
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { PurchaseRequest } from "../../../models/index.js";
import { PurchaseRequestStatus } from "../../../models/index.js";
import { ConflictError } from "../../../errors/index.js";
import type { EvidencePdfGenerator } from "../types/EvidencePdfGenerator.js";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const NAVY = rgb(0.07, 0.14, 0.25);
const BLUE = rgb(0.13, 0.34, 0.85);
const MUTED = rgb(0.38, 0.44, 0.54);
const BORDER = rgb(0.86, 0.89, 0.94);
const GREEN = rgb(0.08, 0.48, 0.27);
const GREEN_BG = rgb(0.88, 0.97, 0.91);
const RED = rgb(0.72, 0.12, 0.16);
const RED_BG = rgb(1, 0.9, 0.9);
const AMBER = rgb(0.62, 0.4, 0.02);
const AMBER_BG = rgb(1, 0.96, 0.82);

/** Genera evidencia empresarial liviana con pdf-lib, paginación y exclusión de credenciales sensibles. */
export class PdfLibEvidencePdfGenerator implements EvidencePdfGenerator {
  async generate(request: PurchaseRequest): Promise<Buffer> {
    if (![PurchaseRequestStatus.COMPLETED, PurchaseRequestStatus.REJECTED].includes(request.status)) {
      throw new ConflictError("Evidence can only be generated for a final request");
    }

    const document = await PDFDocument.create();
    const generatedAt = new Date();
    document.setTitle(`Evidencia de solicitud de compra - ${request.id}`);
    document.setAuthor("PurchaseFlow");
    document.setSubject("Purchase approval evidence");
    document.setCreator("PurchaseFlow Professional Evidence Generator");
    document.setKeywords(["PurchaseFlow", "Evidencia de Solicitud de Compra", "Approval Summary"]);
    const regular = await document.embedFont(StandardFonts.Helvetica);
    const bold = await document.embedFont(StandardFonts.HelveticaBold);
    let page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;

    const addPage = (): void => {
      page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
      drawContinuationHeader(page, regular, request.id);
      y -= 30;
    };
    const ensureSpace = (height: number): void => { if (y - height < 58) addPage(); };
    const text = (value: string, x: number, baseline: number, size: number, font: PDFFont = regular, color = NAVY): void => {
      page.drawText(safeText(value), { x, y: baseline, size, font, color });
    };
    const wrapped = (value: string, maxWidth: number, size: number, font: PDFFont = regular): string[] => wrapText(safeText(value), maxWidth, size, font);

    // Encabezado corporativo
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 108, width: PAGE_WIDTH, height: 108, color: NAVY });
    page.drawRectangle({ x: MARGIN, y: PAGE_HEIGHT - 67, width: 29, height: 29, color: BLUE });
    text("PF", MARGIN + 7, PAGE_HEIGHT - 57, 10, bold, rgb(1, 1, 1));
    text("PurchaseFlow", MARGIN + 40, PAGE_HEIGHT - 47, 17, bold, rgb(1, 1, 1));
    text("Gestion de Aprobaciones de Compra", MARGIN + 40, PAGE_HEIGHT - 66, 10, regular, rgb(0.72, 0.78, 0.88));
    const requestRejected = request.status === PurchaseRequestStatus.REJECTED;
    drawBadge(page, bold, requestRejected ? "RECHAZADA" : "COMPLETADA", PAGE_WIDTH - MARGIN - 92, PAGE_HEIGHT - 61, 92, requestRejected ? RED : GREEN, requestRejected ? RED_BG : GREEN_BG);
    y = PAGE_HEIGHT - 130;
    text("Evidencia de solicitud de compra", MARGIN, y, 20, bold, BLUE);
    y -= 19;
    text(`Generado el ${formatDate(generatedAt)}`, MARGIN, y, 9, regular, MUTED);
    y -= 25;

    text("INFORMACION DE LA SOLICITUD", MARGIN, y, 9, bold, BLUE);
    y -= 11;
    const descriptionLines = wrapped(request.description, CONTENT_WIDTH / 2 - 32, 9, regular);
    const titleLines = wrapped(request.title, CONTENT_WIDTH / 2 - 32, 10, bold);
    const infoHeight = Math.max(155, 84 + titleLines.length * 12 + descriptionLines.length * 12);
    ensureSpace(infoHeight);
    const leftX = MARGIN + 4;
    const rightX = MARGIN + CONTENT_WIDTH / 2 + 12;
    page.drawLine({ start: { x: MARGIN + CONTENT_WIDTH / 2, y: y - 4 }, end: { x: MARGIN + CONTENT_WIDTH / 2, y: y - infoHeight + 4 }, thickness: 0.6, color: BORDER });
    drawInfoCell(page, regular, bold, "ID DE SOLICITUD", request.id, leftX, y - 15, 8);
    drawInfoCell(page, regular, bold, "TITULO", titleLines.join(" "), leftX, y - 52, 9);
    page.drawText("DESCRIPCION", { x: leftX, y: y - 86, size: 7, font: bold, color: MUTED });
    descriptionLines.slice(0, 5).forEach((line, index) => page.drawText(line, { x: leftX, y: y - 102 - index * 12, size: 9, font: regular, color: NAVY }));
    drawInfoCell(page, regular, bold, "SOLICITADO POR", request.requestedBy, rightX, y - 15);
    drawInfoCell(page, regular, bold, "FECHA DE CREACION", formatDate(request.createdAt), rightX, y - 52, 8.5);
    drawInfoCell(page, regular, bold, "MONTO", formatAmount(request.amount), rightX, y - 89, 11);
    drawInfoCell(page, regular, bold, "ESTADO", requestRejected ? "RECHAZADA" : "COMPLETADA", rightX, y - 126, 9);
    y -= infoHeight + 18;

    ensureSpace(55);
    text("RESUMEN DE APROBACIONES", MARGIN, y, 9, bold, BLUE);
    const approvedCount = request.approvers.filter((approver) => approver.status === "SIGNED").length;
    text(`${approvedCount} de ${request.approvers.length} aprobaciones completadas`, PAGE_WIDTH - MARGIN - 190, y - 1, 10, bold, requestRejected ? RED : GREEN);
    y -= 21;
    page.drawRectangle({ x: MARGIN, y: y - 7, width: CONTENT_WIDTH, height: 7, color: rgb(0.9, 0.93, 0.96) });
    page.drawRectangle({ x: MARGIN, y: y - 7, width: CONTENT_WIDTH * approvedCount / request.approvers.length, height: 7, color: requestRejected ? RED : GREEN });
    y -= 23;

    for (const approver of request.approvers) {
      const cardHeight = 74;
      ensureSpace(cardHeight + 9);
      page.drawRectangle({ x: MARGIN, y: y - cardHeight, width: CONTENT_WIDTH, height: cardHeight, color: rgb(1, 1, 1), borderColor: BORDER, borderWidth: 1 });
      const visual = approvalVisual(approver.status);
      drawDecisionIndicator(page, MARGIN + 24, y - 27, visual.color, visual.background, visual.symbol);
      text(approver.name, MARGIN + 48, y - 21, 11, bold);
      text(approver.email, MARGIN + 48, y - 37, 8.5, regular, MUTED);
      text(`Rol: ${approver.role}`, MARGIN + 48, y - 56, 8, bold, BLUE);
      drawBadge(page, bold, visual.label, PAGE_WIDTH - MARGIN - 78, y - 27, 70, visual.color, visual.background);
      text(`${approver.status === "PENDING" ? "Decision" : "Fecha de decision"}: ${formatDate(approver.signedAt)}`, PAGE_WIDTH - MARGIN - 221, y - 55, 8, regular, MUTED);
      y -= cardHeight + 8;
    }

    const pages = document.getPages();
    pages.forEach((pdfPage, index) => drawFooter(pdfPage, regular, generatedAt, index + 1, pages.length));
    const bytes = await document.save();
    return Buffer.from(bytes);
  }
}

function drawContinuationHeader(page: PDFPage, font: PDFFont, requestId: string): void {
  page.drawText("PurchaseFlow  /  Purchase Approval Evidence", { x: MARGIN, y: PAGE_HEIGHT - MARGIN, size: 9, font, color: MUTED });
  page.drawText(safeText(requestId), { x: PAGE_WIDTH - MARGIN - Math.min(200, font.widthOfTextAtSize(safeText(requestId), 8)), y: PAGE_HEIGHT - MARGIN, size: 8, font, color: MUTED });
  page.drawLine({ start: { x: MARGIN, y: PAGE_HEIGHT - MARGIN - 10 }, end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - MARGIN - 10 }, thickness: 1, color: BORDER });
}

function drawInfoCell(page: PDFPage, regular: PDFFont, bold: PDFFont, label: string, value: string, x: number, y: number, valueSize = 10): void {
  page.drawText(label, { x, y, size: 7, font: bold, color: MUTED });
  page.drawText(safeText(value), { x, y: y - 17, size: valueSize, font: regular, color: NAVY, maxWidth: 230 });
}

function drawBadge(page: PDFPage, font: PDFFont, label: string, x: number, y: number, width: number, color = GREEN, background = GREEN_BG): void {
  page.drawRectangle({ x, y, width, height: 23, color: background });
  const textWidth = font.widthOfTextAtSize(label, 8);
  page.drawText(label, { x: x + (width - textWidth) / 2, y: y + 8, size: 8, font, color });
}

function drawDecisionIndicator(page: PDFPage, x: number, y: number, color: ReturnType<typeof rgb>, background: ReturnType<typeof rgb>, symbol: "check" | "cross" | "dash"): void {
  page.drawCircle({ x, y, size: 13, color: background });
  if (symbol === "check") {
    page.drawLine({ start: { x: x - 5, y }, end: { x: x - 1, y: y - 4 }, thickness: 2, color });
    page.drawLine({ start: { x: x - 1, y: y - 4 }, end: { x: x + 6, y: y + 5 }, thickness: 2, color });
  } else if (symbol === "cross") {
    page.drawLine({ start: { x: x - 5, y: y - 5 }, end: { x: x + 5, y: y + 5 }, thickness: 2, color });
    page.drawLine({ start: { x: x - 5, y: y + 5 }, end: { x: x + 5, y: y - 5 }, thickness: 2, color });
  } else page.drawLine({ start: { x: x - 5, y }, end: { x: x + 5, y }, thickness: 2, color });
}

function approvalVisual(status: string): { label: string; color: ReturnType<typeof rgb>; background: ReturnType<typeof rgb>; symbol: "check" | "cross" | "dash" } {
  if (status === "SIGNED") return { label: "APROBADO", color: GREEN, background: GREEN_BG, symbol: "check" };
  if (status === "REJECTED") return { label: "RECHAZADO", color: RED, background: RED_BG, symbol: "cross" };
  return { label: "PENDIENTE", color: AMBER, background: AMBER_BG, symbol: "dash" };
}

function drawFooter(page: PDFPage, font: PDFFont, generatedAt: Date, pageNumber: number, pageCount: number): void {
  page.drawLine({ start: { x: MARGIN, y: 42 }, end: { x: PAGE_WIDTH - MARGIN, y: 42 }, thickness: 1, color: BORDER });
  page.drawText("PurchaseFlow · v1.0 · 2026", { x: MARGIN, y: 26, size: 7.5, font, color: MUTED });
  const center = "Documento generado automaticamente";
  page.drawText(center, { x: (PAGE_WIDTH - font.widthOfTextAtSize(center, 7.5)) / 2, y: 26, size: 7.5, font, color: MUTED });
  const right = `${formatShortDate(generatedAt)}  |  Pagina ${pageNumber} de ${pageCount}`;
  page.drawText(right, { x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(right, 7.5), y: 26, size: 7.5, font, color: MUTED });
}

function wrapText(value: string, maxWidth: number, size: number, font: PDFFont): string[] {
  const words = value.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
    else { if (line) lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function formatAmount(amount: number): string {
  return `$${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(amount)} COP`;
}

function formatDate(value: Date | null): string {
  if (!value) return "No disponible";
  return new Intl.DateTimeFormat("es-CO", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(value);
}

function formatShortDate(value: Date): string {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "short", timeZone: "America/Bogota" }).format(value);
}

function safeText(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "");
}
