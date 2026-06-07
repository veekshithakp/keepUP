interface StudyTrackerMetricProps {
  label: string;
  value: string;
  detail: string;
}

export function StudyTrackerMetric({
  label,
  value,
  detail,
}: StudyTrackerMetricProps) {
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
      <p style={{ margin: "0 0 10px", color: "var(--muted-stone)", fontSize: "13px" }}>
        {label}
      </p>
      <h2
        style={{
          margin: 0,
          fontSize: "30px",
          lineHeight: 1.05,
          color: "var(--off-white)",
        }}
      >
        {value}
      </h2>
      <p style={{ margin: "12px 0 0", color: "var(--off-white-soft)", lineHeight: 1.6 }}>
        {detail}
      </p>
    </div>
  );
}
