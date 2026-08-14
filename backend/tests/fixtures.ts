import { InMemoryPurchaseRequestRepository } from "../src/repositories/implementations/InMemoryPurchaseRequestRepository.js";
import { CreatePurchaseRequestService } from "../src/services/CreatePurchaseRequestService.js";
import { InMemoryMailService } from "../src/services/mail/implementations/InMemoryMailService.js";
import type { CreatePurchaseRequestDTO, PurchaseRequest } from "../src/models/index.js";

export const validInput: CreatePurchaseRequestDTO = {
  title: "Development laptops",
  description: "Three laptops for the engineering team",
  amount: 12_500,
  requestedBy: "Tatiana",
  approvers: [
    { name: "Carlos", email: "carlos@example.com", role: "FINANCE" },
    { name: "Laura", email: "laura@example.com", role: "MANAGER" },
    { name: "Andres", email: "andres@example.com", role: "DIRECTOR" },
  ],
};

export function createTestContext() {
  const repository = new InMemoryPurchaseRequestRepository();
  const mail = new InMemoryMailService();
  const create = new CreatePurchaseRequestService(repository, mail);
  return { repository, mail, create };
}

export async function createRequest(): Promise<{
  request: PurchaseRequest;
  repository: InMemoryPurchaseRequestRepository;
  mail: InMemoryMailService;
}> {
  const context = createTestContext();
  const request = await context.create.execute(validInput);
  return { request, repository: context.repository, mail: context.mail };
}
