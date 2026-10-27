import * as THREE from 'three';
import { trs } from './kit.js';
import { WATER_LEVEL } from './estilo.js';
import { smoothPath, smoothstep, mix } from './terreno.js';

const TAU = Math.PI * 2;

/* ---------- Formas de apoio ---------- */

export function pyramid(k, w, d, h, x = 0, y = 0, z = 0) {
  let g = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4);
  g.rotateY(Math.PI / 4);
  g.translate(0, 0.5, 0);
  g.scale(w, h, d);
  g = g.toNonIndexed();
  g.computeVertexNormals();
  k.add(g, trs(x, y, z));
}

export function roundedRect(x0, z0, x1, z1, r = 1.5, steps = 4) {
  const pts = [];
  const corners = [
    [x1 - r, z0 + r, -Math.PI / 2],
    [x1 - r, z1 - r, 0],
    [x0 + r, z1 - r, Math.PI / 2],
    [x0 + r, z0 + r, Math.PI],
  ];
  for (const [cx, cz, a0] of corners) {
    for (let i = 0; i <= steps; i++) {
      const a = a0 + (i / steps) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
    }
  }
  return pts;
}

export function platform(k, x0, z0, x1, z1, { h = 0.3, r = 1.6 } = {}) {
  k.slab(roundedRect(x0, z0, x1, z1, r), h, 0, { bevel: 0.08 });
}

export function parapet(k, w, d, y, { h = 0.55, t = 0.28 } = {}) {
  k.box(w, h, t, 0, y, -d / 2 + t / 2);
  k.box(w, h, t, 0, y, d / 2 - t / 2);
  k.box(t, h, d - t * 2, -w / 2 + t / 2, y, 0);
  k.box(t, h, d - t * 2, w / 2 - t / 2, y, 0);
}

// Laje do telhado com mureta e equipamentos, como os topos da referência.
export function rooftop(k, w, d, y, amount = 2) {
  parapet(k, w, d, y);
  const spots = [
    [-1, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
  ];
  for (let i = 0; i < Math.min(amount, 4); i++) {
    const bw = k.rand(1.2, Math.max(1.3, w * 0.32));
    const bd = k.rand(1.2, Math.max(1.3, d * 0.32));
    const [sx, sz] = spots[(i + Math.floor(k.rand(0, 4))) % 4];
    const x = sx * (w / 2 - 0.7 - bw / 2) * k.rand(0.3, 1);
    const z = sz * (d / 2 - 0.7 - bd / 2) * k.rand(0.3, 1);
    k.box(bw, k.rand(0.5, 1.2), bd, x, y, z, { bevel: 0.08 });
  }
}

/* ---------- Cidade ---------- */

export function tower(k, { w = 8, d = 8, h = 20, style = 'bands', floor = 3, top = 2, crown = false } = {}) {
  if (style === 'bands') {
    k.box(w - 0.5, h, d - 0.5, 0, 0, 0, { bevel: 0.08 });
    for (let y = floor; y < h - 0.6; y += floor) k.box(w, 0.32, d, 0, y - 0.16, 0, { bevel: 0.05 });
    k.box(w, 0.5, d, 0, h - 0.5, 0, { bevel: 0.06 });
  } else if (style === 'fins') {
    k.box(w - 0.2, h, d - 0.2, 0, 0, 0, { bevel: 0.08 });
    const nx = Math.max(2, Math.round(w / 1.5));
    const nz = Math.max(2, Math.round(d / 1.5));
    for (let i = 0; i < nx; i++) {
      const x = -w / 2 + 0.35 + (i * (w - 0.7)) / (nx - 1);
      k.box(0.16, h - 0.4, 0.4, x, 0, d / 2 - 0.1);
      k.box(0.16, h - 0.4, 0.4, x, 0, -d / 2 + 0.1);
    }
    for (let i = 0; i < nz; i++) {
      const z = -d / 2 + 0.35 + (i * (d - 0.7)) / (nz - 1);
      k.box(0.4, h - 0.4, 0.16, w / 2 - 0.1, 0, z);
      k.box(0.4, h - 0.4, 0.16, -w / 2 + 0.1, 0, z);
    }
    k.box(w + 0.2, 0.5, d + 0.2, 0, h - 0.5, 0, { bevel: 0.06 });
  } else if (style === 'grid') {
    k.box(w - 0.7, h, d - 0.7, 0, 0, 0);
    for (let y = 0; y < h - 0.5; y += floor) k.box(w, 0.9, d, 0, y, 0, { bevel: 0.04 });
    k.box(w, 0.9, d, 0, h - 0.9, 0, { bevel: 0.04 });
    const nx = Math.max(2, Math.round(w / 2.1));
    const nz = Math.max(2, Math.round(d / 2.1));
    for (let i = 0; i <= nx; i++) {
      const x = -w / 2 + 0.25 + (i * (w - 0.5)) / nx;
      k.box(0.5, h, 0.36, x, 0, d / 2 - 0.18);
      k.box(0.5, h, 0.36, x, 0, -d / 2 + 0.18);
    }
    for (let i = 0; i <= nz; i++) {
      const z = -d / 2 + 0.25 + (i * (d - 0.5)) / nz;
      k.box(0.36, h, 0.5, w / 2 - 0.18, 0, z);
      k.box(0.36, h, 0.5, -w / 2 + 0.18, 0, z);
    }
  } else {
    k.box(w, h, d, 0, 0, 0, { bevel: 0.1 });
  }
  rooftop(k, w, d, h, top);
  if (crown) {
    const cw = w * 0.5;
    const cd = d * 0.5;
    k.box(cw, 2.2, cd, 0, h, 0, { bevel: 0.08 });
    parapet(k, cw, cd, h + 2.2, { h: 0.4, t: 0.22 });
  }
}

export function steppedTower(k, { w = 4.6, d = 8, heights = [11, 16, 21], style = 'fins' } = {}) {
  heights.forEach((h, i) => {
    const x = (i - (heights.length - 1) / 2) * (w - 0.15);
    k.local(x, 0, -i * 1.1, 0, () => tower(k, { w, d, h, style, top: 1 }));
  });
}

export function apartments(k, { w = 12, d = 8, floors = 5, balconies = true } = {}) {
  const fh = 2.9;
  const h = floors * fh + 0.4;
  k.box(w, h, d, 0, 0, 0, { bevel: 0.1 });
  for (let f = 1; f < floors; f++) k.box(w + 0.2, 0.22, d + 0.2, 0, f * fh, 0);
  if (balconies) {
    const n = Math.max(2, Math.round(w / 3.4));
    for (let f = 1; f < floors; f++) {
      for (let i = 0; i < n; i++) {
        const x = -w / 2 + (i + 0.5) * (w / n);
        k.box(2.1, 0.18, 1.1, x, f * fh + 0.05, d / 2 + 0.55);
        k.box(2.1, 0.8, 0.12, x, f * fh + 0.23, d / 2 + 1.04);
      }
    }
  }
  rooftop(k, w, d, h, 2);
}

export function house(k, { w = 4.2, d = 5.4, floors = 1, roof = 'gable', pitch = 0.55, chimney = true, porch = false } = {}) {
  const H = floors * 2.7;
  const rh = (w + 0.7) * pitch * 0.5;
  k.box(w, H, d, 0, 0, 0, { bevel: 0.06 });
  if (roof === 'gable') {
    k.prism(w + 0.7, rh, d + 0.6, 0, H, 0);
  } else if (roof === 'hip') {
    pyramid(k, w + 0.6, d + 0.6, rh, 0, H, 0);
  } else {
    k.box(w + 0.3, 0.3, d + 0.3, 0, H, 0, { bevel: 0.05 });
    parapet(k, w + 0.3, d + 0.3, H + 0.3, { h: 0.3, t: 0.2 });
  }
  k.box(0.95, 1.85, 0.12, w * 0.2, 0, d / 2 + 0.04);
  for (let f = 0; f < floors; f++) {
    const y = 0.95 + f * 2.7;
    k.box(0.85, 0.95, 0.1, -w * 0.22, y, d / 2 + 0.03);
    if (f > 0) k.box(0.85, 0.95, 0.1, w * 0.2, y, d / 2 + 0.03);
    k.box(0.1, 0.95, 0.85, w / 2 + 0.03, y, -d * 0.18);
    k.box(0.1, 0.95, 0.85, -w / 2 - 0.03, y, d * 0.12);
  }
  if (porch) {
    k.box(w + 0.4, 0.22, 1.8, 0, 0, d / 2 + 0.9);
    k.box(w + 0.6, 0.18, 2.0, 0, 2.3, d / 2 + 1.0);
    k.box(0.16, 2.3, 0.16, -w / 2, 0, d / 2 + 1.75);
    k.box(0.16, 2.3, 0.16, w / 2, 0, d / 2 + 1.75);
  }
  if (chimney && roof !== 'flat') {
    k.box(0.55, rh + 0.7, 0.55, -w * 0.22, H + rh * 0.15, -d * 0.22);
    return { chimney: [-w * 0.22, H + rh * 1.15 + 0.75, -d * 0.22] };
  }
  return {};
}

export function modernHouse(k, { w = 6, d = 5 } = {}) {
  k.box(w, 2.8, d, 0, 0, 0, { bevel: 0.06 });
  k.box(w * 0.7, 2.6, d + 1.2, w * 0.2, 2.8, -0.2, { bevel: 0.06 });
  k.box(w * 0.7 + 0.2, 0.18, d + 1.4, w * 0.2, 5.4, -0.2);
  k.box(w * 0.4, 0.12, 2.0, -w * 0.25, 2.8, d / 2 + 0.2);
  k.box(1.6, 1.6, 0.08, -w * 0.18, 0.7, d / 2 + 0.03);
  k.box(1.8, 1.5, 0.08, w * 0.3, 3.4, d / 2 + 0.43);
}

export function rowHouse(k, { w = 3.6, d = 8, floors = 4, gable = 'step' } = {}) {
  const fh = 2.6;
  const H = floors * fh;
  k.box(w, H, d, 0, 0, 0, { bevel: 0.05 });
  k.prism(w - 0.1, w * 0.72, d - 0.5, 0, H, -0.25);
  const fz = d / 2 - 0.17;
  if (gable === 'step') {
    [1, 0.72, 0.46, 0.22].forEach((s, i) => k.box(w * s, 0.62, 0.34, 0, H + i * 0.62, fz));
  } else if (gable === 'bell') {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      pts.push([mix(w / 2, w * 0.16, t), Math.sin(t * Math.PI * 0.5) * 2.2]);
    }
    for (let i = 10; i >= 0; i--) pts.push([-pts[i][0], pts[i][1]]);
    k.profile(pts, 0.34, 0, H, fz);
    k.box(w * 0.36, 0.3, 0.38, 0, H + 2.2, fz);
  } else {
    k.profile([[-w / 2, 0], [w / 2, 0], [0, w * 0.75]], 0.34, 0, H, fz);
  }
  for (let f = 0; f < floors; f++) {
    const y = 0.6 + f * fh;
    for (const s of [-1, 1]) k.box(0.9, 1.45, 0.1, s * w * 0.22, y, d / 2 + 0.03);
  }
  k.box(w + 0.1, 0.16, d + 0.1, 0, fh - 0.1, 0);
  k.box(1.0, 0.3, 0.9, 0, 0, d / 2 + 0.45);
}

