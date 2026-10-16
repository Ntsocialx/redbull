"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareEvent({ title, slug, compact = false }: { title: string; slug: string; compact?: boolean }) {
  const [message, setMessage] = useState("");
  async function share() {
    const url = new URL(`/events/${slug}`, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        setMessage("Share sheet opened.");
      } else {
        await navigator.clipboard.writeText(url);
        setMessage("Link copied.");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") setMessage("Could not share this event.");
    }
  }
  return (
    <span className="share-wrap">
      <button className={compact ? "icon-button" : "button button-outline"} type="button" aria-label={`Share ${title}`} onClick={share}>
        {message === "Link copied." ? <Check size={16} /> : <Share2 size={16} />}{!compact && "Share"}
      </button>
      <span className="sr-only" role="status">{message}</span>
    </span>
  );
}
