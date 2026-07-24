import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useRef, useState } from "react";
import {
  Upload as UploadIcon,
  ImageIcon,
  X,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { analyzeRoom, generateRedesigns } from "@/lib/designer.functions";
import { saveCurrent, updateCurrent } from "@/lib/history";
import { LoadingStages } from "@/components/LoadingStages";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload your room — AI Interior Designer" },
      {
        name: "description",
        content:
          "Upload a room photo, pick a style, and get an AI analysis with photorealistic redesigns.",
      },
    ],
  }),
  component: UploadPage,
});

const STYLES = [
  { name: "Modern", desc: "Clean lines, neutral base, bold accents" },
  { name: "Minimalist", desc: "Less is more, calm and functional" },
  { name: "Scandinavian", desc: "Light woods, warm neutrals, cozy" },
  { name: "Luxury", desc: "Rich materials, elegant, refined" },
  { name: "Industrial", desc: "Raw finishes, metal, exposed textures" },
  { name: "Bohemian", desc: "Layered textiles, plants, eclectic" },
  { name: "Japandi", desc: "Japanese calm meets Nordic warmth" },
  { name: "Contemporary", desc: "Current trends, balanced and fresh" },
] as const;

type StyleName = (typeof STYLES)[number]["name"];

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/jpg", "image/png"];

const STAGES = [
  "Scanning room geometry & lighting",
  "Detecting furniture & clutter",
  "Scoring current design",
  "Curating style-matched palette",
  "Generating photorealistic redesigns",
];

function UploadPage() {
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeRoom);
  const redesign = useServerFn(generateRedesigns);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [style, setStyle] = useState<StyleName | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = (f: File) => {
    setError(null);
    if (!ACCEPTED.includes(f.type)) {
      setError("Unsupported format. Please use JPG, JPEG or PNG.");
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("Image too large. Maximum size is 10 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFile(f);
      setPreview(reader.result as string);
    };
    reader.onerror = () => setError("Could not read this file.");
    reader.readAsDataURL(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) readFile(f);
  }, []);

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = async () => {
    if (!preview || !style) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyze({ data: { imageDataUrl: preview, style } });
      const entry = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        preview,
        result,
      };
      saveCurrent(entry);
      // Navigate immediately so the user sees results, then generate redesigns in the background
      navigate({ to: "/result" });
      // Kick off image generation — result page will pick up updates via storage
      redesign({
        data: {
          imageDataUrl: preview,
          prompt: result.redesign_prompt,
          style,
        },
      })
        .then(({ variations }) => {
          updateCurrent({ variations });
          window.dispatchEvent(new CustomEvent("aid:redesigns-ready"));
        })
        .catch((e) => {
          console.error("Redesign generation failed", e);
          window.dispatchEvent(
            new CustomEvent("aid:redesigns-failed", {
              detail: e instanceof Error ? e.message : "Redesign failed",
            }),
          );
        });
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Something went wrong. Please try again.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="bg-mesh min-h-full">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Upload your room
          </h1>
          <p className="mt-3 text-muted-foreground">
            JPG, JPEG or PNG · Maximum 10 MB
          </p>
        </div>

        {/* Dropzone */}
        <div className="mt-10">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`card-elevated relative flex min-h-64 cursor-pointer flex-col items-center justify-center gap-3 p-10 text-center transition ${
              dragging ? "ring-2 ring-emerald shadow-glow" : ""
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) readFile(f);
              }}
            />
            {preview ? (
              <div className="w-full">
                <div className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border">
                  <img src={preview} alt="Room preview" className="w-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      clearFile();
                    }}
                    className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft transition hover:opacity-90"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {file?.name}{" "}
                  {file && <span>· {(file.size / 1024 / 1024).toFixed(2)} MB</span>}
                </p>
              </div>
            ) : (
              <>
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-soft text-emerald">
                  <UploadIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Drag & drop your room photo</p>
                  <p className="mt-1 text-sm text-muted-foreground">or</p>
                </div>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  <ImageIcon className="h-4 w-4" />
                  Browse files
                </button>
              </>
            )}
          </label>
        </div>

        {/* Style picker */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold tracking-tight">Choose a design style</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick one — we'll tailor the whole plan to match.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {STYLES.map((s) => {
              const active = style === s.name;
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setStyle(s.name)}
                  className={`text-left rounded-2xl border p-4 transition ${
                    active
                      ? "border-emerald bg-emerald-soft shadow-glow"
                      : "border-border bg-surface hover:-translate-y-0.5 hover:shadow-soft"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{s.name}</span>
                    {active && (
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald text-primary-foreground">
                        <Sparkles className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Something went wrong</p>
              <p className="mt-0.5 text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="mt-10">
            <LoadingStages active stages={STAGES} />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Analyzing your room · usually takes 15–30 seconds
            </p>
          </div>
        ) : (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              disabled={!preview || !style}
              onClick={submit}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles className="h-4 w-4" />
              Generate design plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
