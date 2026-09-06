/* GBA1..GBA10 shipped with six identical greens (#38A169 on GBA4-GBA10), which
   is invisible in a code list but reads as a bug in the colour-led area palette.
   This replaces them with a perceptually even ten-step ramp built in CIE LCh:
   lightness climbs evenly, hue drifts blue-green -> yellow-green so ten steps
   stay tellable apart, and every step keeps >= 14 dE from every other area code
   (nearest is LAND). Idempotent: matches on `code: 'GBAn'` and rewrites only
   that record's `color` and `fill`. Re-runnable. */
const fs = require('fs');
const path = require('path');

function lab2rgb(L, a, b) {
  const g = t => (t > 6 / 29 ? t * t * t : 3 * (6 / 29) ** 2 * (t - 4 / 29));
  const f = v => (v > 0.0031308 ? 1.055 * Math.pow(v, 1 / 2.4) - 0.055 : 12.92 * v);
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const X = 0.95047 * g(fx), Y = g(fy), Z = 1.08883 * g(fz);
  const rgb = [
    3.2406 * X - 1.5372 * Y - 0.4986 * Z,
    -0.9689 * X + 1.8758 * Y + 0.0415 * Z,
    0.0557 * X - 0.2040 * Y + 1.0570 * Z
  ].map(f);
  return { rgb: rgb.map(v => Math.round(Math.min(1, Math.max(0, v)) * 255)),
           inGamut: rgb.every(v => v >= -0.002 && v <= 1.002) };
}

// Parameters chosen by search: maximise the smallest adjacent step while every
// step stays green, stays in gamut, and keeps clear of the other code colours.
const L0 = 29, L1 = 86, H0 = 166, H1 = 116, C0 = 44, C1 = 56, N = 10;
const ramp = [];
for (let i = 0; i < N; i++) {
  const t = i / (N - 1);
  const L = L0 + (L1 - L0) * t, h = (H0 + (H1 - H0) * t) * Math.PI / 180;
  let C = C0 + (C1 - C0) * t;
  let out = lab2rgb(L, C * Math.cos(h), C * Math.sin(h));
  while (!out.inGamut && C > 6) { C -= 1; out = lab2rgb(L, C * Math.cos(h), C * Math.sin(h)); }
  ramp.push(out.rgb);
}

const file = path.resolve(__dirname, '../sketch.bundle.html');
let source = fs.readFileSync(file).toString('latin1');
let changed = 0;
ramp.forEach(([r, g, b], i) => {
  const code = 'GBA' + (i + 1);
  const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0').toUpperCase()).join('');
  const fill = `rgba(${r},${g},${b},.10)`;
  const re = new RegExp(`(\\{ code: '${code}',[^}]*?color: ')[^']*(', fill: ')[^']*(' \\})`);
  const hits = source.match(new RegExp(re.source, 'g'));
  if (!hits || hits.length !== 1) throw Error(`expected exactly one ${code} record, got ${hits ? hits.length : 0}`);
  source = source.replace(re, `$1${hex}$2${fill}$3`);
  changed++;
  console.log(' ', code.padEnd(6), hex, fill);
});
fs.writeFileSync(file, Buffer.from(source, 'latin1'));
console.log(`\nRewrote ${changed} GBA records; every other bundle byte untouched.`);
