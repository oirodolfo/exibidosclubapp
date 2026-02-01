/**
 * TanStack Query: HumanProof verification status, request code, upload verification image.
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

export type VerificationStatus =
  | "UNVERIFIED"
  | "PENDING"
  | "VERIFIED"
  | "REQUIRES_RECHECK"
  | "REVOKED"
  | null;

type StatusResponse = {
  userId: string;
  userVerificationStatus: VerificationStatus;
  devices: { deviceFingerprint: string; status: string; boundAt: string }[];
};

const statusKey = ["humanproof", "status"] as const;

export function useHumanproofStatus() {
  return useQuery({
    queryKey: statusKey,
    queryFn: async (): Promise<StatusResponse | null> => {
      const res = await fetch("/api/humanproof/status");

      if (res.status === 401) return null;

      if (!res.ok) throw new Error("Failed to fetch status");

      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

type CodeResponse = { code: string; expiresAt: string };
type CodePayload = { deviceFingerprint: string; sessionId: string };

export function useHumanproofCode() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CodePayload): Promise<CodeResponse> => {
      const res = await fetch("/api/humanproof/verification/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({})) as CodeResponse & { message?: string };

      if (!res.ok) throw new Error(data.message ?? "Could not get code");

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: statusKey });
    },
  });
}

type UploadResponse = { accepted: boolean; failureReasons: string[] };

export function useHumanproofUpload() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (file: Blob): Promise<UploadResponse> => {
      const formData = new FormData();

      formData.set("file", file, "verify.jpg");
      const res = await fetch("/api/humanproof/verification/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({})) as UploadResponse & { message?: string };

      if (!res.ok) throw new Error(data.message ?? "Upload failed");

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: statusKey });
    },
  });
}
