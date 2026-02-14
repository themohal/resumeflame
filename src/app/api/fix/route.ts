import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { resumeId } = await req.json();

    if (!resumeId) {
      return NextResponse.json({ error: "Missing resume ID" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Check if paid
    const { data: resume, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", resumeId)
      .single();

    if (error || !resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    // Only allow paid users
    if (!resume.paid) {
      return NextResponse.json({ error: "Payment required" }, { status: 402 });
    }

    // Generate the fix
    const isPro = resume.tier === "pro";

    const completion = await openai.chat.completions.create({
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
          content: `Rewrite this resume:\n\n${resume.original_text.substring(0, 4000)}`,
        },
      ],
      temperature: 0.7,
    });

    const fixResult = completion.choices[0].message.content || "";

    // Save fix to database
    await supabase
      .from("resumes")
      .update({ fix: fixResult })
      .eq("id", resumeId);

    return NextResponse.json({ success: true, fix: fixResult });
  } catch (err) {
    console.error("Fix error:", err);
    return NextResponse.json({ error: "Failed to generate fix" }, { status: 500 });
  }
}
