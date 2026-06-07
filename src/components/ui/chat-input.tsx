import type React from "react";
import { createContext, useContext } from "react";
import { ArrowUpIcon } from "lucide-react";
import { useTextareaResize } from "@/hooks/use-textarea-resize";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Textarea } from "./textarea";

interface ChatInputContextValue {
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  onSubmit?: () => void;
  loading?: boolean;
  onStop?: () => void;
  variant?: "default" | "unstyled";
  rows?: number;
}

const ChatInputContext = createContext<ChatInputContextValue>({});

interface ChatInputProps extends Omit<ChatInputContextValue, "variant"> {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "unstyled";
  rows?: number;
}

function ChatInput({
  children,
  className,
  variant = "default",
  value,
  onChange,
  onSubmit,
  loading,
  onStop,
  rows = 1,
}: ChatInputProps) {
  const contextValue: ChatInputContextValue = {
    value,
    onChange,
    onSubmit,
    loading,
    onStop,
    variant,
    rows,
  };

  return (
    <ChatInputContext.Provider value={contextValue}>
      <div
        className={cn(
          variant === "default" &&
            "flex w-full flex-col items-end rounded-[28px] border border-white/8 bg-black/95 p-2 shadow-[0_24px_60px_rgba(0,0,0,0.35)] focus-within:outline-none focus-within:ring-1 focus-within:ring-white/10",
          variant === "unstyled" && "flex w-full items-start gap-2",
          className,
        )}
      >
        {children}
      </div>
    </ChatInputContext.Provider>
  );
}

interface ChatInputTextAreaProps extends React.ComponentProps<typeof Textarea> {
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  onSubmit?: () => void;
  variant?: "default" | "unstyled";
}

function ChatInputTextArea({
  onSubmit: onSubmitProp,
  value: valueProp,
  onChange: onChangeProp,
  className,
  variant: variantProp,
  ...props
}: ChatInputTextAreaProps) {
  const context = useContext(ChatInputContext);
  const value = valueProp ?? context.value ?? "";
  const onChange = onChangeProp ?? context.onChange;
  const onSubmit = onSubmitProp ?? context.onSubmit;
  const rows = context.rows ?? 1;
  const variant =
    variantProp ?? (context.variant === "default" ? "unstyled" : "default");
  const textareaRef = useTextareaResize(value, rows);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!onSubmit) {
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      if (typeof value !== "string" || value.trim().length === 0) {
        return;
      }

      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <Textarea
      ref={textareaRef}
      {...props}
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      className={cn(
        "max-h-[280px] min-h-0 resize-none overflow-x-hidden border-none bg-transparent px-4 py-3 text-[15px] leading-7 text-white placeholder:text-neutral-500 shadow-none focus-visible:ring-0",
        variant === "unstyled" &&
          "border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
        className,
      )}
      rows={rows}
    />
  );
}

interface ChatInputSubmitProps extends React.ComponentProps<typeof Button> {
  onSubmit?: () => void;
  loading?: boolean;
  onStop?: () => void;
}

function ChatInputSubmit({
  onSubmit: onSubmitProp,
  loading: loadingProp,
  onStop: onStopProp,
  className,
  ...props
}: ChatInputSubmitProps) {
  const context = useContext(ChatInputContext);
  const loading = loadingProp ?? context.loading;
  const onStop = onStopProp ?? context.onStop;
  const onSubmit = onSubmitProp ?? context.onSubmit;

  if (loading && onStop) {
    return (
      <Button
        type="button"
        onClick={onStop}
        variant="outline"
        className={cn("h-11 w-11 rounded-full p-0", className)}
        {...props}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-label="Stop"
        >
          <title>Stop</title>
          <rect x="6" y="6" width="12" height="12" />
        </svg>
      </Button>
    );
  }

  const isDisabled =
    typeof context.value !== "string" || context.value.trim().length === 0;

  return (
    <Button
      type="button"
      className={cn(
        "h-11 w-11 rounded-full border border-white/10 bg-white p-0 text-black hover:bg-neutral-200",
        className,
      )}
      disabled={isDisabled}
      onClick={(event) => {
        event.preventDefault();

        if (!isDisabled) {
          onSubmit?.();
        }
      }}
      {...props}
    >
      <ArrowUpIcon className="h-4 w-4" />
    </Button>
  );
}

export { ChatInput, ChatInputSubmit, ChatInputTextArea };
