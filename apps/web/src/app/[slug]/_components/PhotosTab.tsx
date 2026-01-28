import { listReset, photoGrid } from "@/lib/variants";

type ImageItem = { id: string; caption: string | null; createdAt: Date; moderationStatus: string };

type Props = { images: ImageItem[]; isOwner: boolean };

export function PhotosTab({ images, isOwner }: Props) {
  if (images.length === 0) {
    return <p>No photos yet.</p>;
  }

  return (
    <section>
      <p className="mb-4">{images.length} photo{images.length !== 1 ? "s" : ""}</p>
      <ul className={`${listReset} ${photoGrid}`}>
        {images.map((img) => (
          <li key={img.id}>
            <div className="aspect-square bg-neutral-200 rounded-lg flex items-center justify-center text-xs text-neutral-400">
              [img]
            </div>
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
