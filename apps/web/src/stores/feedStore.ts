/**
 * Feed & verify UI state: upload gate, form visibility, verification flow step.
 * Zustand keeps state out of prop drilling and works with TanStack Query for server state.
 */
import { create } from "zustand";

export type VerifyStep = "code" | "camera" | "pending" | "success" | "error";

type FeedState = {
  // Upload button
  uploadGateOpen: boolean;
  uploadFormOpen: boolean;
  setUploadGateOpen: (open: boolean) => void;
  setUploadFormOpen: (open: boolean) => void;
  openUploadGate: () => void;
  closeUploadGate: () => void;
  openUploadForm: () => void;
  closeUploadForm: () => void;

  // Verification flow
  verifyStep: VerifyStep;
  verifyCode: string;
  verifyExpiresAt: string;
  verifyErrorMessage: string;
  verifyFailureReasons: string[];
  setVerifyStep: (step: VerifyStep) => void;
  setVerifyCode: (code: string, expiresAt: string) => void;
  setVerifyError: (message: string, reasons?: string[]) => void;
  resetVerify: () => void;
};

const initialVerify = {
  verifyStep: "code" as VerifyStep,
  verifyCode: "",
  verifyExpiresAt: "",
  verifyErrorMessage: "",
  verifyFailureReasons: [] as string[],
};

export const useFeedStore = create<FeedState>((set) => ({
  uploadGateOpen: false,
  uploadFormOpen: false,
  setUploadGateOpen: (open) => set({ uploadGateOpen: open }),
  setUploadFormOpen: (open) => set({ uploadFormOpen: open }),
  openUploadGate: () => set({ uploadGateOpen: true }),
  closeUploadGate: () => set({ uploadGateOpen: false }),
  openUploadForm: () => set({ uploadFormOpen: true }),
  closeUploadForm: () => set({ uploadFormOpen: false }),

  verifyStep: initialVerify.verifyStep,
  verifyCode: initialVerify.verifyCode,
  verifyExpiresAt: initialVerify.verifyExpiresAt,
  verifyErrorMessage: initialVerify.verifyErrorMessage,
  verifyFailureReasons: initialVerify.verifyFailureReasons,
  setVerifyStep: (step) => set({ verifyStep: step }),
  setVerifyCode: (code, expiresAt) =>
    set({ verifyCode: code, verifyExpiresAt: expiresAt, verifyErrorMessage: "", verifyFailureReasons: [] }),
  setVerifyError: (message, reasons = []) =>
    set({
      verifyStep: "error",
      verifyErrorMessage: message,
      verifyFailureReasons: reasons,
    }),
  resetVerify: () => set(initialVerify),
}));