export function church(k, { w = 7, d = 13, h = 6, towerH = 12 } = {}) {
  k.box(w, h, d, 0, 0, 0, { bevel: 0.06 });
  k.prism(w + 0.5, w * 0.55, d + 0.4, 0, h, 0);
  const tz = d / 2 + 1.0;
  k.box(3.4, towerH, 3.4, 0, 0, tz, { bevel: 0.06 });
  k.box(3.9, 0.35, 3.9, 0, towerH - 0.35, tz, { bevel: 0.05 });
  for (const [x, z, ry] of [[0, tz + 1.72, 0], [0, tz - 1.72, 0], [1.72, tz, Math.PI / 2], [-1.72, tz, Math.PI / 2]]) {
    k.box(1.1, 2.0, 0.1, x, towerH - 3.1, z, { ry });
  }
  pyramid(k, 3.7, 3.7, 6, 0, towerH, tz);
  k.cylinder(0.05, 0.05, 1.4, 0, towerH + 5.8, tz, { segments: 4 });
  k.box(0.7, 0.06, 0.06, 0, towerH + 6.6, tz);
  k.box(1.3, 2.4, 0.12, 0, 0, tz + 1.74);
  for (let i = 0; i < 4; i++) {
    const z = -d / 2 + 2.2 + i * ((d - 4) / 3);
    k.box(0.1, 2.4, 0.8, w / 2 + 0.03, 1.8, z);
    k.box(0.1, 2.4, 0.8, -w / 2 - 0.03, 1.8, z);
  }
  k.cylinder(w * 0.34, w * 0.34, h * 0.8, 0, 0, -d / 2, { start: Math.PI / 2, length: Math.PI, segments: 18 });
}

/* ---------- Rural ---------- */

export function barn(k, { w = 8, d = 12, h = 4.2 } = {}) {
  k.box(w, h, d, 0, 0, 0, { bevel: 0.06 });
  const o = 0.35;
  k.profile([[-w / 2 - o, 0], [w / 2 + o, 0], [w * 0.33, 2.0], [0, 3.1], [-w * 0.33, 2.0]], d + 0.6, 0, h, 0);
  const fz = d / 2 + 0.05;
  k.box(3.4, 3.3, 0.14, 0, 0, fz);
  k.beam([-1.6, 0.1, fz + 0.1], [1.6, 3.2, fz + 0.1], 0.16, 0.12);
  k.beam([1.6, 0.1, fz + 0.1], [-1.6, 3.2, fz + 0.1], 0.16, 0.12);
  k.box(1.5, 1.3, 0.14, 0, h + 0.5, d / 2 + 0.32);
  k.box(w * 0.55, h * 0.62, d * 0.5, w / 2 + w * 0.27, 0, -d * 0.15, { bevel: 0.05 });
  k.profile([[0, 0], [w * 0.6, -1.0], [w * 0.6, -0.8], [0, 0.2]], d * 0.55, w / 2, h * 0.62 + 1.0, -d * 0.15);
}

