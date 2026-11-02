import type { MetadataRoute } from "next";

import { modeDemo } from "@/lib/demo";
import { URL_SITUS } from "@/lib/situs";

export default function robots(): MetadataRoute.Robots {
  // Situs demo berisi apa pun yang diketik pengunjung terakhir, dan isinya
  // kembar dengan situs utama. Keduanya alasan untuk tidak diindeks.
  if (modeDemo()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/masuk", "/api/"],
    },
    sitemap: `${URL_SITUS}/sitemap.xml`,
  };
}
