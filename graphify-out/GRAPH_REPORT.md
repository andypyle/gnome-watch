# Graph Report - gnome-watch  (2026-11-15)

## Corpus Check
- Corpus is ~17,455 words - fits in a single context window. You may not need a graph.

## Summary
- 292 nodes · 403 edges · 24 communities (18 shown, 6 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.85)
- Token cost: 262,612 input · 0 output

## Community Hubs (Navigation)
- Hook and Focus Detection
- Renderer App UI
- Core State Model
- Package Manifest
- README Features
- Renderer Shared Types
- Core Event Handling
- Hook Install Scripts
- Architecture Docs
- Prompts Screenshot
- TypeScript Config
- Drawer Screenshot
- Gnome Drawing
- Character Packs
- Cats Pack
- Bats Pack
- Bigfoot Pack
- Capybaras Pack
- Tray Icon
- Hook Path Gotcha
- Mac Install Script
- Electron Env Gotcha
- Model Label

## God Nodes (most connected - your core abstractions)
1. `createCore()` - 22 edges
2. `handleEvent()` - 11 edges
3. `compilerOptions` - 11 edges
4. `scripts` - 8 edges
5. `h()` - 7 edges
6. `updateRow()` - 7 edges
7. `renderTab()` - 6 edges
8. `questionCard()` - 6 edges
9. `render()` - 6 edges
10. `GnomeApi` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Privacy (127.0.0.1 + per-launch token)` --semantically_similar_to--> `server.json Port/Token Discovery`  [INFERRED] [semantically similar]
  README.md → CLAUDE.md
- `Renderer TS Files Are Classic Scripts` --rationale_for--> `Script Load Order (gnome.js, packs, app.js)`  [INFERRED]
  CLAUDE.md → renderer/index.html
- `#tab (minimized edge tab)` --implements--> `Drawer Slides Out When Leaving VS Code`  [INFERRED]
  renderer/index.html → README.md
- `#titlebar with collapse/minimize buttons` --implements--> `Drawer Slides Out When Leaving VS Code`  [INFERRED]
  renderer/index.html → README.md
- `#agents container` --implements--> `One Character Per Agent`  [INFERRED]
  renderer/index.html → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Hook Event Pipeline (hook, server discovery, held prompts, timeout)** — claude_hook_to_renderer_flow, claude_hook_always_exit_0, claude_server_json_discovery, claude_held_prompts, readme_prompt_timeout_handback [INFERRED 0.85]
- **Adding a Character Pack** — readme_character_packs, readme_pack_part_classes, claude_packs_iife, renderer_index_script_load_order [EXTRACTED 1.00]
- **Drawer UI Shell** — renderer_index_tab, renderer_index_panel, renderer_index_titlebar, renderer_index_agents [EXTRACTED 1.00]
- **All five packs share per-slot tools and accent colors** — docs_character_packs_gnomes_pack, docs_character_packs_capybaras_pack, docs_character_packs_bats_pack, docs_character_packs_cats_pack, docs_character_packs_bigfoot_pack, docs_character_packs_slot_tool_scheme [INFERRED 0.85]
- **Session card anatomy** — docs_drawer_session_card, docs_drawer_gnome_character, docs_drawer_session_states, docs_drawer_model_badge, docs_drawer_task_progress_bar, docs_drawer_subagent_rows [EXTRACTED 1.00]
- **Answering held prompts inline from the drawer** — docs_prompts_permission_card, docs_prompts_question_card, docs_prompts_use_vs_code, docs_prompts_allow_deny_buttons, docs_prompts_send_answer [INFERRED 0.85]

## Communities (24 total, 6 thin omitted)

### Community 0 - "Hook and Focus Detection"
Cohesion: 0.09
Nodes (25): claudePid(), CONFIG, run(), HookEvent, Done, FrontApp, watchFocus(), AGENTS_FILE (+17 more)

### Community 1 - "Renderer App UI"
Cohesion: 0.10
Nodes (32): AgentView, BUBBLE, Character, chime(), displayStatus(), els, h(), HelperItem (+24 more)

### Community 2 - "Core State Model"
Cohesion: 0.09
Nodes (23): Agent, CoreOptions, snapshot(), describeTool(), Helper, helperLabel(), modelFromTranscript(), Pending (+15 more)

### Community 3 - "Package Manifest"
Cohesion: 0.09
Nodes (21): description, devDependencies, electron@^45.3.2, @electron/packager@^20.3.0, typescript@^7.0.2, main, name, private (+13 more)

### Community 4 - "README Features"
Cohesion: 0.11
Nodes (20): _claude_pid Dead Session Sweep, Packs Are IIFEs Registering on window.PACKS, Agent Status States (busy, needs you, finished, napping), Character Packs, Drawer Slides Out When Leaving VS Code, events.log (~/.gnome-watch, ~2 MB cap), Front-App Focus Detection (focus.log), Menu-Bar Menu (+12 more)

