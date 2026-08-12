import Link from "next/link";
import { SITE_NAME } from "@/lib/defaults";
import type { SiteData } from "@/lib/types";
import { InstagramCta } from "./InstagramCta";
import { SitePhoto } from "./SitePhoto";

function Paragraphs({ text, className = "" }: { text: string; className?: string }) {
  return <p className={`whitespace-pre-line ${className}`}>{text}</p>;
}

function SectionTitle({
  en,
  ja,
}: {
  en: string;
  ja: string;
}) {
  return (
    <div className="mb-8 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
        {en}
      </p>
      <h2 className="mt-1 text-2xl font-bold tracking-wide text-ainezu-900 sm:text-3xl">
        {ja}
      </h2>
      <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-rice-400" />
    </div>
  );
}

function formatDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  const [y, m, d] = date.split("-");
  return `${y}年${Number(m)}月${Number(d)}日`;
}

/**
 * トップページ本体。公開ページとプレビューの両方から使う。
 * previewBasePath を渡すと活動リンクがプレビュー用パスになる。
 */
export function LandingPage({
  data,
  previewBasePath = "",
}: {
  data: SiteData;
  previewBasePath?: string;
}) {
  const joinItems: { label: string; value: string }[] = [
    { label: "年間の活動時期", value: data.joinInfo.seasons },
    { label: "1回の活動期間", value: data.joinInfo.duration },
    { label: "活動場所", value: data.joinInfo.location },
    { label: "費用", value: data.joinInfo.cost },
    { label: "参加頻度", value: data.joinInfo.frequency },
    { label: "毎回参加は必要?", value: data.joinInfo.attendance },
    { label: "未経験でも大丈夫?", value: data.joinInfo.beginners },
  ];

  return (
    <div>
      {/* 1. ファーストビュー */}
      <section className="relative">
        <SitePhoto
          photo={data.heroPhoto}
          label="メインビジュアル"
          className="aspect-[3/4] w-full sm:aspect-[16/9] sm:max-h-[560px]"
          sizes="100vw"
          priority
          rounded={false}
        />
        {data.heroPhoto && (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-ainezu-900/70 via-ainezu-900/20 to-transparent"
          />
        )}
        <div
          className={
            data.heroPhoto
              ? "absolute inset-x-0 bottom-0 p-6 pb-10 text-white sm:p-10"
              : "bg-forest-700 p-6 pb-10 text-white sm:p-10"
          }
        >
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-medium opacity-90">{SITE_NAME}</p>
            <h1 className="mt-2 text-2xl font-bold leading-snug tracking-wide sm:text-4xl">
              {data.hero.catchcopy}
            </h1>
            <Paragraphs
              text={data.hero.description}
              className="mt-3 max-w-2xl text-base leading-loose opacity-95"
            />
            <div className="mt-6">
              <InstagramCta href={data.instagramUrl} position="hero" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. サークル紹介 */}
      <section id="about" className="mx-auto max-w-5xl px-4 py-16">
        <SectionTitle en="About" ja="じょんのびクラブとは" />
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <SitePhoto
            photo={data.aboutPhoto}
            label="サークル紹介"
            className="aspect-[4/3] w-full"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          <div className="space-y-6">
            <div>
              <h3 className="font-bold tracking-wide text-forest-700">活動の目的</h3>
              <Paragraphs
                text={data.about.purpose}
                className="mt-2 text-base leading-loose text-ainezu-700"
              />
            </div>
            <div>
              <h3 className="font-bold tracking-wide text-forest-700">まつだい地域との関係</h3>
              <Paragraphs
                text={data.about.relation}
                className="mt-2 text-base leading-loose text-ainezu-700"
              />
            </div>
            <div>
              <h3 className="font-bold tracking-wide text-forest-700">私たちの特徴</h3>
              <Paragraphs
                text={data.about.features}
                className="mt-2 text-base leading-loose text-ainezu-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. 活動紹介(写真カード) */}
      <section id="activities" className="bg-snow-100 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <SectionTitle en="Activities" ja="活動紹介" />
          <p className="mx-auto mb-8 max-w-xl text-center text-base leading-loose text-ainezu-600">
            気になる活動をタップすると、写真と文章で詳しく紹介します。
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {data.activities.map((activity) => (
              <Link
                key={activity.slug}
                href={`${previewBasePath}/activities/${activity.slug}`}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <SitePhoto
                  photo={activity.cardPhoto}
                  label={`${activity.title}の活動`}
                  className="aspect-[4/3] w-full"
                  sizes="(min-width: 640px) 50vw, 100vw"
                  rounded={false}
                />
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-ainezu-900">
                      {activity.title}
                    </h3>
                    {activity.season && (
                      <span className="shrink-0 rounded-full bg-rice-100 px-3 py-1 text-xs font-medium text-ainezu-700">
                        {activity.season}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-base leading-loose text-ainezu-600">
                    {activity.summary}
                  </p>
                  <p className="mt-3 text-sm font-bold text-forest-600 group-hover:underline">
                    詳しく見る →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. 活動頻度・参加方法 */}
      <section id="join" className="mx-auto max-w-5xl px-4 py-16">
        <SectionTitle en="How to Join" ja="活動頻度・参加方法" />
        <p className="mx-auto mb-8 max-w-xl text-center text-base leading-loose text-ainezu-600">
          「どのくらい時間を取られるの?」という不安にお答えします。
          自分のペースで参加できるサークルです。
        </p>
        <dl className="grid gap-4 sm:grid-cols-2">
          {joinItems.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-snow-200 bg-white p-5"
            >
              <dt className="text-xs font-bold uppercase tracking-wide text-forest-500">
                {item.label}
              </dt>
              <dd className="mt-2 whitespace-pre-line text-base font-medium leading-loose text-ainezu-900">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 5. FAQ */}
      <section id="faq" className="bg-snow-100 py-16">
        <div className="mx-auto max-w-2xl px-4">
          <SectionTitle en="FAQ" ja="よくある質問" />
          <div className="space-y-3">
            {data.faqs.map((faq, index) => (
              <details
                key={index}
                className="faq-item rounded-2xl bg-white p-5 shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold tracking-wide text-ainezu-900">
                  <span>Q. {faq.question}</span>
                </summary>
                <p className="mt-3 whitespace-pre-line border-t border-snow-200 pt-3 text-base leading-loose text-ainezu-700">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 6. お知らせ・次回活動 */}
      <section id="news" className="mx-auto max-w-2xl px-4 py-16">
        <SectionTitle en="News" ja="お知らせ・次回活動" />
        <ul className="space-y-4">
          {data.announcements.map((announcement) => (
            <li
              key={announcement.id}
              className="rounded-2xl border border-snow-200 bg-white p-5"
            >
              {announcement.event_date && (
                <p className="text-xs font-bold text-forest-600">
                  {formatDate(announcement.event_date)}
                </p>
              )}
              <h3 className="mt-1 font-bold tracking-wide text-ainezu-900">
                {announcement.title}
              </h3>
              <p className="mt-2 whitespace-pre-line text-base leading-loose text-ainezu-700">
                {announcement.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* 7. 最下部CTA */}
      <section className="bg-forest-700 py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <SitePhoto
            photo={data.membersPhoto}
            label="メンバー集合写真"
            className="mx-auto aspect-[16/9] w-full max-w-xl"
            sizes="(min-width: 640px) 576px, 100vw"
          />
          <h2 className="mt-8 text-2xl font-bold tracking-wide">
            まずは気軽にDMで話を聞いてみませんか?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base leading-loose opacity-90">
            「ちょっと興味がある」だけで大歓迎。活動の雰囲気や参加方法など、
            どんな質問でもInstagramのDMでお答えします。
          </p>
          <div className="mt-6 flex justify-center">
            <InstagramCta href={data.instagramUrl} position="footer" />
          </div>
        </div>
      </section>
    </div>
  );
}
