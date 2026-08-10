import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActivityDetail } from "@/components/public/ActivityDetail";
import { getSiteData } from "@/lib/content";

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSiteData("published");
  const activity = data.activities.find((a) => a.slug === slug);
  if (!activity) return {};
  return {
    title: activity.title,
    description: activity.summary,
  };
}

export default async function ActivityPage({ params }: Props) {
  const { slug } = await params;
  const data = await getSiteData("published");
  const activity = data.activities.find((a) => a.slug === slug);
  if (!activity) notFound();

  return (
    <ActivityDetail
      activity={activity}
      otherActivities={data.activities.filter((a) => a.slug !== slug)}
      instagramUrl={data.instagramUrl}
    />
  );
}