export function silo(k, { r = 1.9, h = 10 } = {}) {
  k.cylinder(r, r, h, 0, 0, 0, { segments: 22 });
  for (let y = 2.2; y < h - 0.5; y += 2.2) k.cylinder(r + 0.07, r + 0.07, 0.16, 0, y, 0, { segments: 22 });
  k.dome(r + 0.05, 0, h, 0, { sy: 0.72, segments: 22 });
  k.cylinder(0.35, 0.35, 0.3, 0, h + r * 0.7, 0, { segments: 10 });
}

export function grainBin(k, { r = 1.9, h = 4 } = {}) {
  k.cylinder(r, r, h, 0, 0, 0, { segments: 22 });
  k.cone(r + 0.18, 1.3, 0, h, 0, { segments: 22 });
  k.cylinder(0.3, 0.3, 0.35, 0, h + 1.2, 0, { segments: 8 });
}

export function waterTower(k, { h = 8 } = {}) {
  const s = 1.3;
  for (const [x, z] of [[-s, -s], [s, -s], [s, s], [-s, s]]) k.beam([x * 1.35, 0, z * 1.35], [x, h, z], 0.22);
  const brace = s * mix(1.35, 1, 0.45);
  k.box(brace * 2, 0.2, 0.2, 0, h * 0.45, -brace);
  k.box(brace * 2, 0.2, 0.2, 0, h * 0.45, brace);
  k.cylinder(2.1, 2.1, 2.8, 0, h, 0, { segments: 20 });
  k.cone(2.3, 1.2, 0, h + 2.8, 0, { segments: 20 });
}

export function greenhouse(k, { w = 6, d = 14 } = {}) {
  const r = w / 2;
  const arc = [];
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * Math.PI;
    arc.push([Math.cos(a) * r, Math.sin(a) * r * 0.8]);
  }
  k.profile(arc, d, 0, 0.3, 0);
  k.box(w + 0.2, 0.3, d + 0.2, 0, 0, 0, { bevel: 0.05 });
  for (let z = -d / 2 + 0.5; z <= d / 2 - 0.4; z += 2) {
    const band = [];
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI;
      band.push([Math.cos(a) * (r + 0.07), Math.sin(a) * (r + 0.07) * 0.8]);
    }
    for (let i = 16; i >= 0; i--) {
      const a = (i / 16) * Math.PI;
      band.push([Math.cos(a) * (r - 0.02), Math.sin(a) * (r - 0.02) * 0.8]);
    }
    k.profile(band, 0.14, 0, 0.3, z);
  }
}

export function windpump(k, { h = 9 } = {}) {
  const s = 1.1;
  for (const [x, z] of [[-s, -s], [s, -s], [s, s], [-s, s]]) k.beam([x, 0, z], [x * 0.18, h, z * 0.18], 0.14);
  for (const y of [h * 0.3, h * 0.6]) {
    const f = 1 - (y / h) * 0.82;
    k.box(s * 2 * f, 0.1, 0.1, 0, y, -s * f);
    k.box(s * 2 * f, 0.1, 0.1, 0, y, s * f);
  }
  k.box(0.5, 0.5, 1.2, 0, h, 0, { bevel: 0.1 });
  k.profile([[0, 0], [0, 1.4], [-2.6, 0.5], [-2.6, 0.1]], 0.06, 0, h + 0.1, 0, { ry: -Math.PI / 2 });
  k.local(0, h + 0.25, 0.75, 0, () => {
    k.child(
      (c) => {
        c.cylinder(0.25, 0.25, 0.3, 0, 0, 0, { rx: Math.PI / 2, segments: 10, center: true });
        for (let i = 0; i < 14; i++) radial(c, (i / 14) * TAU, 0.3, () => c.box(0.32, 1.6, 0.05, 0, 0, 0));
      },
      (o, t) => {
        o.rotation.z = -t * 1.6;
      },
    );
  });
}

// Gira uma peça em volta do eixo z, começando a `inner` do centro (pás, hélices).
function radial(k, angle, inner, fn) {
  k.stack.push(k.matrix);
  k.matrix = k.matrix.clone().multiply(trs(-Math.sin(angle) * inner, Math.cos(angle) * inner, 0, 0, 1, 1, 1, 0, angle));
  fn();
  k.matrix = k.stack.pop();
}

export function windTurbine(k, { h = 17, blade = 7.5, speed = 0.9 } = {}) {
  k.cylinder(1.3, 1.5, 0.5, 0, 0, 0, { segments: 18 });
  k.cylinder(0.32, 0.62, h, 0, 0.5, 0, { segments: 16 });
  k.box(1.1, 1.1, 3.0, 0, h + 0.2, -0.4, { bevel: 0.4 });
  const phase = k.rand(0, TAU);
  k.local(0, h + 0.75, 1.35, 0, () => {
    k.child(
      (c) => {
        c.sphere(0.55, 0, 0, 0, { sz: 1.4 });
        for (let i = 0; i < 3; i++) {
          radial(c, (i / 3) * TAU, 0.3, () => {
            c.profile([[-0.42, 0], [0.42, 0], [0.12, blade], [-0.08, blade]], 0.16, 0, 0, 0);
          });
        }
      },
      (o, t) => {
        o.rotation.z = phase + t * speed;
      },
    );
  });
}

export function tractor(k) {
  k.box(1.5, 0.9, 2.6, 0, 0.6, 0.3, { bevel: 0.15 });
  k.box(1.4, 1.3, 1.3, 0, 1.4, -0.4, { bevel: 0.12 });
  k.box(1.55, 0.12, 1.5, 0, 2.7, -0.4);
  for (const x of [-1.0, 1.0]) {
    k.cylinder(0.75, 0.75, 0.5, x, 0.75, -0.7, { rz: Math.PI / 2, segments: 16, center: true });
    k.cylinder(0.42, 0.42, 0.35, x * 0.88, 0.42, 1.25, { rz: Math.PI / 2, segments: 12, center: true });
  }
  k.cylinder(0.08, 0.08, 0.9, 0.4, 1.5, 1.1, { segments: 6 });
}

