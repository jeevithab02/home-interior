import { useCallback, useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";

export function BeforeAfterSlider({
  before,
  after,
  className = "",
}: {
  before: string;
  after: string;
  className?: string;
}) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const update = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPos(pct);
  }, []);

  return (
    <div
      ref={ref}
      className={`relative select-none overflow-hidden rounded-3xl border border-border bg-slate-ink ${className}`}
      onMouseDown={(e) => {
        dragging.current = true;
        update(e.clientX);
      }}
      onMouseMove={(e) => dragging.current && update(e.clientX)}
      onMouseUp={() => (dragging.current = false)}
      onMouseLeave={() => (dragging.current = false)}
      onTouchStart={(e) => {
        dragging.current = true;
        update(e.touches[0].clientX);
      }}
      onTouchMove={(e) => dragging.current && update(e.touches[0].clientX)}
      onTouchEnd={() => (dragging.current = false)}
    >
      <img
        src={after}
        alt="After redesign"
        className="block w-full select-none"
        draggable={false}
      />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${pos}%` }}
      >
        <img
          src={before}
          alt="Before"
          className="block h-full w-auto max-w-none select-none object-cover"
          style={{ width: ref.current?.clientWidth ?? "auto" }}
          draggable={false}
        />
      </div>
      {/* Labels */}
      <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-slate-ink/80 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white">
        Before
      </div>
      <div className="pointer-events-none absolute right-4 top-4 rounded-full bg-emerald px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white">
        After
      </div>
      {/* Handle */}
      <div
        className="pointer-events-none absolute inset-y-0 flex items-center"
        style={{ left: `calc(${pos}% - 1px)` }}
      >
        <div className="h-full w-0.5 bg-white shadow-lg" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white text-slate-ink shadow-xl">
          <MoveHorizontal className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
