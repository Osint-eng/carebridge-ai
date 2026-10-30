/**
 * 3-step email verification helpers
 * 1) Syntax check
 * 2) Domain / MX check (DNS-over-HTTPS)
 * 3) Verification code (handled by auth store)
 */

export type EmailSyntaxResult = {
  ok: boolean;
  message: string;
};

export type EmailMxResult = {
  ok: boolean;
  message: string;
  domain?: string;
  mxHosts?: string[];
};

const BLOCKED_DISPOSABLE = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.org',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'throwaway.email',
  'yopmail.com',
  'trashmail.com',
  'getnada.com',
  'fakeinbox.com',
  'sharklasers.com',
  'maildrop.cc',
  'discard.email',
]);

/** Step 1 — RFC-style syntax validation */
export function checkEmailSyntax(raw: string): EmailSyntaxResult {
  const email = (raw || '').trim().toLowerCase();
  if (!email) return { ok: false, message: 'Email is required.' };
  if (email.length > 254) return { ok: false, message: 'Email is too long.' };
  if (email.includes('..')) return { ok: false, message: 'Email cannot contain consecutive dots.' };
  if (email.startsWith('.') || email.endsWith('.')) {
    return { ok: false, message: 'Email cannot start or end with a dot.' };
  }

  const re =
    /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
  if (!re.test(email)) {
    return { ok: false, message: 'Invalid email syntax. Use format: name@example.com' };
  }

  const [local, domain] = email.split('@');
  if (!local || local.length > 64) return { ok: false, message: 'Local part of email is invalid.' };
  if (!domain || !domain.includes('.')) {
    return { ok: false, message: 'Email domain is missing or invalid.' };
  }
  const tld = domain.split('.').pop() || '';
  if (tld.length < 2) return { ok: false, message: 'Email top-level domain is invalid.' };

  if (BLOCKED_DISPOSABLE.has(domain)) {
    return { ok: false, message: 'Disposable / temporary email domains are not allowed.' };
  }

  return { ok: true, message: 'Syntax looks valid.' };
}

/**
 * Step 2 — Domain + MX check via Cloudflare DNS-over-HTTPS
 * Confirms the domain publishes mail exchange records (can receive mail).
 * Does NOT prove the specific mailbox exists (that needs SMTP probe / provider API).
 */
export async function checkEmailDomainMx(raw: string): Promise<EmailMxResult> {
  const email = (raw || '').trim().toLowerCase();
  const syntax = checkEmailSyntax(email);
  if (!syntax.ok) return { ok: false, message: syntax.message };

  const domain = email.split('@')[1];
  if (!domain) return { ok: false, message: 'Could not parse domain from email.' };

  try {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`;
    const res = await fetch(url, {
      headers: { Accept: 'application/dns-json' },
    });
    if (!res.ok) {
      return {
        ok: false,
        message: `Could not look up domain DNS (HTTP ${res.status}). Try again.`,
        domain,
      };
    }
    const json = (await res.json()) as {
      Status?: number;
      Answer?: Array<{ data?: string; type?: number }>;
    };

    if (json.Status !== 0) {
      return {
        ok: false,
        message: `Domain "${domain}" has no valid DNS (status ${json.Status}). This email domain cannot receive mail.`,
        domain,
      };
    }

    const mx = (json.Answer || [])
      .filter((a) => a.type === 15 || (a.data && /^\d+\s+\S+/.test(a.data)))
      .map((a) => (a.data || '').replace(/^\d+\s+/, '').replace(/\.$/, ''))
      .filter(Boolean);

    if (mx.length === 0) {
      const aUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`;
      const aRes = await fetch(aUrl, { headers: { Accept: 'application/dns-json' } });
      const aJson = aRes.ok ? await aRes.json() : null;
      const hasA =
        aJson?.Status === 0 &&
        Array.isArray(aJson?.Answer) &&
        aJson.Answer.some((a: { type?: number }) => a.type === 1);

      if (!hasA) {
        return {
          ok: false,
          message: `Domain "${domain}" has no MX or A records. Mail cannot be delivered here.`,
          domain,
        };
      }
      return {
        ok: true,
        message: `Domain "${domain}" resolves (no MX, but host exists). Proceed to code verification.`,
        domain,
        mxHosts: [],
      };
    }

    return {
      ok: true,
      message: `Domain "${domain}" accepts mail (MX: ${mx.slice(0, 3).join(', ')}).`,
      domain,
      mxHosts: mx,
    };
  } catch (err: any) {
    return {
      ok: false,
      message:
        err?.message?.includes('Failed to fetch')
          ? 'Network error during domain check. Check your connection and try again.'
          : `Domain check failed: ${err?.message || 'unknown error'}`,
      domain,
    };
  }
}

/** Run steps 1 + 2 together before signup is allowed to continue */
export async function validateEmailForSignup(raw: string): Promise<{
  ok: boolean;
  step: 1 | 2;
  message: string;
  mxHosts?: string[];
}> {
  const syntax = checkEmailSyntax(raw);
  if (!syntax.ok) return { ok: false, step: 1, message: syntax.message };

  const mx = await checkEmailDomainMx(raw);
  if (!mx.ok) return { ok: false, step: 2, message: mx.message, mxHosts: mx.mxHosts };

  return { ok: true, step: 2, message: mx.message, mxHosts: mx.mxHosts };
}
