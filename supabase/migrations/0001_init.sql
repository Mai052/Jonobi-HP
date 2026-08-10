-- まつだい早稲田じょんのびクラブ 公式サイト
-- 初期スキーマ: テーブル / RLS / トリガー / RPC / Storage
-- Supabase SQL Editor でそのまま実行できます。

create extension if not exists pgcrypto;

-- ============================================================
-- profiles: 運営メンバー(auth.users と 1:1)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  role text not null default 'editor' check (role in ('editor', 'representative')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 自分のロールを返すヘルパー(RLS再帰を避けるため security definer)
create or replace function public.my_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

revoke execute on function public.my_role() from public, anon;
grant execute on function public.my_role() to authenticated;

create policy "profiles_select_staff"
  on public.profiles for select to authenticated using (true);

create policy "profiles_update_rep_or_self"
  on public.profiles for update to authenticated
  using (public.my_role() = 'representative' or id = auth.uid())
  with check (public.my_role() = 'representative' or id = auth.uid());

create policy "profiles_delete_rep"
  on public.profiles for delete to authenticated
  using (public.my_role() = 'representative');

-- ロール変更の保護 + 代表者0人化の防止
create or replace function public.protect_profiles()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.role is distinct from old.role
       and auth.uid() is not null
       and public.my_role() is distinct from 'representative' then
      raise exception '権限の変更は代表者のみ可能です';
    end if;
    if old.role = 'representative' and new.role <> 'representative' then
      if (select count(*) from public.profiles
          where role = 'representative' and id <> old.id) = 0 then
        raise exception '代表者を0人にすることはできません';
      end if;
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.role = 'representative' then
      if (select count(*) from public.profiles
          where role = 'representative' and id <> old.id) = 0 then
        raise exception '代表者を0人にすることはできません';
      end if;
    end if;
    return old;
  end if;
  return null;
end;
$$;

create trigger protect_profiles_trigger
  before update or delete on public.profiles
  for each row execute function public.protect_profiles();

-- auth.users 作成時に profiles を自動作成
-- (公開サインアップは無効化し、ユーザー作成は service role 経由のみの運用)
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    case when new.raw_user_meta_data ->> 'role' = 'representative'
         then 'representative' else 'editor' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- コンテンツテーブル(共通: draft=下書きJSONB / published=公開JSONB)
-- status: draft(下書き) pending(公開待ち) published(公開中) unpublished(非公開)
-- ============================================================
create table public.sections (
  id uuid primary key default gen_random_uuid(),
  key text not null unique, -- 'hero' | 'about' | 'join_info' | 'settings'
  draft jsonb not null default '{}'::jsonb,
  published jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'published', 'unpublished')),
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  draft jsonb not null default '{}'::jsonb, -- { title, summary, body, season }
  published jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'published', 'unpublished')),
  sort_order int not null default 0,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  draft jsonb not null default '{}'::jsonb, -- { question, answer }
  published jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'published', 'unpublished')),
  sort_order int not null default 0,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  draft jsonb not null default '{}'::jsonb, -- { title, body, event_date }
  published jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'published', 'unpublished')),
  sort_order int not null default 0,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  slot text not null
    check (slot in ('hero', 'about', 'members', 'activity_card', 'activity_detail')),
  activity_id uuid references public.activities (id) on delete cascade,
  storage_path text not null,
  alt text not null default '',
  sort_order int not null default 0,
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'published', 'unpublished')),
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index photos_slot_idx on public.photos (slot, activity_id, sort_order);

alter table public.sections enable row level security;
alter table public.activities enable row level security;
alter table public.faqs enable row level security;
alter table public.announcements enable row level security;
alter table public.photos enable row level security;

-- ============================================================
-- コンテンツの権限ガード(DB側の二重制御)
-- editor は draft の編集と draft<->pending の状態変更のみ。
-- published カラムの変更・公開/非公開への遷移は代表者のみ。
-- auth.uid() が null のとき(service role / マイグレーション)は許可。
-- ============================================================
create or replace function public.enforce_content_rights()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if public.my_role() = 'representative' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status not in ('draft', 'pending') or new.published is not null then
      raise exception '公開操作は代表者のみ可能です';
    end if;
    return new;
  end if;

  -- UPDATE
  if new.published is distinct from old.published
     or new.published_at is distinct from old.published_at then
    raise exception '公開操作は代表者のみ可能です';
  end if;
  if new.status is distinct from old.status then
    if not (old.status in ('draft', 'pending')
            and new.status in ('draft', 'pending')) then
      raise exception 'この状態変更は代表者のみ可能です';
    end if;
  end if;
  return new;
