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
      const customFields = metadata.custom_fields || [];
      const getField = (name: string) => customFields.find((f: any) => f.variable_name === name)?.value;
      const productId = metadata.product_id || getField("product_id");

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
        
       // ---- SCENARIO B: Customer bought a cart of products ----
        else if (metadata && metadata.transaction_type === "marketplace_cart_order") {
          
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
          
          // 2. Extract Cart Metadata
          const storeId = metadata.store_id || getField("store_id");
          const buyerId = metadata.buyer_id || null; // <--- This links the order to the buyer's dashboard!
          const buyerName = getField("buyer_name") || "Guest";
          const buyerPhone = getField("buyer_phone") || null;
          const fulfillmentType = getField("fulfillment_type") || "SHIPPING";
          const rawTakeawayTime = getField("takeaway_time");
          const customerNotes = getField("customer_notes") || "None";
          const paymentMethod = getField("payment_method") || metadata.payment_method || event.data.channel || "Online";
          
          const hasDigital = metadata.has_digital === true || metadata.has_digital === "true";
          const hasPhysical = metadata.has_physical === true || metadata.has_physical === "true";
          const storeCurrency = metadata.store_currency || event.data.currency || "KES";
          const sym = storeCurrency === "USD" ? "$" : "Ksh ";

          // Safely parse the array of cart items we sent from checkout
          let cartItems: any[] = [];
          try {
            cartItems = JSON.parse(metadata.cart_items || "[]");
          } catch (e) {
            console.error("Failed to parse cart items", e);
          }

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
            } catch (e) {}
          }

          // 3. INSERT THE MAIN ORDER
          const { data: newOrder, error: orderError } = await supabaseAdmin
            .from("orders")
            .insert({
              store_id: storeId,
              buyer_id: buyerId, // <-- Saves to their dashboard!
              paystack_reference: event.data.reference,
              customer_name: buyerName,
              customer_email: event.data.customer.email,
              customer_phone: buyerPhone,
              amount_paid: event.data.amount / 100, 
              total_amount: event.data.amount / 100,
              fulfillment_type: fulfillmentType,
              takeaway_time: formattedTakeawayTime,
              status: 'NEW',
              currency: storeCurrency,
              customer_notes: customerNotes,
              payment_method: paymentMethod
            })
            .select()
            .single();

          if (orderError || !newOrder) {
            console.error("🚨 SUPABASE ORDER INSERT FAILED:", orderError);
          }

          if (!orderError && newOrder && cartItems.length > 0) {
            
            // 4. FETCH ALL PRODUCT DETAILS FROM DB FOR EMAILS & DIGITAL LINKS
            const productIds = cartItems.map((item) => item.id);
            const { data: dbProducts } = await supabaseAdmin
              .from("products")
              .select("id, title, price, file_url, is_digital, stores(name, owner_id)")
              .in("id", productIds);

            let storeName = "LocalSoko Store";
            let sellerEmail = null;

            if (dbProducts && dbProducts.length > 0) {
              // @ts-ignore
              storeName = dbProducts[0].stores?.name || "LocalSoko Store";
              // @ts-ignore
              const ownerId = dbProducts[0].stores?.owner_id;
              
              if (ownerId) {
                const { data: authData } = await supabaseAdmin.auth.admin.getUserById(ownerId);
                if (authData?.user?.email) sellerEmail = authData.user.email;
              }
            }

            // Create a summarized title for emails (e.g. "Burger, Fries and 2 more items")
            const orderSummaryTitle = dbProducts && dbProducts.length > 1
              ? `${dbProducts[0].title} and ${dbProducts.length - 1} other item(s)`
              : (dbProducts && dbProducts.length === 1 ? dbProducts[0].title : "Your Cart Order");

            // 5. LOOP THROUGH CART ITEMS TO SAVE AND UPDATE STOCK
            for (const cartItem of cartItems) {
              const dbProduct = dbProducts?.find(p => p.id === cartItem.id);
              if (!dbProduct) continue;

              // Insert line item
              const { error: itemsError } = await supabaseAdmin.from("order_items").insert({
                order_id: newOrder.id,
                product_id: cartItem.id,
                quantity: cartItem.q, 
                price_at_time: dbProduct.price
              });

              if (itemsError) console.error("🚨 SUPABASE ITEMS INSERT FAILED:", itemsError);

              // If physical, decrement stock
              if (!dbProduct.is_digital) {
                const { error: stockError } = await supabaseAdmin.rpc("decrement_stock", { 
                  row_id: cartItem.id, 
                  quantity: cartItem.q 
                });
                if (stockError) console.error(`🚨 Failed to reduce stock for ${cartItem.id}:`, stockError);
              } 
              // If digital, generate link and send individual email
              else if (dbProduct.is_digital && dbProduct.file_url) {
                const { data: signedData } = await supabaseAdmin.storage
                  .from("digital-products")
                  .createSignedUrl(dbProduct.file_url, 259200); // 3 days

                if (signedData?.signedUrl) {
                  await sendDigitalDownloadEmail(
                    event.data.customer.email,
                    buyerName,
                    dbProduct.title,
                    signedData.signedUrl
                  );
                }
              }
            }

            // 6. SEND SUMMARY EMAILS
            if (sellerEmail) {
              await sendSellerNotificationEmail(
                sellerEmail, 
                storeName, 
                orderSummaryTitle, 
                buyerName, 
                event.data.amount / 100,
                fulfillmentType,
                sym 
              );
            }

            if (hasPhysical) {
               await sendPhysicalOrderEmail(
                 event.data.customer.email, 
                 buyerName, 
                 orderSummaryTitle, 
                 storeName, 
                 fulfillmentType
               );
            }
          }
        }
      
      await supabaseAdmin.from('transactions').insert({
        reference: event.data.reference,
        amount: event.data.amount / 100, 
        status: 'success',
        type: 'payment',
        metadata: event.data, 
      });
     // <-- end of your existing charge.success block
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

      // 1. Idempotency Check (Prevent duplicate logging)
      const { data: existingPayout } = await supabaseAdmin
        .from("payouts")
        .select("id")
        .eq("paystack_reference", transferData.reference)
        .single();

      if (existingPayout) return NextResponse.json({ received: true }, { status: 200 });

      // 2. Fetch Store Details
      const { data: store, error: storeError } = await supabaseAdmin
        .from("stores")
        .select("id, owner_id, store_name")
        .eq("paystack_subaccount_code", subaccountCode)
        .single();

      if (!store || storeError) return NextResponse.json({ received: true }, { status: 200 });

      // 3. Insert Payout into DB
      // UPGRADE: Works for both KES cents and USD cents
      const settledAmount = transferData.amount / 100;
      const currency = transferData.currency || "KES";

      await supabaseAdmin
        .from("payouts")
        .insert({
          store_id: store.id,
          amount_paid: settledAmount, 
          paystack_reference: transferData.reference,
          status: "COMPLETED"
        });

      // 4. Fetch Owner's Email and Send Notification via Helper
      const { data: storeOwner } = await supabaseAdmin
        .from("users") // Ensure this matches your user table name
        .select("email")
        .eq("id", store.owner_id)
        .single();

      if (storeOwner?.email) {
        try {
          // UPGRADE: Pass the currency to correctly print $ or Ksh
          await sendPayoutEmail(
            storeOwner.email,
            store.store_name || "Vendor",
            settledAmount,
            transferData.reference,
            currency
          );
        } catch (emailError) {
          console.error("Failed to send payout email:", emailError);
          // Fail silently so we still return 200 OK to Paystack
        }
      }

      return NextResponse.json({ received: true }, { status: 200 });
    }


    // ==========================================
    // SCENARIO 3: DISPUTES (Alerts & Reminders)
    // ==========================================
    else if (event.event.startsWith("charge.dispute.")) {
      const disputeData = event.data;
      const transactionRef = disputeData.transaction ? disputeData.transaction.reference : disputeData.reference || "UNKNOWN";
      
      const { data: linkedOrder } = await supabaseAdmin
        .from('orders')
        .select('id, store_id')
        .eq('paystack_reference', transactionRef)
        .single();

      if (event.event === "charge.dispute.create") {
        await supabaseAdmin.from('disputes').insert({
          transaction_reference: transactionRef,
          reason: disputeData.dispute_reason,
          status: 'open',
          amount: disputeData.dispute_amount / 100,
          metadata: disputeData,
          order_id: linkedOrder?.id || null,
          store_id: linkedOrder?.store_id || null
        });
      } 
      else if (event.event === "charge.dispute.remind") {
        await supabaseAdmin.from('disputes')
          .update({ status: 'needs_attention', metadata: disputeData })
          .eq('transaction_reference', transactionRef);
      } 
      else if (event.event === "charge.dispute.resolve") {
        await supabaseAdmin.from('disputes')
          .update({ status: 'resolved', metadata: disputeData })
          .eq('transaction_reference', transactionRef);
      }
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // ==========================================
    // SCENARIO 4: REFUNDS
    // ==========================================
    else if (event.event.startsWith("refund.")) {
      const refundData = event.data;
      const transactionRef = refundData.transaction_reference || (refundData.transaction ? refundData.transaction.reference : "UNKNOWN");
      const status = event.event.replace("refund.", "");

      const { data: linkedOrder } = await supabaseAdmin
        .from('orders')
        .select('id, store_id')
        .eq('paystack_reference', transactionRef)
        .single();

      await supabaseAdmin.from('refunds').upsert({
        refund_id: refundData.id.toString(),
        transaction_reference: transactionRef,
        amount: refundData.amount / 100,
        status: status,
        metadata: refundData,
        order_id: linkedOrder?.id || null,
        store_id: linkedOrder?.store_id || null
      }, { onConflict: 'refund_id' });
      
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // ==========================================
    // SCENARIO 5: PAYMENT REQUESTS
    // ==========================================
    else if (event.event.startsWith("paymentrequest.")) {
      const prData = event.data;
      const status = event.event.replace("paymentrequest.", ""); 
      
      const { data: linkedOrder } = await supabaseAdmin
        .from('orders')
        .select('id, store_id')
        .eq('paystack_reference', prData.request_code)
        .single();

      await supabaseAdmin.from('payment_requests').upsert({
        request_code: prData.request_code,
        amount: prData.amount / 100,
        status: status,
        metadata: prData,
        order_id: linkedOrder?.id || null,
        store_id: linkedOrder?.store_id || null
      }, { onConflict: 'request_code' });

      return NextResponse.json({ received: true }, { status: 200 });
    }

    // ==========================================
    // SCENARIO 6: SUBACCOUNT INFO
    // ==========================================
    else if (event.event === "subaccount.create") {
      const subData = event.data;

      const { data: linkedStore } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('paystack_subaccount_code', subData.subaccount_code)
        .single();

      await supabaseAdmin.from('subaccounts_log').insert({
        subaccount_code: subData.subaccount_code,
        business_name: subData.business_name,
        bank_name: subData.settlement_bank,
        account_number: subData.account_number,
        metadata: subData,
        store_id: linkedStore?.id || null
      });
      return NextResponse.json({ received: true }, { status: 200 });
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

// UPGRADE: Added currency parameter (defaults to KES)
async function sendPayoutEmail(toEmail: string, toName: string, amount: number, reference: string, currency: string = "KES") {
  const currencySymbol = currency === "USD" ? "$" : "Ksh ";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 40px 20px; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <div style="text-align: center; padding: 30px 20px; border-bottom: 1px solid #f1f5f9;">
          <img src="https://www.localsoko.com/apple-touch-icon.png" alt="LocalSoko" width="56" height="56" style="border-radius: 14px; margin-bottom: 12px; display: block; margin: 0 auto;" />
          <h2 style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Local<span style="color: #10b981;">Soko</span></h2>
        </div>
        
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background-color: #d1fae5; display: inline-block; padding: 16px; border-radius: 50%; font-size: 32px; margin-bottom: 20px; line-height: 1;">🏦</div>
            <h1 style="color: #0f172a; font-size: 24px; margin: 0 0 8px 0;">Settlement Complete</h1>
            <p style="color: #64748b; font-size: 16px; margin: 0;">Your funds have been transferred to your account.</p>
          </div>
          
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">Hi <strong>${toName}</strong>,</p>
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">This is an automated notification to confirm that your payout has been successfully deposited into your registered M-Pesa Till or Bank account.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 30px 0;">
            <ul style="list-style: none; padding: 0; margin: 0; color: #334155; font-size: 15px;">
              <li style="margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;"><span style="color: #64748b; display: block; margin-bottom: 4px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Amount Settled</span> <strong style="font-size: 24px; color: #10b981;">${currencySymbol}${amount.toLocaleString()}</strong></li>
              <li style="margin-bottom: 12px;"><span style="color: #64748b; display: inline-block; width: 120px;">Status:</span> <strong>Completed</strong></li>
              <li><span style="color: #64748b; display: inline-block; width: 120px;">Bank Reference:</span> <span style="font-family: monospace; color: #475569; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${reference}</span></li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 40px;">
            <a href="https://localsoko.com/dashboard/wallet" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">View Wallet History</a>
          </div>
        </div>

        <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #64748b; font-size: 13px;">© ${new Date().getFullYear()} LocalSoko. All rights reserved.</p>
          <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 12px;">This is an automated message. Please check your account statement to confirm receipt.</p>
        </div>

      </div>
    </div>
  `;
  await sendMailjetEmail(toEmail, toName, `🏦 Settlement Complete - LocalSoko`, html);
}

async function sendDigitalDownloadEmail(toEmail: string, toName: string, productTitle: string, downloadLink: string) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 40px 20px; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <div style="text-align: center; padding: 30px 20px; border-bottom: 1px solid #f1f5f9;">
          <img src="https://www.localsoko.com/apple-touch-icon.png" alt="LocalSoko" width="56" height="56" style="border-radius: 14px; margin-bottom: 12px; display: block; margin: 0 auto;" />
          <h2 style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Local<span style="color: #10b981;">Soko</span></h2>
        </div>
        
        <div style="padding: 40px 30px; text-align: center;">
          <div style="background-color: #d1fae5; display: inline-block; padding: 16px; border-radius: 50%; font-size: 32px; margin-bottom: 20px; line-height: 1;">🎁</div>
          <h1 style="color: #0f172a; font-size: 24px; margin: 0 0 8px 0;">Your Download is Ready!</h1>
          
          <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-top: 30px; text-align: left;">Hi <strong>${toName}</strong>,</p>
          <p style="color: #334155; font-size: 16px; line-height: 1.6; text-align: left;">Your payment for <strong>${productTitle}</strong> was successful. You can download your file securely using the button below:</p>
          
          <div style="margin: 40px 0;">
            <a href="${downloadLink}" style="background-color: #10B981; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">Download File Now</a>
          </div>
          
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-top: 20px; text-align: center;">
            <p style="margin: 0; color: #b91c1c; font-size: 14px; font-weight: 500;">⏳ Please note: This secure download link will expire in 3 days.</p>
          </div>
        </div>

        <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #64748b; font-size: 13px;">© ${new Date().getFullYear()} LocalSoko. All rights reserved.</p>
          <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 12px;">Thank you for supporting independent creators.</p>
        </div>
      </div>
    </div>
  `;
  await sendMailjetEmail(toEmail, toName, `Your Download: ${productTitle}`, html);
}

async function sendPhysicalOrderEmail(toEmail: string, toName: string, productTitle: string, storeName: string, type: string) {
  const isDelivery = type === "DELIVERY" || type === "SHIPPING";
  
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 40px 20px; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <div style="text-align: center; padding: 30px 20px; border-bottom: 1px solid #f1f5f9;">
          <img src="https://www.localsoko.com/apple-touch-icon.png" alt="LocalSoko" width="56" height="56" style="border-radius: 14px; margin-bottom: 12px; display: block; margin: 0 auto;" />
          <h2 style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Local<span style="color: #10b981;">Soko</span></h2>
        </div>
        
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background-color: #d1fae5; display: inline-block; padding: 16px; border-radius: 50%; font-size: 32px; margin-bottom: 20px; line-height: 1;">🎉</div>
            <h1 style="color: #0f172a; font-size: 24px; margin: 0 0 8px 0;">Order Confirmed!</h1>
          </div>
          
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">Hi <strong>${toName}</strong>,</p>
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">Your order for <strong>${productTitle}</strong> has been successfully placed with <strong>${storeName}</strong>.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 30px 0;">
            <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 16px;">Order Status Updates</h3>
            <p style="color: #475569; font-size: 15px; margin: 0; line-height: 1.6;">The seller has been notified and is currently preparing your order for <strong style="color: #10b981;">${isDelivery ? "Delivery" : "Pickup/Takeaway"}</strong>.</p>
          </div>
          
          <p style="margin-top: 30px; font-size: 15px; color: #475569; text-align: center; font-style: italic;">Thank you for supporting local businesses on LocalSoko!</p>
        </div>

        <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #64748b; font-size: 13px;">© ${new Date().getFullYear()} LocalSoko. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
  await sendMailjetEmail(toEmail, toName, `Order Confirmed: ${productTitle}`, html);
}

async function sendSellerNotificationEmail(toEmail: string, sellerName: string, productTitle: string, buyerName: string, amount: number, type: string, sym: string) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 40px 20px; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <div style="text-align: center; padding: 30px 20px; border-bottom: 1px solid #f1f5f9;">
          <img src="https://www.localsoko.com/apple-touch-icon.png" alt="LocalSoko" width="56" height="56" style="border-radius: 14px; margin-bottom: 12px; display: block; margin: 0 auto;" />
          <h2 style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Local<span style="color: #10b981;">Soko</span></h2>
        </div>
        
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background-color: #d1fae5; display: inline-block; padding: 16px; border-radius: 50%; font-size: 32px; margin-bottom: 20px; line-height: 1;">💸</div>
            <h1 style="color: #10B981; font-size: 24px; margin: 0 0 8px 0;">Cha-Ching! New Order!</h1>
          </div>
          
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">Hello <strong>${sellerName}</strong>,</p>
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">Great news! You just received a new order from <strong>${buyerName}</strong>.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 30px 0;">
            <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Order Details</h3>
            <ul style="list-style: none; padding: 0; margin: 0; color: #334155; font-size: 15px;">
              <li style="margin-bottom: 12px;"><span style="color: #64748b; display: inline-block; width: 140px;">Item:</span> <strong>${productTitle}</strong></li>
              <li style="margin-bottom: 12px;"><span style="color: #64748b; display: inline-block; width: 140px;">Fulfillment:</span> <strong>${type}</strong></li>
              <li style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #cbd5e1;"><span style="color: #64748b; display: inline-block; width: 140px;">Amount Paid:</span> <strong style="color: #10b981; font-size: 18px;">${sym}${amount.toLocaleString()}</strong></li>
            </ul>
          </div>
          
          <p style="color: #475569; font-size: 15px; margin-bottom: 30px; text-align: center;">Log into your SokoPOS Dashboard to view the full details, manage fulfillment, and chat with the buyer.</p>
          
          <div style="text-align: center;">
            <a href="https://localsoko.com/dashboard/orders" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Go to Dashboard</a>
          </div>
        </div>

        <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #64748b; font-size: 13px;">© ${new Date().getFullYear()} LocalSoko. All rights reserved.</p>
          <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 12px;">This is an automated notification for sellers.</p>
        </div>
      </div>
    </div>
  `;
  await sendMailjetEmail(toEmail, sellerName, `New Order Received: ${productTitle}`, html);
}

async function sendSubscriptionEmail(toEmail: string, toName: string, tier: string, amount: number, expiryDate: string) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 40px 20px; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <div style="text-align: center; padding: 30px 20px; border-bottom: 1px solid #f1f5f9;">
          <img src="https://www.localsoko.com/apple-touch-icon.png" alt="LocalSoko" width="56" height="56" style="border-radius: 14px; margin-bottom: 12px; display: block; margin: 0 auto;" />
          <h2 style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Local<span style="color: #10b981;">Soko</span></h2>
        </div>
        
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background-color: #d1fae5; display: inline-block; padding: 16px; border-radius: 50%; font-size: 32px; margin-bottom: 20px; line-height: 1;">🚀</div>
            <h1 style="color: #0F172A; font-size: 24px; margin: 0 0 8px 0;">Welcome to ${tier}!</h1>
            <p style="color: #64748B; font-size: 16px; margin: 0;">Your store has been successfully upgraded.</p>
          </div>
          
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">Hi <strong>${toName}</strong>,</p>
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">Thank you for subscribing! Your payment of <strong>Ksh ${amount.toLocaleString()}</strong> was successful. Your powerful new seller tools are now unlocked and ready to use.</p>
          
          <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 24px; margin: 30px 0;">
            <ul style="list-style: none; padding: 0; margin: 0; color: #166534; font-size: 15px;">
              <li style="margin-bottom: 12px;"><span style="display: inline-block; width: 140px; color: #15803d;">Plan:</span> <strong style="color: #14532d;">${tier} Tier</strong></li>
              <li style="margin-bottom: 12px;"><span style="display: inline-block; width: 140px; color: #15803d;">Status:</span> <strong style="color: #10b981;">● Active</strong></li>
              <li style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #bbf7d0;"><span style="display: inline-block; width: 140px; color: #15803d;">Next Billing Date:</span> <strong style="color: #14532d;">${expiryDate}</strong></li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 40px;">
            <a href="https://localsoko.com/dashboard" style="background-color: #0F172A; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; font-size: 16px;">Go to Your Dashboard</a>
          </div>
        </div>

        <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #64748b; font-size: 13px;">© ${new Date().getFullYear()} LocalSoko. All rights reserved.</p>
          <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 12px;">This receipt was sent automatically for your records.</p>
        </div>
      </div>
    </div>
  `;
  await sendMailjetEmail(toEmail, toName, `Your LocalSoko ${tier} Subscription Receipt`, html);
}