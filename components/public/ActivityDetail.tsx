import Link from "next/link";
import type { ActivityView } from "@/lib/types";
import { InstagramCta } from "./InstagramCta";
import { SitePhoto } from "./SitePhoto";

/**
 * 活動詳細ページ本体。公開ページとプレビューの両方から使う。
 */
export function ActivityDetail({
  activity,
  otherActivities,
  instagramUrl,
  previewBasePath = "",
}: {
  activity: ActivityView;
  otherActivities: ActivityView[];
  instagramUrl: string;
  previewBasePath?: string;
}) {
  const mainPhoto = activity.detailPhotos[0] ?? activity.cardPhoto;
  const restPhotos = activity.detailPhotos.slice(1);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav aria-label="パンくず" className="text-xs text-ainezu-500">
        <Link href={`${previewBasePath}/`} className="hover:underline">
          トップ
        </Link>
        <span className="mx-1">/</span>
        <Link
          href={`${previewBasePath}/#activities`}
          className="hover:underline"
        >
          活動紹介
        </Link>
        <span className="mx-1">/</span>
        <span className="text-ainezu-700">{activity.title}</span>
      </nav>

      <div className="mt-4 flex items-center gap-3">
        <h1 className="text-3xl font-bold text-ainezu-900">{activity.title}</h1>
        {activity.season && (
          <span className="rounded-full bg-rice-100 px-3 py-1 text-xs font-medium text-ainezu-700">
            {activity.season}
          </span>
        )}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ainezu-600">
        {activity.summary}
      </p>

      <SitePhoto
        photo={mainPhoto}
        label={`${activity.title}の活動`}
        className="mt-6 aspect-[4/3] w-full sm:aspect-[16/9]"
        sizes="(min-width: 768px) 768px, 100vw"
        priority
      />

      <div className="prose-sm mt-8 whitespace-pre-line text-[15px] leading-relaxed text-ainezu-700">
        {activity.body}
      </div>

      {restPhotos.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-3">
          {restPhotos.map((photo) => (
            <SitePhoto
              key={photo.id}
              photo={photo}
              label={`${activity.title}の活動`}
              className="aspect-[4/3] w-full"
              sizes="(min-width: 768px) 384px, 50vw"
            />
          ))}
        </div>
      )}

      {/* 読了後のCTA */}
      <div className="mt-12 rounded-2xl bg-forest-50 p-6 text-center sm:p-8">
        <h2 className="text-lg font-bold text-ainezu-900">
          {activity.title}に少しでも興味が湧いたら
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ainezu-600">
          活動の詳しい日程や持ち物など、気になることはInstagramのDMで気軽に聞いてください!
        </p>
        <div className="mt-5 flex justify-center">
          <InstagramCta href={instagramUrl} position="after_activity" />
        </div>
      </div>

      {otherActivities.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-bold text-ainezu-900">ほかの活動も見る</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {otherActivities.map((other) => (
              <Link
                key={other.slug}
                href={`${previewBasePath}/activities/${other.slug}`}
                className="group overflow-hidden rounded-xl border border-snow-200 bg-white"
              >
                <SitePhoto
                  photo={other.cardPhoto}
                  label={`${other.title}の活動`}
                  className="aspect-[4/3] w-full"
                  sizes="50vw"
                  rounded={false}
                />
                <p className="p-3 text-sm font-bold text-ainezu-900 group-hover:text-forest-600">
                  {other.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
