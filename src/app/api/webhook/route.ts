import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import crypto from "crypto";

// Paddle webhook signature verification
function verifyPaddleWebhook(rawBody: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody);
  const computedSignature = hmac.digest("hex");

  // Paddle sends: ts=xxx;h1=xxx
  const parts = signature.split(";");
  const h1 = parts.find((p) => p.startsWith("h1="))?.replace("h1=", "");

  if (!h1) return false;

  // Extract timestamp for signed payload
  const ts = parts.find((p) => p.startsWith("ts="))?.replace("ts=", "");
  const signedPayload = `${ts}:${rawBody}`;

  const expectedHmac = crypto.createHmac("sha256", secret);
  expectedHmac.update(signedPayload);
  const expectedSignature = expectedHmac.digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(h1, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("paddle-signature") || "";

    // Verify webhook signature in production
    const secret = process.env.PADDLE_WEBHOOK_SECRET;
    if (secret && signature) {
      const isValid = verifyPaddleWebhook(rawBody, signature, secret);
      if (!isValid) {
        console.error("Invalid Paddle webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event_type;

    // Handle completed transaction
    if (eventType === "transaction.completed") {
      const customData = event.data?.custom_data;
      const resumeId = customData?.resume_id;
      const tier = customData?.tier || "basic";
      const transactionId = event.data?.id;

      if (!resumeId) {
        console.error("No resume_id in webhook custom_data");
        return NextResponse.json({ error: "Missing resume_id" }, { status: 400 });
      }

      const supabase = getServiceSupabase();

      // Mark as paid
      await supabase
        .from("resumes")
        .update({
          paid: true,
          tier,
          paddle_transaction_id: transactionId,
        })
        .eq("id", resumeId);

      console.log(`Payment confirmed for resume ${resumeId}, tier: ${tier}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
