"use client";

import { useEffect, useState } from "react";

type ShareReleaseButtonProps = {
  title: string;
  text: string;
  url: string;
  className?: string;
};

type ShareState = "idle" | "copied" | "shared";

const copyToClipboard = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
};

export function ShareReleaseButton({
  title,
  text,
  url,
  className = "",
}: ShareReleaseButtonProps) {
  const [shareState, setShareState] = useState<ShareState>("idle");

  useEffect(() => {
    if (shareState === "idle") {
      return;
    }

    const timeout = window.setTimeout(() => setShareState("idle"), 1800);

    return () => window.clearTimeout(timeout);
  }, [shareState]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        setShareState("shared");
        return;
      }

      await copyToClipboard(url);
      setShareState("copied");
    } catch {
      setShareState("idle");
    }
  };

  const label =
    shareState === "copied" ? "Link copied" : shareState === "shared" ? "Shared" : "Share";

  return (
    <button type="button" onClick={handleShare} className={className}>
      {label}
    </button>
  );
}