### Community 5 - "Renderer Shared Types"
Cohesion: 0.10
Nodes (8): Character, GnomeApi, Pack, ResolveAction, State, Window, AgentView, Focus

### Community 6 - "Core Event Handling"
Cohesion: 0.24
Nodes (16): createCore(), agentFor(), drop(), finish(), handleEvent(), hasPending(), helperFor(), hold() (+8 more)

### Community 7 - "Hook Install Scripts"
Cohesion: 0.17
Nodes (12): EVENTS, HookEntry, hookPath, main(), MARKER, Settings, settingsDir, settingsFile (+4 more)

### Community 8 - "Architecture Docs"
Cohesion: 0.18
Nodes (8): Gnome Watch (CLAUDE.md), Held Prompts (open HTTP response until resolve/release), server.json Port/Token Discovery, Answer Permission Prompts and Questions Without Switching, Gnome Watch (README), How It Works (hook -> localhost HTTP -> app), npm run install:mac, 9.5 Minute Prompt Handback

### Community 9 - "Prompts Screenshot"
Cohesion: 0.18
Nodes (13): Agent Card (gnome, name, status, model badge), Allow / Deny Buttons, Answer Options with Free-text 'Something else', Gnome Character Avatar with Alert Badge, Model Badge (Sonnet / Opus), Header 'N need you' Count, Permission Prompt Card, AskUserQuestion Card (+5 more)

### Community 10 - "TypeScript Config"
Cohesion: 0.15
Nodes (12): compilerOptions, lib, module, moduleDetection, moduleResolution, outDir, rootDir, skipLibCheck (+4 more)

### Community 11 - "Drawer Screenshot"
Cohesion: 0.23
Nodes (12): Collapsed Gnome Rail, Expanded Session Drawer, Gnome Character Avatar, Header Summary (working / needs you counts), Light and Dark Themes, Model Badge (Opus / Sonnet / Haiku), Drawer Screenshot (light and dark), Session Card (+4 more)

### Community 12 - "Gnome Drawing"
Cohesion: 0.29
Nodes (8): character(), CHARACTERS, drawGnome(), extraSVG(), gnomeSVG(), pack(), toolAngleFor(), toolSVG()

### Community 13 - "Character Packs"
Cohesion: 0.29
Nodes (7): Bats Pack (Echo, Fig, Velvet, Sonar, Inky, Gizmo, Luna, Dusk), Bigfoot Pack (Boulder, Sprig, Cedar, Squatch, Rocky, Gus, Hollow, Stomper), Capybaras Pack (Yuzu, Mochi, Biscuit, Pebble, Clementine, Noodle, Tofu, Maple), Cats Pack (Marmalade, Clover, Smudge, Shadow, Hazel, Socks, Moonbeam, Toffee), Gnomes Pack (Pip, Bramble, Nib, Thistle, Cobble, Fern, Moss, Juniper), Character Packs Overview Image, Shared 8-Slot Tool and Accent Color Scheme

### Community 14 - "Cats Pack"
Cohesion: 0.60
Nodes (4): bodyMarkings(), Char, draw(), markings()

### Community 15 - "Bats Pack"
Cohesion: 0.67
Nodes (3): Char, draw(), extraSVG()

### Community 16 - "Bigfoot Pack"
Cohesion: 0.67
Nodes (3): Char, draw(), extraSVG()

### Community 17 - "Capybaras Pack"
Cohesion: 0.67
Nodes (3): Char, draw(), extraSVG()

## Knowledge Gaps
- **27 isolated node(s):** `ELECTRON_RUN_AS_NODE in VS Code Terminal`, `_claude_pid Dead Session Sweep`, `Task List Progress Bar`, `Subagent Helpers`, `Model Label (follows /model)` (+22 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 133 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `electron` connect `Package Manifest` to `Hook and Focus Detection`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `createCore()` (e.g. with `handleEvent()` and `release()`) actually correct?**
  _`createCore()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ELECTRON_RUN_AS_NODE in VS Code Terminal`, `_claude_pid Dead Session Sweep`, `Task List Progress Bar` to the rest of the system?**
  _27 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Hook and Focus Detection` be split into smaller, more focused modules?**
  _Cohesion score 0.08571428571428572 - nodes in this community are weakly interconnected._
- **Why does `createCore()` connect `Core Event Handling` to `Hook and Focus Detection`, `Core State Model`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `Renderer App UI` be split into smaller, more focused modules?**
  _Cohesion score 0.10338680926916222 - nodes in this community are weakly interconnected._
- **Should `Core State Model` be split into smaller, more focused modules?**
  _Cohesion score 0.08547008547008547 - nodes in this community are weakly interconnected._