import { describe, expect, it } from "vitest";
import { computeExpectedState } from "./expectedState.js";

function at(hours: number, minutes: number): Date {
  const d = new Date(2026, 0, 1, hours, minutes);
  return d;
}

describe("computeExpectedState", () => {
  it("is expected-open within a normal (non-wrapping) interval", () => {
    const hours = [{ start: "11:00", end: "23:00" }];
    expect(computeExpectedState(hours, at(15, 0))).toBe("expected-open");
  });

  it("is expected-closed before a normal interval starts", () => {
    const hours = [{ start: "11:00", end: "23:00" }];
    expect(computeExpectedState(hours, at(9, 0))).toBe("expected-closed");
  });

  it("is expected-closed at/after a normal interval's end (end is exclusive)", () => {
    const hours = [{ start: "11:00", end: "23:00" }];
    expect(computeExpectedState(hours, at(23, 0))).toBe("expected-closed");
  });

  it("is expected-open in the evening portion of a midnight-crossing interval", () => {
    const hours = [{ start: "11:00", end: "01:00" }];
    expect(computeExpectedState(hours, at(23, 30))).toBe("expected-open");
  });

  it("is expected-open in the early-morning portion of a midnight-crossing interval", () => {
    const hours = [{ start: "11:00", end: "01:00" }];
    expect(computeExpectedState(hours, at(0, 30))).toBe("expected-open");
  });

  it("is expected-closed in the gap after a midnight-crossing interval ends", () => {
    const hours = [{ start: "11:00", end: "01:00" }];
    expect(computeExpectedState(hours, at(2, 0))).toBe("expected-closed");
  });

  it("is expected-closed in the gap before a midnight-crossing interval starts", () => {
    const hours = [{ start: "11:00", end: "01:00" }];
    expect(computeExpectedState(hours, at(9, 0))).toBe("expected-closed");
  });

  it("treats multiple intervals as open if any interval matches", () => {
    const hours = [
      { start: "07:00", end: "10:00" },
      { start: "18:00", end: "22:00" },
    ];
    expect(computeExpectedState(hours, at(8, 0))).toBe("expected-open");
    expect(computeExpectedState(hours, at(20, 0))).toBe("expected-open");
    expect(computeExpectedState(hours, at(12, 0))).toBe("expected-closed");
  });

  it("is expected-closed with no opening hours at all", () => {
    expect(computeExpectedState([], at(12, 0))).toBe("expected-closed");
  });
});
