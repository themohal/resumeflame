import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { resumeId } = await req.json();

    if (!resumeId) {
      return NextResponse.json({ error: "Missing resume ID" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Only delete original_text (the bulk data) — keep payment records for accounting
    await supabase
      .from("resumes")
      .update({ original_text: null })
      .eq("id", resumeId);

    console.log(`Cleaned up resume text for ${resumeId}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Cleanup error:", err);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
