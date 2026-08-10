import { notFound } from "next/navigation";
import { ActivityDetail } from "@/components/public/ActivityDetail";
import { getSiteData } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function PreviewActivityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getSiteData("preview");
  const activity = data.activities.find((a) => a.slug === slug);
  if (!activity) notFound();

  return (
    <ActivityDetail
      activity={activity}
      otherActivities={data.activities.filter((a) => a.slug !== slug)}
      instagramUrl={data.instagramUrl}
      previewBasePath="/preview"
    />
  );
}
