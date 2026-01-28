type Props = {
  displayName: string;
  bio: string | null;
  slug: string;
  counts: { uploads: number; votes: number; likes: number };
  isOwner: boolean;
};

export function OverviewTab({ displayName, bio, slug, counts, isOwner }: Props) {

  return (
    <section>
      <h2>{displayName}</h2>
      <p style={{ color: "#666" }}>exibidos.club/{slug}</p>
      {bio != null && bio !== "" && <p style={{ whiteSpace: "pre-wrap", marginTop: "0.5rem" }}>{bio}</p>}
      <dl style={{ display: "flex", gap: "1.5rem", marginTop: "1rem" }}>
        <div><dt style={{ fontSize: "0.875rem", color: "#666" }}>Uploads</dt><dd style={{ margin: 0, fontWeight: 600 }}>{counts.uploads}</dd></div>
        <div><dt style={{ fontSize: "0.875rem", color: "#666" }}>Votes</dt><dd style={{ margin: 0, fontWeight: 600 }}>{counts.votes}</dd></div>
        <div><dt style={{ fontSize: "0.875rem", color: "#666" }}>Likes</dt><dd style={{ margin: 0, fontWeight: 600 }}>{counts.likes}</dd></div>
      </dl>
      {isOwner && (
        <p style={{ marginTop: "1rem" }}><a href="/settings">Edit profile &amp; privacy</a></p>
      )}
    </section>
  );
}
