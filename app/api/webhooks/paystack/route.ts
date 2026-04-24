import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Service role required to bypass RLS in the background
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature || !process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // ==========================================
    // SCENARIO 1: CHARGE SUCCESS (Money In)
    // ==========================================
    if (event.event === "charge.success") {
      const metadata = event.data.metadata;

      // ---- SCENARIO A: Platform Subscription ----
      if (metadata && metadata.transaction_type === "platform_subscription") {
        const userId = metadata.owner_id;
        const plan = metadata.plan;
        
        const now = new Date();
        let addMonths = plan === "1_MONTH" ? 1 : plan === "6_MONTHS" ? 6 : 12;
        let newTier = plan === "1_YEAR" ? 'VIP' : 'PREMIUM';

        const newSubEndsAt = new Date(now.setMonth(now.getMonth() + addMonths));

        const { error: subError } = await supabaseAdmin
          .from("stores")
          .update({
            subscription_ends_at: newSubEndsAt.toISOString(),
            tier: newTier,
          })
          .eq("owner_id", userId);

        if (!subError) {
          const amountPaid = event.data.amount / 100;
          await sendSubscriptionEmail(
            event.data.customer.email,
            "LocalSoko Merchant", 
            newTier,
            amountPaid,
            newSubEndsAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          );
        }
      }
      
      // ---- SCENARIO B: Customer bought a product ----
      else if (metadata && metadata.product_id) {
        // 1. Prevent "Double Order" Glitch (Idempotency Check)
        const { data: existingOrder } = await supabaseAdmin
          .from("orders")
          .select("id")
          .eq("paystack_reference", event.data.reference)
          .single();

        if (existingOrder) {
          console.log("⚠️ Ignored duplicate order webhook for reference:", event.data.reference);
          return NextResponse.json({ received: true }, { status: 200 });
        }

        const customFields = metadata.custom_fields || [];
        const getField = (name: string) => customFields.find((f: any) => f.variable_name === name)?.value;

        const buyerName = getField("buyer_name") || "Guest";
        const buyerPhone = getField("buyer_phone") || null;
        const fulfillmentType = getField("fulfillment_type") || "SHIPPING";
        const rawTakeawayTime = getField("takeaway_time");
        const customerNotes = getField("customer_notes") || "None";
        
        const isDigital = metadata.is_digital === true || metadata.is_digital === "true";
        
        // UPGRADE: Safely extract currency from metadata (fallback to KES)
        const storeCurrency = metadata.store_currency || event.data.currency || "KES";
        const sym = storeCurrency === "USD" ? "$" : "Ksh ";

        // Safely parse time
        let formattedTakeawayTime = null;
        if (rawTakeawayTime && rawTakeawayTime !== "N/A") {
          try {
            if (rawTakeawayTime.length === 5 && rawTakeawayTime.includes(":")) {
              const todayDate = new Date().toISOString().split('T')[0];
              formattedTakeawayTime = new Date(`${todayDate}T${rawTakeawayTime}:00Z`).toISOString();
            } else {
              formattedTakeawayTime = new Date(rawTakeawayTime).toISOString();
            }
          } catch (e) {
            console.error("Takeaway time parsing failed:", rawTakeawayTime);
          }
        }

        // Insert Order
        const { data: newOrder, error: orderError } = await supabaseAdmin
          .from("orders")
          .insert({
            store_id: metadata.store_id,
            paystack_reference: event.data.reference,
            customer_name: buyerName,
            customer_email: event.data.customer.email,
            customer_phone: buyerPhone,
            amount_paid: event.data.amount / 100, 
            total_amount: event.data.amount / 100,
            fulfillment_type: fulfillmentType,
            takeaway_time: formattedTakeawayTime,
            status: 'NEW',
            product_id: metadata.product_id,
            currency: storeCurrency // UPGRADE: Securely log the currency to the DB!
          })
          .select()
          .single();

        if (orderError) {
          console.error("🚨 SUPABASE ORDER INSERT FAILED:", orderError);
        }

        if (!orderError && newOrder) {
          // Insert Order Item
          const { error: itemsError } = await supabaseAdmin
            .from("order_items")
            .insert({
              order_id: newOrder.id,
              product_id: metadata.product_id,
              quantity: 1, 
              price_at_time: event.data.amount / 100
            });
            
          if (itemsError) console.error("🚨 SUPABASE ITEMS INSERT FAILED:", itemsError);

          // FETCH PRODUCT & STORE DETAILS FOR EMAILS
          const { data: prodData } = await supabaseAdmin
            .from("products")
            .select("title, file_url, stores(name, owner_id)")
            .eq("id", metadata.product_id)
            .single();

          let sellerEmail = null;
          let storeName = "LocalSoko Store";

          // Fetch the seller's email
          if (prodData && prodData.stores) {
            // @ts-ignore
            storeName = prodData.stores.name || "LocalSoko Store";
            // @ts-ignore
            const ownerId = prodData.stores.owner_id;
            
            if (ownerId) {
              const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(ownerId);
              
              if (authData?.user?.email) {
                sellerEmail = authData.user.email;
              } else {
                console.error("🚨 Could not find seller email for owner ID:", ownerId);
              }
            }
          }

          // -----------------------------------------------------
          // SEND SELLER ALERTS
          // -----------------------------------------------------
          if (sellerEmail && prodData) {
            // UPGRADE: Added the dynamic symbol parameter
            await sendSellerNotificationEmail(
              sellerEmail, 
              storeName, 
              prodData.title, 
              buyerName, 
              event.data.amount / 100,
              fulfillmentType,
              sym 
            );
          }

          // -----------------------------------------------------
          // PHYSICAL VS DIGITAL LOGIC
          // -----------------------------------------------------
          if (!isDigital) {
            // 1. Reduce Stock
            const { error: stockError } = await supabaseAdmin.rpc("decrement_stock", { 
              row_id: metadata.product_id, 
              quantity: 1 
            });
            if (stockError) console.error("🚨 Failed to reduce stock:", stockError);

            // 2. Email Buyer
            if (prodData) {
               await sendPhysicalOrderEmail(
                 event.data.customer.email, 
                 buyerName, 
                 prodData.title, 
                 storeName, 
                 fulfillmentType
               );
            }

          } else {
            // DIGITAL: Generate URL & Email Buyer
            if (prodData && prodData.file_url) {
              const { data: signedData } = await supabaseAdmin.storage
                .from("digital-products")
                .createSignedUrl(prodData.file_url, 259200); // 3 days

              if (signedData?.signedUrl) {
                await sendDigitalDownloadEmail(
                  event.data.customer.email,
                  buyerName,
                  prodData.title,
                  signedData.signedUrl
                );
              }
            }
          }
        }
      }
    } 
    // ==========================================
    // SCENARIO 2: TRANSFER SUCCESS (Money Out) 
    // ==========================================
    else if (event.event === "transfer.success") {
      const transferData = event.data;
      const subaccountCode = 
        transferData.subaccount?.subaccount_code || 
        transferData.recipient?.subaccount || 
        transferData.recipient?.details?.subaccount;

      if (!subaccountCode) return NextResponse.json({ received: true }, { status: 200 });

      const { data: existingPayout } = await supabaseAdmin
        .from("payouts")
        .select("id")
        .eq("paystack_reference", transferData.reference)
        .single();

      if (existingPayout) return NextResponse.json({ received: true }, { status: 200 });

      const { data: store, error: storeError } = await supabaseAdmin
        .from("stores")
        .select("id")
        .eq("paystack_subaccount_code", subaccountCode)
        .single();

      if (!store || storeError) return NextResponse.json({ received: true }, { status: 200 });

      await supabaseAdmin
        .from("payouts")
        .insert({
          store_id: store.id,
          amount_paid: transferData.amount / 100, 
          paystack_reference: transferData.reference,
          status: "COMPLETED"
        });
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}

