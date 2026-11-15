// Types shared by the renderer scripts and src/preload.ts.
// The renderer files are plain <script>s (no imports), so they talk through these window globals.
import type { AgentView } from '../src/core';
import type { Focus } from '../src/focus';

export interface State {
  agents: AgentView[];
  pendingCount: number;
  sound: boolean;
  focus: Focus;
  maxListHeight: number;
  expanded: boolean;
  pack: string;
}

export type ResolveAction = 'allow' | 'deny' | 'answer' | 'vscode';

// Exposed by src/preload.ts as window.gnome
export interface GnomeApi {
  onState(fn: (s: State) => void): void;
  resize(width: number, height: number): void;
  toggle(): void;
  resolve(id: string, action: ResolveAction, answers?: Record<string, string>): void;
  openEditor(sessionId: string): void;
}

export interface Character {
  name: string;
  role: string;
  hat: string; // also the progress-bar color
  tool: string;
}

export interface Pack<C extends Character = any> {
  id: string;
  name: string;
  characters: C[];
  draw(c: C, size: number): string;
}

declare global {
  interface Window {
    gnome?: GnomeApi;
    PACKS: Record<string, Pack>;
    packTools: { toolSVG(tool: string, c: { hat: string }): string; toolAngleFor(tool: string): number; METAL: string; WOOD: string };
    gnomeSVG(slot: number, size?: number): string;
    helperSlot(type: string, parentSlot: number): number;
    gnomeCharacter(slot: number): Character;
    setCharacterPack(id: string): void;
    __render?: (s: State) => void;
  }
}
