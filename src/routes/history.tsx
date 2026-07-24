import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2, Eye, ImageIcon } from "lucide-react";
import { loadHistory, removeEntry, saveCurrent, type HistoryEntry } from "@/lib/history";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Design history — AI Interior Designer" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEntries(loadHistory());
    setReady(true);
  }, []);

  if (!ready) return null;

  const open = (e: HistoryEntry) => {
    saveCurrent(e);
    navigate({ to: "/result" });
  };

  const remove = (id: string) => {
    removeEntry(id);
    setEntries(loadHistory());
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Your design history</h1>
          <p className="mt-2 text-muted-foreground">
            Stored locally on this device. Up to 12 recent designs.
          </p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          New design
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="mt-16 grid place-items-center">
          <div className="card-elevated max-w-md p-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-soft text-emerald">
              <ImageIcon className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-semibold">No designs yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload a room to see it appear here.
            </p>
            <Link
              to="/upload"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Upload a room
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((e) => (
            <article
              key={e.id}
              className="card-elevated group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-glow"
            >
              <button
                onClick={() => open(e)}
                className="block w-full text-left"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-elev">
                  <img
                    src={e.variations?.[0] ?? e.preview}
                    alt={e.result.room_type}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-emerald px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white">
                    {e.result.style}
                  </span>
                  <span className="absolute right-3 top-3 rounded-full bg-slate-ink/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white">
                    {e.result.design_score.overall}/100
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{e.result.room_type}</h3>
                    <span className="text-xs text-muted-foreground">
                      {new Date(e.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {e.result.color_palette.slice(0, 5).map((c) => (
                      <span
                        key={c}
                        className="h-4 w-4 rounded-full ring-1 ring-border"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </button>
              <div className="flex border-t border-border">
                <button
                  onClick={() => open(e)}
                  className="flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-surface-elev hover:text-foreground"
                >
                  <Eye className="h-4 w-4" /> Open
                </button>
                <button
                  onClick={() => remove(e.id)}
                  className="flex items-center justify-center gap-2 border-l border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