end;
$$;

create trigger enforce_sections_rights
  before insert or update on public.sections
  for each row execute function public.enforce_content_rights();
create trigger enforce_activities_rights
  before insert or update on public.activities
  for each row execute function public.enforce_content_rights();
create trigger enforce_faqs_rights
  before insert or update on public.faqs
  for each row execute function public.enforce_content_rights();
create trigger enforce_announcements_rights
  before insert or update on public.announcements
  for each row execute function public.enforce_content_rights();

-- 写真用(published カラムがないため status のみガード)
create or replace function public.enforce_photo_rights()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if public.my_role() = 'representative' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status not in ('draft', 'pending') then
      raise exception '写真の公開は代表者のみ可能です';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    if not (old.status in ('draft', 'pending')
            and new.status in ('draft', 'pending')) then
      raise exception '写真の公開・非公開は代表者のみ可能です';
    end if;
  end if;
  return new;
end;
$$;

create trigger enforce_photos_rights
  before insert or update on public.photos
  for each row execute function public.enforce_photo_rights();

-- ============================================================
-- RLS ポリシー
-- 匿名(公開サイト)は公開中のみ閲覧可。スタッフは全件閲覧・編集可。
-- 削除は代表者のみ。
-- ============================================================
create policy "sections_select_public" on public.sections
  for select to anon using (status = 'published');
create policy "sections_select_staff" on public.sections
  for select to authenticated using (true);
create policy "sections_insert_staff" on public.sections
  for insert to authenticated with check (true);
create policy "sections_update_staff" on public.sections
  for update to authenticated using (true) with check (true);
create policy "sections_delete_rep" on public.sections
  for delete to authenticated using (public.my_role() = 'representative');

create policy "activities_select_public" on public.activities
  for select to anon using (status = 'published');
create policy "activities_select_staff" on public.activities
  for select to authenticated using (true);
create policy "activities_insert_staff" on public.activities
  for insert to authenticated with check (true);
create policy "activities_update_staff" on public.activities
  for update to authenticated using (true) with check (true);
create policy "activities_delete_rep" on public.activities
  for delete to authenticated using (public.my_role() = 'representative');

create policy "faqs_select_public" on public.faqs
  for select to anon using (status = 'published');
create policy "faqs_select_staff" on public.faqs
  for select to authenticated using (true);
create policy "faqs_insert_staff" on public.faqs
  for insert to authenticated with check (true);
create policy "faqs_update_staff" on public.faqs
  for update to authenticated using (true) with check (true);
create policy "faqs_delete_rep" on public.faqs
  for delete to authenticated using (public.my_role() = 'representative');

create policy "announcements_select_public" on public.announcements
  for select to anon using (status = 'published');
create policy "announcements_select_staff" on public.announcements
  for select to authenticated using (true);
create policy "announcements_insert_staff" on public.announcements
  for insert to authenticated with check (true);
create policy "announcements_update_staff" on public.announcements
  for update to authenticated using (true) with check (true);
create policy "announcements_delete_rep" on public.announcements
  for delete to authenticated using (public.my_role() = 'representative');

create policy "photos_select_public" on public.photos
  for select to anon using (status = 'published');
create policy "photos_select_staff" on public.photos
  for select to authenticated using (true);
create policy "photos_insert_staff" on public.photos
  for insert to authenticated with check (true);
create policy "photos_update_staff" on public.photos
  for update to authenticated using (true) with check (true);
create policy "photos_delete_rep" on public.photos
  for delete to authenticated using (public.my_role() = 'representative');

-- ============================================================
-- 公開 / 非公開 RPC(代表者のみ。security definer + 関数内チェック)
-- ============================================================
create or replace function public.publish_row(p_table text, p_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if public.my_role() is distinct from 'representative' then
    raise exception '公開は代表者のみ可能です';
  end if;
  if p_table = 'photos' then
    update public.photos set status = 'published' where id = p_id;
  elsif p_table in ('sections', 'activities', 'faqs', 'announcements') then
    execute format(
      'update public.%I set published = draft, status = ''published'', published_at = now(), updated_at = now() where id = $1',
      p_table
    ) using p_id;
  else
    raise exception '不正なテーブル指定です';
  end if;
end;
$$;

create or replace function public.unpublish_row(p_table text, p_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if public.my_role() is distinct from 'representative' then
    raise exception '非公開化は代表者のみ可能です';
  end if;
  if p_table not in ('sections', 'activities', 'faqs', 'announcements', 'photos') then
    raise exception '不正なテーブル指定です';
  end if;
  execute format(
    'update public.%I set status = ''unpublished'' where id = $1',
    p_table
  ) using p_id;
end;
$$;

revoke execute on function public.publish_row(text, uuid) from public, anon;
revoke execute on function public.unpublish_row(text, uuid) from public, anon;
grant execute on function public.publish_row(text, uuid) to authenticated;
grant execute on function public.unpublish_row(text, uuid) to authenticated;

-- ============================================================
-- アクセス分析
-- INSERT は service role(サーバーAPI)経由のみ。閲覧はスタッフのみ。
-- ============================================================
create table public.analytics_events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('page_view', 'ig_click')),
  path text not null default '/',
  activity_slug text,
  cta_position text
    check (cta_position in ('header', 'hero', 'after_activity', 'footer', 'sticky')),
  session_id uuid not null,
  referrer text,
  device text check (device in ('mobile', 'desktop')),
  created_at timestamptz not null default now()
);

