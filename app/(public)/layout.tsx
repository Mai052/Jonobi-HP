import { Footer } from "@/components/public/Footer";
import { Header } from "@/components/public/Header";
import { PageTracker } from "@/components/public/PageTracker";
import { StickyCta } from "@/components/public/StickyCta";
import { getSiteData } from "@/lib/content";

export const revalidate = 300;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { instagramUrl } = await getSiteData("published");

  return (
    <>
      <PageTracker />
      <Header instagramUrl={instagramUrl} />
      <main>{children}</main>
      <Footer />
      <StickyCta instagramUrl={instagramUrl} />
    </>
  );
}
