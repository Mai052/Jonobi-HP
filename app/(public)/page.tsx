import { LandingPage } from "@/components/public/LandingPage";
import { getSiteData } from "@/lib/content";

export const revalidate = 300;

export default async function HomePage() {
  const data = await getSiteData("published");
  return <LandingPage data={data} />;
}
