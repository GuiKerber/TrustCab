import { WATER_LEVEL as WL } from './estilo.js';
import { carve, polygonDistance, polylineDistance, bump, smoothstep } from './terreno.js';
import * as P from './pecas.js';

const TAU = Math.PI * 2;

// Casa com chaminé fumegando (fumaça em bolinhas de argila).
function smokyHouse(k, o) {
  const { chimney } = P.house(k, o);
  if (chimney) P.smoke(k, chimney[0], chimney[1], chimney[2], { size: 0.5, rise: 3 });
}

function mooredBoat(k, piece, x, z, ry, options = {}) {
  k.local(x, WL, z, ry, () => k.child((c) => piece(c, options), P.bobbing(0.07, 0.03)));
}

/* ---------- Ajudantes de cidade ---------- */

function streetMarks(k, lines, from, to, cross) {
  for (const { axis, at } of lines) {
    for (let s = from; s < to; s += 4.5) {
      if (cross.some((c) => Math.abs(s + 0.9 - c) < 4.5)) continue;
      if (axis === 'x') k.box(1.8, 0.03, 0.22, s + 0.9, 0, at);
      else k.box(0.22, 0.03, 1.8, at, 0, s + 0.9);
    }
  }
  for (const cx of cross) {
    for (const cz of cross) {
      for (let i = -2; i <= 2; i++) {
        k.box(0.5, 0.03, 2.4, cx + i * 1.0, 0, cz - 4.6);
        k.box(2.4, 0.03, 0.5, cx - 4.6, 0, cz + i * 1.0);
      }
    }
  }
}

function blockLoop(cx, cz, half, lane) {
  const a = half + lane;
  return [
    [cx - a, cz - a],
    [cx + a, cz - a],
    [cx + a, cz + a],
    [cx - a, cz + a],
  ];
}

function driveLoop(k, points, count, speed = 6, truck = false) {
  for (let i = 0; i < count; i++) {
    k.child((c) => P.car(c, { truck }), P.follow(points, { speed, offset: i / count, closed: true, y: 0 }));
  }
}

function walkers(k, points, count, speed = 0.9, y = 0.3) {
  for (let i = 0; i < count; i++) {
    k.child((c) => c.instance('person'), P.follow(points, { speed, offset: i / count + 0.1, closed: true, y }));
  }
}

/* ---------- 01 · Centro financeiro ---------- */

