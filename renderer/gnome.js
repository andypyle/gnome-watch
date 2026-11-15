// Original gnome characters, drawn as SVG. Each agent gets the next free character,
// so gnomes working at the same time never share a color or a tool.

const CHARACTERS = [
  { name: 'Pip', role: 'the Tinker', hat: '#d9483b', coat: '#3f5d8a', tool: 'hammer', extra: 'pompom' },
  { name: 'Bramble', role: 'the Gardener', hat: '#2f9e5b', coat: '#7a5232', tool: 'can', extra: 'flower' },
  { name: 'Nib', role: 'the Painter', hat: '#3b7dd9', coat: '#7a3a4f', tool: 'brush', extra: 'glasses' },
  { name: 'Thistle', role: 'the Detective', hat: '#8a5cd6', coat: '#3a6b6b', tool: 'magnifier', extra: 'eyebrows' },
  { name: 'Cobble', role: 'the Miner', hat: '#e08a1e', coat: '#4f6a3a', tool: 'pickaxe', extra: 'patch' },
  { name: 'Fern', role: 'the Mechanic', hat: '#d64f9a', coat: '#34466e', tool: 'wrench', extra: 'star' },
  { name: 'Moss', role: 'the Night Owl', hat: '#159a9c', coat: '#5a3f6e', tool: 'lantern', extra: 'bell' },
  { name: 'Juniper', role: 'the Digger', hat: '#c9a227', coat: '#5b5f66', tool: 'shovel', extra: 'scarf' },
];

const SKIN = '#f2c6a0';
const METAL = '#9aa3ae';
const WOOD = '#8a5a33';

// ---- Character packs ----
// A pack is 8 characters plus a draw(character, size) function. Drawings must use the same
// part classes (g-body, g-head, g-eye, g-eyes-open/closed, g-arm-tool/wave/rest, g-tool...)
// so every pack gets the same working / waving / napping animations for free.
window.PACKS = window.PACKS || {};
let activePack = 'gnomes';
function setPack(id) {
  if (window.PACKS[id]) activePack = id;
}
function pack() {
  return window.PACKS[activePack] || window.PACKS.gnomes;
}

function character(slot) {
  const list = pack().characters;
  const c = list[slot % list.length];
  const round = Math.floor(slot / list.length);
  return round ? { ...c, name: `${c.name} ${['II', 'III', 'IV', 'V'][Math.min(round - 1, 3)]}` } : c;
}

// Tools are drawn with the hand at (0,0), pointing up.
function toolSVG(tool, c) {
  switch (tool) {
    case 'hammer':
      return `<rect x="-.85" y="-12" width="1.7" height="12.5" rx=".8" fill="${WOOD}"/>
              <rect x="-2.2" y="-14.4" width="8" height="4.2" rx="1" fill="${METAL}"/>`;
    case 'pickaxe':
      return `<rect x="-.85" y="-13" width="1.7" height="13.5" rx=".8" fill="${WOOD}"/>
              <path d="M-7 -10.5 Q0 -16.5 7 -10.5" stroke="${METAL}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`;
    case 'shovel':
      return `<rect x="-.8" y="-13" width="1.6" height="16" rx=".8" fill="${WOOD}"/>
              <rect x="-2.6" y="2.4" width="5.2" height="1.6" rx=".8" fill="${WOOD}"/>
              <path d="M-3.4 -13 L3.4 -13 L3.4 -17.5 Q0 -21.5 -3.4 -17.5 Z" fill="${METAL}"/>`;
    case 'wrench':
      return `<rect x="-1" y="-10" width="2" height="11" rx="1" fill="${METAL}"/>
              <path d="M-2.6 -9.4 A3.6 3.6 0 1 1 2.6 -9.4" stroke="${METAL}" stroke-width="2.4" fill="none"/>`;
    case 'brush':
      return `<rect x="-.75" y="-9" width="1.5" height="10" rx=".7" fill="${WOOD}"/>
              <rect x="-1.3" y="-11.4" width="2.6" height="2.6" rx=".4" fill="${METAL}"/>
              <path d="M-1.3 -11.4 Q-1.6 -15 0 -17 Q1.6 -15 1.3 -11.4 Z" fill="${c.hat}"/>`;
    case 'magnifier':
      return `<rect x="-.9" y="-6" width="1.8" height="7" rx=".9" fill="#4a3426"/>
              <circle cx="0" cy="-10" r="4.2" fill="rgba(190,225,255,.45)" stroke="#c99a3c" stroke-width="1.6"/>
              <path d="M-2 -11.8 Q-1 -12.8 .4 -12.6" stroke="#fff" stroke-width=".8" fill="none" opacity=".8"/>`;
    case 'can':
      return `<g class="g-can">
                <path d="M1 -7.5 Q4.5 -11 8 -7.5" stroke="${METAL}" stroke-width="1.3" fill="none"/>
                <rect x="0" y="-7" width="8.5" height="7" rx="1.4" fill="#5f8f6a"/>
                <rect x="0" y="-5.2" width="8.5" height="1.2" fill="rgba(255,255,255,.25)"/>
                <path d="M8 -4.5 L12.5 -9" stroke="#5f8f6a" stroke-width="1.6" stroke-linecap="round"/>
                <g class="g-drops" fill="#6db3f2">
                  <circle cx="13.6" cy="-6.4" r=".75"/><circle cx="14.4" cy="-3.8" r=".7"/><circle cx="13.2" cy="-1.6" r=".65"/>
                </g>
              </g>`;
    case 'lantern':
      return `<g class="g-lantern">
                <path d="M0 0 L0 3" stroke="#4a3426" stroke-width=".8"/>
                <rect x="-2.6" y="3" width="5.2" height="1.4" rx=".5" fill="#4a3426"/>
                <rect class="g-glow" x="-2.2" y="4.4" width="4.4" height="5.4" rx="1" fill="#ffd25e"/>
                <path d="M-2.2 4.4 V9.8 M2.2 4.4 V9.8 M0 4.4 V9.8" stroke="#4a3426" stroke-width=".6"/>
                <rect x="-2.6" y="9.8" width="5.2" height="1.3" rx=".5" fill="#4a3426"/>
              </g>`;
    default:
      return '';
  }
}

