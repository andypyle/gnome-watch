// Cat pack. Same tools and poses as the gnomes; every cat has its own coat, and a collar in its
// own color (that's also its progress-bar color). Tails swish while they work.
(function () {
  const { toolSVG, toolAngleFor } = window.packTools;
  const INK = '#2a2024';
  const OUTLINE = 'rgba(60, 40, 30, 0.18)'; // keeps light coats readable on light backgrounds
  const PINK = '#f2a7b5';

  const CHARACTERS = [
    { name: 'Marmalade', role: 'the Tinker', hat: '#d9483b', tool: 'hammer',
      coat: { fur: '#e8954a', mark: '#c46f2a', chest: '#fbe6cc', paw: '#fbe6cc', eye: '#7cb55a', pattern: 'tabby' } },
    { name: 'Clover', role: 'the Gardener', hat: '#2f9e5b', tool: 'can',
      coat: { fur: '#f7f1e8', mark: '#e8954a', mark2: '#3a3236', chest: '#ffffff', paw: '#ffffff', eye: '#c9b13a', pattern: 'calico' } },
    { name: 'Smudge', role: 'the Painter', hat: '#3b7dd9', tool: 'brush',
      coat: { fur: '#9aa0a8', mark: '#6e747c', chest: '#e6e8eb', paw: '#e6e8eb', eye: '#d9a63a', pattern: 'tabby', smudge: true } },
    { name: 'Shadow', role: 'the Detective', hat: '#8a5cd6', tool: 'magnifier',
      coat: { fur: '#34303a', mark: '#34303a', chest: '#3e3945', paw: '#3e3945', eye: '#f2c12e', pattern: 'solid' } },
    { name: 'Hazel', role: 'the Miner', hat: '#e08a1e', tool: 'pickaxe',
      coat: { fur: '#8b6a4f', mark: '#5e4632', chest: '#ead8c0', paw: '#ead8c0', eye: '#8fbf4a', pattern: 'tabby' } },
    { name: 'Socks', role: 'the Mechanic', hat: '#d64f9a', tool: 'wrench',
      coat: { fur: '#34303a', mark: '#34303a', chest: '#f4f1ec', paw: '#f4f1ec', eye: '#7cc26a', pattern: 'tuxedo' } },
    { name: 'Moonbeam', role: 'the Night Owl', hat: '#159a9c', tool: 'lantern',
      coat: { fur: '#f4f1ec', mark: '#e4ddd2', chest: '#ffffff', paw: '#ffffff', eye: '#6fa8e8', pattern: 'solid' } },
    { name: 'Toffee', role: 'the Digger', hat: '#c9a227', tool: 'shovel',
      coat: { fur: '#efe3cf', mark: '#5b4636', chest: '#f8f0e2', paw: '#5b4636', eye: '#5d9fe0', pattern: 'siamese' } },
  ];
  type Char = (typeof CHARACTERS)[number];

  // Cat-only animation: tails swish (faster while working, slow while idle, still while napping).
  const css = document.createElement('style');
  css.textContent = `
    .pack-cats .g-tail { transform-origin: 31px 47px; animation: tail-swish 2.6s ease-in-out infinite; }
    .pack-cats.st-working .g-tail { animation-duration: 1.1s; }
    .pack-cats.st-waiting .g-tail { animation-duration: 0.7s; }
    .pack-cats.st-sleeping .g-tail, .pack-cats.st-ended .g-tail { animation: none; transform: rotate(38deg); }
    @keyframes tail-swish { 0%, 100% { transform: rotate(-8deg); } 50% { transform: rotate(12deg); } }
  `;
  document.head.appendChild(css);

  function markings(k: Char['coat']): string {
    switch (k.pattern) {
      case 'tabby':
        return `<path d="M21.6 17.4 L22.2 20.4 M24 16.8 L24 20.2 M26.4 17.4 L25.8 20.4" stroke="${k.mark}" stroke-width="1.3" stroke-linecap="round"/>
                <path d="M14.6 24.4 L17.4 25 M14.8 26.8 L17.4 26.8 M33.4 24.4 L30.6 25 M33.2 26.8 L30.6 26.8" stroke="${k.mark}" stroke-width="1.1" stroke-linecap="round"/>`;
      case 'calico':
        return `<path d="M15 19.6 Q16.6 16 21 16.6 Q21.4 20.4 18.8 22.4 Q15.8 22.4 15 19.6 Z" fill="${k.mark}"/>
                <path d="M33 19.8 Q32 16.6 27.8 16.8 Q27.4 19.8 29.6 21.6 Q32.4 21.8 33 19.8 Z" fill="${k.mark2}"/>`;
      case 'siamese':
        return `<ellipse cx="24" cy="27.6" rx="5.6" ry="4.6" fill="${k.mark}" opacity=".55"/>`;
      default:
        return '';
    }
  }

  function bodyMarkings(k: Char['coat']): string {
    if (k.pattern === 'tabby')
      return `<path d="M15.4 41 Q17.4 41.6 18.2 43.4 M14.8 45 Q16.8 45.4 17.6 47 M32.6 41 Q30.6 41.6 29.8 43.4 M33.2 45 Q31.2 45.4 30.4 47" stroke="${k.mark}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
    if (k.pattern === 'calico')
      return `<path d="M28.4 38.6 Q33.4 38.4 33.8 44 Q31 45.4 28.6 43.2 Z" fill="${k.mark}"/>
              <path d="M14.6 44.6 Q16.6 41.4 19.4 43.4 Q19 47.4 15.4 48 Z" fill="${k.mark2}"/>`;
    return '';
  }

  function draw(c: Char, size: number): string {
    const k = c.coat;
    const toolAngle = toolAngleFor(c.tool);
    const earColor = k.pattern === 'siamese' ? k.mark : k.fur;
    const tailColor = k.pattern === 'siamese' ? k.mark : k.pattern === 'calico' ? k.mark2 : k.fur;
    const muzzle = k.pattern === 'tuxedo' || k.pattern === 'calico' ? '#ffffff' : k.chest;
    return `
<svg class="gnome-svg pack-cats tool-${c.tool}" viewBox="0 0 48 56" width="${size}" height="${(size * 56) / 48}" aria-hidden="true">
  <ellipse class="g-shadow" cx="24" cy="53" rx="13" ry="2.5"/>
  <g class="g-tail">
    <path d="M31 47.4 Q40.6 46.6 41.4 38.6 Q41.8 33.6 38.4 32.6" stroke="${tailColor}" stroke-width="3.6" stroke-linecap="round" fill="none"/>
    ${k.pattern === 'tabby' ? `<path d="M39.6 44.2 l1.9 1.2 M41.2 39.6 l2.1 .3 M40.4 35.2 l1.9 -.9" stroke="${k.mark}" stroke-width="1.2" stroke-linecap="round"/>` : ''}
  </g>
  <g class="g-body">
    <ellipse cx="19" cy="50.6" rx="3.6" ry="2.1" fill="${k.paw}"/>
    <ellipse cx="29" cy="50.6" rx="3.6" ry="2.1" fill="${k.paw}"/>
    <path d="M13.8 48.6 Q12.6 36.6 24 32.4 Q35.4 36.6 34.2 48.6 Q33.8 51.6 24 51.6 Q14.2 51.6 13.8 48.6 Z" fill="${k.fur}" stroke="${OUTLINE}" stroke-width=".7"/>
    ${bodyMarkings(k)}
    <path d="M19.6 37.6 Q24 35.4 28.4 37.6 Q28.8 45 24 49.4 Q19.2 45 19.6 37.6 Z" fill="${k.chest}"/>
    <path d="M15 38 Q11.4 41 12.4 45" stroke="${k.fur}" stroke-width="4" stroke-linecap="round" fill="none"/>
    <circle cx="12.6" cy="45.5" r="2.1" fill="${k.paw}"/>
    <g class="g-head">
      <!-- pointy ears -->
      <path d="M14.4 21.6 L14.2 10.6 L21.4 16 Z" fill="${earColor}" stroke="${OUTLINE}" stroke-width=".7" stroke-linejoin="round"/>
      <path d="M33.6 21.6 L33.8 10.6 L26.6 16 Z" fill="${earColor}" stroke="${OUTLINE}" stroke-width=".7" stroke-linejoin="round"/>
      <path d="M15.6 18.8 L15.6 13.2 L19.6 16.4 Z" fill="${PINK}"/>
      <path d="M32.4 18.8 L32.4 13.2 L28.4 16.4 Z" fill="${PINK}"/>
      <!-- wide round cat head -->
      <ellipse cx="24" cy="24.6" rx="10.4" ry="8.8" fill="${k.fur}"/>
      <!-- outline only around the top, so there's no seam where the head meets the body -->
      <path d="M13.8 26.4 A10.4 8.8 0 1 1 34.2 26.4" fill="none" stroke="${OUTLINE}" stroke-width=".7"/>
      ${markings(k)}
      ${k.pattern === 'tuxedo' ? `<path d="M19 33 Q19.6 26.8 24 25.4 Q28.4 26.8 29 33 Q24 34.4 19 33 Z" fill="#f4f1ec"/>` : ''}
      <ellipse cx="22.2" cy="28.6" rx="2.3" ry="1.8" fill="${muzzle}"/>
      <ellipse cx="25.8" cy="28.6" rx="2.3" ry="1.8" fill="${muzzle}"/>
      <path d="M22.9 26.6 L25.1 26.6 L24 27.9 Z" fill="${PINK}"/>
      <path d="M24 27.9 L24 28.8 M24 28.8 Q22.9 30 21.9 29 M24 28.8 Q25.1 30 26.1 29" stroke="${INK}" stroke-width=".7" fill="none" stroke-linecap="round"/>
      <path d="M19.6 28 L14.2 27.2 M19.6 29.2 L14.4 30 M28.4 28 L33.8 27.2 M28.4 29.2 L33.6 30" stroke="${k.pattern === 'solid' && k.fur === '#34303a' ? '#bdb6c4' : '#8a7f78'}" stroke-width=".55" stroke-linecap="round" opacity=".8"/>
      <g class="g-eyes-open">
        <ellipse cx="20" cy="23.6" rx="1.7" ry="1.9" fill="${k.eye}"/>
        <ellipse cx="28" cy="23.6" rx="1.7" ry="1.9" fill="${k.eye}"/>
        <ellipse class="g-eye" cx="20" cy="23.7" rx=".7" ry="1.6" fill="${INK}"/>
        <ellipse class="g-eye" cx="28" cy="23.7" rx=".7" ry="1.6" fill="${INK}"/>
        <circle cx="20.5" cy="23" r=".45" fill="#fff"/>
        <circle cx="28.5" cy="23" r=".45" fill="#fff"/>
      </g>
      <g class="g-eyes-closed" stroke="${k.fur === '#34303a' ? '#e8e2ec' : INK}" stroke-width="1.1" stroke-linecap="round" fill="none">
        <path d="M18.6 23.8 Q20 25 21.4 23.8"/><path d="M26.6 23.8 Q28 25 29.4 23.8"/>
      </g>
      <circle cx="17.6" cy="27" r="1.3" fill="${PINK}" opacity=".45"/>
      <circle cx="30.4" cy="27" r="1.3" fill="${PINK}" opacity=".45"/>
      ${k.smudge ? `<ellipse cx="30.2" cy="20.4" rx="1.4" ry=".9" fill="${c.hat}" opacity=".85" transform="rotate(-20 30.2 20.4)"/>` : ''}
    </g>
    <!-- collar in this cat's color, with a little bell, sitting right on the neck -->
    <path d="M17.6 32 Q24 35.2 30.4 32 L30.6 34.2 Q24 37.6 17.4 34.2 Z" fill="${c.hat}"/>
    <circle cx="24" cy="36.4" r="1.6" fill="#f2c94c" stroke="#b8902a" stroke-width=".5"/>
    <g class="g-arm-tool">
      <path d="M33 38 Q37 39.5 38 42" stroke="${k.fur}" stroke-width="4" stroke-linecap="round" fill="none"/>
      <g class="g-tool" transform="translate(38.3 42.6) rotate(${toolAngle})">${toolSVG(c.tool, c)}</g>
      <circle cx="38.3" cy="42.6" r="2.1" fill="${k.paw}"/>
    </g>
    <g class="g-arm-wave">
      <path d="M33 38 Q38 34 38.5 28" stroke="${k.fur}" stroke-width="4" stroke-linecap="round" fill="none"/>
      <circle cx="38.6" cy="27" r="2.3" fill="${k.paw}"/>
    </g>
    <g class="g-arm-rest">
      <path d="M33 38 Q36.8 41 35.6 45" stroke="${k.fur}" stroke-width="4" stroke-linecap="round" fill="none"/>
      <circle cx="35.5" cy="45.5" r="2.1" fill="${k.paw}"/>
    </g>
  </g>
</svg>`;
  }

  window.PACKS.cats = { id: 'cats', name: 'Cats', characters: CHARACTERS, draw };
})();
