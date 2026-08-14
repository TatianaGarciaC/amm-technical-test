/**
 * Mail module - exports types and implementations
 */

export type { MailService } from "./types/MailService.js";
export type { MockMail } from "./models/MockMail.js";
export { InMemoryMailService } from "./implementations/InMemoryMailService.js";
export { DynamoDbMailService } from "./implementations/DynamoDbMailService.js";
