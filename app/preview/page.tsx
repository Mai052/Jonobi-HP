import { LandingPage } from "@/components/public/LandingPage";
import { getSiteData } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function PreviewHomePage() {
  const data = await getSiteData("preview");
  return <LandingPage data={data} previewBasePath="/preview" />;
}
