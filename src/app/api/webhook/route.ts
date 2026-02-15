import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import crypto from "crypto";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Lemon Squeezy webhook signature verification
function verifyLemonSqueezyWebhook(rawBody: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody);
  const digest = hmac.digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") || "";

    // Verify webhook signature
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    if (secret) {
      const isValid = verifyLemonSqueezyWebhook(rawBody, signature, secret);
      if (!isValid) {
        console.error("Invalid Lemon Squeezy webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventName = event.meta?.event_name;

    // Handle completed order
    if (eventName === "order_created") {
      const customData = event.meta?.custom_data;
      const resumeId = customData?.resume_id;
      const tier = customData?.tier || "basic";
      const orderId = event.data?.id;

      if (!resumeId) {
        console.error("No resume_id in webhook custom_data");
        return NextResponse.json({ error: "Missing resume_id" }, { status: 400 });
      }

      const supabase = getServiceSupabase();

      // Get current state
      const { data: existing } = await supabase
        .from("resumes")
        .select("original_text, roast, fix")
        .eq("id", resumeId)
        .single();

      // Mark as paid
      await supabase
        .from("resumes")
        .update({
          paid: true,
          tier,
          payment_id: String(orderId),
        })
        .eq("id", resumeId);

      console.log(`Payment confirmed for resume ${resumeId}, tier: ${tier}, order: ${orderId}`);

      // Generate roast + fix if not already done
      if (existing?.original_text) {
        const resumeText = existing.original_text;

        if (!existing.roast) {
          try {
            const roastCompletion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content: `You are ResumeFlame, a brutally honest and funny resume reviewer. Your job is to roast resumes with savage but constructive humor — like Simon Cowell reviewing a resume.

You MUST respond in this exact JSON format:
{
  "score": <number 1-10>,
  "roast_lines": [<array of 5-8 savage roast lines>],
  "issues": [<array of 3-5 serious issues found>],
  "one_liner": "<a single devastating one-liner summary>"
}

Rules:
- Be funny but not mean-spirited — the goal is to help
- Point out real problems (weak verbs, no metrics, bad formatting, buzzwords, etc.)
- Each roast line should address a specific problem in the resume
- Score fairly: 1-3 = bad, 4-6 = mediocre, 7-8 = good, 9-10 = excellent
- Keep it entertaining so people want to share their results`,
                },
                {
                  role: "user",
                  content: `Roast this resume:\n\n${resumeText.substring(0, 4000)}`,
                },
              ],
              temperature: 0.9,
              response_format: { type: "json_object" },
            });

            const roastResult = roastCompletion.choices[0].message.content || "{}";
            const parsed = JSON.parse(roastResult);

            await supabase
              .from("resumes")
              .update({ score: parsed.score || 5, roast: roastResult })
              .eq("id", resumeId);

            console.log(`Webhook: Roast saved for ${resumeId}`);
          } catch (err) {
            console.error("Webhook roast error:", err);
          }
        }

        if (!existing.fix) {
          try {
            const isPro = tier === "pro";
            const fixCompletion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content: `You are an expert resume writer. Rewrite the following resume to be significantly better.

Rules:
- Replace weak action verbs with strong ones (Led, Built, Drove, Achieved, etc.)
- Add quantifiable metrics where possible (even reasonable estimates)
- Remove buzzwords and fluff
- Keep it concise (aim for 1 page worth of content)
- Use professional formatting with clear sections
- Make each bullet point achievement-focused, not task-focused
${isPro ? "- Also optimize for ATS (Applicant Tracking Systems) with relevant keywords\n- Include a professional summary at the top\n- Generate a brief cover letter template at the end" : ""}

Return the rewritten resume as clean, well-formatted text.`,
                },
                {
                  role: "user",
                  content: `Rewrite this resume:\n\n${resumeText.substring(0, 4000)}`,
                },
              ],
              temperature: 0.7,
            });

            const fixResult = fixCompletion.choices[0].message.content || "";

            await supabase
              .from("resumes")
              .update({ fix: fixResult })
              .eq("id", resumeId);

            console.log(`Webhook: Fix saved for ${resumeId}`);
          } catch (err) {
            console.error("Webhook fix error:", err);
          }
        }

        // Always clean up original text after processing
        await supabase
          .from("resumes")
          .update({ original_text: null })
          .eq("id", resumeId);
        console.log(`Webhook: Original text cleaned up for ${resumeId}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
