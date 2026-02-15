import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { resumeId, tier } = await req.json();

    if (!resumeId || !tier) {
      return NextResponse.json({ error: "Missing resumeId or tier" }, { status: 400 });
    }

    const variantId =
      tier === "pro"
        ? process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ID_PRO
        : process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ID_BASIC;

    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    const apiKey = process.env.LEMONSQUEEZY_API_KEY;

    if (!variantId || !storeId || !apiKey) {
      console.error("Missing env vars:", { variantId: !!variantId, storeId: !!storeId, apiKey: !!apiKey });
      return NextResponse.json({ error: "Payment not configured" }, { status: 500 });
    }

    const payload = {
      data: {
        type: "checkouts",
        attributes: {
          product_options: {
            redirect_url: `${req.nextUrl.origin}/roast/${resumeId}?paid=1&tier=${tier}`,
          },
          checkout_data: {
            custom: {
              resume_id: resumeId,
              tier: tier,
            },
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: String(storeId),
            },
          },
          variant: {
            data: {
              type: "variants",
              id: String(variantId),
            },
          },
        },
      },
    };

    console.log("Creating Lemon Squeezy checkout:", JSON.stringify(payload));

    const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Lemon Squeezy API error:", res.status, JSON.stringify(data));
      return NextResponse.json(
        { error: data.errors?.[0]?.detail || "Failed to create checkout", details: data },
        { status: 500 }
      );
    }

    const checkoutUrl = data.data?.attributes?.url;

    if (!checkoutUrl) {
      console.error("No checkout URL in response:", JSON.stringify(data));
      return NextResponse.json({ error: "No checkout URL returned" }, { status: 500 });
    }

    // Add embed=1 so lemon.js can open it as an overlay
    const overlayUrl = checkoutUrl + (checkoutUrl.includes("?") ? "&" : "?") + "embed=1";

    return NextResponse.json({ checkoutUrl: overlayUrl });
  } catch (err) {
    console.error("Create checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }
}
