// Progressively formats digits as (XXX) XXX-XXXX while typing -- shared by
// every phone <input> in the app so a number always looks the same
// regardless of which form it was typed into. US-only, consistent with
// the rest of the site (all 50 states + DC, no international numbers
// anywhere else in this flow). Caps at 10 digits so pasting a longer
// string doesn't overflow the mask.
export function formatPhoneInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
