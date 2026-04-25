import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // 1. Initialize Supabase SSR Client for API Routes
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              // Ignore cookie setting errors in API routes
            }
          },
        },
      }
    );

    // 2. Authenticate the Seller
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Fetch the Order details (Fetching buyer details and item title for the email)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        buyers ( name, email ),
        items ( title )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 4. Refund via Paystack (If applicable)
    if (order.paystack_reference) {
      const paystackResponse = await fetch('https://api.paystack.co/refund', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction: order.paystack_reference,
          customer_note: `Order cancelled by seller`,
        }),
      });

      const refundData = await paystackResponse.json();

      if (!refundData.status) {
        console.error("Paystack Refund Error:", refundData);
        return NextResponse.json({ 
          error: `Refund failed: ${refundData.message}` 
        }, { status: 500 });
      }
    }

    // 5. Update the Order Status in Supabase
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'CANCELLED' })
      .eq('id', orderId);

    if (updateError) {
      throw updateError;
    }

    // 6. Send Cancellation Email to Buyer
    try {
      const buyerName = Array.isArray(order.buyers) ? order.buyers[0]?.name : order.buyers?.name || "Valued Customer";
      const buyerEmail = Array.isArray(order.buyers) ? order.buyers[0]?.email : order.buyers?.email;
      const itemTitle = Array.isArray(order.items) ? order.items[0]?.title : order.items?.title || "your recent order";
      const amount = order.amount ? `KES ${order.amount.toLocaleString()}` : "your payment";

      if (buyerEmail) {
        // Base64 encode the Mailjet credentials
        const mailjetAuth = Buffer.from(`${process.env.MAILJET_API_KEY}:${process.env.MAILJET_SECRET_KEY}`).toString('base64');
        const emailHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 40px 20px; margin: 0;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                
                <div style="text-align: center; padding: 30px 20px; border-bottom: 1px solid #f1f5f9;">
                  <img src="https://www.localsoko.com/apple-touch-icon.png" alt="LocalSoko" width="56" height="56" style="border-radius: 14px; margin-bottom: 12px; display: block; margin: 0 auto;" />
                  <h2 style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Local<span style="color: #10b981;">Soko</span></h2>
                </div>
                
                <div style="padding: 40px 30px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <div style="background-color: #d1fae5; display: inline-block; padding: 16px; border-radius: 50%; font-size: 32px; margin-bottom: 20px; line-height: 1;">💸</div>
                    <h1 style="color: #0f172a; font-size: 24px; margin: 0 0 8px 0;">Refund Initiated</h1>
                    <p style="color: #64748b; font-size: 16px; margin: 0;">Your order has been cancelled and is being investigated.</p>
                  </div>
                  
                  <p style="color: #334155; font-size: 16px; line-height: 1.6;">Hi <strong>${buyerName.split(' ')[0]}</strong>,</p>
                  <p style="color: #334155; font-size: 16px; line-height: 1.6;">We are writing to let you know that the seller has cancelled your order for <strong>"${itemTitle}"</strong>. We sincerely apologize for any inconvenience this may cause.</p>
                  
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 30px 0;">
                    <ul style="list-style: none; padding: 0; margin: 0; color: #334155; font-size: 15px;">
                      <li style="margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
                        <span style="color: #64748b; display: block; margin-bottom: 4px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Amount to be investigated</span> 
                        <strong style="font-size: 24px; color: #10b981;">${amount}</strong>
                      </li>
                      <li style="margin-bottom: 12px;">
                        <span style="color: #64748b; display: inline-block; width: 120px;">Status:</span> 
                        <strong>Processing</strong>
                      </li>
                      <li>
                        <span style="color: #64748b; display: inline-block; width: 120px;">Timeline:</span> 
                        <span style="color: #475569;">7-30 business days</span>
                      </li>
                    </ul>
                  </div>

                  <div style="text-align: center; margin-top: 40px;">
                    <a href="https://localsoko.com" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Return to LocalSoko</a>
                  </div>
                </div>

                <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; color: #64748b; font-size: 13px;">© ${new Date().getFullYear()} LocalSoko. All rights reserved.</p>
                  <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 12px;">If you have any questions, our support team is always here to help.</p>
                </div>

                </div>
              </div>
            `;

        const mailjetResponse = await fetch('https://api.mailjet.com/v3.1/send', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${mailjetAuth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            Messages: [
              {
                From: {
                  Email: "hello@localsoko.com", 
                  Name: "LocalSoko" 
              
                },
                To: [
                  {
                    Email: buyerEmail,
                    Name: buyerName
                  }
                ],
                Subject: "Your Order Cancellation & Refund",
                HTMLPart: emailHtml
              }
            ]
          })
        });

        if (!mailjetResponse.ok) {
          const mailjetError = await mailjetResponse.json();
          console.error("Mailjet API Error:", mailjetError);
        }
      }
    } catch (emailError) {
      console.error("Failed to send cancellation email:", emailError);
    }

    // 7. Return Success
    return NextResponse.json({ 
      success: true, 
      message: "Order cancelled, refunded, and buyer notified successfully." 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Cancellation API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}