// ==========================================
// MAILJET EMAIL HELPERS
// ==========================================

async function sendMailjetEmail(toEmail: string, toName: string, subject: string, htmlContent: string) {
  const mailjetUrl = "https://api.mailjet.com/v3.1/send";
  const apiKey = process.env.MAILJET_API_KEY;
  const apiSecret = process.env.MAILJET_SECRET_KEY;

  if (!apiKey || !apiSecret) return;
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

  try {
    await fetch(mailjetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Basic ${auth}` },
      body: JSON.stringify({
        Messages: [{
          From: { Email: "hello@localsoko.com", Name: "LocalSoko" },
          To: [{ Email: toEmail, Name: toName }],
          Subject: subject,
          HTMLPart: htmlContent
        }]
      })
    });
  } catch (error) {
    console.error("Mailjet Error:", error);
  }
}

async function sendDigitalDownloadEmail(toEmail: string, toName: string, productTitle: string, downloadLink: string) {
  const html = `
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px;">
      <h2>Your Download is Ready!</h2>
      <p>Hi ${toName},</p>
      <p>Your payment for <strong>${productTitle}</strong> was successful. You can download your file securely below:</p>
      <a href="${downloadLink}" style="background-color: #10B981; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Download File</a>
      <p style="font-size: 12px; color: #64748b; margin-top: 30px;">This link expires in 3 days.</p>
    </div>
  `;
  await sendMailjetEmail(toEmail, toName, `Your Download: ${productTitle}`, html);
}

async function sendPhysicalOrderEmail(toEmail: string, toName: string, productTitle: string, storeName: string, type: string) {
  const isDelivery = type === "DELIVERY" || type === "SHIPPING";
  const html = `
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px;">
      <h2>Order Confirmed! 🎉</h2>
      <p>Hi ${toName},</p>
      <p>Your order for <strong>${productTitle}</strong> has been successfully placed with <strong>${storeName}</strong>.</p>
      <p>The seller has been notified and is currently preparing your order for <strong>${isDelivery ? "Delivery" : "Pickup/Takeaway"}</strong>.</p>
      <p style="margin-top: 30px; font-size: 14px; color: #475569;">Thank you for supporting local businesses on LocalSoko!</p>
    </div>
  `;
  await sendMailjetEmail(toEmail, toName, `Order Confirmed: ${productTitle}`, html);
}

// UPGRADE: Added the `sym` parameter to print $ or Ksh
async function sendSellerNotificationEmail(toEmail: string, sellerName: string, productTitle: string, buyerName: string, amount: number, type: string, sym: string) {
  const html = `
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #10B981;">Cha-Ching! New Order! 💸</h2>
      <p>Hello ${sellerName},</p>
      <p>You just received a new order for <strong>${productTitle}</strong> from <strong>${buyerName}</strong>.</p>
      <ul style="background-color: #f8fafc; padding: 20px; border-radius: 8px; list-style: none;">
        <li><strong>Item:</strong> ${productTitle}</li>
        <li><strong>Amount Paid:</strong> ${sym}${amount.toLocaleString()}</li>
        <li><strong>Fulfillment Method:</strong> ${type}</li>
      </ul>
      <p style="margin-top: 20px;">Log into your SokoPOS Dashboard to view the full details and manage this order.</p>
      <a href="https://localsoko.com/dashboard/orders" style="background-color: #0f172a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Go to Dashboard</a>
    </div>
  `;
  await sendMailjetEmail(toEmail, sellerName, `New Order Received: ${productTitle}`, html);
}

async function sendSubscriptionEmail(toEmail: string, toName: string, tier: string, amount: number, expiryDate: string) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-w: 600px; margin: 0 auto; background-color: #F8FAFC; padding: 40px 20px;">
      <div style="background-color: #FFFFFF; border-radius: 24px; padding: 40px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #E2E8F0;">
        
        <div style="text-align: center; margin-bottom: 30px;">
          <span style="color: #10B981; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">LocalSoko</span>
        </div>
        
        <h1 style="color: #0F172A; font-size: 24px; font-weight: 800; text-align: center; margin-bottom: 8px;">Welcome to ${tier}! 🚀</h1>
        <p style="color: #64748B; font-size: 16px; text-align: center; margin-bottom: 32px;">Your store has been successfully upgraded.</p>
        
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Hi ${toName},</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Thank you for subscribing! Your payment of <strong>Ksh ${amount.toLocaleString()}</strong> was successful. Your powerful new seller tools are now unlocked and ready to use.</p>
        
        <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 20px; margin: 30px 0;">
          <ul style="list-style: none; padding: 0; margin: 0; color: #166534; font-size: 15px;">
            <li style="margin-bottom: 10px;"><strong>Plan:</strong> ${tier} Tier</li>
            <li style="margin-bottom: 10px;"><strong>Status:</strong> Active</li>
            <li><strong>Next Billing Date:</strong> ${expiryDate}</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 40px 0;">
          <a href="https://localsoko.com/dashboard" style="background-color: #0F172A; color: #ffffff; padding: 16px 32px; text-decoration: none; font-weight: bold; border-radius: 12px; display: inline-block; font-size: 16px;">
            Go to Your Dashboard
          </a>
        </div>
      </div>
    </div>
  `;
  await sendMailjetEmail(toEmail, toName, `Your LocalSoko ${tier} Subscription Receipt`, html);
}