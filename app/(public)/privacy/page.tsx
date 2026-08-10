import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/defaults";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: `${SITE_NAME}公式サイトのプライバシーポリシーです。`,
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-ainezu-900">
        プライバシーポリシー
      </h1>
      <div className="mt-6 space-y-6 text-sm leading-relaxed text-ainezu-700">
        <section>
          <h2 className="font-bold text-ainezu-900">1. 基本方針</h2>
          <p className="mt-2">
            {SITE_NAME}
            (以下「当団体」)は、当サイトの利用者のプライバシーを尊重し、
            個人情報を適切に取り扱います。
          </p>
        </section>
        <section>
          <h2 className="font-bold text-ainezu-900">2. 取得する情報</h2>
          <p className="mt-2">
            当サイトでは、サイトの改善のために以下の匿名の利用状況データを取得しています。
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>閲覧されたページと閲覧日時</li>
            <li>Instagramボタンのクリック</li>
            <li>参照元サイト(リンク元)</li>
            <li>端末の種類(スマートフォン / PC)</li>
          </ul>
          <p className="mt-2">
            これらのデータは、ブラウザ内に保存される匿名のID(ランダムな文字列)で集計しており、
            氏名・メールアドレス・IPアドレスなど個人を特定できる情報は収集・保存していません。
            外部のアクセス解析サービスやCookieによる広告目的の追跡は行っていません。
          </p>
        </section>
        <section>
          <h2 className="font-bold text-ainezu-900">3. 利用目的</h2>
          <p className="mt-2">
            取得したデータは、サイトの内容改善および新入生への情報発信の改善のためにのみ利用します。
          </p>
        </section>
        <section>
          <h2 className="font-bold text-ainezu-900">4. 第三者提供</h2>
          <p className="mt-2">
            法令に基づく場合を除き、取得したデータを第三者に提供することはありません。
          </p>
        </section>
        <section>
          <h2 className="font-bold text-ainezu-900">5. 外部サービスへのリンク</h2>
          <p className="mt-2">
            当サイトにはInstagramなど外部サービスへのリンクがあります。
            リンク先での情報の取り扱いは、各サービスのプライバシーポリシーをご確認ください。
          </p>
        </section>
        <section>
          <h2 className="font-bold text-ainezu-900">6. お問い合わせ</h2>
          <p className="mt-2">
            本ポリシーに関するお問い合わせは、公式InstagramのDMにてお願いします。
          </p>
        </section>
        <p className="text-xs text-ainezu-500">制定日: 2026年</p>
      </div>
    </div>
  );
}
