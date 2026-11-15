// Capybara pack. Same tools and poses as the gnomes; each capybara wears a scarf in its own
// color (that's also its progress-bar color) and has its own little head accessory.
(function () {
  const { toolSVG, toolAngleFor } = window.packTools;

  const FUR = '#b07a4c';
  const FUR_DARK = '#8c5b34';
  const MUZZLE = '#7a4e2c';
  const INK = '#2b2016';

  const CHARACTERS = [
    { name: 'Yuzu', role: 'the Tinker', hat: '#d9483b', tool: 'hammer', extra: 'yuzu' },
    { name: 'Mochi', role: 'the Gardener', hat: '#2f9e5b', tool: 'can', extra: 'flower' },
    { name: 'Biscuit', role: 'the Painter', hat: '#3b7dd9', tool: 'brush', extra: 'glasses' },
    { name: 'Pebble', role: 'the Detective', hat: '#8a5cd6', tool: 'magnifier', extra: 'beanie' },
    { name: 'Clementine', role: 'the Miner', hat: '#e08a1e', tool: 'pickaxe', extra: 'headlamp' },
    { name: 'Noodle', role: 'the Mechanic', hat: '#d64f9a', tool: 'wrench', extra: 'bow' },
    { name: 'Tofu', role: 'the Night Owl', hat: '#159a9c', tool: 'lantern', extra: 'nightcap' },
    { name: 'Maple', role: 'the Digger', hat: '#c9a227', tool: 'shovel', extra: 'leaf' },
  ];
  type Char = (typeof CHARACTERS)[number];

  function extraSVG(extra: string, c: Char): string {
    switch (extra) {
      case 'yuzu': // the classic capybara hat
        return `<circle cx="24" cy="10.4" r="4.4" fill="#f6b82e"/><circle cx="22.6" cy="9" r="1.1" fill="#ffe08a" opacity=".8"/>
                <path d="M24 6.2 q1.8 -2.6 4.2 -2" stroke="#3f7d32" stroke-width="1.3" fill="none" stroke-linecap="round"/>
                <ellipse cx="27" cy="4.6" rx="1.8" ry="1" fill="#4f9a3c" transform="rotate(-20 27 4.6)"/>`;
      case 'flower':
        return `<g transform="translate(30.6 13.4)">${[0, 72, 144, 216, 288]
          .map((r) => `<ellipse cx="0" cy="-1.9" rx="1.3" ry="1.9" fill="#ffd6e6" transform="rotate(${r})"/>`)
          .join('')}<circle r="1.2" fill="#f5c542"/></g>`;
      case 'glasses':
        return `<g stroke="${INK}" stroke-width=".9" fill="rgba(255,255,255,.25)">
                  <circle cx="18.2" cy="19.4" r="2.5"/><circle cx="29.8" cy="19.4" r="2.5"/></g>
                <path d="M20.7 19.2 Q24 18 27.3 19.2" stroke="${INK}" stroke-width=".9" fill="none"/>`;
      case 'beanie':
        return `<path d="M15.2 16.6 Q15.8 7.6 24 7.4 Q32.2 7.6 32.8 16.6 Z" fill="${c.hat}"/>
                <rect x="14.6" y="15.2" width="18.8" height="3" rx="1.5" fill="${c.hat}" stroke="rgba(0,0,0,.18)" stroke-width=".6"/>
                <circle cx="24" cy="6.8" r="1.9" fill="${c.hat}" stroke="rgba(0,0,0,.15)" stroke-width=".5"/>`;
      case 'headlamp':
        return `<path d="M14 17 Q24 13.4 34 17" stroke="#3d3d3d" stroke-width="1.6" fill="none"/>
                <rect x="21.6" y="12.4" width="4.8" height="3.6" rx="1" fill="#555"/>
                <circle cx="24" cy="14.2" r="1.3" fill="#fff4b8"/>`;
      case 'bow':
        return `<g transform="translate(31.4 14.2) rotate(18)">
                  <path d="M0 0 L-3.6 -2.4 L-3.6 2.4 Z M0 0 L3.6 -2.4 L3.6 2.4 Z" fill="${c.hat}"/>
                  <circle r="1.1" fill="${c.hat}" stroke="rgba(0,0,0,.2)" stroke-width=".4"/></g>`;
      case 'nightcap':
        return `<path d="M15.4 16.6 Q17.6 8 26 7.4 Q33 7.6 35.6 12.6 Q33.8 13.2 32.6 16.6 Z" fill="${c.hat}"/>
                <path d="M14.8 16.4 Q24 13.6 33.2 16.4" stroke="#f7f4ee" stroke-width="2" fill="none" stroke-linecap="round"/>
                <circle cx="35.8" cy="12.8" r="2" fill="#f7f4ee"/>`;
      case 'leaf':
        return `<g transform="translate(25.5 10.6) rotate(-12)">
                  <path d="M0 -4.6 L1.2 -1.6 L4 -2.4 L2.6 0 L4.2 1.2 L1 1.4 L0 4 L-1 1.4 L-4.2 1.2 L-2.6 0 L-4 -2.4 L-1.2 -1.6 Z" fill="#d9612b"/>
                  <path d="M0 4 L0 6.4" stroke="#8a4a22" stroke-width=".8"/></g>`;
      default:
        return '';
    }
  }

  function draw(c: Char, size: number): string {
    const toolAngle = toolAngleFor(c.tool);
    return `
<svg class="gnome-svg tool-${c.tool}" viewBox="0 0 48 56" width="${size}" height="${(size * 56) / 48}" aria-hidden="true">
  <ellipse class="g-shadow" cx="24" cy="53" rx="14" ry="2.5"/>
  <g class="g-body">
    <ellipse cx="18" cy="50.6" rx="3.8" ry="2.2" fill="${MUZZLE}"/>
    <ellipse cx="30" cy="50.6" rx="3.8" ry="2.2" fill="${MUZZLE}"/>
    <!-- round loaf of a body -->
    <path d="M10.5 46 Q10 33.5 24 32.5 Q38 33.5 37.5 46 Q37 51.5 24 51.5 Q11 51.5 10.5 46 Z" fill="${FUR}"/>
    <ellipse cx="24" cy="44.5" rx="8" ry="5.4" fill="#c99467" opacity=".55"/>
    <!-- scarf in this capybara's color -->
    <path d="M14.4 34.4 Q24 39 33.6 34.4 L33.4 37.2 Q24 41.8 14.6 37.2 Z" fill="${c.hat}"/>
    <path d="M27.6 37.8 L29.6 43.6 L27 44 L25.8 38.6 Z" fill="${c.hat}"/>
    <!-- left front paw -->
    <path d="M15 38 Q11.2 41 12.2 45" stroke="${FUR}" stroke-width="4" stroke-linecap="round" fill="none"/>
    <ellipse cx="12.4" cy="45.4" rx="2.2" ry="1.9" fill="${FUR_DARK}"/>
    <g class="g-head">
      <!-- tiny ears set high and wide -->
      <ellipse cx="15.4" cy="15.2" rx="2.1" ry="1.6" fill="${FUR_DARK}"/>
      <ellipse cx="32.6" cy="15.2" rx="2.1" ry="1.6" fill="${FUR_DARK}"/>
      <!-- long, boxy capybara head -->
      <path d="M14 19.4 Q14 14.6 19 14.4 L29 14.4 Q34 14.6 34 19.4 L34.2 29.6 Q34.2 35.6 24 35.6 Q13.8 35.6 13.8 29.6 Z" fill="${FUR}"/>
      <!-- big blunt snout -->
      <path d="M15.2 26 Q15.2 22.6 19 22.4 L29 22.4 Q32.8 22.6 32.8 26 L32.8 30.4 Q32.8 35.2 24 35.2 Q15.2 35.2 15.2 30.4 Z" fill="${MUZZLE}"/>
      <path d="M16.4 24.6 Q24 22.8 31.6 24.6" stroke="rgba(255,255,255,.12)" stroke-width="1" fill="none"/>
      <ellipse cx="21" cy="25.6" rx="1.3" ry=".75" fill="${INK}"/>
      <ellipse cx="27" cy="25.6" rx="1.3" ry=".75" fill="${INK}"/>
      <path d="M24 28.4 L24 30.4 M21.8 31 Q24 32.4 26.2 31" stroke="${INK}" stroke-width=".8" fill="none" stroke-linecap="round"/>
      <g class="g-eyes-open">
        <ellipse class="g-eye" cx="18.2" cy="19.4" rx="1" ry="1.15" fill="${INK}"/>
        <ellipse class="g-eye" cx="29.8" cy="19.4" rx="1" ry="1.15" fill="${INK}"/>
      </g>
      <g class="g-eyes-closed" stroke="${INK}" stroke-width="1.1" stroke-linecap="round" fill="none">
        <path d="M17 19.6 Q18.2 20.6 19.4 19.6"/><path d="M28.6 19.6 Q29.8 20.6 31 19.6"/>
      </g>
      ${extraSVG(c.extra, c)}
    </g>
    <g class="g-arm-tool">
      <path d="M33 38 Q37 39.5 38 42" stroke="${FUR}" stroke-width="4" stroke-linecap="round" fill="none"/>
      <g class="g-tool" transform="translate(38.3 42.6) rotate(${toolAngle})">${toolSVG(c.tool, c)}</g>
      <ellipse cx="38.3" cy="42.6" rx="2.2" ry="1.9" fill="${FUR_DARK}"/>
    </g>
    <g class="g-arm-wave">
      <path d="M33 38 Q38 34 38.5 28" stroke="${FUR}" stroke-width="4" stroke-linecap="round" fill="none"/>
      <ellipse cx="38.6" cy="27" rx="2.3" ry="2" fill="${FUR_DARK}"/>
    </g>
    <g class="g-arm-rest">
      <path d="M33 38 Q36.8 41 35.6 45" stroke="${FUR}" stroke-width="4" stroke-linecap="round" fill="none"/>
      <ellipse cx="35.5" cy="45.4" rx="2.2" ry="1.9" fill="${FUR_DARK}"/>
    </g>
  </g>
</svg>`;
  }

  window.PACKS.capybaras = { id: 'capybaras', name: 'Capybaras', characters: CHARACTERS, draw };
})();
