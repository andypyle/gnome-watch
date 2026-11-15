// Bat pack. Same tools and poses as the gnomes; each bat wears a bow tie in its own color
// (that's also its progress-bar color). Napping bats hang upside down from a branch.
(function () {
  const { toolSVG, toolAngleFor } = window.packTools;

  const FUR = '#6e5c80';
  const FUR_DARK = '#57476a';
  const WING = '#4a3c5c';
  const WING_BONE = '#3a2e4a';
  const BELLY = '#a593b5';
  const FACE = '#c9b6c9';
  const INNER_EAR = '#e3a6b8';
  const INK = '#221a2b';

  const CHARACTERS = [
    { name: 'Echo', role: 'the Tinker', hat: '#d9483b', tool: 'hammer', extra: 'tuft' },
    { name: 'Fig', role: 'the Gardener', hat: '#2f9e5b', tool: 'can', extra: 'flower' },
    { name: 'Velvet', role: 'the Painter', hat: '#3b7dd9', tool: 'brush', extra: 'beret' },
    { name: 'Sonar', role: 'the Detective', hat: '#8a5cd6', tool: 'magnifier', extra: 'glasses' },
    { name: 'Inky', role: 'the Miner', hat: '#e08a1e', tool: 'pickaxe', extra: 'headlamp' },
    { name: 'Gizmo', role: 'the Mechanic', hat: '#d64f9a', tool: 'wrench', extra: 'goggles' },
    { name: 'Luna', role: 'the Night Owl', hat: '#159a9c', tool: 'lantern', extra: 'moon' },
    { name: 'Dusk', role: 'the Digger', hat: '#c9a227', tool: 'shovel', extra: 'star' },
  ];
  type Char = (typeof CHARACTERS)[number];

  // Bat-only animation: hang upside down from a branch while napping.
  const css = document.createElement('style');
  css.textContent = `
    .pack-bats .g-perch { display: none; }
    .pack-bats.st-sleeping .g-perch { display: block; }
    .pack-bats.st-sleeping .g-shadow { display: none; }
    .pack-bats.st-sleeping .g-body { transform-origin: 24px 30px; transform: scaleY(-1); animation: bat-sway 3s ease-in-out infinite; }
    .pack-bats.st-sleeping .g-head { transform: none; }
    /* keep the sleepy face smiling the right way up while hanging */
    .pack-bats.st-sleeping .g-eyes-closed { transform-origin: 24px 25.2px; transform: scaleY(-1); }
    .pack-bats.st-sleeping .g-mouth { transform-origin: 24px 29.2px; transform: scaleY(-1); }
    @keyframes bat-sway { 0%, 100% { transform: scaleY(-1) rotate(-3deg); } 50% { transform: scaleY(-1) rotate(3deg); } }
  `;
  document.head.appendChild(css);

  function extraSVG(extra: string, c: Char): string {
    switch (extra) {
      case 'tuft':
        return `<path d="M21.4 16.6 Q22 12.6 24 14.6 Q24.6 11.2 26.4 13.8 Q27.8 12.4 27 16.6 Z" fill="${FUR_DARK}"/>`;
      case 'flower':
        return `<g transform="translate(31.2 18.4)">${[0, 72, 144, 216, 288]
          .map((r) => `<ellipse cx="0" cy="-1.8" rx="1.2" ry="1.8" fill="#ffd6e6" transform="rotate(${r})"/>`)
          .join('')}<circle r="1.1" fill="#f5c542"/></g>`;
      case 'beret':
        return `<path d="M15.6 19.2 Q16.4 12.6 25 12.8 Q32.4 13.2 31.8 18.2 Q24 15.8 15.6 19.2 Z" fill="${c.hat}"/>
                <path d="M24.6 12.9 L25.4 10.6" stroke="${c.hat}" stroke-width="1.4" stroke-linecap="round"/>`;
      case 'glasses':
        return `<g stroke="#f1ece4" stroke-width=".9" fill="rgba(255,255,255,.18)">
                  <circle cx="20.4" cy="24.4" r="2.6"/><circle cx="27.6" cy="24.4" r="2.6"/></g>
                <path d="M23 24.2 Q24 23.4 25 24.2" stroke="#f1ece4" stroke-width=".9" fill="none"/>`;
      case 'headlamp':
        return `<path d="M15 20.6 Q24 16 33 20.6" stroke="#2b2b2b" stroke-width="1.6" fill="none"/>
                <rect x="21.6" y="15.6" width="4.8" height="3.6" rx="1" fill="#555"/>
                <circle cx="24" cy="17.4" r="1.3" fill="#fff4b8"/>`;
      case 'goggles':
        return `<path d="M14.8 19.4 Q24 15.6 33.2 19.4" stroke="#3d3d3d" stroke-width="1.4" fill="none"/>
                <circle cx="20.2" cy="18.4" r="2.4" fill="#9fd3e6" stroke="#8a6d1a" stroke-width="1"/>
                <circle cx="27.8" cy="18.4" r="2.4" fill="#9fd3e6" stroke="#8a6d1a" stroke-width="1"/>`;
      case 'moon':
        return `<path d="M30.8 15.6 A3.2 3.2 0 1 0 33.6 20.6 A2.5 2.5 0 1 1 30.8 15.6 Z" fill="#ffe28a"/>`;
      case 'star':
        return `<path d="M31 14.6 l.9 1.9 2.1.3 -1.5 1.5 .4 2.1 -1.9-1 -1.9 1 .4-2.1 -1.5-1.5 2.1-.3z" fill="#ffe28a"/>`;
      default:
        return '';
    }
  }

  function draw(c: Char, size: number): string {
    const toolAngle = toolAngleFor(c.tool);
    return `
<svg class="gnome-svg pack-bats tool-${c.tool}" viewBox="0 0 48 56" width="${size}" height="${(size * 56) / 48}" aria-hidden="true">
  <ellipse class="g-shadow" cx="24" cy="53" rx="12" ry="2.4"/>
  <g class="g-perch">
    <path d="M6 7.6 Q24 5.4 42 7.8" stroke="#7a5232" stroke-width="2.2" stroke-linecap="round" fill="none"/>
    <path d="M34 7.2 Q37 3.6 40 4.4" stroke="#7a5232" stroke-width="1.2" stroke-linecap="round" fill="none"/>
    <ellipse cx="40.6" cy="4.2" rx="1.8" ry="1" fill="#4f9a3c" transform="rotate(-20 40.6 4.2)"/>
  </g>
  <g class="g-body">
    <!-- tiny feet -->
    <path d="M20 49.6 l-1.4 2 M20 49.6 l0 2.2 M20 49.6 l1.4 2" stroke="${WING_BONE}" stroke-width="1.1" stroke-linecap="round"/>
    <path d="M28 49.6 l-1.4 2 M28 49.6 l0 2.2 M28 49.6 l1.4 2" stroke="${WING_BONE}" stroke-width="1.1" stroke-linecap="round"/>
    <!-- left wing, folded -->
    <path d="M15.4 35.6 Q7 33.6 4.4 39.4 Q7 39.6 7.6 42.4 Q9.8 41.8 10.6 44.8 Q12.6 44 14.4 46.6 Z" fill="${WING}"/>
    <path d="M15.4 35.6 Q9 36.6 7.6 42.4 M12.6 38.8 L10.6 44.8" stroke="${WING_BONE}" stroke-width=".8" fill="none"/>
    <!-- round fuzzy body -->
    <ellipse cx="24" cy="42" rx="10.2" ry="9.4" fill="${FUR}"/>
    <ellipse cx="24" cy="43.6" rx="6.2" ry="6.4" fill="${BELLY}" opacity=".7"/>
    <path d="M21.4 41 q1.2 .9 2.6 0 q1.4 .9 2.6 0 M21.8 44 q1.1 .8 2.2 0 q1.1 .8 2.2 0" stroke="${FUR}" stroke-width=".7" fill="none" opacity=".7"/>
    <!-- bow tie in this bat's color -->
    <path d="M24 34.6 L19.6 32.4 L19.6 37 Z M24 34.6 L28.4 32.4 L28.4 37 Z" fill="${c.hat}"/>
    <circle cx="24" cy="34.6" r="1.3" fill="${c.hat}" stroke="rgba(0,0,0,.25)" stroke-width=".5"/>
    <g class="g-head">
      <!-- big pointy ears -->
      <path d="M15.6 22.6 L12.4 8.4 L21.4 17 Z" fill="${FUR}"/>
      <path d="M32.4 22.6 L35.6 8.4 L26.6 17 Z" fill="${FUR}"/>
      <path d="M16.2 19.8 L14.2 11.6 L19.6 17 Z" fill="${INNER_EAR}"/>
      <path d="M31.8 19.8 L33.8 11.6 L28.4 17 Z" fill="${INNER_EAR}"/>
      <circle cx="24" cy="25.4" r="9.6" fill="${FUR}"/>
      <!-- lighter face -->
      <path d="M16.4 25.6 Q16.6 19.8 21.4 21 Q24 22.6 26.6 21 Q31.4 19.8 31.6 25.6 Q31.2 32.6 24 32.8 Q16.8 32.6 16.4 25.6 Z" fill="${FACE}"/>
      <g class="g-eyes-open">
        <ellipse class="g-eye" cx="20.4" cy="24.6" rx="1.35" ry="1.6" fill="${INK}"/>
        <ellipse class="g-eye" cx="27.6" cy="24.6" rx="1.35" ry="1.6" fill="${INK}"/>
        <circle cx="20.9" cy="24" r=".45" fill="#fff"/>
        <circle cx="28.1" cy="24" r=".45" fill="#fff"/>
      </g>
      <g class="g-eyes-closed" stroke="${INK}" stroke-width="1.1" stroke-linecap="round" fill="none">
        <path d="M19.1 24.8 Q20.4 25.9 21.7 24.8"/><path d="M26.3 24.8 Q27.6 25.9 28.9 24.8"/>
      </g>
      <!-- tiny nose, smile, and two little fangs -->
      <g class="g-mouth">
      <path d="M23 27.4 Q24 26.8 25 27.4 Q24.6 28.4 24 28.5 Q23.4 28.4 23 27.4 Z" fill="${INK}"/>
      <path d="M21.8 29.6 Q24 31.2 26.2 29.6" stroke="${INK}" stroke-width=".8" fill="none" stroke-linecap="round"/>
      <path d="M22.6 30 L23.1 31.4 L23.6 30.3 Z M25.4 30 L24.9 31.4 L24.4 30.3 Z" fill="#fff"/>
      </g>
      <circle cx="18.4" cy="28" r="1.3" fill="#f0a0b4" opacity=".55"/>
      <circle cx="29.6" cy="28" r="1.3" fill="#f0a0b4" opacity=".55"/>
      ${extraSVG(c.extra, c)}
    </g>
    <!-- right wing holding the tool -->
    <g class="g-arm-tool">
      <path d="M32.6 35.6 Q37.2 37 38.3 42.6 L36.4 46.4 Q35.4 44.6 33.8 45.8 Z" fill="${WING}"/>
      <path d="M32.6 36 Q36.6 38 38.3 42.6" stroke="${WING_BONE}" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      <g class="g-tool" transform="translate(38.3 42.6) rotate(${toolAngle})">${toolSVG(c.tool, c)}</g>
      <circle cx="38.3" cy="42.6" r="1.7" fill="${FUR_DARK}"/>
    </g>
    <!-- right wing raised (needs you) -->
    <g class="g-arm-wave">
      <path d="M32.6 35.6 Q39 31.6 39.2 25 L42 28.4 Q39.8 30.6 41.4 33.4 Q38.8 33.6 37.8 36.4 Z" fill="${WING}"/>
      <path d="M32.6 36 Q38.2 32.6 39.2 25" stroke="${WING_BONE}" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      <circle cx="39.2" cy="25" r="1.7" fill="${FUR_DARK}"/>
    </g>
    <!-- right wing folded (resting) -->
    <g class="g-arm-rest">
      <path d="M32.6 35.6 Q41 33.6 43.6 39.4 Q41 39.6 40.4 42.4 Q38.2 41.8 37.4 44.8 Q35.4 44 33.6 46.6 Z" fill="${WING}"/>
      <path d="M32.6 35.6 Q39 36.6 40.4 42.4 M35.4 38.8 L37.4 44.8" stroke="${WING_BONE}" stroke-width=".8" fill="none"/>
    </g>
  </g>
</svg>`;
  }

  window.PACKS.bats = { id: 'bats', name: 'Bats', characters: CHARACTERS, draw };
})();
