interface ProgressBarProps {
  label: string;
  value: number;
  helper: string;
  accent?: string;
}

export function ProgressBar({
  label,
  value,
  helper,
  accent = "linear-gradient(135deg, #f7f3eb, #c7ad90)",
}: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(value, 100));

  return (
    <div
      style={{
        padding: "18px",
        borderRadius: "20px",
        background: "rgba(15, 15, 15, 0.96)",
        border: "1px solid rgba(199, 173, 144, 0.12)",
        boxShadow: "0 22px 44px rgba(0, 0, 0, 0.26)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <p style={{ margin: 0, color: "var(--off-white)", fontWeight: 700 }}>{label}</p>
        <span style={{ color: "var(--off-white)", fontWeight: 800 }}>{clampedValue}%</span>
      </div>
      <div
        style={{
          height: "12px",
          borderRadius: "999px",
          background: "rgba(247, 243, 235, 0.09)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${clampedValue}%`,
            height: "100%",
            borderRadius: "999px",
            background: accent,
          }}
        />
      </div>
      <p style={{ margin: "12px 0 0", color: "var(--muted-stone)", lineHeight: 1.6 }}>
        {helper}
      </p>
    </div>
  );
}
