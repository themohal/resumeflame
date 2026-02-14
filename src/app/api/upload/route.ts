import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
    }

    // Parse PDF text
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdfParse(buffer);
    const resumeText = (pdfData.text || "").trim();

    if (!resumeText || resumeText.length < 50) {
      return NextResponse.json(
        { error: "Could not extract enough text from PDF. Make sure it's not a scanned image." },
        { status: 400 }
      );
    }

    // Get visitor ID from header (set by client)
    const visitorId = req.headers.get("x-visitor-id") || "anonymous";

    // Check free usage
    const supabase = getServiceSupabase();
    const { count } = await supabase
      .from("resumes")
      .select("*", { count: "exact", head: true })
      .eq("visitor_id", visitorId);

    const isFirstUse = (count || 0) === 0;

    // Insert resume record
    const { data, error } = await supabase
      .from("resumes")
      .insert({
        original_text: resumeText,
        file_name: file.name,
        visitor_id: visitorId,
        tier: isFirstUse ? "free" : "pending_payment",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to save resume" }, { status: 500 });
    }

    // Trigger roast generation
    const origin = req.headers.get("origin") || req.nextUrl.origin;
    fetch(`${origin}/api/roast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeId: data.id, resumeText }),
    }).catch(console.error);

    return NextResponse.json({
      id: data.id,
      isFirstUse,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Failed to process resume" }, { status: 500 });
  }
}
