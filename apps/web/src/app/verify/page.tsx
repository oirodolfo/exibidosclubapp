"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VerifyStepCode } from "./_components/VerifyStepCode";
import { VerifyStepCamera } from "./_components/VerifyStepCamera";
import { VerifyPending } from "./_components/VerifyPending";
import { VerifyError } from "./_components/VerifyError";

type Step = "code" | "camera" | "pending" | "success" | "error";

/**
 * Verification flow: code → camera → upload → result.
 * Mobile-optimized, single primary action per screen.
 * On VERIFIED: redirect to /feed and show toast.
 */
export default function VerifyPage() {
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [failureReasons, setFailureReasons] = useState<string[]>([]);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const router = useRouter();

  const deviceFingerprint =
    typeof window !== "undefined"
      ? (localStorage.getItem("humanproof_device") ??
        (() => {
          const id = crypto.randomUUID();
          localStorage.setItem("humanproof_device", id);
          return id;
        })())
      : "";
  const sessionId =
    typeof window !== "undefined"
      ? sessionStorage.getItem("humanproof_session") ??
        (() => {
          const id = crypto.randomUUID();
          sessionStorage.setItem("humanproof_session", id);
          return id;
        })()
      : "";

  const requestCode = useCallback(async () => {
    setCodeLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/humanproof/verification/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceFingerprint,
          sessionId,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        code?: string;
        expiresAt?: string;
        message?: string;
      };
      if (!res.ok) {
        setErrorMessage(data.message ?? "Could not get code. Try again.");
        setCodeLoading(false);
        return;
      }
      setCode(data.code ?? "");
      setExpiresAt(data.expiresAt ?? "");
      setStep("code");
    } catch {
      setErrorMessage("Something went wrong. Try again.");
    }
    setCodeLoading(false);
  }, [deviceFingerprint, sessionId]);

  useEffect(() => {
    if (step === "code" && !code) requestCode();
  }, [step, code, requestCode]);

  const handleCodeNext = useCallback(() => {
    setStep("camera");
  }, []);

  const handleCapture = useCallback(
    async (blob: Blob) => {
      setUploadLoading(true);
      setErrorMessage("");
      setFailureReasons([]);
      try {
        const formData = new FormData();
        formData.set("file", blob, "verify.jpg");
        const res = await fetch("/api/humanproof/verification/upload", {
          method: "POST",
          body: formData,
        });
        const data = (await res.json().catch(() => ({}))) as {
          accepted?: boolean;
          failureReasons?: string[];
          message?: string;
        };
        if (!res.ok) {
          setErrorMessage(data.message ?? "Upload failed. Try again.");
          setUploadLoading(false);
          setStep("error");
          return;
        }
        if (data.accepted) {
          setStep("success");
          router.push("/feed?verified=1");
          return;
        }
        setFailureReasons(data.failureReasons ?? []);
        setErrorMessage(
          "We couldn’t accept this photo. Please use a camera (not a screenshot) and ensure the code is visible."
        );
        setStep("error");
      } catch {
        setErrorMessage("Something went wrong. Try again.");
        setStep("error");
      }
      setUploadLoading(false);
    },
    [router]
  );

  const handleCheckStatus = useCallback(async () => {
    setCheckingStatus(true);
    try {
      const res = await fetch("/api/humanproof/status");
      const data = (await res.json().catch(() => ({}))) as {
        userVerificationStatus?: string;
      };
      if (data.userVerificationStatus === "VERIFIED") {
        router.push("/feed?verified=1");
        return;
      }
    } finally {
      setCheckingStatus(false);
    }
  }, [router]);

  const handleRetry = useCallback(() => {
    setStep("code");
    setCode("");
    setExpiresAt("");
    setErrorMessage("");
    setFailureReasons([]);
    requestCode();
  }, [requestCode]);

  if (step === "pending") {
    return (
      <main className="min-h-screen py-8">
        <VerifyPending
          onCheckStatus={handleCheckStatus}
          checking={checkingStatus}
        />
      </main>
    );
  }

  if (step === "error") {
    return (
      <main className="min-h-screen py-8">
        <VerifyError
          message={errorMessage}
          failureReasons={failureReasons}
          onRetry={handleRetry}
        />
      </main>
    );
  }

  if (step === "camera") {
    return (
      <main className="min-h-screen py-8">
        <VerifyStepCamera
          onCapture={handleCapture}
          onBack={() => setStep("code")}
          loading={uploadLoading}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8">
      <VerifyStepCode
        code={code}
        expiresAt={expiresAt}
        onNext={handleCodeNext}
        loading={codeLoading}
      />
      {errorMessage && (
        <p className="mx-auto max-w-[480px] px-4 mt-4 text-red-600">
          {errorMessage}
        </p>
      )}
    </main>
  );
}
