// Outbound email — single source of truth for transactional mail.
// All exported senders go through `send` so future templates (welcome,
// password reset, …) only have to add one function + one HTML body.
import { Resend } from "resend";

/**
 * Low-level send: validates env, instantiates Resend per-call (so a key
 * injected after module load is still picked up), and surfaces API errors as
 * thrown exceptions — Resend's SDK resolves successfully on API errors, so we
 * have to check the `error` field explicitly.
 */
async function send(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set — cannot send email.");
  }
  // EMAIL_FROM must be a verified Resend sender/domain. The shared sandbox
  // sender `onboarding@resend.dev` only delivers to your own Resend account's
  // email — verify a domain to send to arbitrary recipients.
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from, subject, html, to });
  if (error) {
    throw new Error(`Resend failed (${subject}): ${error.message}`);
  }
}

/**
 * Shared email shell — heading + body paragraph + a primary action button
 * linking to `url`. Keeps templates readable and consistent.
 */
function renderEmail(opts: {
  heading: string;
  body: string;
  url: string;
  cta: string;
}) {
  return `
    <div style="font-family: sans-serif; line-height: 1.5;">
      <h2>${opts.heading}</h2>
      <p>${opts.body}</p>
      <p>
        <a href="${opts.url}"
           style="display:inline-block;padding:10px 20px;background:#1867c0;color:#fff;border-radius:8px;text-decoration:none;">
          ${opts.cta}
        </a>
      </p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
}

/**
 * Passwordless sign-in link (Better Auth magic-link plugin).
 * `url` already targets /api/auth/magic-link/verify with the token embedded.
 */
export async function sendMagicLinkEmail(to: string, url: string) {
  await send(
    to,
    "Your sign-in link",
    renderEmail({
      heading: "Sign in to your account",
      body: "Click the button below to sign in. This link expires shortly and can be used once.",
      url,
      cta: "Sign in",
    }),
  );
}

/**
 * Generic email-verification link (Better Auth's global `emailVerification`
 * subsystem). Called e.g. when the user has to confirm their current address
 * before a change-email request can proceed.
 */
export async function sendEmailVerification(to: string, url: string) {
  await send(
    to,
    "Verify your email address",
    renderEmail({
      heading: "Verify your email",
      body: "Click below to confirm this email address for your account.",
      url,
      cta: "Verify email",
    }),
  );
}

