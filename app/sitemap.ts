import type { MetadataRoute } from "next";
import { getSiteData } from "@/lib/content";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getSiteData("published");
  return [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    ...data.activities.map((activity) => ({
      url: `${siteUrl}/activities/${activity.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