create index analytics_events_created_idx on public.analytics_events (created_at);
create index analytics_events_type_created_idx on public.analytics_events (event_type, created_at);

alter table public.analytics_events enable row level security;

create policy "analytics_select_staff" on public.analytics_events
  for select to authenticated using (true);
-- INSERT/UPDATE/DELETE のポリシーは作らない = service role 以外は書き込み不可

-- 集計レポート(管理画面から呼び出す)
create or replace function public.analytics_report(
  p_from timestamptz,
  p_to timestamptz,
  p_granularity text
)
returns jsonb
language plpgsql stable
set search_path = public
as $$
declare
  result jsonb;
begin
  if p_granularity not in ('day', 'week', 'month') then
    raise exception 'granularity は day / week / month のいずれかです';
  end if;

  select jsonb_build_object(
    'summary', (
      select jsonb_build_object(
        'visitors',    count(distinct session_id) filter (where event_type = 'page_view'),
        'pageviews',   count(*)                   filter (where event_type = 'page_view'),
        'ig_clicks',   count(*)                   filter (where event_type = 'ig_click'),
        'ig_sessions', count(distinct session_id) filter (where event_type = 'ig_click')
      )
      from analytics_events
      where created_at >= p_from and created_at < p_to
    ),
    'timeseries', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.bucket)
      from (
        select
          to_char(date_trunc(p_granularity, created_at at time zone 'Asia/Tokyo'), 'YYYY-MM-DD') as bucket,
          count(distinct session_id) filter (where event_type = 'page_view') as visitors,
          count(*)                   filter (where event_type = 'page_view') as pageviews,
          count(distinct session_id) filter (where event_type = 'ig_click') as ig_sessions
        from analytics_events
        where created_at >= p_from and created_at < p_to
        group by 1
      ) t
    ), '[]'::jsonb),
    'positions', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.clicks desc)
      from (
        select cta_position as "position", count(*) as clicks
        from analytics_events
        where event_type = 'ig_click' and cta_position is not null
          and created_at >= p_from and created_at < p_to
        group by 1
      ) t
    ), '[]'::jsonb),
    'activities', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.views desc)
      from (
        select activity_slug as slug, count(*) as views
        from analytics_events
        where event_type = 'page_view' and activity_slug is not null
          and created_at >= p_from and created_at < p_to
        group by 1
      ) t
    ), '[]'::jsonb),
    'referrers', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.sessions desc)
      from (
        select
          case
            when referrer is null or referrer = '' then '直接アクセス・QRコード'
            else coalesce(substring(referrer from '^[A-Za-z][A-Za-z0-9+.-]*://([^/]+)'), referrer)
          end as source,
          count(distinct session_id) as sessions
        from analytics_events
        where event_type = 'page_view'
          and created_at >= p_from and created_at < p_to
        group by 1
        order by 2 desc
        limit 10
      ) t
    ), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(to_jsonb(t))
      from (
        select coalesce(device, 'desktop') as device,
               count(distinct session_id) as sessions
        from analytics_events
        where event_type = 'page_view'
          and created_at >= p_from and created_at < p_to
        group by 1
      ) t
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke execute on function public.analytics_report(timestamptz, timestamptz, text) from public, anon;
grant execute on function public.analytics_report(timestamptz, timestamptz, text) to authenticated;

-- ============================================================
-- Storage: 写真バケット(公開読み取り / スタッフのみアップロード)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "photos_bucket_public_read" on storage.objects
  for select using (bucket_id = 'photos');
create policy "photos_bucket_staff_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'photos');
create policy "photos_bucket_rep_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and public.my_role() = 'representative');
