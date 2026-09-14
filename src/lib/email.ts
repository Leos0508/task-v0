import { Resend } from "resend";
import { getEmailEnv } from "#/lib/env.server";

export async function sendAppEmail({
	to,
	subject,
	html,
	text,
	idempotencyKey,
}: {
	to: string;
	subject: string;
	html: string;
	text: string;
	idempotencyKey: string;
}) {
	const { apiKey, from } = getEmailEnv();
	if (!apiKey) {
		console.warn(
			`RESEND_API_KEY is not set; skipped email "${subject}" to ${to}`,
		);
		return;
	}

	const resend = new Resend(apiKey);
	const { error } = await resend.emails.send(
		{ from, to, subject, html, text },
		{ idempotencyKey },
	);

	if (error) {
		throw new Error(error.message);
	}
}

export function authEmailHtml({
	title,
	body,
	href,
	action,
}: {
	title: string;
	body: string;
	href: string;
	action: string;
}) {
	return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:32px;background:#f6f4ef;font-family:Inter,system-ui,sans-serif;color:#1c1a16;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;">
    <tr><td>
      <p style="margin:0 0 8px;font-family:'Space Grotesk',system-ui,sans-serif;font-size:22px;font-weight:600;">Task</p>
      <h1 style="margin:0 0 16px;font-size:18px;">${title}</h1>
      <p style="margin:0 0 24px;line-height:1.5;">${body}</p>
      <p style="margin:0 0 24px;">
        <a href="${href}" style="display:inline-block;background:#1c1a16;color:#f7f5f0;text-decoration:none;padding:10px 16px;border-radius:8px;">${action}</a>
      </p>
      <p style="margin:0;font-size:12px;color:#6b665d;">If the button does not work, copy this link:<br>${href}</p>
    </td></tr>
  </table>
</body>
</html>`;
}