export function cabin(k, { w = 5, d = 6.5, h = 5 } = {}) {
  const half = w / 2;
  const slant = Math.hypot(half, h);
  const angle = Math.atan2(half, h);
  k.box(0.3, slant, d, -half, 0, 0, { rz: -angle });
  k.box(0.3, slant, d, half, 0, 0, { rz: angle });
  k.prism(w - 0.9, h - 0.65, d - 0.9, 0, 0, 0);
  k.box(w + 1.0, 0.25, 2.2, 0, 0, d / 2 + 0.6);
  k.prism(w * 0.42, h * 0.45, 0.1, 0, 0.9, (d - 0.9) / 2 + 0.03);
  k.cylinder(0.14, 0.14, 1.6, half * 0.45, h * 0.62, -d * 0.2, { segments: 8 });
}

export function lodge(k, { w = 12, d = 7 } = {}) {
  k.box(w, 3.2, d, 0, 0, 0, { bevel: 0.08 });
  k.prism(d + 0.8, 2.4, w + 0.8, 0, 3.2, 0, { ry: Math.PI / 2 });
  k.box(w * 0.4, 2.6, d * 0.7, -w * 0.18, 3.2, 0, { bevel: 0.06 });
  k.prism(w * 0.4 + 0.6, 1.8, d * 0.7 + 0.6, -w * 0.18, 5.8, 0);
  k.box(w + 1.2, 0.25, 2.4, 0, 0, d / 2 + 1.2);
  k.box(0.8, 4.4, 0.8, w * 0.3, 3.2, -d * 0.2);
  for (let i = 0; i < 4; i++) k.box(1.4, 1.2, 0.1, -w / 2 + 1.8 + i * ((w - 3.6) / 3), 1.1, d / 2 + 0.03);
}

export function fireTower(k, { h = 12 } = {}) {
  const s = 1.2;
  for (const [x, z] of [[-s, -s], [s, -s], [s, s], [-s, s]]) k.beam([x * 1.5, 0, z * 1.5], [x, h, z], 0.2);
  for (const y of [h * 0.33, h * 0.66]) {
    const f = mix(1.5, 1, y / h);
    k.box(s * 2 * f, 0.12, 0.12, 0, y, -s * f);
    k.box(s * 2 * f, 0.12, 0.12, 0, y, s * f);
    k.box(0.12, 0.12, s * 2 * f, -s * f, y, 0);
    k.box(0.12, 0.12, s * 2 * f, s * f, y, 0);
  }
  k.box(3.4, 0.2, 3.4, 0, h, 0);
  k.box(2.8, 1.8, 2.8, 0, h + 0.2, 0, { bevel: 0.06 });
  pyramid(k, 3.6, 3.6, 1.3, 0, h + 2.0, 0);
}

/* ---------- Porto e água ---------- */

function hullShape(length, beam, bow) {
  const L = length / 2;
  const B = beam / 2;
  const start = L - length * bow;
  const s = new THREE.Shape();
  s.moveTo(-L, -B * 0.92);
  s.lineTo(start, -B);
  s.quadraticCurveTo(L * 0.97, -B * 0.82, L, 0);
  s.quadraticCurveTo(L * 0.97, B * 0.82, start, B);
  s.lineTo(-L, B * 0.92);
  s.quadraticCurveTo(-L - B * 0.22, 0, -L, -B * 0.92);
  return s;
}

// Casco visto de cima, extrudado para cima e afinando em V embaixo.
export function hull(k, length, beam, height, y0, { bow = 0.3, bevel = 0.22 } = {}) {
  const g = new THREE.ExtrudeGeometry(hullShape(length - bevel * 2, beam - bevel * 2, bow), {
    depth: height - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 10,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0 + bevel, 0);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = smoothstep(y0, y0 + height * 0.65, pos.getY(i));
    pos.setZ(i, pos.getZ(i) * mix(0.45, 1, t));
  }
  g.computeVertexNormals();
  k.add(g);
}

export function cargoShip(k, { length = 46, beam = 9, load = 0.85 } = {}) {
  const L = length / 2;
  hull(k, length, beam, 4.4, -2.4, { bow: 0.2, bevel: 0.3 });
  k.box(length * 0.12, 1.0, beam - 0.6, L - length * 0.08, 2.0, 0);
  const sx = -L + 5.2;
  k.box(5.2, 5.4, beam - 1.6, sx, 2.0, 0, { bevel: 0.12 });
  for (let y = 3.2; y < 7; y += 1.35) k.box(5.3, 0.16, beam - 1.5, sx, y, 0);
  k.box(2.6, 0.9, beam + 0.4, sx + 0.8, 6.6, 0, { bevel: 0.1 });
  k.box(3.6, 1.1, beam - 3, sx, 7.4, 0, { bevel: 0.1 });
  k.box(1.8, 3.4, 2.2, sx - 2.7, 7.0, 0, { bevel: 0.2 });
  const start = sx + 3.6;
  const end = L - length * 0.15;
  const rows = Math.floor((beam - 1.2) / 2.5);
  for (let x = start; x + 6.1 <= end; x += 6.5) {
    for (let r = 0; r < rows; r++) {
      const z = -((rows - 1) * 2.5) / 2 + r * 2.5;
      const tiers = k.chance(load) ? 1 + Math.floor(k.rand(0, 4)) : 0;
      for (let t = 0; t < tiers; t++) k.box(6.05, 2.5, 2.4, x + 3.05, 2.0 + t * 2.55, z);
    }
  }
}

export function fishingBoat(k, { length = 7 } = {}) {
  const beam = length * 0.36;
  hull(k, length, beam, 1.7, -0.75, { bow: 0.36, bevel: 0.14 });
  k.box(length * 0.26, 1.35, beam * 0.7, -length * 0.14, 0.95, 0, { bevel: 0.1 });
  k.box(length * 0.3, 0.12, beam * 0.8, -length * 0.14, 2.3, 0);
  k.cylinder(0.07, 0.09, 3.4, length * 0.16, 0.95, 0, { segments: 6 });
  k.beam([length * 0.16, 3.6, 0], [-length * 0.32, 1.3, 0], 0.08);
  k.beam([length * 0.16, 3.9, 0], [length * 0.46, 1.0, 0], 0.05);
}

export function sailboat(k, { length = 7, sails = true } = {}) {
  const beam = length * 0.32;
  hull(k, length, beam, 1.25, -0.6, { bow: 0.42, bevel: 0.14 });
  k.box(length * 0.3, 0.5, beam * 0.55, -length * 0.04, 0.6, 0, { bevel: 0.15 });
  const mx = length * 0.06;
  const mh = length * 1.35;
  k.cylinder(0.05, 0.07, mh, mx, 0.6, 0, { segments: 6 });
  if (sails) {
    k.profile([[0, 0], [-length * 0.42, 0], [0, mh * 0.88]], 0.05, mx - 0.08, 1.4, 0);
    k.profile([[0, 0], [length * 0.36, 0], [0, mh * 0.8]], 0.05, mx + 0.1, 1.0, 0);
  } else {
    k.beam([mx, 1.5, 0], [mx - length * 0.42, 1.5, 0], 0.09);
  }
}

