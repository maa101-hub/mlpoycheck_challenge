/**
 * Corporate-email policy.
 * Registration and login require a company email address — common free/personal
 * email providers are rejected so accounts map to real organisations.
 */
const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.uk', 'yahoo.co.in', 'ymail.com', 'rocketmail.com',
  'hotmail.com', 'hotmail.co.uk', 'outlook.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com',
  'proton.me', 'protonmail.com',
  'mail.com', 'gmx.com', 'gmx.net',
  'yandex.com', 'yandex.ru',
  'zoho.com',
  'pm.me',
]);

export function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** True when the email is a plausible corporate address (not a personal provider). */
export function isCorporateEmail(email: string): boolean {
  if (!isValidEmailFormat(email)) return false;
  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain) return false;
  return !PERSONAL_EMAIL_DOMAINS.has(domain);
}

export const CORPORATE_EMAIL_MESSAGE =
  'Please use your company email address. Personal email providers (Gmail, Yahoo, Outlook, etc.) are not allowed.';
