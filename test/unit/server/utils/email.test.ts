/**
 * Unit tests for `server/utils/email.ts`.
 *
 * `server/utils/email.ts` is the template's "send transactional email"
 * utility. It wraps the Resend SDK behind a small `send(to, subject, html)`
 * helper plus two pre-built senders (magic-link, generic verification).
 *
 * The behaviours we lock in are deliberately minimal — a downstream
 * project will swap Resend for SendGrid / Mailgun / SES / a self-hosted
 * SMTP relay and add its own templates. What MUST keep working across
 * any such swap is the contract this file exposes to the rest of the app:
 *
 *   1. The sender refuses to call out if RESEND_API_KEY is unset
 *      (otherwise a misconfigured prod deploy silently swallows mails).
 *   2. On a successful Resend response, the sender resolves quietly.
 *   3. On a Resend-reported error, the sender throws so the upstream
 *      caller (e.g. Better Auth's magic-link plugin) can surface it.
 *
 * The Resend SDK is mocked at module level so the test never touches the
 * network. Copy this file as the template for any new email sender added
 * downstream — replace the Resend mock with the new SDK's shape.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Spy used by the Resend mock — the constructor returns `{ emails: { send } }`,
// so the assertion target is `sendSpy.mock.calls[...]`.
const sendSpy = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: (...args: unknown[]) => sendSpy(...args) };
  },
}));

describe("server/utils/email", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    sendSpy.mockReset();
    // Reset modules so the SDK mock gets re-evaluated per test (Resend
    // is instantiated per-call in the source, so the env can be set
    // *after* import and still take effect — we test that too).
    vi.resetModules();
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("throws a clear error when RESEND_API_KEY is unset", async () => {
    // No env → the sender must fail loudly rather than silently no-op.
    // A silent no-op in production would mean users never get their
    // magic-link / verification email and have no actionable error.
    const { sendMagicLinkEmail } = await import("~~/server/utils/email");
    await expect(
      sendMagicLinkEmail("a@b.tld", "https://example.com/verify?token=x"),
    ).rejects.toThrow(/RESEND_API_KEY/);
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it("sends a magic-link email with the requested URL embedded", async () => {
    // Happy path: env is set, Resend returns no error → resolves.
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "noreply@example.com";
    sendSpy.mockResolvedValue({ error: null });

    const { sendMagicLinkEmail } = await import("~~/server/utils/email");
    await sendMagicLinkEmail("alice@example.com", "https://app/verify?token=abc");

    expect(sendSpy).toHaveBeenCalledTimes(1);
    const payload = sendSpy.mock.calls[0]![0] as {
      from: string;
      to: string;
      subject: string;
      html: string;
    };
    expect(payload.from).toBe("noreply@example.com");
    expect(payload.to).toBe("alice@example.com");
    expect(payload.subject).toMatch(/sign-in/i);
    // The CTA URL must reach the rendered HTML — that's the entire
    // point of a magic-link email.
    expect(payload.html).toContain("https://app/verify?token=abc");
  });

  it("throws when Resend reports an error (the SDK does NOT auto-reject)", async () => {
    // Resend's send() resolves successfully even on API errors — the
    // `error` field is what tells us something went wrong. This test
    // pins that we read it and re-throw, so the caller can react.
    process.env.RESEND_API_KEY = "re_test_key";
    sendSpy.mockResolvedValue({ error: { message: "rate limited" } });

    const { sendMagicLinkEmail } = await import("~~/server/utils/email");
    await expect(
      sendMagicLinkEmail("a@b.tld", "https://app/x"),
    ).rejects.toThrow(/rate limited/);
  });
});
