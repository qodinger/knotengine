import { describe, it, expect } from "vitest";

function determineStatus(
  confirmations: number,
  requiredConfirmations: number,
): string {
  if (confirmations <= 0) {
    return "mempool_detected";
  }
  if (confirmations >= requiredConfirmations) {
    return "confirmed";
  }
  return "confirming";
}

describe("Core Confirmation Engine Logic", () => {
  describe("determineStatus()", () => {
    it("should return 'mempool_detected' for 0 confirmations", () => {
      const status = determineStatus(0, 6);
      expect(status).toBe("mempool_detected");
    });

    it("should return 'mempool_detected' for negative confirmations (edge case)", () => {
      const status = determineStatus(-1, 6);
      expect(status).toBe("mempool_detected");
    });

    it("should return 'confirming' for partial confirmations (1 to required - 1)", () => {
      expect(determineStatus(1, 6)).toBe("confirming");
      expect(determineStatus(3, 6)).toBe("confirming");
      expect(determineStatus(5, 6)).toBe("confirming");
    });

    it("should return 'confirmed' when exactly meeting required confirmations", () => {
      const status = determineStatus(6, 6);
      expect(status).toBe("confirmed");
    });

    it("should return 'confirmed' when exceeding required confirmations", () => {
      const status = determineStatus(10, 6);
      expect(status).toBe("confirmed");
    });
  });

  describe("Fee Calculation Logic (Platform Fee)", () => {
    // KnotEngine fee structure based on PRICING_MODEL
    const calculateFee = (
      amountUsd: number,
      plan: "starter" | "professional" | "enterprise",
    ): number => {
      if (plan === "enterprise")
        return parseFloat((amountUsd * 0.0025).toFixed(4)); // 0.25%
      if (plan === "professional")
        return parseFloat((amountUsd * 0.005).toFixed(4)); // 0.5%
      return parseFloat((amountUsd * 0.01).toFixed(4)); // 1.0% (Starter default)
    };

    it("should calculate correct fee for Starter plan (1.0%)", () => {
      expect(calculateFee(100.0, "starter")).toBe(1.0);
      expect(calculateFee(500.5, "starter")).toBe(5.005);
      expect(calculateFee(1.0, "starter")).toBe(0.01);
    });

    it("should calculate correct fee for Professional plan (0.5%)", () => {
      expect(calculateFee(100.0, "professional")).toBe(0.5);
      expect(calculateFee(1000.0, "professional")).toBe(5.0);
    });

    it("should calculate correct fee for Enterprise plan (0.25%)", () => {
      expect(calculateFee(100.0, "enterprise")).toBe(0.25);
      expect(calculateFee(10000.0, "enterprise")).toBe(25.0);
    });
  });

  describe("Amount Status Evaluation", () => {
    const checkAmountStatus = (
      receivedAmount: number,
      requiredAmount: number,
      tolerancePercentage: number,
    ) => {
      const tolerance = tolerancePercentage ?? 1;
      const minRequired = requiredAmount * (1 - tolerance / 100);
      const isOverpayment = receivedAmount > requiredAmount * 1.05;

      if (receivedAmount < minRequired) return "partially_paid";
      if (isOverpayment) return "overpaid";
      return "perfectly_paid"; // Not a real DB status, just internal mapping for the test
    };

    it("should flag as partially_paid if below 1% tolerance", () => {
      expect(checkAmountStatus(98, 100, 1)).toBe("partially_paid");
    });

    it("should NOT flag as partially_paid if exactly on the 1% boundary", () => {
      expect(checkAmountStatus(99, 100, 1)).toBe("perfectly_paid");
    });

    it("should flag as overpaid if customer sends more than 5% extra", () => {
      expect(checkAmountStatus(106, 100, 1)).toBe("overpaid");
    });

    it("should pass standard full payments", () => {
      expect(checkAmountStatus(100, 100, 1)).toBe("perfectly_paid");
      expect(checkAmountStatus(102, 100, 1)).toBe("perfectly_paid");
    });

    it("should respect custom merchant underpayment tolerances (e.g. 5%)", () => {
      expect(checkAmountStatus(96, 100, 5)).toBe("perfectly_paid");
      expect(checkAmountStatus(94, 100, 5)).toBe("partially_paid");
    });
  });
});