const centro = {
  id: 'centro',
  name: 'Centro financeiro',
  kind: 'Urbano',
  description: 'Torres escalonadas em volta de uma praça com chafariz, ruas com faixas e um parque na esquina.',
  alt: 'Maquete 3D de um centro urbano com torres, praça arborizada e ruas com carros.',
  seed: 11,
  extent: 70,
  camera: { target: [-2, 4, -2], distance: 195, elevation: 44, azimuth: 45, fog: [0.85, 1.75] },
  build(k) {
    const B = 26;
    const half = 10;
    const centers = [-B, 0, B];
    for (const x of [-2 * B, ...centers, 2 * B]) {
      for (const z of [-2 * B, ...centers, 2 * B]) {
        P.platform(k, x - half, z - half, x + half, z + half, { h: 0.3 });
      }
    }
    streetMarks(
      k,
      [-39, -13, 13, 39].flatMap((at) => [{ axis: 'x', at }, { axis: 'z', at }]),
      -64,
      64,
      [-39, -13, 13, 39],
    );
    const on = { y: 0.3 };

    // Torre-símbolo no fundo, como foco.
    k.place(P.steppedTower, -B, -B, { ...on, foot: [16, 10], heights: [16, 22, 29], w: 5, d: 9, style: 'fins' });
    k.place(P.tower, -B + 4, -B + 7, { ...on, w: 6, d: 4, h: 7, style: 'bands' });

    k.place(P.tower, -3, -B - 3, { ...on, foot: [9, 9], w: 9, d: 9, h: 25, style: 'grid', crown: true });
    k.place(P.tower, 5, -B + 4, { ...on, foot: [7, 7], w: 7, d: 7, h: 15, style: 'bands' });

    k.place(P.tower, -B - 3, 3, { ...on, foot: [8, 9], w: 8, d: 9, h: 20, style: 'fins' });
    k.place(P.tower, -B + 5, -4, { ...on, foot: [6, 6], w: 6, d: 6, h: 11, style: 'bands' });

    // Praça central.
    k.place(P.fountain, 0, 0, { ...on, r: 3.4 });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      k.instance('round', Math.cos(a) * 7.2, 0.25, Math.sin(a) * 7.2, { s: 0.8, ry: a });
    }
    for (const [x, z, ry] of [[4.6, 0, Math.PI / 2], [-4.6, 0, -Math.PI / 2], [0, 4.6, 0], [0, -4.6, Math.PI]]) {
      k.place(P.bench, x, z, { ...on, ry });
    }
    for (const [x, z] of [[-8.5, -8.5], [8.5, -8.5], [8.5, 8.5], [-8.5, 8.5]]) k.instance('lamp', x, 0.3, z, { ry: Math.atan2(-x, -z) - Math.PI / 2 });
    for (let i = 0; i < 14; i++) {
      const a = k.rand(0, TAU);
      const r = k.rand(4.4, 6.2);
      k.instance('person', Math.cos(a) * r, 0.3, Math.sin(a) * r, { ry: k.rand(0, TAU) });
    }
    walkers(k, [[-5, -5], [5, -5], [5, 5], [-5, 5]], 3, 0.8);

    // Lado direito: blocos residenciais.
    k.place(P.apartments, B, -B - 3, { ...on, foot: [16, 8], w: 16, d: 8, floors: 5 });
    k.place(P.apartments, B + 1, -B + 6, { ...on, foot: [12, 6], w: 12, d: 6, floors: 3 });
    P.treeRow(k, [[B - 8, -B + 9], [B + 8, -B + 9]], { spacing: 4, type: 'round', scale: [0.7, 0.8] });

    // Lado esquerdo.
    k.place(P.apartments, -B, B - 2, { ...on, foot: [9, 14], w: 14, d: 9, floors: 6, ry: Math.PI / 2 });
    k.place(P.tower, -B + 5, B + 5, { ...on, foot: [7, 7], w: 7, d: 7, h: 12, style: 'grid' });

    // Frente.
    k.place(P.tower, B - 3, -2, { ...on, foot: [8, 8], w: 8, d: 8, h: 13, style: 'bands' });
    k.place(P.tower, B + 5, 5, { ...on, foot: [6, 7], w: 6, d: 7, h: 8, style: 'plain' });
    k.place(P.tower, -2, B - 3, { ...on, foot: [8, 8], w: 8, d: 8, h: 15, style: 'fins' });
    k.place(P.apartments, 4, B + 5, { ...on, foot: [10, 6], w: 10, d: 6, floors: 3, balconies: false });

    // Parque na esquina da frente.
    k.place(P.playground, B + 4, B + 4, { ...on });
    P.scatter(k, {
      bounds: [B - 9, B - 9, B + 9, B + 9],
      count: 22,
      minDist: 3.2,
      types: [['oak', 2], ['round', 2], ['bush', 1]],
      scale: [0.65, 0.95],
    });

    // Quarteirões de borda, baixos, somem na névoa.
    for (const [x, z] of [[-2 * B, -B], [-2 * B, 0], [-B, -2 * B], [0, -2 * B], [2 * B, -B], [-B, 2 * B], [-2 * B, B], [B, -2 * B]]) {
      k.place(P.tower, x - 3, z - 2, { ...on, foot: [9, 8], w: 9, d: 8, h: k.rand(6, 12), style: k.pick(['bands', 'grid', 'plain']) });
      k.place(P.apartments, x + 4, z + 4, { ...on, foot: [10, 6], w: 10, d: 6, floors: 2 + Math.floor(k.rand(0, 3)), balconies: false });
    }
    for (const [x, z] of [[2 * B, 0], [0, 2 * B], [2 * B, B], [B, 2 * B], [2 * B, 2 * B], [-2 * B, 2 * B], [2 * B, -2 * B], [-2 * B, -2 * B]]) {
      P.scatter(k, { bounds: [x - 9, z - 9, x + 9, z + 9], count: 12, minDist: 3.4, types: [['round', 2], ['oak', 1]], scale: [0.7, 0.95] });
    }

    driveLoop(k, blockLoop(0, 0, 13, -1.4), 3, 7);
    driveLoop(k, blockLoop(-B, -B, 13, 1.4), 2, 6);
    driveLoop(k, blockLoop(B, B, 13, -1.4), 2, 6.5);
  },
};

