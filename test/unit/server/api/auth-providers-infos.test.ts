/**
 * Unit tests for `server/api/auth/providers/infos.get.ts`.
 *
 * The handler returns a static, hand-curated map of provider id → UI
 * metadata (display name, MDI icon, brand RGB colour). It is the single
 * source of truth for the OAuth-button UI rendered by `app.vue` and the
 * components that `inject("providersInfos", …)` it.
 *
 * Because a downstream project will freely add / remove providers from
 * this map (Discord, Google, Apple, …), the tests here DO NOT pin the
 * specific keys present. Instead they pin the structural contract every
 * entry must satisfy — so any provider added to a fork stays renderable
 * by the existing components without code changes elsewhere.
 *
 * What we pin:
 *   - the handler returns a plain object whose values all carry
 *     `name` (string), `icon` (string), and `color` (RGB triple).
 *   - the handler returns a fresh object on every call (no shared
 *     mutable state — callers may freely mutate the result).
 *
 * Use this file as the template for any "static catalogue" endpoint.
 */
import { describe, it, expect } from "vitest";
import handler from "~~/server/api/auth/providers/infos.get";

// The exported `defineEventHandler(() => ({...}))` is typed by h3 as an
// `EventHandler`. Our setup.ts stub returns the inner function unchanged,
// so calling the default export with no args yields the metadata object.
// We bridge the type mismatch with an `unknown` cast at a single named
// helper here — keeps the test bodies focused on the data, not the cast.
type ProviderEntry = {
  name: string;
  color: { r: number; g: number; b: number };
  icon: string;
};
const invoke = (): Record<string, ProviderEntry> =>
  (handler as unknown as () => Record<string, ProviderEntry>)();

describe("GET /api/auth/providers/infos", () => {
  it("returns at least one provider whose value matches the {name, icon, color} contract", () => {
    // We deliberately do NOT check for "github" / "twitch" specifically.
    // A fork that adds Discord, Google, etc. must still pass this test;
    // it only breaks when the SHAPE of an entry diverges from what the
    // OAuth-button components expect to render.
    const result = invoke();
    const ids = Object.keys(result);
    expect(ids.length).toBeGreaterThan(0);

    for (const id of ids) {
      const info = result[id]!;
      // Display name — surfaced in tooltips / button labels.
      expect(typeof info.name, `${id}.name`).toBe("string");
      expect(info.name.length, `${id}.name`).toBeGreaterThan(0);
      // MDI icon name — bound to `<v-icon :icon="..."/>`. Must start
      // with `mdi-` or Vuetify renders blank.
      expect(typeof info.icon, `${id}.icon`).toBe("string");
      expect(info.icon, `${id}.icon`).toMatch(/^mdi-/);
      // Brand colour, RGB triple — used as `rgba(r, g, b, 0.25)` for the
      // button background and `rgba(r, g, b, 1)` for the icon tint.
      expect(info.color, `${id}.color`).toEqual(
        expect.objectContaining({
          r: expect.any(Number),
          g: expect.any(Number),
          b: expect.any(Number),
        }),
      );
      // Destructure to a local so eslint-plugin-security does not flag
      // the dynamic key reads as object-injection sinks.
      const { r, g, b } = info.color;
      for (const [label, value] of [
        ["r", r],
        ["g", g],
        ["b", b],
      ] as const) {
        expect(value, `${id}.color.${label}`).toBeGreaterThanOrEqual(0);
        expect(value, `${id}.color.${label}`).toBeLessThanOrEqual(255);
      }
    }
  });

  it("returns a fresh object on every call (no shared mutable state)", () => {
    // The handler builds a fresh object literal every time. Pin that
    // contract so callers can mutate the result without leaking changes
    // into the next request's response.
    const a = invoke();
    const b = invoke();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});
