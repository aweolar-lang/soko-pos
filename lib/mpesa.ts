import crypto from 'crypto';

// ============================================================================
// ENVIRONMENT & CONSTANTS
// ============================================================================
const MPESA_ENV = process.env.MPESA_ENV || 'sandbox';
const BASE_URL = MPESA_ENV === 'live'
  ? 'https://api.safaricom.co.ke' 
  : 'https://sandbox.safaricom.co.ke';

// Token Caching: In serverless (Next.js), `globalThis` persists across warm invocations. 
// For high-volume production, replace this with Redis (e.g., Vercel KV).
const tokenCache: { token: string | null; expiry: number } = {
  token: null,
  expiry: 0,
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Normalizes any Kenyan phone number to the strict Daraja format: 254XXXXXXXXX
 */
export function normalizeMsisdn(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = `254${cleaned.slice(1)}`;
  if (cleaned.startsWith('254') && cleaned.length === 12) return cleaned;
  throw new Error(`Invalid Kenyan phone number format: ${phone}`);
}

/**
 * Generates the YYYYMMDDHHMMSS timestamp Daraja requires
 */
function getMpesaTimestamp(): string {
  return new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
}

// ============================================================================
// AUTHENTICATION & SECURITY
// ============================================================================

/**
 * Fetches the M-Pesa Access Token, utilizing a cache to prevent rate-limits.
 */
export async function getMpesaToken(): Promise<string> {
  const now = Date.now();
  // Safaricom tokens expire in 3599 seconds. We refresh 5 minutes early (3300s).
  if (tokenCache.token && tokenCache.expiry > now + 300000) {
    return tokenCache.token;
  }

  const consumerKey = process.env.MPESA_CONSUMER_KEY!;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const response = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: 'no-store', // Never let Next.js cache this network request
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Daraja Auth Failed: ${errorText}`);
  }

  const data = await response.json();
  
  tokenCache.token = data.access_token;
  // data.expires_in is usually "3599" (seconds)
  tokenCache.expiry = now + (parseInt(data.expires_in, 10) * 1000);

  return tokenCache.token!;
}

/**
 * Generates the Base64 password for STK Push
 */
function generateStkPassword(timestamp: string): string {
  const shortCode = process.env.MPESA_PAYBILL!;
  const passkey = process.env.MPESA_PASSKEY!;
  return Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
}

/**
 * Encrypts the B2C Initiator Password using Safaricom's public cert
 */
/**
 * Encrypts the B2C Initiator Password using Safaricom's public cert.
 * Daraja strictly requires RSA_NO_PADDING and a 256-byte padded buffer.
 */
function generateB2cSecurityCredential(): string {
  const password = process.env.MPESA_INITIATOR_PASSWORD!;
  const certString = process.env.MPESA_PUBLIC_CERTIFICATE!.replace(/\\n/g, '\n'); 
  
  // 1. Convert password to buffer
  const passwordBuffer = Buffer.from(password, 'utf8');
  
  // 2. Daraja requires a 256-byte buffer for RSA_NO_PADDING. We must pad it manually.
  const paddedBuffer = Buffer.alloc(256);
  passwordBuffer.copy(paddedBuffer, 256 - passwordBuffer.length); // Pad from the left

  // 3. Encrypt using NO PADDING
  const encrypted = crypto.publicEncrypt(
    {
      key: certString,
      padding: crypto.constants.RSA_NO_PADDING,
    },
    paddedBuffer
  );

  return encrypted.toString('base64');
}
// ============================================================================
// API INITIATORS
// ============================================================================

/**
 * Triggers Lipa Na M-Pesa Online (STK Push)
 */
export async function initiateStkPush(amount: number, phoneNumber: string, accountReference: string) {
  const token = await getMpesaToken();
  const timestamp = getMpesaTimestamp();
  const password = generateStkPassword(timestamp);
  const msisdn = normalizeMsisdn(phoneNumber);
  
  // Ensure amount is a whole number (M-Pesa rejects decimals)
  const safeAmount = Math.round(amount);

  const payload = {
    BusinessShortCode: process.env.MPESA_PAYBILL!,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: safeAmount,
    PartyA: msisdn,
    PartyB: process.env.MPESA_PAYBILL!,
    PhoneNumber: msisdn,
    CallBackURL: `${process.env.PLATFORM_A_BASE_URL}/api/webhooks/mpesa/stk-push`,
    AccountReference: accountReference.substring(0, 12), // Daraja strict 12 char limit
    TransactionDesc: "Payment",
  };

  const response = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (data.errorCode) {
    throw new Error(`STK Push Failed: ${data.errorMessage}`);
  }
  
  // Returns { MerchantRequestID, CheckoutRequestID, ResponseCode, ResponseDescription, CustomerMessage }
  return data;
}

/**
 * Triggers B2C Withdrawal
 */
export async function initiateB2C(amount: number, phoneNumber: string, shadowRequestId: string) {
  const token = await getMpesaToken();
  const securityCredential = generateB2cSecurityCredential();
  const msisdn = normalizeMsisdn(phoneNumber);
  const safeAmount = Math.round(amount);

  const payload = {
    InitiatorName: process.env.MPESA_INITIATOR_NAME!,
    SecurityCredential: securityCredential,
    CommandID: 'BusinessPayment', 
    Amount: safeAmount,
    PartyA: process.env.MPESA_SHORTCODE_B2C!, 
    PartyB: msisdn,
    Remarks: 'Platform Withdrawal',
    QueueTimeOutURL: `${process.env.PLATFORM_A_BASE_URL}/api/webhooks/mpesa/b2c-timeout`,
    ResultURL: `${process.env.PLATFORM_A_BASE_URL}/api/webhooks/mpesa/b2c-result`,
    Occasion: shadowRequestId, // Passes the Shadow Table ID through Safaricom
  };

  const response = await fetch(`${BASE_URL}/mpesa/b2c/v1/paymentrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (data.errorCode) {
    throw new Error(`B2C Failed: ${data.errorMessage}`);
  }

  // Returns { OriginatorConversationID, ConversationID, ResponseCode, ResponseDescription }
  return data;
}