/* ---------- 02 · Porto de cargas ---------- */

const portoWater = [[-300, 7], [-13, 7], [-13, 41], [3, 41], [3, 7], [300, 7], [300, 300], [-300, 300]];

const porto = {
  id: 'porto',
  name: 'Porto de cargas',
  kind: 'Urbano · costeiro',
  description: 'Guindastes sobre o cais, navio carregado, pátio de contêineres e a cidade separada por uma faixa verde.',
  alt: 'Maquete 3D de um porto com guindastes, navio de carga, contêineres, galpões e cidade ao fundo.',
  seed: 22,
  extent: 80,
  water: true,
  camera: { target: [4, 4, -10], distance: 205, elevation: 42, azimuth: 45 },
  size: 320,
  height: (x, z) => carve(0, polygonDistance(x, z, portoWater), 0.8, 2.6),
  build(k) {
    k.slab([[-300, -6], [300, -6], [300, 8], [2, 8], [2, 40], [-12, 40], [-12, 8], [-300, 8]], 2.7, -2.68);
    for (const z of [-2.5, 6.5]) k.box(400, 0.06, 0.25, 0, 0.02, z);

    // Navio no cais e guindastes por cima dele.
    k.place(P.cargoShip, -36, 13.6, { y: WL, length: 48, beam: 9.5 });
    for (const x of [-48, -33, -19]) k.place(P.portCrane, x, 2, { y: 0.02, gauge: 9.5 });

    // Segundo navio no píer.
    k.place(P.cargoShip, 7.2, 25, { y: WL, ry: Math.PI / 2, length: 34, beam: 8, load: 0.6 });
    k.local(-5, 0.02, 10, 0, () => P.containers(k, { cols: 1, rows: 4, tiers: 3 }));
    k.local(-5, 0.02, 22, Math.PI / 2, () => P.containers(k, { cols: 2, rows: 3, tiers: 2 }));
    k.place(P.lighthouse, -5, 37.5, { y: 0.02, h: 5 });
    for (let z = 12; z < 39; z += 5) k.instance('bollard', 1.5, 0.02, z);

    // Pátio de contêineres.
    for (const x of [-52, -30, -8, 14]) {
      for (const z of [-12, -22]) {
        k.local(x, 0.02, z, 0, () => P.containers(k, { cols: 3, rows: 3, tiers: 4, fill: 0.9 }));
      }
    }

    // Galpões.
    k.place(P.warehouse, -48, -40, { foot: [26, 14], w: 26, d: 14, h: 7, roof: 'arch', ry: Math.PI / 2 });
    k.place(P.warehouse, -19, -40, { foot: [26, 14], w: 26, d: 14, h: 6, roof: 'saw', ry: Math.PI / 2 });
    k.place(P.warehouse, 10, -40, { foot: [22, 14], w: 22, d: 14, h: 7, roof: 'arch', ry: Math.PI / 2 });
    k.place(P.tower, 26, -38, { foot: [7, 8], w: 7, d: 8, h: 9, style: 'grid' });

    // Faixa verde separando porto e cidade.
    P.scatter(k, { bounds: [32, -70, 40, 2], count: 30, minDist: 3.2, types: [['poplar', 2], ['round', 1]], scale: [0.85, 1.1] });
    P.treeRow(k, [[-60, -27.5], [28, -27.5]], { spacing: 6, type: 'round', scale: [0.75, 0.85] });

    // Cidade ao fundo.
    k.place(P.tower, 52, -50, { foot: [9, 9], w: 9, d: 9, h: 24, style: 'grid', crown: true });
    k.place(P.tower, 63, -34, { foot: [8, 8], w: 8, d: 8, h: 17, style: 'bands' });
    k.place(P.steppedTower, 50, -26, { foot: [14, 9], w: 4.6, d: 8, heights: [10, 14, 19] });
    k.place(P.apartments, 64, -12, { foot: [12, 7], w: 12, d: 7, floors: 5 });
    k.place(P.apartments, 50, -6, { foot: [7, 12], w: 12, d: 7, floors: 4, ry: Math.PI / 2 });
    k.place(P.tower, 72, -56, { foot: [8, 8], w: 8, d: 8, h: 12, style: 'fins' });

    // Orla com árvores à direita.
    P.scatter(k, { bounds: [44, 0, 80, 7], count: 10, minDist: 4, types: [['round', 1]], scale: [0.8, 0.95] });

    // Movimento.
    k.child((c) => P.tugboat(c), P.follow([[-60, 30], [-20, 48], [20, 44], [30, 28], [-10, 60], [-50, 50]], { speed: 3, forward: 'x', y: WL, bob: 0.06 }));
    k.child((c) => P.fishingBoat(c), P.follow([[40, 20], [70, 40], [30, 60], [10, 50]], { speed: 2.4, forward: 'x', y: WL, bob: 0.06, offset: 0.3 }));
    k.place(P.cargoShip, -70, 52, { y: WL, ry: 0.35, length: 40, beam: 8, load: 0.7 });
    for (let i = 0; i < 3; i++) {
      k.child((c) => P.car(c, { truck: true }), P.follow([[-62, -31], [30, -31], [30, -4], [-62, -4]], { speed: 7, offset: i / 3, y: 0.02 }));
    }
  },
};