export function ferry(k, { length = 24, beam = 8 } = {}) {
  hull(k, length, beam, 2.8, -1.4, { bow: 0.26, bevel: 0.25 });
  k.box(length * 0.72, 2.1, beam - 0.6, -length * 0.04, 1.4, 0, { bevel: 0.18 });
  k.box(length * 0.72 + 0.12, 0.6, beam - 0.48, -length * 0.04, 2.3, 0);
  k.box(length * 0.5, 1.8, beam - 1.8, -length * 0.08, 3.5, 0, { bevel: 0.18 });
  k.box(length * 0.5 + 0.12, 0.5, beam - 1.68, -length * 0.08, 4.2, 0);
  k.box(3.2, 1.3, beam * 0.62, length * 0.12, 5.3, 0, { bevel: 0.15 });
  k.box(1.5, 2.1, 1.7, -length * 0.22, 5.3, 0, { bevel: 0.25 });
}

export function tugboat(k, { length = 9 } = {}) {
  const beam = length * 0.42;
  hull(k, length, beam, 2.1, -1.0, { bow: 0.38, bevel: 0.25 });
  k.box(length * 0.36, 1.5, beam * 0.62, length * 0.06, 1.1, 0, { bevel: 0.12 });
  k.box(length * 0.22, 1.1, beam * 0.55, length * 0.12, 2.6, 0, { bevel: 0.1 });
  k.box(0.8, 1.6, 0.9, -length * 0.08, 2.6, 0, { bevel: 0.15 });
  k.cylinder(0.06, 0.06, 1.6, length * 0.14, 3.7, 0, { segments: 6 });
}

export function motorboat(k, { length = 6 } = {}) {
  const beam = length * 0.36;
  hull(k, length, beam, 1.1, -0.5, { bow: 0.4, bevel: 0.14 });
  k.box(length * 0.24, 0.5, beam * 0.7, -length * 0.04, 0.6, 0, { bevel: 0.14 });
  k.box(0.08, 0.45, beam * 0.66, length * 0.1, 0.6, 0, { rz: -0.55 });
}

export function rowboat(k, { length = 3.6 } = {}) {
  const beam = length * 0.38;
  hull(k, length, beam, 0.6, -0.25, { bow: 0.45, bevel: 0.1 });
  k.box(0.25, 0.12, beam * 0.8, 0, 0.35, 0);
  k.box(0.25, 0.12, beam * 0.7, -length * 0.25, 0.35, 0);
}

export function canalBoat(k, { length = 12 } = {}) {
  const beam = 2.6;
  hull(k, length, beam, 1.1, -0.5, { bow: 0.25, bevel: 0.14 });
  k.box(length * 0.62, 1.05, beam - 0.5, -length * 0.06, 0.6, 0, { bevel: 0.22 });
  k.box(length * 0.62 + 0.08, 0.32, beam - 0.42, -length * 0.06, 1.0, 0);
}

export function houseboat(k, { length = 11 } = {}) {
  k.box(length, 0.9, 3.6, 0, -0.5, 0, { bevel: 0.2 });
  k.box(length * 0.8, 2.4, 3.0, -length * 0.05, 0.4, 0, { bevel: 0.08 });
  k.prism(3.5, 0.9, length * 0.82, -length * 0.05, 2.8, 0, { ry: Math.PI / 2 });
  k.box(1.0, 1.0, 0.08, length * 0.1, 1.0, 1.52);
  k.box(1.0, 1.0, 0.08, -length * 0.22, 1.0, 1.52);
}

export function pier(k, { length = 20, width = 3, deck = 0.25, spacing = 3.2, bollards = true } = {}) {
  k.box(width, 0.3, length, 0, deck, length / 2, { bevel: 0.05 });
  const bottom = WATER_LEVEL - 2;
  for (let z = 1; z < length; z += spacing) {
    for (const x of [-width / 2 + 0.25, width / 2 - 0.25]) {
      k.cylinder(0.16, 0.16, deck - bottom, x, bottom, z, { segments: 8 });
    }
  }
  if (bollards) {
    for (let z = 3; z < length - 1; z += 6) {
      k.instance('bollard', -width / 2 + 0.35, deck + 0.3, z);
      k.instance('bollard', width / 2 - 0.35, deck + 0.3, z);
    }
  }
}

export function floatingDock(k, { length = 30, width = 2.4, fingers = 6, fingerLength = 8, side = 1 } = {}) {
  const y = WATER_LEVEL + 0.12;
  k.box(width, 0.32, length, 0, y, length / 2, { bevel: 0.06 });
  const gap = length / (fingers + 0.5);
  const slips = [];
  for (let i = 0; i < fingers; i++) {
    const z = gap * (i + 0.75);
    k.box(fingerLength, 0.28, 1.0, side * (width / 2 + fingerLength / 2), y, z, { bevel: 0.05 });
    if (i < fingers - 1) slips.push(z + gap / 2);
  }
  return slips;
}

export function breakwater(k, points, { width = 4, seed = 0 } = {}) {
  const path = smoothPath(points, Math.max(8, Math.round(points.length * 10)));
  for (let i = 0; i < path.length; i++) {
    const [x, z] = path[i];
    const r = k.rand(1.0, 1.7) * (width / 4);
    const g = new THREE.IcosahedronGeometry(r, 0);
    k.add(g, trs(x + k.rand(-0.5, 0.5), WATER_LEVEL + k.rand(-0.2, 0.3), z + k.rand(-0.5, 0.5), k.rand(0, TAU), 1, k.rand(0.6, 0.85), 1, k.rand(0, 1), k.rand(0, 1)));
  }
}

export function rock(k, x, y, z, r) {
  k.add(new THREE.IcosahedronGeometry(r, 0), trs(x, y, z, k.rand(0, TAU), 1, k.rand(0.55, 0.85), 1, k.rand(0, 1)));
}

// Ponte corcunda com um arco, como as de canal. Comprimento em x, largura em z.
export function archBridge(k, { length = 16, width = 4.5, hump = 1.6, base = 0.15 } = {}) {
  const L = length / 2;
  const crown = base + hump;
  const control = 2 * crown - base;
  const bottom = WATER_LEVEL - 2;
  const r = L - 1.5;
  const cy = crown - 0.6 - r;
  const a0 = Math.asin(Math.max(-1, Math.min(1, (bottom - cy) / r)));
  const body = new THREE.Shape();
  body.moveTo(-L, base);
  body.quadraticCurveTo(0, control, L, base);
  body.lineTo(L, bottom);
  body.lineTo(Math.cos(a0) * r, bottom);
  body.absarc(0, cy, r, a0, Math.PI - a0, false);
  body.lineTo(-L, bottom);
  body.lineTo(-L, base);
  k.extrude(body, width, 0, 0, 0, { curve: 16 });
  const rail = new THREE.Shape();
  rail.moveTo(-L, base);
  rail.quadraticCurveTo(0, control, L, base);
  rail.lineTo(L, base + 0.65);
  rail.quadraticCurveTo(0, control + 0.65, -L, base + 0.65);
  rail.lineTo(-L, base);
  for (const z of [-width / 2 + 0.2, width / 2 - 0.2]) k.extrude(rail, 0.4, 0, 0, z, { curve: 16 });
}

