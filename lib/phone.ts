export function isE164(phone: string) {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}
