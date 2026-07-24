export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-surface-elev">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} AI Interior Designer. Crafted with care.</p>
        <p className="flex items-center gap-1">
          Powered by
          <span className="font-medium text-foreground">AI vision</span>
        </p>
      </div>
    </footer>
  );
}
