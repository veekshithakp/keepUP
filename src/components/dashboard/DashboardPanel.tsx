import type { ReactNode } from "react";

interface DashboardPanelProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function DashboardPanel({
  title,
  subtitle,
  children,
}: DashboardPanelProps) {
  return (
    <section
      style={{
        padding: "26px",
        borderRadius: "28px",
        background: "rgba(9, 9, 9, 0.98)",
        border: "1px solid rgba(199, 173, 144, 0.14)",
        boxShadow: "var(--panel-shadow)",
      }}
    >
      <div style={{ marginBottom: "18px" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "24px",
            lineHeight: 1.15,
            fontWeight: 800,
            color: "var(--off-white)",
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: "10px 0 0",
            color: "var(--muted-stone)",
            fontSize: "14px",
            lineHeight: 1.7,
          }}
        >
          {subtitle}
        </p>
      </div>
      {children}
    </section>
  );
}
