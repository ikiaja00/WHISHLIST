-- Our Little Journey: run this whole file once in Supabase > SQL Editor.
create extension if not exists pgcrypto;

create table public.couples(
  id uuid primary key default gen_random_uuid(),
  name_a text not null default 'Me', name_b text not null default 'You',
  start_date date,
  invite_code text not null unique default upper(substr(md5(random()::text||clock_timestamp()::text),1,8)),
  created_at timestamptz not null default now());

create table public.couple_members(
  couple_id uuid not null references public.couples on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  primary key(couple_id,user_id), unique(user_id));

create table public.wishlists(
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples on delete cascade,
  position int not null default 0,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description)<=400),
  category text not null default 'Other',
  status text not null default 'not_yet' check (status in ('not_yet','in_progress','completed')),
  target_date date, completed_at date,
  created_at timestamptz not null default now());

create table public.memories(
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null unique references public.wishlists on delete cascade,
  couple_id uuid not null references public.couples on delete cascade,
  activity_date date not null, location text not null default '',
  caption text not null default '', notes text not null default '',
  created_by uuid default auth.uid() references auth.users on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table public.memory_photos(
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories on delete cascade,
  couple_id uuid not null references public.couples on delete cascade,
  path text not null, created_at timestamptz not null default now());

create index on public.wishlists(couple_id,position);
create index on public.memories(couple_id);
create index on public.memory_photos(memory_id);

-- Membership check used by every policy
create function public.is_member(cid uuid) returns boolean
language sql security definer stable set search_path=public as
$$ select exists(select 1 from couple_members where couple_id=cid and user_id=auth.uid()) $$;

alter table couples enable row level security;
alter table couple_members enable row level security;
alter table wishlists enable row level security;
alter table memories enable row level security;
alter table memory_photos enable row level security;

create policy "members read couple" on couples for select to authenticated using (is_member(id));
create policy "members update couple" on couples for update to authenticated using (is_member(id)) with check (is_member(id));
create policy "read own membership" on couple_members for select to authenticated using (user_id=auth.uid());
create policy "members all wishlists" on wishlists for all to authenticated using (is_member(couple_id)) with check (is_member(couple_id));
create policy "members all memories" on memories for all to authenticated using (is_member(couple_id)) with check (is_member(couple_id));
create policy "members all photos" on memory_photos for all to authenticated using (is_member(couple_id)) with check (is_member(couple_id));

-- Create a couple (+ the 20 starter wishes). Called from the app.
create function public.create_couple(p_a text, p_b text, p_start date) returns uuid
language plpgsql security definer set search_path=public as $$
declare cid uuid;
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  if exists(select 1 from couple_members where user_id=auth.uid()) then raise exception 'You already belong to a couple'; end if;
  insert into couples(name_a,name_b,start_date) values(coalesce(nullif(trim(p_a),''),'Me'),coalesce(nullif(trim(p_b),''),'You'),p_start) returning id into cid;
  insert into couple_members values(cid,auth.uid());
  insert into wishlists(couple_id,position,title,category)
  select cid,i,t,c from unnest(
   array['First date together','Watch the sunset together','Have a cute picnic','Watch a movie under the stars','Try a new restaurant','Cook a meal together','Take photobooth pictures','Go on a spontaneous trip','Visit a place we''ve never been to','Exchange handwritten letters','Watch the sunrise together','Have a beach date','Make a scrapbook together','Buy matching accessories','Play games together','Have a late-night conversation','Celebrate our anniversary','Take pictures in matching outfits','Recreate our first photo together','Create our own special memory'],
   array['Date','Romantic','Date','Date','Food','Food','Creative','Adventure','Adventure','Creative','Romantic','Adventure','Creative','Other','Other','Romantic','Romantic','Creative','Memory','Memory'])
  with ordinality as x(t,c,i);
  return cid;
end $$;

-- Join with the partner's invite code (max 2 people per couple)
create function public.join_couple(p_code text) returns uuid
language plpgsql security definer set search_path=public as $$
declare cid uuid;
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  if exists(select 1 from couple_members where user_id=auth.uid()) then raise exception 'You already belong to a couple'; end if;
  select id into cid from couples where invite_code=upper(trim(p_code));
  if cid is null then raise exception 'Invite code not found'; end if;
  if (select count(*) from couple_members where couple_id=cid)>=2 then raise exception 'This couple already has two members'; end if;
  insert into couple_members values(cid,auth.uid());
  return cid;
end $$;

revoke execute on function public.create_couple(text,text,date), public.join_couple(text) from public, anon;
grant execute on function public.create_couple(text,text,date), public.join_couple(text) to authenticated;

-- Private photo bucket (5 MB, images only); first folder in the path = couple id
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('memories','memories',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

create policy "members manage photos" on storage.objects for all to authenticated
using (bucket_id='memories' and public.is_member(((storage.foldername(name))[1])::uuid))
with check (bucket_id='memories' and public.is_member(((storage.foldername(name))[1])::uuid));
