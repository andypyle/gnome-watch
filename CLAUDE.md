# Gnome Watch

Electron menu-bar app that shows Claude Code sessions as characters and lets you answer permission prompts and AskUserQuestion from a side drawer. One user, one Mac, a handful of sessions. See README.md for features.

## Commands

```bash
npm run build          # tsc -> out/ (everything else runs this first)
npm test               # build + end-to-end test (out/test/core.test.js)
npm start              # build + run from source
npm run install-hooks  # build + write hooks into ~/.claude/settings.json (backs it up first)
npm run install:mac    # package and install to /Applications
```

`npx tsc --noEmit` is the type check. There is no linter or bundler.

## Layout and flow

```
Claude Code → out/hook/gnome-hook.js → HTTP 127.0.0.1 + token → src/server.ts → src/core.ts → IPC → renderer/
```

- `src/core.ts`: all state and hook handling. No Electron imports, so tests drive it with plain Node. Held prompts keep the HTTP response open until `resolve`/`release`.
- `src/server.ts`: writes port and token to `~/.gnome-watch/server.json`, which is how the hook finds the app.
- `src/main.ts`: window, tray menu, prefs, IPC. `src/preload.ts` exposes `window.gnome`.
- `hook/gnome-hook.ts`: must **always exit 0** and return fast for non-blocking events. If the app is down it does nothing.
- `renderer/`: `index.html` and `style.css` live here. Compiled JS loads from `../out/renderer/`. Shared types are in `renderer/types.d.ts`.

## Gotchas

- **Renderer `.ts` files are classic `<script>`s, not modules.** No top-level `import`/`export` in `renderer/*.ts`, or tsc emits `exports` and the page breaks. Use `import('./types').X` for types and `window.*` to share values. This relies on `"moduleDetection": "auto"` in tsconfig, because TS 7 defaults to treating every file as a module.
- **Packs** (`renderer/packs/*.ts`) are IIFEs (functions that run once when the script loads). They register on `window.PACKS` and use `window.packTools` (`toolSVG`, `toolAngleFor`). A new pack needs a `<script>` tag in `index.html` and an entry in `PACKS` in `src/main.ts`.
- **Paths**: use `app.getAppPath()` for repo-root files (HTML, assets). It works from source and in the packaged app. `__dirname` points into `out/`.
- **The hook path is baked into the user's `~/.claude/settings.json`.** Moving or renaming `hook/gnome-hook.ts` means running `npm run install-hooks` again and restarting open Claude Code sessions.
- **Tests must never touch the real home dir.** `test/core.test.ts` sets `HOME` to a temp folder and loads `src/` with `require()` after that, because `import`s are hoisted and `src/server.ts` reads the home dir at load time. Keep it that way.
- **Don't launch the dev app while the installed app is running.** It would take another port, overwrite `server.json` (stealing the hooks), then delete it on quit.
- **Electron from a VS Code terminal**: `ELECTRON_RUN_AS_NODE=1` is set there, so prefix with `env -u ELECTRON_RUN_AS_NODE` or Electron runs as plain Node.
- The tracked process ID (`_claude_pid`) is used to sweep dead sessions. The hook sends `null` when unsure. A wrong process ID removes a live agent.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. When the answer is under a Markdown heading, `graphify section "<heading>"` prints that section's text, so the .md need not be opened. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
