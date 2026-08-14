export interface EvidenceFile {
  requestId: string;
  fileName: string;
  contentType: "application/pdf";
  content: Buffer;
  storageKey: string;
}
