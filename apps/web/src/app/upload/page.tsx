import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth/config";
import { link, mainBlock } from "@/lib/variants";
import { UploadForm } from "./_components/UploadForm";

export default async function UploadPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/upload");
  }

  if (process.env.FEATURE_IMAGE_UPLOAD !== "true") {
    return (
      <main className={mainBlock}>
        <h1>Upload</h1>
        <p>Photo upload is currently disabled.</p>
        <p><Link href="/" className={link}>Home</Link></p>
      </main>
    );
  }

  return <UploadForm />;
}
