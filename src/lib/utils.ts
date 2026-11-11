import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const phoneNumberAutoFormat = (phoneNumber: string): string => {
  const number = phoneNumber.trim().replace(/[^0-9]/g, "");

  if (number.length < 4) return number;
  if (number.length < 7) return number.replace(/(\d{3})(\d{1})/, "$1-$2");
  if (number.length < 11) return number.replace(/(\d{3})(\d{3})(\d{1})/, "$1-$2-$3");
  if (number.length === 11) return number.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, "+$1 ($2) $3-$4");
  return number.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
};

/**
 * Display formatter for stored phone values. Reformats plain US numbers (10 digits, or 11 with a
 * leading 1); anything else (extensions, international, free text) is returned unchanged.
 */
export const formatPhone = (phone?: string | null): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  const isPlainUs = digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
  const hasExtraText = /[a-z]/i.test(phone) || /\d\D*[x#]/i.test(phone);
  return isPlainUs && !hasExtraText ? phoneNumberAutoFormat(phone) : phone.trim();
};

export const capitalizeFirst = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, "-")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

// Builds a readable "/members/:slug" path segment from the business name, e.g. "acme-plumbing".
// Falls back to the raw id when there's no name yet. The backend resolves this slug back to the
// business (matching on slugified name), so no id needs to be embedded in the URL.
export const buildMemberSlug = (businessName?: string | null, id?: string): string => {
  const namePart = businessName ? slugify(businessName) : "";
  return namePart || id || "";
};