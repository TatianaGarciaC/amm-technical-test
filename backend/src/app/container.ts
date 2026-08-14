/**
 * PurchaseFlow
 * Versión: 1.0
 * Copyright © 2026 Tatiana Garcia Contreras
 */
import { S3Client } from "@aws-sdk/client-s3";
import { createDynamoDBClient, getPurchaseRequestsTableName } from "../config/index.js";
import { DynamoDbPurchaseRequestRepository } from "../repositories/index.js";
import {
  ApprovePurchaseRequestService,
  CreatePurchaseRequestService,
  DynamoDbMailService,
  GenerateEvidenceService,
  GetPurchaseRequestService,
  ListPurchaseRequestsService,
  PdfLibEvidencePdfGenerator,
  RejectPurchaseRequestService,
  ResendApproverOtpService,
  S3EvidenceStorage,
  ValidateApproverOtpService,
} from "../services/index.js";

export interface AppContainer {
  createPurchaseRequest: CreatePurchaseRequestService;
  listPurchaseRequests: ListPurchaseRequestsService;
  getPurchaseRequest: GetPurchaseRequestService;
  validateApproverOtp: ValidateApproverOtpService;
  approvePurchaseRequest: ApprovePurchaseRequestService;
  rejectPurchaseRequest: RejectPurchaseRequestService;
  resendApproverOtp: ResendApproverOtpService;
  mailService: DynamoDbMailService;
  evidenceStorage: S3EvidenceStorage;
}

let cachedContainer: AppContainer | undefined;

/** Composition root de producción; conecta adaptadores AWS con servicios sin ejecutar solicitudes al construirlo. */
export function getContainer(): AppContainer {
  cachedContainer ??= createContainer();
  return cachedContainer;
}

function createContainer(): AppContainer {
  const dynamoClient = createDynamoDBClient();
  const repository = new DynamoDbPurchaseRequestRepository(
    dynamoClient,
    getPurchaseRequestsTableName()
  );
  const mailService = new DynamoDbMailService(
    dynamoClient,
    requiredEnvironmentVariable("MOCK_MAIL_TABLE")
  );
  const evidenceStorage = new S3EvidenceStorage(
    new S3Client({ region: process.env.AWS_REGION || "us-east-1" }),
    requiredEnvironmentVariable("EVIDENCE_BUCKET")
  );
  const generateEvidence = new GenerateEvidenceService(
    new PdfLibEvidencePdfGenerator(),
    evidenceStorage
  );

  return {
    createPurchaseRequest: new CreatePurchaseRequestService(repository, mailService),
    listPurchaseRequests: new ListPurchaseRequestsService(repository),
    getPurchaseRequest: new GetPurchaseRequestService(repository),
    validateApproverOtp: new ValidateApproverOtpService(repository),
    approvePurchaseRequest: new ApprovePurchaseRequestService(repository, generateEvidence),
    rejectPurchaseRequest: new RejectPurchaseRequestService(repository, generateEvidence),
    resendApproverOtp: new ResendApproverOtpService(repository, mailService),
    mailService,
    evidenceStorage,
  };
}

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is required`);
  return value;
}
