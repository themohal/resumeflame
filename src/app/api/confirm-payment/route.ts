import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { resumeId, tier } = await req.json();

    if (!resumeId) {
      return NextResponse.json({ error: "Missing resume ID" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Check current state
    const { data: resume, error: fetchError } = await supabase
      .from("resumes")
      .select("paid, original_text, roast")
      .eq("id", resumeId)
      .single();

    if (fetchError || !resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    // If already paid and roast exists, nothing to do
    if (resume.paid && resume.roast) {
      return NextResponse.json({ success: true, already_processed: true });
    }

    // Mark as paid (webhook may have already done this, but this ensures it)
    await supabase
      .from("resumes")
      .update({ paid: true, tier: tier || "basic" })
      .eq("id", resumeId);

    // Trigger roast generation if not already done
    if (!resume.roast && resume.original_text) {
      const origin = req.headers.get("origin") || req.nextUrl.origin;

      fetch(`${origin}/api/roast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, resumeText: resume.original_text }),
      }).catch(console.error);

      fetch(`${origin}/api/fix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId }),
      }).catch(console.error);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Confirm payment error:", err);
    return NextResponse.json({ error: "Failed to confirm payment" }, { status: 500 });
  }
}