/* ---------- 03 · Vale dos ventos ---------- */

const river = [[-120, -44], [-70, -24], [-40, -12], [-14, 2], [10, 10], [34, 18], [58, 32], [120, 46]];
// Cristas onde ficam as turbinas: morros estreitos e altos para a luz de cima marcar o relevo.
const crests = [[-50, -56, 20, 12], [-26, -70, 19, 14], [-2, -60, 18, 11], [22, -70, 20, 14], [42, -50, 18, 11], [64, -32, 18, 11], [74, 8, 16, 10], [-68, 26, 19, 11]];
const valeHills = (x, z) =>
  crests.reduce((h, [cx, cz, r, t]) => h + bump(x, z, cx, cz, r, t), 0) +
  bump(x, z, -30, 58, 18, 7) + bump(x, z, 34, 62, 20, 8) + bump(x, z, -78, -22, 16, 8) +
  0.8 * Math.sin(x * 0.06) * Math.sin(z * 0.05 + 1);
const patch = (x, z) => Math.sin(x * 0.06 + 1) + Math.sin(z * 0.07) + Math.sin((x - z) * 0.04 + 2);

const vale = {
  id: 'vale',
  name: 'Vale dos ventos',
  kind: 'Rural',
  description: 'Turbinas eólicas nas cristas, um rio sinuoso com ponte de pedra, vilarejo na margem e lavouras no vale.',
  alt: 'Maquete 3D de um vale com morros, turbinas eólicas, rio com ponte, vilarejo, lavouras e bosques.',
  seed: 88,
  extent: 85,
  water: true,
  camera: { target: [0, 4, -8], distance: 215, elevation: 40, azimuth: 45 },
  height: (x, z) => {
    const toRiver = polylineDistance(x, z, river);
    const land = 0.4 + Math.max(0, valeHills(x, z)) * smoothstep(5, 32, toRiver);
    return carve(land, toRiver - 4, 3.5, 2.2);
  },
  build(k) {
    for (const [x, z] of crests) k.place(P.windTurbine, x, z, { foot: [3, 3], ry: Math.PI / 4, h: 17, speed: 0.7 + k.rand(0, 0.4) });

    k.place(P.church, -12, -24, { foot: [8, 16], ry: 0.35, w: 6, d: 10, towerH: 10 });
    const village = [[-26, -16], [-22, -11], [-4, -12], [2, -18], [-30, -26], [-2, -30], [8, -10], [-16, -36]];
    for (const [x, z] of village) {
      const w = k.rand(3.8, 4.6);
      k.place(k.chance(0.3) ? smokyHouse : P.house, x, z, { foot: [w, 5.4], ry: 0.35 + k.rand(-0.2, 0.2), w, d: 5.4, floors: k.chance(0.4) ? 2 : 1 });
    }

    // A ponte cruza o rio na perpendicular; as pontas ficam em (12.8, 1.5) e (7.2, 18.5).
    k.place(P.archBridge, 10, 10, { y: 0.35, ry: -1.89, length: 18, width: 4.2 });
    P.road(k, [[-6, -16], [4, -6], [12.6, 0.4]], { width: 3.2 });
    P.road(k, [[7.4, 19.6], [4, 30], [-8, 38], [-18, 39]], { width: 3.2 });

    k.place(P.barn, -24, 36, { foot: [12, 13], ry: 0.2 });
    k.place(P.house, -10, 46, { foot: [5, 6], ry: 0.2, floors: 2, porch: true });
    k.place(P.silo, -33, 30, { foot: [4, 4], h: 8 });
    P.field(k, -62, 0, -36, 16, { dir: 'x' });
    P.field(k, -30, 12, -8, 26, { dir: 'z', kind: 'stripes', spacing: 2.2 });
    P.field(k, 28, -6, 52, 10, { dir: 'z' });
    P.field(k, 30, 38, 48, 54, { kind: 'hay' });
    k.place(P.house, 46, -12, { foot: [5, 6], ry: -0.3, floors: 1 });
    k.place(P.grainBin, 52, -16, { foot: [4, 4] });

    P.scatter(k, {
      bounds: [-120, -120, 120, 120],
      count: 650,
      minDist: 2.7,
      inside: (x, z) => patch(x, z) > 0.55 && polylineDistance(x, z, river) > 7,
      types: [['pine', 3], ['fir', 2], ['round', 2]],
      scale: [0.85, 1.2],
    });
    P.treeRow(k, [[-60, -20], [-40, -9], [-20, 4]], { spacing: 4.5, type: 'poplar' });

    k.child((c) => P.car(c), P.follow([[7.4, 19.6], [4, 30], [-8, 38], [-18, 39]], { speed: 4, closed: false, pingpong: true, height: (x, z) => k.height(x, z) + 0.1 }));
    k.child((c) => P.canalBoat(c, { length: 9 }), P.follow(river.slice(1, 7), { speed: 2, closed: false, pingpong: true, forward: 'x', y: WL, bob: 0.03 }));
  },
};

