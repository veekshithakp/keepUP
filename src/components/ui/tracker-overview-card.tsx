import * as React from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

type TrackerTone = "primary" | "secondary" | "tertiary" | "quaternary";

interface TrackerGraphSegment {
  tone: TrackerTone;
  duration: number;
  height: number;
  label: string;
}

interface TrackerMetric {
  label: string;
  value: string;
  detail: string;
}

interface TrackerLegendItem {
  label: string;
  value: string;
  tone: TrackerTone;
}

interface TrackerOverviewCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  metrics: [TrackerMetric, TrackerMetric, TrackerMetric];
  graphData: TrackerGraphSegment[];
  startLabel: string;
  endLabel: string;
  legend: TrackerLegendItem[];
  icons: {
    leading: React.ReactNode;
    start: React.ReactNode;
    end: React.ReactNode;
  };
}

const toneClasses: Record<TrackerTone, string> = {
  primary: "bg-white",
  secondary: "bg-neutral-300",
  tertiary: "bg-neutral-500",
  quaternary: "bg-neutral-700",
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const barVariants: Variants = {
  hidden: { scaleY: 0, opacity: 0 },
  visible: {
    scaleY: 1,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12,
    },
  },
};

const TrackerOverviewCard = React.forwardRef<
  HTMLDivElement,
  TrackerOverviewCardProps
>(
  (
    {
      className,
      title,
      metrics,
      graphData,
      startLabel,
      endLabel,
      legend,
      icons,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "w-full rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,10,10,0.92),rgba(3,3,3,0.98))] p-6 text-white shadow-[0_30px_80px_rgba(0,0,0,0.35)]",
          className,
        )}
        {...props}
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-neutral-200">
            {icons.leading}
          </div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <p className="text-2xl font-bold">{metric.value}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                {metric.label}
              </p>
              <p className="mt-1 text-xs leading-5 text-neutral-400">
                {metric.detail}
              </p>
            </div>
          ))}
        </div>

        <div
          className="rounded-2xl border border-white/8 bg-white/[0.04] p-4"
          aria-label={`${title} graph`}
          role="figure"
        >
          <motion.div
            className="flex h-24 w-full items-end justify-center gap-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {graphData.map((segment, index) => (
              <motion.div
                key={`${segment.label}-${index}`}
                className={cn("rounded-full", toneClasses[segment.tone])}
                style={{
                  flexGrow: segment.duration,
                  height: `${segment.height}%`,
                  transformOrigin: "bottom",
                }}
                variants={barVariants}
                aria-label={segment.label}
              />
            ))}
          </motion.div>

          <div className="mt-3 flex justify-between text-xs text-neutral-500">
            <div className="flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center">
                {icons.start}
              </span>
              <span>{startLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>{endLabel}</span>
              <span className="flex h-4 w-4 items-center justify-center">
                {icons.end}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
          {legend.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className={cn("h-2.5 w-2.5 rounded-full", toneClasses[item.tone])}
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-neutral-500">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

TrackerOverviewCard.displayName = "TrackerOverviewCard";

export { TrackerOverviewCard };
