/**
 * Unit tests for `server/api/auth/providers/infos.get.ts`.
 *
 * The handler returns a static, hand-curated map of provider id → display
 * metadata (name, RGB brand colour, MDI icon). It is the single source of
 * truth for the OAuth button UI — both `app.vue` (which `provide`s the
 * list) and the components that `inject` it depend on this exact shape.
 *
 * What we pin here:
 *
 *   - the set of provider keys MUST match the ones registered in
 *     `lib/auth.ts → socialProviders`. We assert the keys explicitly so
 *     adding/removing a provider in one file without the other breaks CI.
 *
 *   - each provider entry MUST expose `name` (string), `icon` (string), and
 *     `color` with three byte-range RGB channels (0-255). These are the
 *     fields LoginItem.vue / settings.vue / AccountItem.vue read.
 */
import { describe, it, expect } from "vitest";
import handler from "~~/server/api/auth/providers/infos.get";

describe("GET /api/auth/providers/infos", () => {
  it("returns metadata for GitHub and Twitch only", async () => {
    const result = (handler as () => Record<string, unknown>)();
    const keys = Object.keys(result).sort();
    expect(keys).toEqual(["github", "twitch"]);
  });

  it("each provider exposes name / color (RGB) / icon (MDI)", async () => {
    const result = (handler as () => Record<
      string,
      {
        name: string;
        color: { r: number; g: number; b: number };
        icon: string;
      }
    >)();

    for (const [id, info] of Object.entries(result)) {
      expect(typeof info.name, `${id}.name`).toBe("string");
      expect(info.name.length, `${id}.name`).toBeGreaterThan(0);

      expect(typeof info.icon, `${id}.icon`).toBe("string");
      // The UI does direct interpolation: `<v-icon :icon="..."/>` — the
      // string must be a valid `mdi-*` identifier or Vuetify renders blank.
      expect(info.icon, `${id}.icon`).toMatch(/^mdi-/);

      expect(info.color, `${id}.color`).toEqual(
        expect.objectContaining({
          r: expect.any(Number),
          g: expect.any(Number),
          b: expect.any(Number),
        }),
      );
      for (const channel of ["r", "g", "b"] as const) {
        const value = info.color[channel];
        expect(value, `${id}.color.${channel}`).toBeGreaterThanOrEqual(0);
        expect(value, `${id}.color.${channel}`).toBeLessThanOrEqual(255);
      }
    }
  });

  it("returns a fresh object on every call (no shared mutable state)", () => {
    const a = (handler as () => Record<string, unknown>)();
    const b = (handler as () => Record<string, unknown>)();
    // Each call ships a new literal — callers may safely mutate the result.
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});
