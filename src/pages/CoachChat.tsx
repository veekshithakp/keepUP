import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import { ChatInput, ChatInputSubmit, ChatInputTextArea } from "@/components/ui";
import { CoachMessageBubble } from "../components/coach";
import { useAuth, useCoachChat } from "../hooks";
import { routePaths } from "../routes";
import { generateCoachReply, saveCoachMessage } from "../services";
import type { CoachSuggestion } from "../types";

const coachSuggestions: CoachSuggestion[] = [
  {
    id: "study-advice",
    title: "Study advice",
    prompt:
      "Give me a focused study plan for this week based on my current roadmap and placement goals.",
  },
  {
    id: "placement-guidance",
    title: "Placement guidance",
    prompt:
      "What should I prioritize right now to improve my chances in campus placements?",
  },
  {
    id: "resume-suggestions",
    title: "Resume suggestions",
    prompt:
      "Suggest how I should improve my resume for internships or entry-level software roles.",
  },
  {
    id: "roadmap-recommendations",
    title: "Roadmap recommendations",
    prompt:
      "Review my roadmap progress and recommend the next best milestones to focus on.",
  },
  {
    id: "interview-preparation",
    title: "Interview preparation",
    prompt:
      "Help me prepare for upcoming technical and HR interview rounds with practical steps.",
  },
];

