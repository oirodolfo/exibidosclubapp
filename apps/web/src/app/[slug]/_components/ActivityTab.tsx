type ActivityItem =
  | { type: "upload"; id: string; createdAt: Date; caption: string | null }
  | { type: "vote"; id: string; createdAt: Date; imageId: string }
  | { type: "swipe"; id: string; createdAt: Date; imageId: string; direction: string };

type Props = { items: ActivityItem[] };

export function ActivityTab({ items }: Props) {
  if (items.length === 0) {
    return <p>No recent activity.</p>;
  }

  return (
    <section>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.map((a) => (
          <li key={`${a.type}-${a.id}`} style={{ padding: "0.5rem 0", borderBottom: "1px solid #eee" }}>
            <span style={{ fontSize: "0.75rem", color: "#666" }}>{new Date(a.createdAt).toLocaleString()}</span>
            {" — "}
            {a.type === "upload" && <>Uploaded {a.caption ? `"${a.caption}"` : "a photo"}</>}
            {a.type === "vote" && <>Voted on an image</>}
            {a.type === "swipe" && <>Swiped {a.direction} on an image</>}
          </li>
        ))}
      </ul>
    </section>
  );
}