export function lighthouse(k, { h = 11 } = {}) {
  k.cylinder(2.2, 2.5, 0.8, 0, 0, 0, { segments: 22 });
  k.cylinder(0.95, 1.45, h, 0, 0.8, 0, { segments: 22 });
  for (const t of [0.22, 0.58]) {
    const r = mix(1.45, 0.95, t + 0.08) + 0.05;
    k.cylinder(r - 0.02, r + 0.05, h * 0.16, 0, 0.8 + h * t, 0, { segments: 22 });
  }
  const top = 0.8 + h;
  k.cylinder(1.5, 1.3, 0.3, 0, top, 0, { segments: 22 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    k.box(0.06, 0.6, 0.06, Math.cos(a) * 1.4, top + 0.3, Math.sin(a) * 1.4);
  }
  k.cylinder(1.42, 1.42, 0.07, 0, top + 0.85, 0, { segments: 22 });
  k.cylinder(0.72, 0.72, 1.3, 0, top + 0.3, 0, { segments: 14 });
  k.cone(0.95, 1.0, 0, top + 1.6, 0, { segments: 14 });
  k.sphere(0.16, 0, top + 2.65, 0, { detail: 1 });
}

export function portCrane(k, { span = 11, gauge = 10, height = 15, outreach = 24, backreach = 9 } = {}) {
  const legs = [[-span / 2, -gauge / 2], [span / 2, -gauge / 2], [span / 2, gauge / 2], [-span / 2, gauge / 2]];
  for (const [x, z] of legs) {
    k.box(0.75, height, 0.75, x, 0, z, { bevel: 0.05 });
    k.box(1.0, 0.7, 2.0, x, 0, z, { bevel: 0.1 });
  }
  for (const z of [-gauge / 2, gauge / 2]) {
    k.box(span + 0.75, 0.8, 0.8, 0, height * 0.42, z);
    k.box(span + 0.75, 1.0, 0.95, 0, height - 1.0, z);
  }
  for (const x of [-span / 2, span / 2]) k.box(0.95, 1.0, gauge + 0.9, x, height - 1.0, 0);
  const z0 = -gauge / 2 - backreach;
  const z1 = gauge / 2 + outreach;
  for (const x of [-1.5, 1.5]) k.box(0.65, 1.3, z1 - z0, x, height, (z0 + z1) / 2);
  for (let z = z0 + 1; z < z1; z += 3.2) k.box(3.6, 0.22, 0.22, 0, height + 0.55, z);
  k.box(4.4, 2.4, 6.2, 0, height + 1.3, z0 + 3.6, { bevel: 0.12 });
  const apex = [0, height + 9, -gauge / 2 + 1];
  for (const x of [-1.5, 1.5]) {
    k.beam([x * 2.6, height + 1.1, -gauge / 2], [x * 0.25, apex[1], apex[2]], 0.45);
    k.beam([x * 2.6, height + 1.1, gauge / 2], [x * 0.25, apex[1], apex[2]], 0.45);
    k.beam([x * 0.25, apex[1], apex[2]], [x, height + 1.2, z1 - 5], 0.16);
    k.beam([x * 0.25, apex[1], apex[2]], [x, height + 1.2, z0 + 1], 0.16);
  }
  k.box(1.6, 0.6, 1.4, 0, apex[1] - 0.3, apex[2], { bevel: 0.1 });
  const phase = k.rand(0, TAU);
  k.local(0, height + 0.45, gauge / 2, 0, () => {
    k.child(
      (c) => {
        c.box(3.4, 0.9, 2.6, 0, 0, 0, { bevel: 0.1 });
        c.box(1.8, 1.5, 1.6, 0.6, -1.6, 0, { bevel: 0.15 });
        c.box(2.6, 0.3, 6.1, 0, -6.4, 0);
        c.beam([0, -0.1, 0], [0, -6.1, 0], 0.1);
      },
      (o, t) => {
        const along = (Math.sin(t * 0.35 + phase) * 0.5 + 0.5) * (outreach - 6);
        o.position.copy(o.userData.origin.position);
        o.translateZ(along);
      },
    );
  });
}

export function containers(k, { cols = 6, rows = 4, tiers = 4, fill = 0.85 } = {}) {
  const sx = 6.4;
  const sz = 2.75;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (!k.chance(fill)) continue;
      const n = 1 + Math.floor(k.rand(0, tiers));
      const x = (i - (cols - 1) / 2) * sx;
      const z = (j - (rows - 1) / 2) * sz;
      for (let t = 0; t < n; t++) k.box(6.05, 2.5, 2.42, x, t * 2.56, z);
    }
  }
}

export function warehouse(k, { w = 14, d = 28, h = 6, roof = 'arch', doors = 4 } = {}) {
  k.box(w, h, d, 0, 0, 0, { bevel: 0.08 });
  if (roof === 'arch') {
    const rise = Math.min(3, w * 0.18);
    const half = w / 2 + 0.3;
    const R = (half * half + rise * rise) / (2 * rise);
    const a0 = Math.asin(half / R);
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const a = -a0 + (i / 16) * a0 * 2;
      pts.push([Math.sin(a) * R, Math.cos(a) * R - (R - rise)]);
    }
    k.profile(pts, d + 0.5, 0, h, 0);
  } else if (roof === 'saw') {
    const n = Math.max(2, Math.round(d / 4.5));
    const L = d / n;
    for (let i = 0; i < n; i++) {
      k.profile([[0, 0], [L, 0], [L, 1.8]], w, 0, h, -d / 2 + i * L, { ry: -Math.PI / 2 });
    }
  } else {
    k.prism(w + 0.5, w * 0.16, d + 0.5, 0, h, 0);
  }
  for (let i = 0; i < doors; i++) {
    const z = -d / 2 + (i + 0.5) * (d / doors);
    k.box(0.14, h * 0.6, Math.min(3.4, d / doors - 1), w / 2 + 0.05, 0, z);
  }
  k.box(1.2, 0.18, d * 0.9, w / 2 + 0.6, h * 0.62, 0);
}

/* ---------- Ruas e campo ---------- */

export function car(k, { truck = false } = {}) {
  if (truck) {
    k.box(2.2, 2.0, 2.2, 0, 0.45, 3.1, { bevel: 0.2 });
    k.box(2.3, 2.5, 6.0, 0, 0.6, -1.2, { bevel: 0.06 });
    k.box(2.0, 0.3, 8.2, 0, 0.35, 0);
    for (const z of [3.0, -0.4, -3.4]) {
      for (const x of [-1.0, 1.0]) k.cylinder(0.45, 0.45, 0.35, x, 0.45, z, { rz: Math.PI / 2, segments: 10, center: true });
    }
    return;
  }
  k.box(1.75, 0.68, 3.9, 0, 0.28, 0, { bevel: 0.24 });
  k.box(1.5, 0.58, 2.0, 0, 0.88, -0.25, { bevel: 0.22 });
  for (const z of [1.25, -1.25]) {
    for (const x of [-0.8, 0.8]) k.cylinder(0.33, 0.33, 0.24, x, 0.33, z, { rz: Math.PI / 2, segments: 10, center: true });
  }
}

