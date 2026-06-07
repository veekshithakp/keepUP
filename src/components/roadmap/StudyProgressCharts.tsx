import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import type { StudySubjectProgress, StudyWeeklyProgressPoint } from "../../types";

interface StudyProgressChartsProps {
  weeklySeries: StudyWeeklyProgressPoint[];
  subjectProgress: StudySubjectProgress[];
}

const axisStyle = {
  fontSize: 12,
  fill: "#b2aaa0",
};

export function StudyProgressCharts({
  weeklySeries,
  subjectProgress,
}: StudyProgressChartsProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "18px",
      }}
    >
      <div
        style={{
          padding: "24px",
          borderRadius: "24px",
          background: "rgba(11, 11, 11, 0.98)",
          border: "1px solid rgba(199, 173, 144, 0.14)",
          boxShadow: "0 28px 60px rgba(0, 0, 0, 0.28)",
        }}
      >
        <h2 style={{ margin: "0 0 10px", fontSize: "24px", color: "var(--off-white)" }}>Weekly Progress</h2>
        <p style={{ margin: "0 0 18px", color: "var(--muted-stone)", lineHeight: 1.7 }}>
          Realtime study hours and completed topics over the last 7 tracked days.
        </p>
        <div style={{ width: "100%", height: "320px" }}>
          <ResponsiveContainer>
            <AreaChart data={weeklySeries}>
              <defs>
                <linearGradient id="weeklyHoursFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c7ad90" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#c7ad90" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(247, 243, 235, 0.08)" vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: "14px",
                  border: "1px solid rgba(199, 173, 144, 0.16)",
                  background: "rgba(12, 12, 12, 0.98)",
                  color: "#f7f3eb",
                }}
              />
              <Area
                type="monotone"
                dataKey="actualHours"
                stroke="#c7ad90"
                fill="url(#weeklyHoursFill)"
                strokeWidth={3}
                name="Actual Hours"
              />
              <Area
                type="monotone"
                dataKey="completedTopics"
                stroke="#f7f3eb"
                fill="transparent"
                strokeWidth={3}
                name="Completed Topics"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        style={{
          padding: "24px",
          borderRadius: "24px",
          background: "rgba(11, 11, 11, 0.98)",
          border: "1px solid rgba(199, 173, 144, 0.14)",
          boxShadow: "0 28px 60px rgba(0, 0, 0, 0.28)",
        }}
      >
        <h2 style={{ margin: "0 0 10px", fontSize: "24px", color: "var(--off-white)" }}>Subject Progress</h2>
        <p style={{ margin: "0 0 18px", color: "var(--muted-stone)", lineHeight: 1.7 }}>
          Completion percentage across your active subjects.
        </p>
        <div style={{ width: "100%", height: "320px" }}>
          <ResponsiveContainer>
            <BarChart
              data={subjectProgress.map((item) => ({
                name: item.subjectName,
                completionPercentage: item.completionPercentage,
              }))}
              layout="vertical"
              margin={{ left: 12 }}
            >
              <CartesianGrid stroke="rgba(247, 243, 235, 0.08)" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
                width={96}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "14px",
                  border: "1px solid rgba(199, 173, 144, 0.16)",
                  background: "rgba(12, 12, 12, 0.98)",
                  color: "#f7f3eb",
                }}
              />
              <Bar
                dataKey="completionPercentage"
                fill="#e0cfbb"
                radius={[0, 10, 10, 0]}
                name="Completion %"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
