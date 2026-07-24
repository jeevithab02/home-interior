import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

export function LoadingStages({
  active,
  stages,
}: {
  active: boolean;
  stages: string[];
}) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    setStep(0);
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, stages.length - 1));
    }, 2200);
    return () => clearInterval(id);
  }, [active, stages.length]);

  if (!active) return null;
  return (
    <div className="card-elevated mx-auto max-w-md p-6">
      <ul className="space-y-3">
        {stages.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li
              key={label}
              className={`flex items-center gap-3 rounded-xl p-3 transition ${
                current ? "bg-emerald-soft" : ""
              }`}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-full ${
                  done
                    ? "bg-emerald text-white"
                    : current
                      ? "bg-white text-emerald ring-2 ring-emerald"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : current ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="text-xs">{i + 1}</span>
                )}
              </span>
              <span
                className={`text-sm font-medium ${
                  current
                    ? "text-foreground"
                    : done
                      ? "text-muted-foreground line-through"
                      : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
