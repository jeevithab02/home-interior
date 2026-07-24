import { Link } from "@tanstack/react-router";
import { History, Sparkles } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass border-b border-border/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft transition group-hover:scale-105">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold tracking-tight">
              AI Interior Designer
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="/#features" className="hover:text-foreground transition">Features</a>
            <a href="/#how" className="hover:text-foreground transition">How it works</a>
            <Link to="/history" className="hover:text-foreground transition inline-flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" /> History
            </Link>
          </nav>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Upload Room
          </Link>
        </div>
      </div>
    </header>
  );
}
