/**
 * Email delivery is out of scope for the MVP ("no automated communication"),
 * so there is no provider wired up yet.
 *
 * The password-reset token flow is fully built and correct; only delivery is
 * missing. In development the link is printed to the server console so the flow
 * can be exercised end to end. In production nothing is sent, and the token is
 * NOT logged — writing working reset links into production logs would be worse
 * than the feature being unavailable.
 *
 * Wiring Resend here is the single change needed to make reset work in prod.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.info(`[daur] password reset for ${to}\n[daur] ${resetUrl}`);
    return;
  }

  console.warn(
    "[daur] Password reset requested but no email provider is configured. " +
      "Wire Resend in lib/mailer.ts before relying on this in production.",
  );
}
