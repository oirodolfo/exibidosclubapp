type BadgeItem = { key: string; name: string; description: string | null; earnedAt: Date };

type Props = { badges: BadgeItem[] };

export function BadgesTab({ badges }: Props) {
  if (badges.length === 0) {
    return <p>No badges yet.</p>;
  }

  return (
    <section>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        {badges.map((b) => (
          <li
            key={b.key}
            style={{
              padding: "0.75rem 1rem",
              background: "#f5f5f5",
              borderRadius: 8,
              minWidth: 140,
            }}
          >
            <strong>{b.name}</strong>
            {b.description && <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#666" }}>{b.description}</p>}
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#999" }}>Earned {new Date(b.earnedAt).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
