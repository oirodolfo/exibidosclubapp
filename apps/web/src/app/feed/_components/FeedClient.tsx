"use client";

import { Suspense } from "react";
import { FeedList } from "./FeedList";
import { UploadButton } from "./UploadButton";
import { VerifiedToast } from "./VerifiedToast";

/**
 * Client wrapper: feed list + smart upload button + verified toast.
 * Feed is always visible; upload button adapts to verification state.
 */
export function FeedClient() {
  return (
    <>
      <FeedList />
      <UploadButton />
      <Suspense fallback={null}>
        <VerifiedToast />
      </Suspense>
    </>
  );
}
