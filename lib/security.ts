import crypto from 'crypto';

/**
 * Validates incoming requests from Platform B.
 * Defends against:
 * 1. Payload Tampering (HMAC validation)
 * 2. Replay Attacks (5-minute timestamp expiration window)
 * 3. Timing Attacks (using timingSafeEqual)
 */
export function verifyPlatformBRequest(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
  secret: string
): { isValid: boolean; error?: string } {
  if (!signature || !timestamp) {
    return { isValid: false, error: 'Missing security headers (x-signature or x-timestamp).' };
  }

  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime)) {
    return { isValid: false, error: 'Invalid timestamp format.' };
  }

  // Prevent Replay Attacks: Enforce a strict 5-minute window
  const timeDifference = Date.now() - requestTime;
  // Allow up to 60 seconds (60000ms) of clock drift for "future" timestamps
if (timeDifference > 5 * 60 * 1000 || timeDifference < -60000) {
    return { isValid: false, error: 'Request expired or timestamp is in the future.' };
  }

  // Compute expected signature based on the raw body string (preserves exact character spacing)
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  // Prevent crashes on buffer length mismatch, which also prevents timing leaks
  if (signatureBuffer.length !== expectedBuffer.length) {
    return { isValid: false, error: 'Signature length mismatch.' };
  }

  // Prevent Timing Attacks by comparing hashes in constant time
  const isMatch = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

  if (!isMatch) {
    return { isValid: false, error: 'Cryptographic signature mismatch.' };
  }

  return { isValid: true };
}

/**
 * Signs outgoing payloads sent FROM Platform A back to Platform B's webhook.
 * Ensures Platform B knows the final M-Pesa result is authentically from you.
 */
export function signOutgoingPayload(payload: Record<string, any>, secret: string) {
  const timestamp = Date.now().toString();
  const stringifiedPayload = JSON.stringify(payload);

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${stringifiedPayload}`)
    .digest('hex');

  return {
    signature,
    timestamp,
    stringifiedPayload,
  };
}
