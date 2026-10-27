import * as THREE from 'three';
import { WATER_LEVEL } from './estilo.js';

export function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function mix(a, b, t) {
  return a + (b - a) * t;
}

function segmentDistance(px, pz, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(px - ax - dx * t, pz - az - dz * t);
}

// Distância com sinal até um polígono [[x, z], ...]: negativa dentro.
export function polygonDistance(px, pz, poly) {
  let d = Infinity;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    d = Math.min(d, segmentDistance(px, pz, xj, zj, xi, zi));
    if (zi > pz !== zj > pz && px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside ? -d : d;
}

export function polylineDistance(px, pz, pts) {
  let d = Infinity;
  for (let i = 1; i < pts.length; i++) {
    d = Math.min(d, segmentDistance(px, pz, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]));
  }
  return d;
}

export function bump(x, z, cx, cz, radius, height) {
  const d2 = ((x - cx) ** 2 + (z - cz) ** 2) / (radius * radius);
  return height * Math.exp(-d2);
}

// Afunda o terreno onde há água. `inside` é a distância com sinal até a água
// (negativa dentro); `bank` é a largura da margem.
export function carve(height, inside, bank = 3, depth = 2.4) {
  return mix(height, -depth, smoothstep(0, bank, -inside));
}

// Amostra uma curva fechada ou aberta em pontos suaves.
export function smoothPath(points, samples = 120, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)), closed, 'centripetal');
  return curve.getSpacedPoints(samples).map((p) => [p.x, p.z]);
}

export function buildGround({ height, size = 240, outer = 0, water = false }, materials) {
  const group = new THREE.Group();
  const segments = Math.round(size);
  const half = size / 2;

  const plane = new THREE.PlaneGeometry(size, size, segments, segments);
  plane.rotateX(-Math.PI / 2);
  const pos = plane.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const edge = smoothstep(half * 0.8, half, Math.max(Math.abs(x), Math.abs(z)));
    pos.setY(i, mix(height(x, z), outer, edge));
  }
  plane.computeVertexNormals();
  const terrain = new THREE.Mesh(plane, materials.ground);
  terrain.receiveShadow = true;
  terrain.castShadow = true;
  group.add(terrain);

  const ring = new THREE.Shape([
    new THREE.Vector2(-2000, -2000),
    new THREE.Vector2(2000, -2000),
    new THREE.Vector2(2000, 2000),
    new THREE.Vector2(-2000, 2000),
  ]);
  ring.holes.push(
    new THREE.Path([
      new THREE.Vector2(-half + 0.5, -half + 0.5),
      new THREE.Vector2(-half + 0.5, half - 0.5),
      new THREE.Vector2(half - 0.5, half - 0.5),
      new THREE.Vector2(half - 0.5, -half + 0.5),
    ]),
  );
  const ringGeometry = new THREE.ShapeGeometry(ring);
  ringGeometry.rotateX(-Math.PI / 2);
  ringGeometry.translate(0, outer, 0);
  const surround = new THREE.Mesh(ringGeometry, materials.ground);
  surround.receiveShadow = true;
  group.add(surround);

  if (water) {
    const sheet = new THREE.PlaneGeometry(4000, 4000);
    sheet.rotateX(-Math.PI / 2);
    sheet.translate(0, WATER_LEVEL, 0);
    const surface = new THREE.Mesh(sheet, materials.water);
    surface.receiveShadow = true;
    surface.renderOrder = 1;
    group.add(surface);
  }

  return group;
}
