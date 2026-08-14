import { describe, expect, it } from "vitest";
import { getRandomPurchaseRequestTestData, PURCHASE_REQUEST_TEST_DATA } from "./purchaseRequestTestData";

describe("purchase request test data", () => {
  it("contains 30 complete, unique, valid cases", () => {
    expect(PURCHASE_REQUEST_TEST_DATA).toHaveLength(30);
    expect(new Set(PURCHASE_REQUEST_TEST_DATA.map(({ title }) => title)).size).toBe(30);
    for (const item of PURCHASE_REQUEST_TEST_DATA) {
      expect(item.title.trim()).not.toBe("");
      expect(item.description.trim()).not.toBe("");
      expect(item.requestedBy.trim()).not.toBe("");
      expect(item.amount).toBeGreaterThan(0);
      expect(item.approvers).toHaveLength(3);
      expect(new Set(item.approvers.map(({ role }) => role.toLowerCase())).size).toBe(3);
      item.approvers.forEach((approver) => {
        expect(approver.name.trim()).not.toBe("");
        expect(approver.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        expect(approver.role.trim()).not.toBe("");
      });
    }
  });

  it("selects a bank entry and excludes the previous entry", () => {
    const first = getRandomPurchaseRequestTestData(undefined, () => 0);
    const next = getRandomPurchaseRequestTestData(first, () => 0);
    expect(PURCHASE_REQUEST_TEST_DATA).toContain(first);
    expect(PURCHASE_REQUEST_TEST_DATA).toContain(next);
    expect(next).not.toBe(first);
  });
});
