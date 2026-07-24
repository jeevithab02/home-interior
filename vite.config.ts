// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Lovable's shared config defaults Nitro's build target to Cloudflare. That output
  // doesn't run as a Vercel Function and doesn't read process.env the same way, which is
  // why GEMINI_API_KEY showed up as missing even after adding it in Vercel's dashboard.
  // Forcing the "vercel" preset makes the build emit a real Vercel Function that reads
  // process.env normally.
  vite: {
    plugins: [nitro({ preset: "vercel" })],
  },
});
