import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
}

function Hero({ onPrimaryAction, onSecondaryAction }: HeroProps) {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["smarter", "focused", "consistent", "career-ready", "confident"],
    [],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setTitleNumber((currentTitle) =>
        currentTitle === titles.length - 1 ? 0 : currentTitle + 1,
      );
    }, 2200);

    return () => window.clearTimeout(timeoutId);
  }, [titleNumber, titles.length]);

  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-8 py-12 text-center lg:items-start lg:text-left">
        <div>
          <Button
            variant="secondary"
            size="sm"
            className="gap-3 rounded-full border border-white/20 bg-white/10 text-neutral-100"
            onClick={onSecondaryAction}
            type="button"
          >
            Built for student placements <Sparkles className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
            <span className="text-white">KeepUP makes your placement prep</span>
            <span className="relative flex w-full justify-center overflow-hidden py-2 lg:justify-start">
              <span className="sr-only">smarter</span>
              {titles.map((title, index) => (
                <motion.span
                  key={title}
                  className="absolute font-semibold text-white"
                  initial={{ opacity: 0, y: "-100%" }}
                  animate={
                    titleNumber === index
                      ? { y: 0, opacity: 1 }
                      : { y: titleNumber > index ? "-150%" : "150%", opacity: 0 }
                  }
                  transition={{ type: "spring", stiffness: 50 }}
                >
                  {title}
                </motion.span>
              ))}
            </span>
          </h1>

          <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Track study progress, roadmaps, applications, resume feedback, and AI
            coaching in one place. Sign in to continue your momentum without
            losing sight of what matters next.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            variant="outline"
            className="gap-3 rounded-full"
            onClick={onSecondaryAction}
            type="button"
          >
            Explore features <Sparkles className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            className="gap-3 rounded-full"
            onClick={onPrimaryAction}
            type="button"
          >
            Sign in now <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export { Hero };