export function bench(k) {
  k.box(1.8, 0.1, 0.6, 0, 0.45, 0);
  k.box(1.8, 0.45, 0.08, 0, 0.55, -0.28);
  k.box(0.12, 0.45, 0.5, -0.75, 0, 0);
  k.box(0.12, 0.45, 0.5, 0.75, 0, 0);
}

export function fountain(k, { r = 3 } = {}) {
  k.cylinder(r + 0.1, r + 0.25, 0.25, 0, 0, 0, { segments: 28 });
  k.cylinder(r - 0.1, r - 0.1, 0.42, 0, 0.1, 0, { segments: 28 });
  k.torus(r - 0.05, 0.2, 0, 0.5, 0, { sy: 0.9 });
  k.cylinder(0.5, 0.7, 1.4, 0, 0, 0, { segments: 14 });
  k.cylinder(1.3, 0.9, 0.3, 0, 1.4, 0, { segments: 18 });
  k.cylinder(0.25, 0.35, 0.8, 0, 1.7, 0, { segments: 10 });
  k.sphere(0.32, 0, 2.6, 0, { detail: 1 });
}

export function court(k, { w = 14, d = 26 } = {}) {
  k.box(w, 0.12, d, 0, 0, 0, { bevel: 0.04 });
  const y = 0.12;
  const t = 0.16;
  k.box(w - 1.4, 0.03, t, 0, y, d / 2 - 0.7);
  k.box(w - 1.4, 0.03, t, 0, y, -d / 2 + 0.7);
  k.box(t, 0.03, d - 1.4, w / 2 - 0.7, y, 0);
  k.box(t, 0.03, d - 1.4, -w / 2 + 0.7, y, 0);
  k.box(w - 1.4, 0.03, t, 0, y, 0);
  k.torus(2.0, 0.08, 0, y, 0, { sy: 0.25 });
  for (const s of [-1, 1]) {
    k.box(3.2, 1.6, 0.12, 0, y, s * (d / 2 - 0.9));
  }
}

export function playground(k) {
  k.box(8, 0.12, 8, 0, 0, 0, { bevel: 0.04 });
  k.box(1.6, 1.8, 1.6, -2, 0.12, -2, { bevel: 0.1 });
  k.box(1.6, 0.12, 1.8, -2, 1.9, -2);
  k.box(0.9, 0.1, 3.8, -2, 0.12, 0.2, { rx: -0.42 });
  k.beam([1.2, 0.1, 1.5], [2.2, 2.6, 1.5], 0.12);
  k.beam([3.2, 0.1, 1.5], [2.2, 2.6, 1.5], 0.12);
  k.beam([1.2, 0.1, -1.5], [2.2, 2.6, -1.5], 0.12);
  k.beam([3.2, 0.1, -1.5], [2.2, 2.6, -1.5], 0.12);
  k.box(0.14, 0.14, 3.2, 2.2, 2.55, 0);
  k.box(0.7, 0.08, 0.4, 2.2, 0.8, 0.6);
  k.box(0.7, 0.08, 0.4, 2.2, 0.8, -0.6);
  k.cylinder(1.5, 1.5, 0.25, 1.5, 0.12, -3, { segments: 20 });
}

// Estrada em fita que acompanha o terreno, levemente elevada.
export function road(k, points, { width = 4, h = 0.1, closed = false, spacing = 1 } = {}) {
  let length = 0;
  for (let i = 1; i < points.length; i++) length += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  const pts = smoothPath(points, Math.max(4, Math.ceil(length / spacing)), closed);
  const positions = [];
  const L = [];
  const R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const tx = b[0] - a[0];
    const tz = b[1] - a[1];
    const len = Math.hypot(tx, tz) || 1;
    const nx = -tz / len;
    const nz = tx / len;
    const [x, z] = pts[i];
    const lx = x + nx * width * 0.5;
    const lz = z + nz * width * 0.5;
    const rx = x - nx * width * 0.5;
    const rz = z - nz * width * 0.5;
    const y = Math.max(k.height(x, z), k.height(lx, lz), k.height(rx, rz));
    L.push([lx, y + h, lz, y - 0.3]);
    R.push([rx, y + h, rz, y - 0.3]);
  }
  const push = (...vs) => vs.forEach((v) => positions.push(...v));
  for (let i = 0; i < pts.length - 1; i++) {
    const lt0 = [L[i][0], L[i][1], L[i][2]];
    const lt1 = [L[i + 1][0], L[i + 1][1], L[i + 1][2]];
    const rt0 = [R[i][0], R[i][1], R[i][2]];
    const rt1 = [R[i + 1][0], R[i + 1][1], R[i + 1][2]];
    const lb0 = [L[i][0], L[i][3], L[i][2]];
    const lb1 = [L[i + 1][0], L[i + 1][3], L[i + 1][2]];
    const rb0 = [R[i][0], R[i][3], R[i][2]];
    const rb1 = [R[i + 1][0], R[i + 1][3], R[i + 1][2]];
    push(lt0, lt1, rt1, lt0, rt1, rt0);
    push(lb0, lb1, lt1, lb0, lt1, lt0);
    push(rb0, rt1, rb1, rb0, rt0, rt1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.computeVertexNormals();
  k.add(g);
}

export function fence(k, points, { spacing = 2.4, h = 1.0 } = {}) {
  for (let i = 1; i < points.length; i++) {
    const [ax, az] = points[i - 1];
    const [bx, bz] = points[i];
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.round(len / spacing));
    for (let j = 0; j <= n; j++) {
      if (j === 0 && i > 1) continue;
      const x = mix(ax, bx, j / n);
      const z = mix(az, bz, j / n);
      k.instance('post', x, k.height(x, z), z, { sy: h });
    }
    for (let j = 0; j < n; j++) {
      const x0 = mix(ax, bx, j / n);
      const z0 = mix(az, bz, j / n);
      const x1 = mix(ax, bx, (j + 1) / n);
      const z1 = mix(az, bz, (j + 1) / n);
      const y0 = k.height(x0, z0);
      const y1 = k.height(x1, z1);
      for (const f of [0.45, 0.85]) k.beam([x0, y0 + h * f, z0], [x1, y1 + h * f, z1], 0.08, 0.1);
    }
  }
}

