import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_RETRIES = 3;

async function callOpenAIWithRetry(
  params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
  retries = MAX_RETRIES
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await openai.chat.completions.create(params);
    } catch (err: unknown) {
      console.error(`OpenAI attempt ${attempt}/${retries} failed:`, err);
      // Don't retry on auth errors — they'll never succeed
      const status = (err as { status?: number }).status;
      if (status === 401 || status === 403) throw err;
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  }
  throw new Error("OpenAI retries exhausted");
}

export async function POST(req: NextRequest) {
  const supabase = getServiceSupabase();
  let resumeId: string | undefined;

  try {
    const body = await req.json();
    resumeId = body.resumeId;
    const tier = body.tier;

    if (!resumeId) {
      return NextResponse.json({ error: "Missing resume ID" }, { status: 400 });
    }

    const { data: resume, error: fetchError } = await supabase
      .from("resumes")
      .select("paid, original_text, roast, fix, tier")
      .eq("id", resumeId)
      .single();

    if (fetchError || !resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    if (resume.paid && resume.roast && resume.fix) {
      return NextResponse.json({ success: true, already_processed: true });
    }

    const selectedTier = tier || resume.tier || "basic";
    await supabase
      .from("resumes")
      .update({ paid: true, tier: selectedTier, payment_id: "client-confirmed" })
      .eq("id", resumeId);

    const resumeText = resume.original_text;
    if (!resumeText) {
      return NextResponse.json({ error: "No resume text found" }, { status: 400 });
    }

    let roastFailed = false;
    let fixFailed = false;

    // Generate roast with retries
    if (!resume.roast) {
      try {
        console.log(`Generating roast for resume ${resumeId}`);
        const roastCompletion = await callOpenAIWithRetry({
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

        console.log(`Roast saved for resume ${resumeId}, score: ${parsed.score}`);
      } catch (err) {
        console.error("Roast generation failed after retries:", err);
        roastFailed = true;
      }
    }

    // Generate fix with retries
    if (!resume.fix) {
      try {
        const isPro = selectedTier === "pro";
        console.log(`Generating fix for resume ${resumeId}, tier: ${selectedTier}`);

        const fixCompletion = await callOpenAIWithRetry({
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

        console.log(`Fix saved for resume ${resumeId}`);
      } catch (err) {
        console.error("Fix generation failed after retries:", err);
        fixFailed = true;
      }
    }

    // ALWAYS delete original resume text after processing — success or failure
    await supabase
      .from("resumes")
      .update({ original_text: null })
      .eq("id", resumeId);
    console.log(`Original text cleaned up for resume ${resumeId}`);

    if (roastFailed || fixFailed) {
      try {
        await supabase
          .from("resumes")
          .update({ processing_error: "AI generation failed after multiple attempts" })
          .eq("id", resumeId);
      } catch {
        console.error("Could not set processing_error (column may not exist)");
      }

      return NextResponse.json({ success: false, error: "AI generation failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Confirm payment error:", err);

    // Clean up even on unexpected errors
    if (resumeId) {
      try {
        await supabase
          .from("resumes")
          .update({ original_text: null, processing_error: "Processing failed unexpectedly" })
          .eq("id", resumeId);
      } catch {
        // processing_error column may not exist yet, at least clean up text
        await supabase
          .from("resumes")
          .update({ original_text: null })
          .eq("id", resumeId);
      }
    }

    return NextResponse.json({ error: "Failed to confirm payment" }, { status: 500 });
  }
}
