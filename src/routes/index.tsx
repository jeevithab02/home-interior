import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Sparkles,
  Upload,
  Wand2,
  Palette,
  Sofa,
  Lightbulb,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

const rooms = [
  "Bedroom",
  "Living Room",
  "Kitchen",
  "Bathroom",
  "Office",
  "Dining Room",
  "Study Room",
];

const features = [
  {
    icon: Wand2,
    title: "Smart room analysis",
    desc: "A vision model identifies the room and its context in seconds.",
  },
  {
    icon: Palette,
    title: "Curated palettes",
    desc: "Get color palettes that match your style with hex codes ready to go.",
  },
  {
    icon: Sofa,
    title: "Furniture ideas",
    desc: "Tailored furniture picks that fit the room's function and flow.",
  },
  {
    icon: Lightbulb,
    title: "Lighting plans",
    desc: "Ambient, task, and accent lighting recommendations for every space.",
  },
];

const steps = [
  { n: "01", title: "Upload a photo", desc: "Drag & drop any room photo up to 10 MB." },
  { n: "02", title: "Pick a style", desc: "Choose from 8 curated design directions." },
  { n: "03", title: "Get your plan", desc: "Receive a full design brief in seconds." },
];

function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-mesh">
        <div className="mx-auto max-w-7xl px-6 pt-20 pb-28 sm:pt-28 sm:pb-36 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-emerald" />
            AI-powered interior design
          </div>
          <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">
            AI Interior Designer
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Transform any room into your dream space using Artificial Intelligence.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-90"
            >
              <Upload className="h-4 w-4" />
              Upload Room
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-6 py-3 text-sm font-medium backdrop-blur transition hover:bg-surface"
            >
              Learn More
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Preview card */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="card-elevated overflow-hidden">
              <div className="grid gap-0 md:grid-cols-2">
                <div className="aspect-[4/3] bg-gradient-to-br from-emerald-soft to-accent" />
                <div className="p-8 text-left">
                  <div className="text-xs font-medium uppercase tracking-widest text-emerald">
                    Room analysis
                  </div>
                  <h3 className="mt-2 text-2xl font-semibold">Living Room · 94% match</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Style: Scandinavian. Warm woods, oat linens, matte black hardware.
                  </p>
                  <div className="mt-5 flex gap-2">
                    {["#F5F5F5", "#D6CFC7", "#A89F91", "#3E4A3D"].map((c) => (
                      <span
                        key={c}
                        className="h-7 w-7 rounded-full ring-1 ring-border"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight">Everything you need to design</h2>
          <p className="mt-3 text-muted-foreground">
            A complete design brief generated from a single photo.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="card-elevated p-6 transition hover:-translate-y-0.5 hover:shadow-glow">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-soft text-emerald">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border/60 bg-surface-elev">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-bold tracking-tight">How it works</h2>
            <p className="mt-3 text-muted-foreground">Three steps to a full design plan.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="card-elevated p-8">
                <div className="text-sm font-semibold text-emerald">{s.n}</div>
                <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rooms */}
      <section id="rooms" className="mx-auto max-w-7xl px-6 py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-bold tracking-tight">Supported room types</h2>
            <p className="mt-3 text-muted-foreground">
              The classifier recognizes seven common indoor spaces.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald" />
            Privacy-first — images are analyzed and not stored.
          </div>
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          {rooms.map((r) => (
            <span
              key={r}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground shadow-soft"
            >
              {r}
            </span>
          ))}
        </div>

        <div className="mt-16 rounded-3xl bg-primary p-10 text-primary-foreground sm:p-14">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-3xl font-semibold tracking-tight">Ready to redesign?</h3>
              <p className="mt-2 max-w-xl text-primary-foreground/70">
                Upload a photo and get a professional design plan in under 30 seconds.
              </p>
            </div>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-full bg-emerald px-6 py-3 text-sm font-medium text-primary shadow-glow transition hover:opacity-90"
            >
              Start now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
