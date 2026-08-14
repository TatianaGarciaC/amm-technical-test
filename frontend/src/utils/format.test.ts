import { describe, expect, it } from "vitest";
import { formatAmount, formatDate } from "./format";

describe("formatters", () => {
  it("formats a neutral numeric amount consistently", () => {
    expect(formatAmount(12_500.5)).toBe("12,500.5");
  });

  it("formats valid dates and handles invalid input", () => {
    expect(formatDate("2025-01-15T14:30:00.000Z")).not.toBe("Unavailable");
    expect(formatDate("invalid")).toBe("Unavailable");
  });
});