// Canteiros em fileiras, divididos em trechos para acompanhar o terreno.
export function field(k, x0, z0, x1, z1, { dir = 'x', spacing = 1.3, kind = 'rows' } = {}) {
  k.reserveRect(x0, z0, x1, z1);
  if (kind === 'orchard') {
    for (let x = x0 + 1.5; x < x1 - 1; x += 3.4) {
      for (let z = z0 + 1.5; z < z1 - 1; z += 3.4) k.instance('round', x, k.height(x, z), z, { s: k.rand(0.48, 0.6), ry: k.rand(0, TAU) });
    }
    return;
  }
  if (kind === 'hay') {
    for (let i = 0; i < ((x1 - x0) * (z1 - z0)) / 22; i++) {
      const x = k.rand(x0 + 1, x1 - 1);
      const z = k.rand(z0 + 1, z1 - 1);
      k.instance('hay', x, k.height(x, z), z, { ry: k.rand(0, TAU) });
    }
    return;
  }
  const along = dir === 'x';
  const [a0, a1, b0, b1] = along ? [x0, x1, z0, z1] : [z0, z1, x0, x1];
  const ridge = kind === 'stripes' ? 0.14 : 0.34;
  const width = kind === 'stripes' ? spacing * 0.55 : 0.62;
  const bevel = kind === 'stripes' ? 0.05 : 0.16;
  for (let b = b0 + spacing / 2; b < b1; b += spacing) {
    const segs = Math.max(1, Math.ceil((a1 - a0) / 7));
    const segLen = (a1 - a0) / segs;
    for (let s = 0; s < segs; s++) {
      const a = a0 + segLen * (s + 0.5);
      const [x, z] = along ? [a, b] : [b, a];
      const y = Math.min(k.height(x, z), k.height(along ? a - segLen / 2 : b, along ? b : a - segLen / 2), k.height(along ? a + segLen / 2 : b, along ? b : a + segLen / 2));
      if (along) k.box(segLen + 0.02, ridge + 0.15, width, x, y - 0.15, z, { bevel, segments: 1 });
      else k.box(width, ridge + 0.15, segLen + 0.02, x, y - 0.15, z, { bevel, segments: 1 });
    }
  }
}

// Espalha árvores sem encostar em prédios reservados nem cair na água.
export function scatter(k, { inside, bounds, count, minDist = 2.6, types = [['round', 1]], scale = [0.8, 1.2], minHeight = -0.1 }) {
  const [x0, z0, x1, z1] = bounds;
  const cell = minDist;
  const grid = new Map();
  const key = (x, z) => `${Math.floor(x / cell)},${Math.floor(z / cell)}`;
  const total = types.reduce((s, t) => s + t[1], 0);
  let placed = 0;
  for (let attempt = 0; attempt < count * 25 && placed < count; attempt++) {
    const x = k.rand(x0, x1);
    const z = k.rand(z0, z1);
    if (inside && !inside(x, z)) continue;
    if (!k.isFree(x, z)) continue;
    const y = k.height(x, z);
    if (y < minHeight) continue;
    let ok = true;
    const cx = Math.floor(x / cell);
    const cz = Math.floor(z / cell);
    for (let i = -1; i <= 1 && ok; i++) {
      for (let j = -1; j <= 1 && ok; j++) {
        for (const [px, pz] of grid.get(`${cx + i},${cz + j}`) || []) {
          if ((px - x) ** 2 + (pz - z) ** 2 < minDist * minDist) {
            ok = false;
            break;
          }
        }
      }
    }
    if (!ok) continue;
    const k2 = key(x, z);
    if (!grid.has(k2)) grid.set(k2, []);
    grid.get(k2).push([x, z]);
    let r = k.rand(0, total);
    let type = types[0][0];
    for (const [t, w] of types) {
      if ((r -= w) <= 0) {
        type = t;
        break;
      }
    }
    k.instance(type, x, y - 0.05, z, { s: k.rand(scale[0], scale[1]), ry: k.rand(0, TAU) });
    placed++;
  }
  return placed;
}

export function treeRow(k, points, { spacing = 4, type = 'round', scale = [0.8, 1.0] } = {}) {
  for (let i = 1; i < points.length; i++) {
    const [ax, az] = points[i - 1];
    const [bx, bz] = points[i];
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.round(len / spacing));
    for (let j = i === 1 ? 0 : 1; j <= n; j++) {
      const x = mix(ax, bx, j / n);
      const z = mix(az, bz, j / n);
      if (!k.isFree(x, z)) continue;
      k.instance(type, x, k.height(x, z) - 0.05, z, { s: k.rand(scale[0], scale[1]), ry: k.rand(0, TAU) });
    }
  }
}

/* ---------- Movimento ---------- */

// Faz um objeto percorrer uma rota. `forward` diz qual eixo local é a frente.
export function follow(points, { speed = 3, offset = 0, closed = true, forward = 'z', y = null, bob = 0, pingpong = false, height } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)), closed, 'centripetal');
  const length = curve.getLength();
  const p = new THREE.Vector3();
  const tan = new THREE.Vector3();
  return (o, t) => {
    let u = (offset + (t * speed) / length) % 1;
    let dir = 1;
    if (pingpong) {
      const phase = (offset + (t * speed) / length) % 2;
      const raw = phase < 1 ? phase : 2 - phase;
      dir = phase < 1 ? 1 : -1;
      u = raw * raw * (3 - 2 * raw);
    }
    curve.getPointAt(u, p);
    curve.getTangentAt(u, tan).multiplyScalar(dir);
    const base = y ?? (height ? height(p.x, p.z) : 0);
    o.position.set(p.x, base + (bob ? Math.sin(t * 1.4 + offset * 20) * bob : 0), p.z);
    o.rotation.set(0, forward === 'x' ? Math.atan2(-tan.z, tan.x) : Math.atan2(tan.x, tan.z), bob ? Math.sin(t * 1.1 + offset * 9) * 0.03 : 0);
  };
}

export function bobbing(amount = 0.08, roll = 0.025) {
  return (o, t) => {
    const s = o.userData.seed ?? (o.userData.seed = Math.random() * 10);
    o.position.y = o.userData.origin.position.y + Math.sin(t * 1.3 + s) * amount;
    o.rotation.x = Math.sin(t * 1.1 + s * 2) * roll;
  };
}

export function smoke(k, x, y, z, { puffs = 4, rise = 3.6, size = 0.7, period = 5 } = {}) {
  for (let i = 0; i < puffs; i++) {
    k.local(x, y, z, 0, () => {
      k.child(
        (c) => c.sphere(1, 0, 0, 0, { detail: 1 }),
        (o, t) => {
          const u = ((t / period + i / puffs) % 1 + 1) % 1;
          const s = size * Math.sin(Math.PI * Math.min(1, u * 1.15)) * (0.55 + u);
          o.scale.setScalar(Math.max(0.001, s));
          o.position.set(o.userData.origin.position.x + u * 0.8, o.userData.origin.position.y + u * rise, o.userData.origin.position.z - u * 0.4);
        },
      );
    });
  }
}
