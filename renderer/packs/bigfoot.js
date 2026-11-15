// Bigfoot pack. Same tools and poses as the gnomes; every Bigfoot has its own fur shade, a
// bandana in its own color (that's also its progress-bar color), and very big feet.
// Napping Bigfoots hide behind a pine tree, as Bigfoots do.
(function () {
  const { toolSVG } = window.packTools;
  const INK = '#24180f';

  const CHARACTERS = [
    { name: 'Boulder', role: 'the Tinker', hat: '#d9483b', tool: 'hammer', extra: 'beanie',
      fur: { main: '#7a5236', dark: '#5a3b25', face: '#cfa982' } },
    { name: 'Sprig', role: 'the Gardener', hat: '#2f9e5b', tool: 'can', extra: 'leaves',
      fur: { main: '#8f6744', dark: '#6a4a2e', face: '#d6b28c' } },
    { name: 'Cedar', role: 'the Painter', hat: '#3b7dd9', tool: 'brush', extra: 'beret',
      fur: { main: '#9a4f2c', dark: '#73391e', face: '#d8a983' } },
    { name: 'Squatch', role: 'the Detective', hat: '#8a5cd6', tool: 'magnifier', extra: 'deerstalker',
      fur: { main: '#5c4b3e', dark: '#42352b', face: '#c19c7c' } },
    { name: 'Rocky', role: 'the Miner', hat: '#e08a1e', tool: 'pickaxe', extra: 'hardhat',
      fur: { main: '#77716a', dark: '#57524c', face: '#c9b39c' } },
    { name: 'Gus', role: 'the Mechanic', hat: '#d64f9a', tool: 'wrench', extra: 'cap',
      fur: { main: '#a8784a', dark: '#82592f', face: '#dfbf98' } },
    { name: 'Hollow', role: 'the Night Owl', hat: '#159a9c', tool: 'lantern', extra: 'owl',
      fur: { main: '#4d3d32', dark: '#372b23', face: '#bb9676' } },
    { name: 'Stomper', role: 'the Digger', hat: '#c9a227', tool: 'shovel', extra: 'twig',
      fur: { main: '#8a5838', dark: '#664027', face: '#d4a985' } },
  ];

  // Bigfoot-only animation: napping means hiding behind a pine tree, peeking out.
  const css = document.createElement('style');
  css.textContent = `
    .pack-bigfoot .g-tree { display: none; }
    .pack-bigfoot.st-sleeping .g-tree { display: block; }
    .pack-bigfoot.st-sleeping .g-shadow { opacity: .6; }
    .pack-bigfoot.st-sleeping .g-head { transform-origin: 24px 34px; transform: rotate(9deg) translateX(1px); }
  `;
  document.head.appendChild(css);

  function extraSVG(extra, c, f) {
    switch (extra) {
      case 'beanie':
        return `<path d="M15.6 20.4 Q15.8 11.4 24 11.2 Q32.2 11.4 32.4 20.4 Z" fill="${c.hat}"/>
                <rect x="15" y="18.8" width="18" height="3" rx="1.5" fill="${c.hat}" stroke="rgba(0,0,0,.2)" stroke-width=".6"/>
                <path d="M19 13.6 L19 18.4 M22 12.4 L22 18.4 M26 12.4 L26 18.4 M29 13.6 L29 18.4" stroke="rgba(0,0,0,.15)" stroke-width=".7"/>`;
      case 'leaves':
        return `<ellipse cx="19.4" cy="14.6" rx="2.6" ry="1.2" fill="#4f9a3c" transform="rotate(-35 19.4 14.6)"/>
                <ellipse cx="24" cy="12.4" rx="2.6" ry="1.2" fill="#62b04a" transform="rotate(-80 24 12.4)"/>
                <ellipse cx="28.6" cy="14.6" rx="2.6" ry="1.2" fill="#4f9a3c" transform="rotate(35 28.6 14.6)"/>
                <circle cx="21.6" cy="13" r="1.2" fill="#ffd6e6"/><circle cx="21.6" cy="13" r=".5" fill="#f5c542"/>`;
      case 'beret':
        return `<path d="M15.8 17.8 Q16.8 11 25.4 11.4 Q33 11.8 32 16.8 Q24 14.4 15.8 17.8 Z" fill="${c.hat}"/>
                <path d="M25 11.5 L25.8 9.2" stroke="${c.hat}" stroke-width="1.4" stroke-linecap="round"/>`;
      case 'deerstalker':
        return `<path d="M16.2 18.6 Q16.6 11.2 24 11 Q31.4 11.2 31.8 18.6 Z" fill="#a8835a"/>
                <path d="M16.2 18.6 L31.8 18.6 M24 11 L24 18.6 M19.4 12.6 L19.6 18.6 M28.6 12.6 L28.4 18.6" stroke="#7b5d3c" stroke-width=".7"/>
                <path d="M15.4 18.2 Q13 18.8 12.6 20.6 Q15 20.8 17 19.4 Z M32.6 18.2 Q35 18.8 35.4 20.6 Q33 20.8 31 19.4 Z" fill="#a8835a"/>
                <path d="M23 10.6 Q24 9 25 10.6" stroke="#7b5d3c" stroke-width="1" fill="none"/>`;
      case 'hardhat':
        return `<path d="M15.4 18.8 Q15.6 10.8 24 10.6 Q32.4 10.8 32.6 18.8 Z" fill="#f2c230"/>
                <rect x="14" y="17.8" width="20" height="2.4" rx="1.2" fill="#e0ad18"/>
                <path d="M24 10.8 L24 17.8" stroke="#e0ad18" stroke-width="1.6"/>
                <rect x="21.8" y="13" width="4.4" height="3.4" rx="1" fill="#555"/>
                <circle cx="24" cy="14.7" r="1.2" fill="#fff4b8"/>`;
      case 'cap':
        return `<path d="M16 19 Q16.2 11.6 24 11.4 Q31.8 11.6 32 19 Z" fill="${c.hat}"/>
                <path d="M16 19 Q24 17 32 19 L33.6 20.6 Q24 18.6 14.6 20.6 Z" fill="${c.hat}" stroke="rgba(0,0,0,.2)" stroke-width=".5"/>
                <path d="M16.6 15.6 Q24 12.8 31.4 15.6 L31.6 19 L16.4 19 Z" fill="#f4f1ec" opacity=".85"/>
                <circle cx="24" cy="11.6" r=".9" fill="${c.hat}"/>`;
      case 'owl': // a tiny owl friend perched on top
        return `<g transform="translate(24 11.6)">
                  <ellipse cx="0" cy="-1.4" rx="3.2" ry="3.4" fill="#a07850"/>
                  <ellipse cx="0" cy="-.6" rx="2" ry="2" fill="#d9bf98"/>
                  <path d="M-2.6 -4.2 L-2 -5.8 L-1 -4.4 M2.6 -4.2 L2 -5.8 L1 -4.4" fill="#a07850" stroke="#a07850" stroke-width=".6"/>
                  <circle cx="-1.2" cy="-2.2" r="1" fill="#fff"/><circle cx="1.2" cy="-2.2" r="1" fill="#fff"/>
                  <circle cx="-1.2" cy="-2.2" r=".5" fill="${INK}"/><circle cx="1.2" cy="-2.2" r=".5" fill="${INK}"/>
                  <path d="M-.5 -1.2 L0 -.4 L.5 -1.2 Z" fill="#e8a33a"/>
                  <path d="M-1.4 1.8 L-1.4 2.4 M1.4 1.8 L1.4 2.4" stroke="#e8a33a" stroke-width=".6"/>
                </g>`;
      case 'twig':
        return `<path d="M27.4 14.4 L31.6 10.4 M29.6 12.2 L30.4 9.6" stroke="#6a4a2e" stroke-width=".9" stroke-linecap="round"/>
                <ellipse cx="31.8" cy="9.8" rx="1.4" ry=".8" fill="#4f9a3c" transform="rotate(-40 31.8 9.8)"/>
                <ellipse cx="30.4" cy="8.8" rx="1.2" ry=".7" fill="#62b04a" transform="rotate(-80 30.4 8.8)"/>`;
      default:
        return '';
    }
  }

  function draw(c, size) {
    const f = c.fur;
    const toolAngle = { can: 0, lantern: 0, magnifier: 10 }[c.tool] ?? 18;
    const sole = f.face;
    return `
<svg class="gnome-svg pack-bigfoot tool-${c.tool}" viewBox="0 0 48 56" width="${size}" height="${(size * 56) / 48}" aria-hidden="true">
  <ellipse class="g-shadow" cx="24" cy="53" rx="15" ry="2.6"/>
  <g class="g-body">
    <!-- very big feet -->
    <ellipse cx="17.2" cy="50.8" rx="5.6" ry="2.6" fill="${f.dark}"/>
    <ellipse cx="30.8" cy="50.8" rx="5.6" ry="2.6" fill="${f.dark}"/>
    <g fill="${sole}" opacity=".9">
      <circle cx="12.4" cy="50" r=".85"/><circle cx="13.6" cy="49" r=".75"/><circle cx="15" cy="48.6" r=".7"/>
      <circle cx="35.6" cy="50" r=".85"/><circle cx="34.4" cy="49" r=".75"/><circle cx="33" cy="48.6" r=".7"/>
    </g>
    <!-- big shaggy body -->
    <path d="M12.6 48.6 L11.2 46.6 L12.4 45.2 L10.8 42.6 L12.2 41.4 Q13.4 33.6 24 31.6 Q34.6 33.6 35.8 41.4 L37.2 42.6 L35.6 45.2 L36.8 46.6 L35.4 48.6 Q30 50.6 24 50.6 Q18 50.6 12.6 48.6 Z" fill="${f.main}"/>
    <path d="M18.6 40 l1 2.2 M23.2 41.6 l.4 2.4 M28.2 40 l-.8 2.2 M20.6 45.2 l.8 2 M26.6 45.4 l-.6 2 M16.2 44 l.9 1.8 M31.4 44 l-.8 1.8" stroke="${f.dark}" stroke-width=".9" stroke-linecap="round"/>
    <!-- bandana in this Bigfoot's color -->
    <path d="M16.4 33.8 Q24 37.4 31.6 33.8 L31.4 36 Q24 39.6 16.6 36 Z" fill="${c.hat}"/>
    <path d="M21.4 36.8 L24 41.4 L26.6 36.8 Z" fill="${c.hat}"/>
    <circle cx="22.4" cy="35.4" r=".45" fill="#fff" opacity=".7"/><circle cx="25.6" cy="35.6" r=".45" fill="#fff" opacity=".7"/>
    <!-- long left arm -->
    <path d="M14.4 37 Q10.6 41 11.2 46.4" stroke="${f.main}" stroke-width="4.6" stroke-linecap="round" fill="none"/>
    <circle cx="11.3" cy="47" r="2.2" fill="${f.face}"/>
    <g class="g-head">
      <!-- crested, shaggy head -->
      <path d="M15.2 26.4 L14.2 24.6 L15.4 23.6 Q15.4 15.6 21.2 13.4 L22.6 11.6 L24 13 L25.4 11.6 L26.8 13.4 Q32.6 15.6 32.6 23.6 L33.8 24.6 L32.8 26.4 Q32.2 33.4 24 34 Q15.8 33.4 15.2 26.4 Z" fill="${f.main}"/>
      <!-- face -->
      <path d="M18.4 25.6 Q18.2 21.8 24 21.8 Q29.8 21.8 29.6 25.6 Q29.4 31.4 24 31.8 Q18.6 31.4 18.4 25.6 Z" fill="${f.face}"/>
      <!-- heavy brow -->
      <path d="M17.6 22.8 Q24 20.2 30.4 22.8 Q30 24.4 24 23.4 Q18 24.4 17.6 22.8 Z" fill="${f.dark}"/>
      <g class="g-eyes-open">
        <ellipse class="g-eye" cx="21.2" cy="25" rx="1.05" ry="1.25" fill="${INK}"/>
        <ellipse class="g-eye" cx="26.8" cy="25" rx="1.05" ry="1.25" fill="${INK}"/>
        <circle cx="21.6" cy="24.5" r=".38" fill="#fff"/><circle cx="27.2" cy="24.5" r=".38" fill="#fff"/>
      </g>
      <g class="g-eyes-closed" stroke="${INK}" stroke-width="1.1" stroke-linecap="round" fill="none">
        <path d="M20 25.2 Q21.2 26.2 22.4 25.2"/><path d="M25.6 25.2 Q26.8 26.2 28 25.2"/>
      </g>
      <!-- broad nose and a friendly grin -->
      <path d="M22.2 27.6 Q24 26.2 25.8 27.6 Q25.4 28.8 24 28.8 Q22.6 28.8 22.2 27.6 Z" fill="${f.dark}"/>
      <path d="M21.6 29.8 Q24 31.4 26.4 29.8" stroke="${INK}" stroke-width=".8" fill="none" stroke-linecap="round"/>
      <circle cx="19.6" cy="28.4" r="1.2" fill="#e89a8a" opacity=".45"/>
      <circle cx="28.4" cy="28.4" r="1.2" fill="#e89a8a" opacity=".45"/>
      ${extraSVG(c.extra, c, f)}
    </g>
    <g class="g-arm-tool">
      <path d="M33.4 37 Q37.4 39 38.2 42" stroke="${f.main}" stroke-width="4.6" stroke-linecap="round" fill="none"/>
      <g class="g-tool" transform="translate(38.3 42.6) rotate(${toolAngle})">${toolSVG(c.tool, c)}</g>
      <circle cx="38.3" cy="42.6" r="2.2" fill="${f.face}"/>
    </g>
    <g class="g-arm-wave">
      <path d="M33.4 37 Q38.4 33 38.8 27" stroke="${f.main}" stroke-width="4.6" stroke-linecap="round" fill="none"/>
      <circle cx="38.8" cy="26" r="2.4" fill="${f.face}"/>
    </g>
    <g class="g-arm-rest">
      <path d="M33.4 37 Q37.4 41 36.6 46.4" stroke="${f.main}" stroke-width="4.6" stroke-linecap="round" fill="none"/>
      <circle cx="36.6" cy="47" r="2.2" fill="${f.face}"/>
    </g>
  </g>
  <!-- the pine tree it hides behind while napping -->
  <g class="g-tree">
    <rect x="11.6" y="44" width="3" height="8.6" rx=".8" fill="#6b4a2e"/>
    <path d="M13.1 20 L21.8 33.4 L4.4 33.4 Z" fill="#2f7d4a"/>
    <path d="M13.1 26 L23.6 41.2 L2.6 41.2 Z" fill="#2a7043"/>
    <path d="M13.1 33 L25.4 47.6 L0.8 47.6 Z" fill="#25643c"/>
    <path d="M9 30.6 l2.4 -1 M15.4 37.4 l2.6 -.8 M7.4 44 l2.6 -.9 M17 44.6 l2.6 -.7" stroke="#3f9a5e" stroke-width=".8" stroke-linecap="round"/>
  </g>
</svg>`;
  }

  window.PACKS.bigfoot = { id: 'bigfoot', name: 'Bigfoot', characters: CHARACTERS, draw };
})();
