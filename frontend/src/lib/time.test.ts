import { describe, expect, it } from "vitest";
import { timeAgo } from "./time";

const NOW = Date.parse("2026-10-30T12:00:00Z");
const ago = (secs: number) => new Date(NOW - secs * 1000).toISOString();

describe("timeAgo", () => {
  it("devuelve una raya cuando no hay fecha", () => {
    expect(timeAgo(null, "es", NOW)).toBe("—");
    expect(timeAgo(undefined, "en", NOW)).toBe("—");
    expect(timeAgo("", "es", NOW)).toBe("—");
  });

  it("elige la unidad más grande que cabe", () => {
    expect(timeAgo(ago(3 * 24 * 3600), "en", NOW)).toBe("3 days ago");
    expect(timeAgo(ago(2 * 3600), "en", NOW)).toBe("2 hours ago");
    expect(timeAgo(ago(5 * 60), "en", NOW)).toBe("5 minutes ago");
  });

  it("respeta el idioma pedido", () => {
    expect(timeAgo(ago(3 * 24 * 3600), "es", NOW)).toBe("hace 3 días");
  });

  it("usa «ayer» y «hoy» con numeric: auto", () => {
    expect(timeAgo(ago(24 * 3600), "es", NOW)).toBe("ayer");
  });

  it("menos de un minuto cuenta como «este minuto»", () => {
    expect(timeAgo(ago(20), "en", NOW)).toBe("this minute");
  });

  it("también entiende fechas futuras", () => {
    expect(timeAgo(ago(-2 * 3600), "en", NOW)).toBe("in 2 hours");
  });
});