export default function CoachChat() {
  const { user } = useAuth();
  const { messages, loading, error } = useCoachChat(user?.uid);
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, submitting]);

  async function sendMessage(nextPrompt: string) {
    if (!user || !nextPrompt.trim()) {
      return;
    }

    const trimmedPrompt = nextPrompt.trim();
    setPageError("");
    setSubmitting(true);

    try {
      const updatedMessages = [
        ...messages,
        {
          id: crypto.randomUUID(),
          role: "user" as const,
          text: trimmedPrompt,
          localCreatedAt: new Date().toISOString(),
        },
      ];

      await saveCoachMessage(user.uid, {
        role: "user",
        text: trimmedPrompt,
      });

      setPrompt("");

      const reply = await generateCoachReply(user.uid, updatedMessages);

      await saveCoachMessage(user.uid, {
        role: "model",
        text: reply,
      });
    } catch (nextError) {
      setPageError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to get a response from KeepUP Coach right now.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage(prompt);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "24px 0 40px",
        color: "var(--off-white)",
      }}
    >
      <div style={{ width: "100%", margin: 0, padding: "0 24px" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "18px",
            marginBottom: "28px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 10px",
                fontSize: "12px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--french-beige-soft)",
              }}
            >
              KeepUP Chatbot
            </p>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(2rem, 5vw, 42px)",
                lineHeight: 1.04,
                fontWeight: 800,
              }}
            >
              Chat with your career coach
            </h1>
            <p
              style={{
                margin: "14px 0 0",
                maxWidth: "760px",
                color: "var(--muted-stone)",
                fontSize: "15px",
                lineHeight: 1.7,
              }}
            >
              Ask for study advice, placement guidance, resume suggestions,
              roadmap recommendations, and interview preparation help. Your
              message history is still stored in Firestore.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              alignItems: "stretch",
              minWidth: "220px",
            }}
          >
            <Link
              to={routePaths.dashboard}
              style={{
                padding: "12px 18px",
                borderRadius: "14px",
                border: "1px solid rgba(199, 173, 144, 0.14)",
                background: "rgba(6, 6, 6, 0.96)",
                color: "var(--off-white)",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "14px",
                textAlign: "center",
              }}
            >
              Back to dashboard
            </Link>
            <Link
              to={routePaths.coach}
              style={{
                padding: "12px 18px",
                borderRadius: "14px",
                border: "1px solid rgba(199, 173, 144, 0.14)",
                background: "rgba(6, 6, 6, 0.96)",
                color: "var(--off-white)",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "14px",
                textAlign: "center",
              }}
            >
              Back to planner
            </Link>
          </div>
        </header>

        {(error || pageError) && (
          <div
            style={{
              marginBottom: "18px",
              padding: "14px 16px",
              borderRadius: "16px",
              background: "rgba(18, 14, 11, 0.98)",
              border: "1px solid rgba(199, 173, 144, 0.16)",
              color: "var(--off-white-soft)",
              lineHeight: 1.6,
            }}
          >
            {pageError || error}
          </div>
        )}

        <section
          style={{
            padding: "24px",
            borderRadius: "24px",
            background: "rgba(8, 8, 8, 0.98)",
            border: "1px solid rgba(199, 173, 144, 0.12)",
            boxShadow: "0 30px 70px rgba(0, 0, 0, 0.3)",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: "24px" }}>Quick prompts</h2>
              <p style={{ margin: "8px 0 0", color: "var(--muted-stone)", lineHeight: 1.7 }}>
                Start with one of these coaching flows.
              </p>
            </div>
            <span
              style={{
                padding: "10px 14px",
                borderRadius: "999px",
                background: "rgba(199, 173, 144, 0.14)",
                color: "var(--off-white)",
                fontWeight: 700,
              }}
            >
              {loading ? "Loading history..." : `${messages.length} saved messages`}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
            {coachSuggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                disabled={submitting}
                onClick={() => void sendMessage(suggestion.prompt)}
                style={{
                  padding: "16px",
                  borderRadius: "18px",
                  border: "1px solid rgba(199, 173, 144, 0.12)",
                  background: "rgba(12, 12, 12, 0.98)",
                  color: "var(--off-white)",
                  textAlign: "left",
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                <p style={{ margin: "0 0 8px", fontWeight: 800 }}>{suggestion.title}</p>
                <p
                  style={{
                    margin: 0,
                    color: "var(--muted-stone)",
                    lineHeight: 1.6,
                    fontSize: "14px",
                  }}
                >
                  {suggestion.prompt}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section
          style={{
            padding: "24px",
            borderRadius: "24px",
            background: "rgba(8, 8, 8, 0.98)",
            border: "1px solid rgba(199, 173, 144, 0.12)",
            boxShadow: "0 30px 70px rgba(0, 0, 0, 0.45)",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: "14px",
              minHeight: "420px",
              maxHeight: "65vh",
              overflowY: "auto",
              paddingRight: "6px",
              marginBottom: "18px",
            }}
          >
            {loading ? (
              <div
                style={{
                  padding: "18px",
                  borderRadius: "18px",
                  background: "rgba(12, 12, 12, 0.98)",
                  border: "1px solid rgba(199, 173, 144, 0.12)",
                  color: "var(--off-white-soft)",
                }}
              >
                Loading your coach history...
              </div>
            ) : messages.length === 0 ? (
              <div
                style={{
                  padding: "20px",
                  borderRadius: "18px",
                  background: "rgba(12, 12, 12, 0.98)",
                  border: "1px solid rgba(199, 173, 144, 0.12)",
                  color: "var(--off-white-soft)",
                  lineHeight: 1.7,
                }}
              >
                Start your first conversation with KeepUP Coach. Ask about
                study plans, placements, resumes, roadmaps, or interviews.
              </div>
            ) : (
              messages.map((message) => (
                <CoachMessageBubble key={message.id} message={message} />
              ))
            )}

            {submitting ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                }}
              >
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: "24px",
                    background: "rgba(12, 12, 12, 0.98)",
                    border: "1px solid rgba(199, 173, 144, 0.12)",
                    color: "var(--off-white-soft)",
                  }}
                >
                  KeepUP Coach is thinking...
                </div>
              </div>
            ) : null}

            <div ref={endOfMessagesRef} />
          </div>

          <form onSubmit={handleSubmit}>
            <ChatInput
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onSubmit={() => {
                void sendMessage(prompt);
              }}
              loading={submitting}
              rows={1}
              className="bg-black/95"
            >
              <ChatInputTextArea placeholder="Ask for help with studying, placements, resumes, roadmaps, or interviews..." />
              <ChatInputSubmit />
            </ChatInput>
          </form>
        </section>
      </div>
    </div>
  );
}
