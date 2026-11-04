// Shared form helpers.
// Kenyan mobile numbers: 07XXXXXXXX, 01XXXXXXXX, +2547XXXXXXXX or 2547XXXXXXXX
export const PHONE_PATTERN = '^(\\+?254|0)[17][0-9]{8}$';
export const PHONE_TITLE = 'Enter a valid Kenyan number, e.g. 0712345678 or +254712345678';

// Keep only digits, plus a single leading "+", so letters can never be typed into a phone field.
export const cleanPhone = (v) => v.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
