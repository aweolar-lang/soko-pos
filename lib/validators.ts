// lib/validators.ts

/**
 * EMAIL VALIDATION
 * Checks for a standard email format (user@domain.com)
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * NAME VALIDATION
 * Allows letters, spaces, hyphens, and apostrophes. Length: 2-50 chars.
 * Blocks numbers and dangerous symbols (<, >, /, etc.)
 */
export const isValidName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s\-']{2,50}$/;
  return nameRegex.test(name);
};

/**
 * KENYAN PHONE NUMBER NORMALIZATION & VALIDATION
 * Accepts: 07..., 01..., 2547..., +2547..., etc.
 * Returns: A clean 254... format (required by M-Pesa & Paystack), or null if invalid.
 */
export const formatKenyanPhone = (phone: string): string | null => {
  // 1. Remove all spaces, dashes, and brackets
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // 2. Kenyan Phone Regex: Matches 07, 01, 2547, +2547, 2541, +2541
  const phoneRegex = /^(?:254|\+254|0)?([17]\d{8})$/;
  
  const match = cleaned.match(phoneRegex);
  
  if (match) {
    // match[1] is the 9-digit part starting with 7 or 1 (e.g., 712345678)
    return `254${match[1]}`;
  }
  
  return null; // Invalid phone number
};

/**
 * KRA PIN VALIDATION
 * Must start with P or A, followed by 9 digits, ending with a letter.
 */
export const isValidKRAPin = (pin: string): boolean => {
  const kraRegex = /^[PA]\d{9}[A-Z]$/i;
  return kraRegex.test(pin);
};