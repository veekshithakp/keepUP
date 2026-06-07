import { motion, type Variants } from "framer-motion";
import { CheckCircle, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { Card, CardContent } from "./card";

export interface TimelineItem {
  title: string;
  description: string;
  date?: string;
  image?: string;
  status?: "completed" | "current" | "upcoming";
  category?: string;
  bullets?: string[];
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.98 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      delay: index * 0.08,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const getStatusConfig = (status: TimelineItem["status"]) => {
  const configs = {
    completed: {
      progressColor: "bg-white",
      borderColor: "border-white/14",
      badgeBg: "bg-white text-black border-white/20",
      badgeLabel: "Completed",
    },
    current: {
      progressColor: "bg-neutral-300",
      borderColor: "border-white/10",
      badgeBg: "bg-neutral-200 text-black border-white/16",
      badgeLabel: "Current",
    },
    upcoming: {
      progressColor: "bg-neutral-600",
      borderColor: "border-white/8",
      badgeBg: "bg-neutral-900 text-neutral-200 border-white/8",
      badgeLabel: "Upcoming",
    },
  };

  return configs[status || "upcoming"];
};

const getStatusIcon = (status: TimelineItem["status"]) => {
  switch (status) {
    case "completed":
      return CheckCircle;
    case "current":
      return Clock;
    default:
      return Circle;
  }
};

export function Timeline({ items, className }: TimelineProps) {
  if (!items.length) {
    return (
      <div className={cn("w-full py-4", className)}>
        <p className="text-center text-sm text-neutral-500">
          No timeline items to display.
        </p>
      </div>
    );
  }

  return (
    <section
      className={cn("w-full py-2", className)}
      role="list"
      aria-label="Resume analysis timeline"
    >
      <div className="relative">
        <div
          className="absolute left-5 top-0 bottom-0 w-px bg-white/8 sm:left-7"
          aria-hidden="true"
        />

        <motion.div
          className="absolute left-5 top-0 w-px origin-top bg-white sm:left-7"
          initial={{ scaleY: 0 }}
          whileInView={{
            scaleY: 1,
            transition: {
              duration: 1,
              ease: "easeOut",
              delay: 0.12,
            },
          }}
          viewport={{ once: true }}
          aria-hidden="true"
        />

        <div className="relative space-y-6 sm:space-y-8">
          {items.map((item, index) => {
            const config = getStatusConfig(item.status);
            const IconComponent = getStatusIcon(item.status);
            const progressValue =
              item.status === "completed"
                ? 100
                : item.status === "current"
                  ? 68
                  : 28;

            return (
              <motion.div
                key={`${item.title}-${index}`}
                className="relative"
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-20px" }}
                variants={revealVariants}
                role="listitem"
              >
                <div className="flex items-start gap-4 sm:gap-6">
                  <div className="relative flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black shadow-[0_12px_30px_rgba(0,0,0,0.35)] sm:h-14 sm:w-14">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full rounded-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <IconComponent
                          className="h-4 w-4 text-neutral-300 sm:h-5 sm:w-5"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </div>

                  <motion.div
                    className="min-w-0 flex-1"
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Card
                      className={cn(
                        "overflow-hidden transition-all duration-300 hover:border-white/16 hover:shadow-[0_26px_70px_rgba(0,0,0,0.45)]",
                        config.borderColor,
                      )}
                    >
                      <CardContent className="p-5 sm:p-6">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="mb-1 text-lg font-semibold tracking-tight text-white sm:text-xl">
                              {item.title}
                            </h3>

                            {(item.category || item.date) && (
                              <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                                {item.category ? (
                                  <span className="font-medium text-neutral-400">
                                    {item.category}
                                  </span>
                                ) : null}
                                {item.category && item.date ? (
                                  <span
                                    className="h-1 w-1 rounded-full bg-neutral-600"
                                    aria-hidden="true"
                                  />
                                ) : null}
                                {item.date ? (
                                  <time dateTime={item.date}>{item.date}</time>
                                ) : null}
                              </div>
                            )}
                          </div>

                          <Badge className={config.badgeBg}>{config.badgeLabel}</Badge>
                        </div>

                        <p className="mb-4 text-sm leading-7 text-neutral-300 sm:text-base">
                          {item.description}
                        </p>

                        {item.bullets?.length ? (
                          <div className="mb-5 grid gap-3">
                            {item.bullets.map((bullet) => (
                              <div
                                key={`${item.title}-${bullet}`}
                                className="rounded-2xl border border-white/6 bg-neutral-950 px-4 py-3 text-sm leading-7 text-neutral-200"
                              >
                                {bullet}
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div
                          className="h-1.5 overflow-hidden rounded-full bg-white/8"
                          role="progressbar"
                          aria-valuenow={progressValue}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Progress for ${item.title}`}
                        >
                          <motion.div
                            className={cn("h-full rounded-full", config.progressColor)}
                            initial={{ width: 0 }}
                            whileInView={{
                              width: `${progressValue}%`,
                              transition: {
                                duration: 0.9,
                                delay: index * 0.14 + 0.4,
                                ease: "easeOut",
                              },
                            }}
                            viewport={{ once: true }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
