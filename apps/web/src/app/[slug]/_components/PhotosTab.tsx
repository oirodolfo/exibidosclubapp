type ImageItem = { id: string; caption: string | null; createdAt: Date; moderationStatus: string };

type Props = { images: ImageItem[]; isOwner: boolean };

export function PhotosTab({ images, isOwner }: Props) {
  if (images.length === 0) {
    return <p>No photos yet.</p>;
  }

  return (
    <section>
      <p style={{ marginBottom: "1rem" }}>{images.length} photo{images.length !== 1 ? "s" : ""}</p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem" }}>
        {images.map((img) => (
          <li key={img.id}>
            <div
              style={{
                aspectRatio: "1",
                background: "#eee",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                color: "#999",
              }}
            >
              [img]
            </div>
            {img.caption && <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem" }}>{img.caption}</p>}
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#666" }}>{new Date(img.createdAt).toLocaleDateString()}</p>
            {isOwner && img.moderationStatus !== "approved" && (
              <span style={{ fontSize: "0.7rem", color: "#b8860b" }}>{img.moderationStatus}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
