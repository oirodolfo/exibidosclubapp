"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { VerifyStepCode } from "./_components/VerifyStepCode";
import { VerifyStepCamera } from "./_components/VerifyStepCamera";
import { VerifyPending } from "./_components/VerifyPending";
import { VerifyError } from "./_components/VerifyError";
import {
  useHumanproofStatus,
  useHumanproofCode,
  useHumanproofUpload,
} from "@/hooks/api/useHumanproof";
import { useFeedStore } from "@/stores/feedStore";

const DEVICE_KEY = "humanproof_device";
const SESSION_KEY = "humanproof_session";

function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/**
 * Verification flow: code → camera → upload → result.
 * TanStack Query for code/upload mutations and status refetch; Zustand for step state.
 */
export default function VerifyPage() {
  const router = useRouter();
  const codeRequestedRef = useRef(false);
  const {
    verifyStep,
    verifyCode,
    verifyExpiresAt,
    verifyErrorMessage,
    verifyFailureReasons,
    setVerifyStep,
    setVerifyCode,
    setVerifyError,
    resetVerify,
  } = useFeedStore();

  const { refetch: refetchStatus, isFetching: checkingStatus } = useHumanproofStatus();
  const codeMutation = useHumanproofCode();
  const uploadMutation = useHumanproofUpload();

  // Request code when step is code and we don't have one yet (TanStack Query mutation)
  useEffect(() => {
    if (verifyStep !== "code" || verifyCode) return;
    if (codeRequestedRef.current) return;
    codeRequestedRef.current = true;
    const deviceFingerprint = getDeviceFingerprint();
    const sessionId = getSessionId();
    codeMutation.mutate(
      { deviceFingerprint, sessionId },
      {
        onSuccess: (data) => {
          setVerifyCode(data.code, data.expiresAt);
        },
        onError: (err) => {
          setVerifyError(err instanceof Error ? err.message : "Could not get code. Try again.");
        },
        onSettled: () => {
          codeRequestedRef.current = false;
        },
      }
    );
  }, [verifyStep, verifyCode, codeMutation, setVerifyCode, setVerifyError]);

  const handleCodeNext = useCallback(() => {
    setVerifyStep("camera");
  }, [setVerifyStep]);

  const handleCapture = useCallback(
    (blob: Blob) => {
      uploadMutation.mutate(blob, {
        onSuccess: (data) => {
          if (data.accepted) {
            setVerifyStep("success");
            router.push("/feed?verified=1");
            return;
          }
          setVerifyError(
            "We couldn’t accept this photo. Please use a camera (not a screenshot) and ensure the code is visible.",
            data.failureReasons ?? []
          );
        },
        onError: (err) => {
          setVerifyError(err instanceof Error ? err.message : "Something went wrong. Try again.");
        },
      });
    },
    [uploadMutation, setVerifyStep, setVerifyError, router]
  );

  const handleCheckStatus = useCallback(async () => {
    const result = await refetchStatus();
    if (result.data?.userVerificationStatus === "VERIFIED") {
      router.push("/feed?verified=1");
    }
  }, [refetchStatus, router]);

  const handleRetry = useCallback(() => {
    codeRequestedRef.current = false;
    resetVerify();
  }, [resetVerify]);

  if (verifyStep === "pending") {
    return (
      <main className="min-h-screen py-8">
        <VerifyPending
          onCheckStatus={handleCheckStatus}
          checking={checkingStatus}
        />
      </main>
    );
  }

  if (verifyStep === "error") {
    return (
      <main className="min-h-screen py-8">
        <VerifyError
          message={verifyErrorMessage}
          failureReasons={verifyFailureReasons}
          onRetry={handleRetry}
        />
      </main>
    );
  }

  if (verifyStep === "camera") {
    return (
      <main className="min-h-screen py-8">
        <VerifyStepCamera
          onCapture={handleCapture}
          onBack={() => setVerifyStep("code")}
          loading={uploadMutation.isPending}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8">
      <VerifyStepCode
        code={verifyCode}
        expiresAt={verifyExpiresAt}
        onNext={handleCodeNext}
        loading={codeMutation.isPending}
      />
      {codeMutation.isError && (
        <p className="mx-auto max-w-[480px] px-4 mt-4 text-red-600">
          {codeMutation.error instanceof Error
            ? codeMutation.error.message
            : "Could not get code. Try again."}
        </p>
      )}
    </main>
  );
}