function extraSVG(extra, c) {
  switch (extra) {
    case 'pompom':
      return `<circle cx="23.5" cy="2" r="2.4" fill="#f7f4ee"/>`;
    case 'bell':
      return `<circle cx="23.5" cy="2.4" r="2.1" fill="#e8c35a"/><circle cx="23.5" cy="3.6" r=".6" fill="#8a6d1a"/>`;
    case 'flower':
      return `<g transform="translate(30.4 18.6)">${[0, 72, 144, 216, 288]
        .map((r) => `<ellipse cx="0" cy="-1.6" rx="1.1" ry="1.6" fill="#ffd6e6" transform="rotate(${r})"/>`)
        .join('')}<circle r="1" fill="#f5c542"/></g>`;
    case 'star':
      return `<path d="M24 10.2 l1 2.1 2.3.3 -1.7 1.6 .4 2.3 -2-1.1 -2 1.1 .4-2.3 -1.7-1.6 2.3-.3z" fill="#ffe28a"/>`;
    case 'patch':
      return `<rect x="21" y="12.5" width="5" height="4.2" rx=".6" fill="#7a5232" transform="rotate(-8 23.5 14.6)"/>
              <path d="M21.6 13 l.6 3.6 M25.4 12.4 l.6 3.6" stroke="#f1d8a8" stroke-width=".5" stroke-dasharray=".8 .6" transform="rotate(-8 23.5 14.6)"/>`;
    case 'glasses':
      return `<g stroke="#2b2016" stroke-width=".8" fill="rgba(255,255,255,.25)">
                <circle cx="20.6" cy="25.2" r="2.3"/><circle cx="27.4" cy="25.2" r="2.3"/>
              </g><path d="M22.9 25 Q24 24.2 25.1 25" stroke="#2b2016" stroke-width=".8" fill="none"/>`;
    case 'eyebrows':
      return `<path d="M18.6 22.6 Q20.6 21.2 22.4 22.6 M25.6 22.6 Q27.4 21.2 29.4 22.6" stroke="#f7f4ee" stroke-width="1.6" stroke-linecap="round" fill="none"/>`;
    case 'scarf':
      return ''; // drawn on the body instead
    default:
      return '';
  }
}

function gnomeSVG(slot, size = 46) {
  return pack().draw(character(slot), size);
}

