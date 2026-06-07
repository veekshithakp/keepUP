import { useEffect, useRef } from "react";

export function useTextareaResize(value: string, rows = 1) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.rows = rows;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [rows, value]);

  return textareaRef;
}
