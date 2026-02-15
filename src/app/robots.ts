import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/roast/"],
      },
    ],
    sitemap: "https://resumeflame.vercel.app/sitemap.xml",
  };
}
