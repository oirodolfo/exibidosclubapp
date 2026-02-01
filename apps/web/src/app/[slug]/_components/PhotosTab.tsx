import Link from "next/link";
import Image from "next/image";
import { listReset, photoGrid } from "@/lib/variants";

type ImageItem = {
  id: string;
  caption: string | null;
  createdAt: Date;
  moderationStatus: string;
  thumbUrl?: string | null;
};

type Props = { images: ImageItem[]; isOwner: boolean; slug: string };

export function PhotosTab({ images, isOwner, slug }: Props) {
  if (images.length === 0) {
    return <p>No photos yet.</p>;
  }

  return (
    <section>
      <p className="mb-4">{images.length} photo{images.length !== 1 ? "s" : ""}</p>
      <ul className={`${listReset} ${photoGrid}`}>
        {images.map((img) => (
          <li key={img.id}>
            <Link href={`/${slug}/photos/${img.id}`}>
              <div className="aspect-square bg-neutral-200 rounded-lg overflow-hidden flex items-center justify-center text-xs text-neutral-400 relative">
                {img.thumbUrl ? (
                  <Image src={img.thumbUrl} alt={img.caption ?? "Photo"} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                ) : (
                  <span>[img]</span>
                )}
              </div>
            </Link>
            {img.caption && <p className="mt-1 text-sm">{img.caption}</p>}
            <p className="m-0 text-xs text-neutral-500">{new Date(img.createdAt).toLocaleDateString()}</p>
            {isOwner && img.moderationStatus !== "approved" && (
              <span className="text-[0.7rem] text-amber-600">{img.moderationStatus}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
