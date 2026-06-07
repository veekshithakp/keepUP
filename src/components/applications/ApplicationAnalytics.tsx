import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui";
import { DashboardPanel } from "../dashboard";
import type { JobApplicationAnalytics } from "../../types";

interface ApplicationAnalyticsProps {
  analytics: JobApplicationAnalytics;
}

const axisStyle = {
  fontSize: 12,
  fill: "#b2aaa0",
};

const momentumChartConfig = {
  applications: {
    label: "Applications",
    color: "#f7f3eb",
  },
  interviews: {
    label: "Interviews",
    color: "#d9cebf",
  },
  offers: {
    label: "Offers",
    color: "#8f877d",
  },
} satisfies ChartConfig;

const pipelineChartConfig = {
  count: {
    label: "Applications",
    color: "#e0cfbb",
  },
} satisfies ChartConfig;

function DottedBackgroundPattern() {
  return (
    <>
      {[
        ["applications", "#f8f8f8"],
        ["interviews", "#d9cebf"],
        ["offers", "#8f877d"],
      ].map(([key, color]) => (
        <pattern
          key={key}
          id={`dotted-background-pattern-${key}`}
          x="0"
          y="0"
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="5" cy="5" r="1.5" fill={color} opacity={0.45} />
        </pattern>
      ))}
    </>
  );
}

export function ApplicationAnalytics({
  analytics,
}: ApplicationAnalyticsProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "18px",
        marginBottom: "18px",
      }}
    >
      <DashboardPanel
        title="Application Momentum"
        subtitle="Realtime Firestore updates chart your recent applications, interview-stage entries, and offers across the last 7 tracked days."
      >
        <ChartContainer
          config={momentumChartConfig}
          className="h-[320px] w-full text-neutral-400"
        >
          <AreaChart accessibilityLayer data={analytics.weeklyTrend}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={axisStyle}
            />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(value) => `${value}`}
                />
              }
            />
            <defs>
              <DottedBackgroundPattern />
            </defs>
            <Area
              dataKey="offers"
              type="natural"
              fill="url(#dotted-background-pattern-offers)"
              fillOpacity={0.3}
              stroke="var(--color-offers)"
              stackId="a"
              strokeWidth={1}
            />
            <Area
              dataKey="interviews"
              type="natural"
              fill="url(#dotted-background-pattern-interviews)"
              fillOpacity={0.3}
              stroke="var(--color-interviews)"
              stackId="a"
              strokeWidth={1}
            />
            <Area
              dataKey="applications"
              type="natural"
              fill="url(#dotted-background-pattern-applications)"
              fillOpacity={0.35}
              stroke="var(--color-applications)"
              stackId="a"
              strokeWidth={1}
            />
          </AreaChart>
        </ChartContainer>
      </DashboardPanel>

      <DashboardPanel
        title="Pipeline Breakdown"
        subtitle="Track hiring stages and outcome quality from your current Firestore application set."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "18px",
          alignItems: "center",
        }}
      >
        <ChartContainer
          config={pipelineChartConfig}
          className="h-[300px] w-full text-neutral-400"
        >
          <BarChart accessibilityLayer data={analytics.stageBreakdown} barGap={10}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="status"
              tick={axisStyle}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" hideLabel />}
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[10, 10, 0, 0]}
              name="Applications"
            />
          </BarChart>
        </ChartContainer>

        <ChartContainer
          config={{
            Offers: { label: "Offers", color: "#f7f3eb" },
            Rejected: { label: "Rejected", color: "#8f877d" },
            Active: { label: "Active", color: "#d9cebf" },
          }}
          className="h-[300px] w-full text-neutral-400"
        >
          <PieChart>
            <Pie
              data={analytics.outcomeBreakdown}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={90}
              paddingAngle={4}
            >
              {analytics.outcomeBreakdown.map((entry) => (
                <Cell key={entry.label} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" hideLabel />}
            />
          </PieChart>
        </ChartContainer>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: "12px",
            marginTop: "10px",
          }}
        >
          {analytics.outcomeBreakdown.map((item) => (
            <div
              key={item.label}
              style={{
                padding: "12px 14px",
                borderRadius: "14px",
                background: "rgba(8, 8, 8, 0.96)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "999px",
                  background: item.fill,
                  marginBottom: "10px",
                }}
              />
              <p style={{ margin: 0, color: "var(--muted-stone)", fontSize: "12px" }}>
                {item.label}
              </p>
              <p
                style={{
                  margin: "6px 0 0",
                  color: "var(--off-white)",
                  fontWeight: 800,
                  fontSize: "22px",
                }}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </DashboardPanel>
    </div>
  );
}
