import crypto from 'crypto';

// Environment variables required for M-Pesa
const MPESA_ENV = process.env.MPESA_ENV || 'sandbox'; // 'sandbox' or 'live'
const BASE_URL = MPESA_ENV === 'live' 
  ? 'https://api.safaricom.co.ke' 
  : 'https://sandbox.safaricom.co.ke';

/**
 * 1. Generate M-Pesa Access Token
 */
export async function getMpesaToken(): Promise<string> {
  const consumerKey = process.env.MPESA_CONSUMER_KEY!;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const response = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
    // Prevent Next.js from caching this token request aggressively
    cache: 'no-store', 
  });

  if (!response.ok) {
    throw new Error('Failed to generate M-Pesa access token');
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * 2. Encrypt the Initiator Password using Safaricom's Public Key
 * Required for B2C transactions to prove you are authorized to move funds out of the paybill/till.
 */
function generateSecurityCredential(): string {
  const password = process.env.MPESA_INITIATOR_PASSWORD!;
  const certString = process.env.MPESA_PUBLIC_CERTIFICATE!; // The raw string of the .cer file
  
  const buffer = Buffer.from(password);
  const encrypted = crypto.publicEncrypt(
    {
      key: certString,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    buffer
  );

  return encrypted.toString('base64');
}

/**
 * 3. Initiate the B2C (Business to Customer) Payment
 */
export async function initiateB2C(amount: number, phoneNumber: string, shadowRequestId: string) {
  const token = await getMpesaToken();
  const securityCredential = generateSecurityCredential();

  const payload = {
    InitiatorName: process.env.MPESA_INITIATOR_NAME!,
    SecurityCredential: securityCredential,
    CommandID: 'BusinessPayment', // Use 'SalaryPayment' or 'PromotionPayment' if required by your Till type
    Amount: amount.toString(),
    PartyA: process.env.MPESA_SHORTCODE!,
    PartyB: phoneNumber, // Must be in format 2547XXXXXXXX
    Remarks: 'Withdrawal from Platform',
    QueueTimeOutURL: `${process.env.MAIN_PLATFORM_URL}/api/webhooks/mpesa/b2c/timeout`,
    ResultURL: `${process.env.MAIN_PLATFORM_URL}/api/webhooks/mpesa/b2c/result`,
    Occasion: shadowRequestId, // We pass our internal DB ID here so M-Pesa returns it in the webhook!
  };

  const response = await fetch(`${BASE_URL}/mpesa/b2c/v1/paymentrequest`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (data.errorCode) {
    throw new Error(`M-Pesa API Error: ${data.errorMessage}`);
  }

  return data; // Returns OriginatorConversationID and ConversationID
}