/* ---------- 04 · Fazenda ---------- */

const pond = [38, 32, 7.5];

function farmPiece(k) {
  P.barn(k, { w: 8, d: 12, h: 4.2 });
}

const fazenda = {
  id: 'fazenda',
  name: 'Fazenda',
  kind: 'Rural',
  description: 'Celeiro, silos e casa de fazenda cercados por uma colcha de lavouras, pomar, pasto com fardos e um açude.',
  alt: 'Maquete 3D de uma fazenda com celeiro, silos, lavouras em fileiras, pomar, açude e quebra-ventos de álamos.',
  seed: 44,
  extent: 80,
  water: true,
  camera: { target: [2, 2, 6], distance: 205, elevation: 42, azimuth: 45 },
  height: (x, z) => {
    const land = 0.2 + bump(x, z, -46, -66, 40, 4) + bump(x, z, 52, -60, 30, 3) + 0.25 * Math.sin(x * 0.05) * Math.sin(z * 0.04);
    return carve(land, Math.hypot(x - pond[0], z - pond[1]) - pond[2], 3, 2.2);
  },
  build(k) {
    k.place(farmPiece, -6, -4, { foot: [16, 13] });
    k.place(P.silo, 6, -10, { foot: [4, 4], r: 1.9, h: 11 });
    k.place(P.silo, 10.6, -10.4, { foot: [4, 4], r: 1.7, h: 9 });
    k.place(P.grainBin, 6, -3, { foot: [4, 4] });
    k.place(P.grainBin, 10.6, -3.2, { foot: [4, 4], h: 3.4 });
    k.place(smokyHouse, -21, 3, { foot: [6, 9], w: 6, d: 6.5, floors: 2, porch: true, roof: 'gable' });
    k.place(P.waterTower, -23, -9, { foot: [4, 4], h: 7 });
    k.place(P.greenhouse, 7, 6.5, { foot: [12, 6], ry: Math.PI / 2, w: 5, d: 11 });
    k.place(P.tractor, 1, 5, { ry: 0.7 });
    k.place(P.windpump, 15, 10, { foot: [3, 3] });

    P.fence(k, [[-16, 5], [-16, 13], [-3, 13], [-3, 5]]);
    for (let i = 0; i < 5; i++) {
      const x = k.rand(-14.5, -4.5);
      const z = k.rand(6.5, 11.5);
      k.instance('cow', x, k.height(x, z), z, { ry: k.rand(0, TAU) });
    }

    P.field(k, -62, -44, -32, -16, { dir: 'x' });
    P.field(k, -62, -10, -32, 12, { dir: 'z', kind: 'stripes', spacing: 2.2 });
    P.field(k, 22, -46, 56, -18, { dir: 'z' });
    P.field(k, 22, -12, 50, 4, { kind: 'orchard' });
    P.field(k, -28, 18, 14, 42, { dir: 'x' });
    P.field(k, 46, 6, 68, 22, { kind: 'hay' });
    P.field(k, -62, 20, -34, 44, { dir: 'x', kind: 'stripes', spacing: 2.4 });
    P.field(k, -28, -48, 14, -22, { dir: 'z', spacing: 1.5 });

    P.road(k, [[-80, 15.5], [0, 15.5], [80, 15.5]], { width: 3.4 });
    P.road(k, [[18, -70], [18, 0], [18, 60]], { width: 3.4 });
    P.road(k, [[16.3, 1.5], [6, 1.5], [-2, 3.5], [-14, 2.5]], { width: 2.6 });

    P.treeRow(k, [[-30, -46], [-30, 44]], { spacing: 3.2, type: 'poplar', scale: [0.9, 1.1] });
    P.treeRow(k, [[-62, -50], [14, -50]], { spacing: 3.2, type: 'poplar', scale: [0.9, 1.1] });
    P.scatter(k, { bounds: [-120, -120, 60, -54], count: 160, minDist: 3, types: [['oak', 2], ['round', 2], ['pine', 1]], scale: [0.85, 1.2] });
    P.scatter(k, { bounds: [-120, -54, -66, 70], count: 90, minDist: 3, types: [['oak', 2], ['round', 2]], scale: [0.85, 1.2] });
    P.scatter(k, { bounds: [26, 22, 52, 44], count: 9, minDist: 4, inside: (x, z) => Math.hypot(x - pond[0], z - pond[1]) > pond[2] + 2, types: [['oak', 1], ['bush', 1]] });
    k.place(P.pier, pond[0] - 4, pond[1] - 6.2, { y: 0.1, ry: 0.5, length: 5, width: 1.6, bollards: false });
    mooredBoat(k, P.rowboat, pond[0] - 1.2, pond[1] - 1.8, 0.5 - Math.PI / 2);

    k.child((c) => P.tractor(c), P.follow([[-25, 24.5], [11, 24.5]], { speed: 2.6, closed: false, pingpong: true, forward: 'z', height: k.height }));
    k.child((c) => P.car(c, { truck: true }), P.follow([[17, -70], [17, 60]], { speed: 6, closed: false, pingpong: true, height: k.height }));
  },
};

export const COMPOSITIONS = [centro, porto, vale, fazenda];
