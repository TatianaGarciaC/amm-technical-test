import { describe, expect, it } from "vitest";
import { isFinalStatus } from "./purchaseRequestStatus";

describe("isFinalStatus", () => {
  it.each([
    ["COMPLETED", true],
    ["REJECTED", true],
    ["PENDING", false],
  ] as const)("returns %s => %s", (status, expected) => {
    expect(isFinalStatus(status)).toBe(expected);
  });
});
