import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";

// Disable worker for server-side usage
GlobalWorkerOptions.workerSrc = "";

async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    text += pageText + "\n";
  }

  return text.trim();
}

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
    const arrayBuffer = await file.arrayBuffer();
    const resumeText = await extractTextFromPDF(arrayBuffer);

    if (!resumeText || resumeText.length < 50) {
      return NextResponse.json(
        { error: "Could not extract enough text from PDF. Make sure it's not a scanned image." },
        { status: 400 }
      );
    }

    // Get visitor ID from header (set by client)
    const visitorId = req.headers.get("x-visitor-id") || "anonymous";

    const supabase = getServiceSupabase();

    // Insert resume record — all uploads require payment before fix
    const { data, error } = await supabase
      .from("resumes")
      .insert({
        original_text: resumeText,
        file_name: file.name,
        visitor_id: visitorId,
        tier: "pending_payment",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Database error — please try again later." }, { status: 500 });
    }

    // Roast generation is deferred until after payment

    return NextResponse.json({
      id: data.id,
    });
  } catch (err) {
    console.error("Upload error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to process resume: ${message}` }, { status: 500 });
  }
}
