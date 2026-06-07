interface DashboardMetricCardProps {
  title: string;
  value: string;
  detail: string;
  accent: string;
}

export function DashboardMetricCard({
  title,
  value,
  detail,
  accent,
}: DashboardMetricCardProps) {
  return (
    <article
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "22px",
        borderRadius: "24px",
        background: "rgba(16, 16, 16, 0.96)",
        border: "1px solid rgba(199, 173, 144, 0.14)",
        boxShadow: "0 24px 48px rgba(0, 0, 0, 0.28)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "0 auto auto 0",
          width: "120px",
          height: "120px",
          background: accent,
          filter: "blur(48px)",
          opacity: 0.2,
          transform: "translate(-25%, -25%)",
        }}
      />
      <p style={{ margin: "0 0 12px", color: "var(--muted-stone)", fontSize: "13px" }}>
        {title}
      </p>
      <h2
        style={{
          margin: 0,
          fontSize: "32px",
          lineHeight: 1.05,
          fontWeight: 800,
          color: "var(--off-white)",
        }}
      >
        {value}
      </h2>
      <p
        style={{
          margin: "14px 0 0",
          color: "var(--off-white-soft)",
          fontSize: "14px",
          lineHeight: 1.6,
        }}
      >
        {detail}
      </p>
    </article>
  );
}
