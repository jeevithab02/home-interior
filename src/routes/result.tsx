import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Sparkles,
  Palette,
  Lightbulb,
  Sofa,
  ListChecks,
  Copy,
  Check,
  Download,
  Loader2,
  ImageIcon,
  RefreshCw,
} from "lucide-react";
import { loadCurrent, type HistoryEntry } from "@/lib/history";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { ScoreRing } from "@/components/ScoreRing";
import { exportDesignPdf } from "@/lib/pdf-report";
import type { Recommendation } from "@/lib/designer.functions";

export const Route = createFileRoute("/result")({
  head: () => ({
    meta: [
      { title: "Your design report — AI Interior Designer" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResultPage,
});

const CATEGORY_STYLES: Record<Recommendation["category"], string> = {
  Color: "bg-rose-100 text-rose-700",
  Furniture: "bg-amber-100 text-amber-700",
  Lighting: "bg-yellow-100 text-yellow-700",
  Decor: "bg-violet-100 text-violet-700",
  Layout: "bg-sky-100 text-sky-700",
};

const IMPACT_STYLES = {
  High: "bg-emerald text-white",
  Medium: "bg-emerald-soft text-emerald",
  Low: "bg-muted text-muted-foreground",
} as const;

const CONDITION_STYLES = {
  Keep: "bg-emerald-soft text-emerald",
  Add: "bg-sky-100 text-sky-700",
  Replace: "bg-amber-100 text-amber-700",
  Remove: "bg-rose-100 text-rose-700",
} as const;

function ResultPage() {
  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const [ready, setReady] = useState(false);
  const [redesignError, setRedesignError] = useState<string | null>(null);
  const [activeVariation, setActiveVariation] = useState(0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setEntry(loadCurrent());
    setReady(true);
    const onReady = () => setEntry(loadCurrent());
    const onFailed = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setRedesignError(detail || "Redesign failed");
    };
    window.addEventListener("aid:redesigns-ready", onReady);
    window.addEventListener("aid:redesigns-failed", onFailed);
    // Poll every 2s in case events were missed (e.g. navigation across pages)
    const poll = setInterval(() => {
      const c = loadCurrent();
      if (c?.variations && c.variations.length > 0) {
        setEntry(c);
      }
    }, 2000);
    return () => {
      window.removeEventListener("aid:redesigns-ready", onReady);
      window.removeEventListener("aid:redesigns-failed", onFailed);
      clearInterval(poll);
    };
  }, []);

  if (!ready) return null;

  if (!entry) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold">No design plan yet</h1>
        <p className="mt-2 text-muted-foreground">
          Upload a room to generate your first plan.
        </p>
        <Link
          to="/upload"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Upload a room
        </Link>
      </div>
    );
  }

  const { preview, result, variations } = entry;
  const confidencePct = Math.round(result.confidence * 100);
  const activeAfter = variations?.[activeVariation];
  const hasRedesign = variations && variations.length > 0;

  const onExport = async () => {
    setExporting(true);
    try {
      await exportDesignPdf(entry);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-mesh min-h-full">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Design another room
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-soft px-3 py-1 text-xs font-medium text-emerald">
              <Sparkles className="h-3.5 w-3.5" />
              {result.style}
            </span>
            <button
              onClick={onExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export PDF
            </button>
          </div>
        </div>

        {/* Hero */}
        <section className="mt-6 grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            {hasRedesign && activeAfter ? (
              <BeforeAfterSlider before={preview} after={activeAfter} />
            ) : (
              <div className="card-elevated relative overflow-hidden">
                <img src={preview} alt="Uploaded room" className="w-full object-cover" />
                {!redesignError && (
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-slate-ink/85 to-transparent px-4 py-6 text-sm font-medium text-white">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Rendering photorealistic redesigns…
                  </div>
                )}
                {redesignError && (
                  <div className="absolute inset-x-0 bottom-0 bg-rose-600/90 px-4 py-3 text-center text-xs font-medium text-white">
                    Redesign generation failed: {redesignError}
                  </div>
                )}
              </div>
            )}

            {/* Variation gallery */}
            {variations && variations.length > 1 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {variations.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveVariation(i)}
                    className={`relative overflow-hidden rounded-xl border-2 transition ${
                      activeVariation === i
                        ? "border-emerald shadow-glow"
                        : "border-border hover:border-emerald/50"
                    }`}
                  >
                    <img src={v} alt={`Variation ${i + 1}`} className="w-full" />
                    <span className="absolute left-2 top-2 rounded-full bg-slate-ink/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white">
                      V{i + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="card-elevated p-6">
              <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Room type
              </div>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                {result.room_type}
              </h1>
              <div className="mt-4 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Classification confidence</span>
                  <span className="font-semibold">{confidencePct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald transition-all"
                    style={{ width: `${confidencePct}%` }}
                  />
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
                <Stat label="Brightness" value={result.analysis.brightness} />
                <Stat label="Clutter" value={result.analysis.clutter} />
                <Stat label="Size" value={result.analysis.estimated_size} />
              </dl>
            </div>

            {/* Overall score */}
            <div className="card-elevated p-6 text-center">
              <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Design score
              </div>
              <div className="mt-2">
                <ScoreRing
                  value={result.design_score.overall}
                  label="Overall"
                  size={140}
                />
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2">
                <MiniScore label="Style" value={result.design_score.style_match} />
                <MiniScore label="Harmony" value={result.design_score.harmony} />
                <MiniScore label="Function" value={result.design_score.functionality} />
                <MiniScore label="Light" value={result.design_score.lighting} />
              </div>
            </div>
          </div>
        </section>

        {/* Recommendations */}
        <section className="mt-10">
          <Header
            icon={<ListChecks className="h-5 w-5" />}
            title="Intelligent recommendations"
            subtitle={`${result.recommendations.length} improvements to reach ${result.style} style`}
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {result.recommendations.map((r, i) => (
              <div key={i} className="card-elevated p-5">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest ${CATEGORY_STYLES[r.category]}`}
                  >
                    {r.category}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest ${IMPACT_STYLES[r.impact]}`}
                  >
                    {r.impact} impact
                  </span>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-rose-600">
                      Current issue
                    </div>
                    <p className="mt-1 text-foreground/80">{r.issue}</p>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-emerald">
                      Expected improvement
                    </div>
                    <p className="mt-1 text-foreground/90">{r.suggestion}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Palette + Detected colors + Lighting */}
        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="card-elevated p-6 lg:col-span-2">
            <Header
              icon={<Palette className="h-5 w-5" />}
              title={`${result.style} palette`}
              subtitle="Curated for your redesign"
            />
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {result.color_palette.map((c) => (
                <Swatch key={c} hex={c} />
              ))}
            </div>
            <div className="mt-6 border-t border-border pt-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Dominant colors currently in your room
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.analysis.dominant_colors.map((c) => (
                  <span
                    key={c}
                    className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-mono"
                  >
                    <span
                      className="h-4 w-4 rounded-full ring-1 ring-border"
                      style={{ backgroundColor: c }}
                    />
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="card-elevated p-6">
            <Header
              icon={<Lightbulb className="h-5 w-5" />}
              title="Lighting plan"
            />
            <p className="mt-5 text-base leading-relaxed text-foreground/90">
              {result.lighting}
            </p>
          </div>
        </section>

        {/* Furniture */}
        <section className="mt-10">
          <Header
            icon={<Sofa className="h-5 w-5" />}
            title="Furniture plan"
            subtitle="Detected pieces and additions"
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.furniture.map((f, i) => (
              <div key={i} className="card-elevated flex items-start gap-3 p-4">
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest ${CONDITION_STYLES[f.condition]}`}
                >
                  {f.condition}
                </span>
                <div className="min-w-0">
                  <div className="font-semibold">{f.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{f.note}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium transition hover:bg-surface-elev"
          >
            <RefreshCw className="h-4 w-4" />
            Design another room
          </Link>
          <Link
            to="/history"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <ImageIcon className="h-4 w-4" />
            View history
          </Link>
        </div>
      </div>
    </div>
  );
}

function Header({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-soft text-emerald">
        {icon}
      </span>
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-elev p-2.5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}

function MiniScore({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function Swatch({ hex }: { hex: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  };
  return (
    <button
      onClick={copy}
      className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-2 pr-3 text-left transition hover:shadow-soft"
    >
      <span
        className="h-10 w-10 shrink-0 rounded-lg ring-1 ring-border"
        style={{ backgroundColor: hex }}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-xs uppercase tracking-widest text-muted-foreground">
          Hex
        </span>
        <span className="block truncate font-mono text-sm font-medium">{hex}</span>
      </span>
      <span className="text-muted-foreground opacity-0 transition group-hover:opacity-100">
        {copied ? (
          <Check className="h-4 w-4 text-emerald" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </span>
    </button>
  );
}
