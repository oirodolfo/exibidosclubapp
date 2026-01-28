import { text, link as linkCls } from "@/lib/variants";
import Link from "next/link";

type Props = {
  displayName: string;
  bio: string | null;
  slug: string;
  counts: { uploads: number; votes: number; likes: number; followers: number; following: number };
  isOwner: boolean;
};

export function OverviewTab({ displayName, bio, slug, counts, isOwner }: Props) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{displayName}</h2>
      <p className={text.muted}>exibidos.club/{slug}</p>
      {bio != null && bio !== "" && <p className="whitespace-pre-wrap mt-2">{bio}</p>}
      <dl className="flex gap-6 mt-4 flex-wrap">
        <div><dt className="text-sm text-neutral-500">Uploads</dt><dd className="m-0 font-semibold">{counts.uploads}</dd></div>
        <div><dt className="text-sm text-neutral-500">Votes</dt><dd className="m-0 font-semibold">{counts.votes}</dd></div>
        <div><dt className="text-sm text-neutral-500">Likes</dt><dd className="m-0 font-semibold">{counts.likes}</dd></div>
        <div><dt className="text-sm text-neutral-500">Followers</dt><dd className="m-0 font-semibold"><Link href={`/${slug}/followers`} className={linkCls}>{counts.followers}</Link></dd></div>
        <div><dt className="text-sm text-neutral-500">Following</dt><dd className="m-0 font-semibold"><Link href={`/${slug}/following`} className={linkCls}>{counts.following}</Link></dd></div>
      </dl>
      {isOwner && (
        <p className="mt-4"><Link href="/settings" className={linkCls}>Edit profile &amp; privacy</Link></p>
      )}
    </section>
  );
}
