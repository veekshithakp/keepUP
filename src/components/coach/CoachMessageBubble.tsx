import type { CoachMessage } from "../../types";

interface CoachMessageBubbleProps {
  message: CoachMessage;
}

export function CoachMessageBubble({ message }: CoachMessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      <article
        style={{
          maxWidth: isUser ? "260px" : "860px",
          minWidth: isUser ? "92px" : undefined,
          padding: isUser ? "14px 16px" : "18px 20px",
          borderRadius: isUser ? "28px" : "24px",
          background: isUser
            ? "linear-gradient(180deg, #f7f3eb, #c7ad90)"
            : "rgba(8, 8, 8, 0.98)",
          border: isUser
            ? "1px solid rgba(199, 173, 144, 0.34)"
            : "1px solid rgba(199, 173, 144, 0.12)",
          color: isUser ? "#050505" : "var(--off-white)",
          boxShadow: "0 20px 44px rgba(0, 0, 0, 0.28)",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: isUser ? "rgba(5, 5, 5, 0.62)" : "var(--french-beige-soft)",
          }}
        >
          {isUser ? "You" : "KeepUP Coach"}
        </p>
        <p
          style={{
            margin: 0,
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {message.text}
        </p>
      </article>
    </div>
  );
}
