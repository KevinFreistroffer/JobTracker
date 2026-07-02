"use client";

import { useState } from "react";

const DEFAULT_TRUNCATE_LENGTH = 140;

type NotesPreviewProps = {
  notes: string;
  truncateLength?: number;
  className?: string;
};

export function NotesPreview({
  notes,
  truncateLength = DEFAULT_TRUNCATE_LENGTH,
  className,
}: NotesPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = notes.length > truncateLength;
  const showFull = expanded || !needsTruncation;
  const visibleText = showFull
    ? notes
    : `${notes.slice(0, truncateLength).trimEnd()}…`;

  return (
    <span className={className}>
      <span className="font-medium text-slate-500">Notes: </span>
      <span className="whitespace-pre-wrap">{visibleText}</span>
      {needsTruncation ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="ml-1 font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </span>
  );
}