function drawGnome(c, size) {
  const toolAngle = { can: 0, lantern: 0, magnifier: 10 }[c.tool] ?? 18;
  const scarf =
    c.extra === 'scarf'
      ? `<path d="M15.5 35 Q24 39 32.5 35 L32.5 37.6 Q24 41.6 15.5 37.6 Z" fill="#c74a3a"/>
         <path d="M28 37 L30.5 43.5 L27.6 43.8 L26.4 38 Z" fill="#c74a3a"/>`
      : '';
  return `
<svg class="gnome-svg tool-${c.tool}" viewBox="0 0 48 56" width="${size}" height="${(size * 56) / 48}" aria-hidden="true">
  <ellipse class="g-shadow" cx="24" cy="53" rx="13" ry="2.5"/>
  <g class="g-body">
    <ellipse cx="18.5" cy="50.5" rx="4.2" ry="2.4" fill="#3b2a1f"/>
    <ellipse cx="29.5" cy="50.5" rx="4.2" ry="2.4" fill="#3b2a1f"/>
    <path d="M13 49 Q12 36 24 33 Q36 36 35 49 Z" fill="${c.coat}"/>
    <rect x="13.6" y="43" width="20.8" height="2.6" rx="1" fill="#2b2016" opacity=".85"/>
    <rect x="22.4" y="42.6" width="3.4" height="3.4" rx=".6" fill="#e8c35a"/>
    <path d="M15 37 Q11 41 12.5 45" stroke="${c.coat}" stroke-width="4" stroke-linecap="round" fill="none"/>
    <circle cx="12.6" cy="45.5" r="2.1" fill="${SKIN}"/>
    <g class="g-head">
      <circle cx="24" cy="26" r="7.2" fill="${SKIN}"/>
      <path d="M15.8 27.5 Q16 40 24 44.5 Q32 40 32.2 27.5 Q28 31 24 30.5 Q20 31 15.8 27.5 Z" fill="#f7f4ee"/>
      <path d="M19 31 Q24 34.5 29 31" stroke="#e2ddd2" stroke-width="1" fill="none"/>
      <circle cx="24" cy="28.2" r="2.7" fill="#e8907a"/>
      <g class="g-eyes-open">
        <ellipse class="g-eye" cx="20.6" cy="25.2" rx="1.1" ry="1.35" fill="#2b2016"/>
        <ellipse class="g-eye" cx="27.4" cy="25.2" rx="1.1" ry="1.35" fill="#2b2016"/>
      </g>
      <g class="g-eyes-closed" stroke="#2b2016" stroke-width="1.1" stroke-linecap="round" fill="none">
        <path d="M19.4 25.4 Q20.6 26.4 21.8 25.4"/><path d="M26.2 25.4 Q27.4 26.4 28.6 25.4"/>
      </g>
      <circle cx="18.6" cy="27.8" r="1.3" fill="#f0a0a0" opacity=".55"/>
      <circle cx="29.4" cy="27.8" r="1.3" fill="#f0a0a0" opacity=".55"/>
      <path d="M14.5 23.2 Q24 19.4 33.5 23.2 L31 9 Q29 2.5 23.5 1.5 Q27 6 25 9 Q21 4.5 17 15 Z" fill="${c.hat}"/>
      <path d="M14.2 23.4 Q24 19.2 33.8 23.4 Q34.4 25 33 25.2 Q24 21.8 15 25.2 Q13.6 25 14.2 23.4 Z" fill="rgba(0,0,0,.18)"/>
      ${extraSVG(c.extra, c)}
    </g>
    ${scarf}
    <g class="g-arm-tool">
      <path d="M33 37 Q37 39 38 42" stroke="${c.coat}" stroke-width="4" stroke-linecap="round" fill="none"/>
      <g class="g-tool" transform="translate(38.3 42.6) rotate(${toolAngle})">${toolSVG(c.tool, c)}</g>
      <circle cx="38.3" cy="42.6" r="2.1" fill="${SKIN}"/>
    </g>
    <g class="g-arm-wave">
      <path d="M33 37 Q38 33 38.5 27" stroke="${c.coat}" stroke-width="4" stroke-linecap="round" fill="none"/>
      <circle cx="38.6" cy="26" r="2.3" fill="${SKIN}"/>
    </g>
    <g class="g-arm-rest">
      <path d="M33 37 Q37 41 35.5 45" stroke="${c.coat}" stroke-width="4" stroke-linecap="round" fill="none"/>
      <circle cx="35.4" cy="45.5" r="2.1" fill="${SKIN}"/>
    </g>
  </g>
</svg>`;
}

// Helpers (your .claude/agents) get a gnome picked from their type name, so "design-agent"
// always looks the same everywhere. It never matches the parent gnome it's helping.
function helperSlot(type, parentSlot) {
  let h = 2166136261;
  const t = String(type || 'helper').toLowerCase();
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
  let slot = (h >>> 0) % CHARACTERS.length;
  if (slot === parentSlot % CHARACTERS.length) slot = (slot + 1) % CHARACTERS.length;
  return slot;
}

window.PACKS.gnomes = { id: 'gnomes', name: 'Gnomes', characters: CHARACTERS, draw: drawGnome };
window.gnomeSVG = gnomeSVG;
window.helperSlot = helperSlot;
window.gnomeCharacter = character;
window.setCharacterPack = setPack;
window.packTools = { toolSVG, METAL, WOOD }; // shared with other packs
