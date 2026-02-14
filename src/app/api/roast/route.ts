import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// GET: Fetch resume data for the results page
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("resumes")
    .select("id, score, roast, fix, paid, tier")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ resume: data });
}

export async function POST(req: NextRequest) {
  try {
    const { resumeId, resumeText } = await req.json();

    if (!resumeId || !resumeText) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // Verify payment before calling OpenAI
    const supabase = getServiceSupabase();
    const { data: resume, error: dbError } = await supabase
      .from("resumes")
      .select("paid")
      .eq("id", resumeId)
      .single();

    if (dbError || !resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    if (!resume.paid) {
      return NextResponse.json({ error: "Payment required" }, { status: 402 });
    }

    const completion = await openai.chat.completions.create({
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

    const roastResult = completion.choices[0].message.content || "{}";
    const parsed = JSON.parse(roastResult);

    // Save to database
    await supabase
      .from("resumes")
      .update({
        score: parsed.score || 5,
        roast: roastResult,
      })
      .eq("id", resumeId);

    return NextResponse.json({ success: true, roast: parsed });
  } catch (err) {
    console.error("Roast error:", err);
    return NextResponse.json({ error: "Failed to generate roast" }, { status: 500 });
  }
}
