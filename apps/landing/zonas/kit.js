import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const euler = new THREE.Euler();
const quat = new THREE.Quaternion();
const vec = new THREE.Vector3();
const scl = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const SIDE = new THREE.Vector3(1, 0, 0);

export function trs(x = 0, y = 0, z = 0, ry = 0, sx = 1, sy = sx, sz = sx, rx = 0, rz = 0) {
  euler.set(rx, ry, rz, 'YXZ');
  quat.setFromEuler(euler);
  return new THREE.Matrix4().compose(vec.set(x, y, z), quat, scl.set(sx, sy, sz));
}

// Todas as peças viram só posição + normal, para poderem ser fundidas num único mesh.
function prep(geometry) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  if (g !== geometry) geometry.dispose();
  for (const name of Object.keys(g.attributes)) {
    if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
  }
  if (!g.attributes.normal) g.computeVertexNormals();
  return g;
}

export class Kit {
  constructor({ height = () => 0, seed = 1, random } = {}) {
    this.height = height;
    this.random = random || seeded(seed);
    this.parts = [];
    this.instances = new Map();
    this.children = [];
    this.matrix = new THREE.Matrix4();
    this.stack = [];
    this.reserved = [];
  }

  rand(a = 0, b = 1) {
    return a + (b - a) * this.random();
  }

  pick(list) {
    return list[Math.floor(this.random() * list.length)];
  }

  chance(p) {
    return this.random() < p;
  }

  local(x, y, z, ry, fn) {
    this.stack.push(this.matrix);
    this.matrix = this.matrix.clone().multiply(trs(x, y, z, ry));
    fn();
    this.matrix = this.stack.pop();
  }

  // Coloca uma peça sobre o terreno. Com `foot` ([largura, profundidade]) a peça
  // reserva o espaço (árvores espalhadas desviam) e ganha base se o chão for inclinado.
  place(piece, x, z, options = {}) {
    const { ry = 0, foot, y, margin = 1.2 } = options;
    let base = y ?? this.height(x, z);
    let plinth = null;
    if (y === undefined && foot) {
      const heights = this.corners(x, z, ry, foot).map(([cx, cz]) => this.height(cx, cz));
      const low = Math.min(...heights, base);
      const high = Math.max(...heights, base);
      base = high;
      if (high - low > 0.06) plinth = high - low;
    }
    if (foot) this.reserve(x, z, ry, foot, margin);
    this.local(x, base, z, ry, () => {
      if (plinth) this.box(foot[0] + 0.4, plinth + 0.3, foot[1] + 0.4, 0, -plinth - 0.3, 0);
      piece(this, options);
    });
  }

  corners(x, z, ry, [w, d]) {
    const c = Math.cos(ry);
    const s = Math.sin(ry);
    return [
      [-w / 2, -d / 2],
      [w / 2, -d / 2],
      [w / 2, d / 2],
      [-w / 2, d / 2],
    ].map(([a, b]) => [x + a * c + b * s, z - a * s + b * c]);
  }

  reserve(x, z, ry, foot, margin = 1) {
    const pts = this.corners(x, z, ry, foot);
    const xs = pts.map((p) => p[0]);
    const zs = pts.map((p) => p[1]);
    this.reserved.push([Math.min(...xs) - margin, Math.min(...zs) - margin, Math.max(...xs) + margin, Math.max(...zs) + margin]);
  }

  reserveRect(x0, z0, x1, z1) {
    this.reserved.push([Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1)]);
  }

  isFree(x, z) {
    for (const [x0, z0, x1, z1] of this.reserved) {
      if (x > x0 && x < x1 && z > z0 && z < z1) return false;
    }
    return true;
  }

  add(geometry, matrix) {
    const g = prep(geometry);
    if (matrix) g.applyMatrix4(matrix);
    g.applyMatrix4(this.matrix);
    this.parts.push(g);
  }

  // y é sempre a base da peça, não o centro.
  box(w, h, d, x = 0, y = 0, z = 0, { bevel = 0, ry = 0, rx = 0, rz = 0, segments = 2 } = {}) {
    const r = Math.min(bevel, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
    const g = r > 0.005 ? new RoundedBoxGeometry(w, h, d, segments, r) : new THREE.BoxGeometry(w, h, d);
    g.translate(0, h / 2, 0);
    this.add(g, trs(x, y, z, ry, 1, 1, 1, rx, rz));
  }

  // Com `center`, (x, y, z) é o centro do cilindro (útil para rodas e eixos deitados).
  cylinder(rTop, rBottom, h, x = 0, y = 0, z = 0, { segments = 16, ry = 0, rx = 0, rz = 0, start = 0, length = Math.PI * 2, center = false } = {}) {
    const g = new THREE.CylinderGeometry(rTop, rBottom, h, segments, 1, false, start, length);
    if (!center) g.translate(0, h / 2, 0);
    this.add(g, trs(x, y, z, ry, 1, 1, 1, rx, rz));
  }

  torus(radius, tube, x = 0, y = 0, z = 0, { sy = 1, segments = 28 } = {}) {
    const g = new THREE.TorusGeometry(radius, tube, 8, segments);
    g.rotateX(Math.PI / 2);
    this.add(g, trs(x, y, z, 0, 1, sy, 1));
  }

  // Prisma triangular (telhado de duas águas): largura em x, cumeeira ao longo de z.
  prism(w, h, d, x = 0, y = 0, z = 0, { ry = 0 } = {}) {
    this.profile([[-w / 2, 0], [w / 2, 0], [0, h]], d, x, y, z, { ry });
  }

  sphere(r, x = 0, y = 0, z = 0, { sx = 1, sy = 1, sz = 1, detail = 2 } = {}) {
    this.add(new THREE.IcosahedronGeometry(r, detail), trs(x, y, z, 0, sx, sy, sz));
  }

  dome(r, x = 0, y = 0, z = 0, { sy = 1, segments = 16 } = {}) {
    const g = new THREE.SphereGeometry(r, segments, Math.max(4, segments / 2), 0, Math.PI * 2, 0, Math.PI / 2);
    this.add(g, trs(x, y, z, 0, 1, sy, 1));
  }

  cone(r, h, x = 0, y = 0, z = 0, { segments = 12, ry = 0, sx = 1, sz = 1 } = {}) {
    const g = new THREE.ConeGeometry(r, h, segments);
    g.translate(0, h / 2, 0);
    this.add(g, trs(x, y, z, ry, sx, 1, sz));
  }

  // Perfil 2D (x, y) extrudado ao longo de z, centrado em z.
  profile(points, depth, x = 0, y = 0, z = 0, { ry = 0, bevel = 0 } = {}) {
    const shape = new THREE.Shape();
    shape.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) shape.lineTo(points[i][0], points[i][1]);
    this.extrude(shape, depth, x, y, z, { ry, bevel });
  }

  extrude(shape, depth, x = 0, y = 0, z = 0, { ry = 0, rx = 0, bevel = 0, curve = 6 } = {}) {
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: depth - bevel * 2,
      bevelEnabled: bevel > 0,
      bevelSize: bevel,
      bevelThickness: bevel,
      bevelSegments: 2,
      curveSegments: curve,
    });
    g.translate(0, 0, -depth / 2 + bevel);
    this.add(g, trs(x, y, z, ry, 1, 1, 1, rx));
  }

  // Contorno visto de cima (x, z) levantado em altura h a partir de y.
  slab(points, h, y = 0, { bevel = 0, holes = [], curve = 8 } = {}) {
    const shape = new THREE.Shape(points.map(([px, pz]) => new THREE.Vector2(px, -pz)));
    for (const hole of holes) shape.holes.push(new THREE.Path(hole.map(([px, pz]) => new THREE.Vector2(px, -pz))));
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(0.01, h - bevel * 2),
      bevelEnabled: bevel > 0,
      bevelSize: bevel,
      bevelThickness: bevel,
      bevelSegments: 2,
      curveSegments: curve,
    });
    g.rotateX(-Math.PI / 2);
    g.translate(0, y + bevel, 0);
    this.add(g);
  }

  beam(a, b, t = 0.2, t2 = t) {
    const from = new THREE.Vector3(...a);
    const to = new THREE.Vector3(...b);
    const length = from.distanceTo(to);
    const g = new THREE.BoxGeometry(t, t2, length);
    const dir = to.clone().sub(from).normalize();
    const up = Math.abs(dir.dot(UP)) > 0.98 ? SIDE : UP;
    const m = new THREE.Matrix4().lookAt(from, to, up);
    m.setPosition(from.clone().add(to).multiplyScalar(0.5));
    this.add(g, m);
  }

  instance(type, x = 0, y = 0, z = 0, { ry = 0, s = 1, sy = s } = {}) {
    if (!this.instances.has(type)) this.instances.set(type, []);
    this.instances.get(type).push(this.matrix.clone().multiply(trs(x, y, z, ry, s, sy, s)));
  }

  // Peça animada: vira um objeto próprio, posicionado onde foi criado.
  child(build, update) {
    const sub = new Kit({ height: this.height, random: this.random });
    build(sub);
    this.children.push({ kit: sub, update, matrix: this.matrix.clone() });
  }

  finish(material) {
    const group = new THREE.Group();
    const updates = [];

    if (this.parts.length) {
      const geometry = mergeGeometries(this.parts, false);
      for (const part of this.parts) part.dispose();
      this.parts = [];
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    for (const [type, matrices] of this.instances) {
      const mesh = new THREE.InstancedMesh(prototype(type), material, matrices.length);
      matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.computeBoundingSphere();
      mesh.userData.shared = true;
      group.add(mesh);
    }

    for (const child of this.children) {
      const built = child.kit.finish(material);
      const object = built.group;
      child.matrix.decompose(object.position, object.quaternion, object.scale);
      object.userData.origin = { position: object.position.clone(), quaternion: object.quaternion.clone() };
      group.add(object);
      if (child.update) updates.push((t, dt) => child.update(object, t, dt));
      if (built.update) updates.push(built.update);
    }

    const update = updates.length ? (t, dt) => updates.forEach((u) => u(t, dt)) : null;
    return { group, update };
  }
}

// Peças repetidas centenas de vezes (árvores, pessoas, fardos) usam instancing.
const PROTOTYPES = {
  pine(k) {
    k.cylinder(0.14, 0.2, 1.1, 0, 0, 0, { segments: 6 });
    k.cone(1.5, 2.8, 0, 0.8, 0, { segments: 10 });
    k.cone(1.15, 2.3, 0, 2.1, 0, { segments: 10 });
    k.cone(0.78, 1.8, 0, 3.3, 0, { segments: 10 });
  },
  fir(k) {
    k.cylinder(0.12, 0.18, 0.8, 0, 0, 0, { segments: 6 });
    k.cone(1.0, 5.2, 0, 0.6, 0, { segments: 10 });
  },
  round(k) {
    k.cylinder(0.13, 0.19, 1.7, 0, 0, 0, { segments: 6 });
    k.sphere(1.35, 0, 2.75, 0, { sy: 1.05 });
  },
  oak(k) {
    k.cylinder(0.16, 0.24, 1.8, 0, 0, 0, { segments: 6 });
    k.sphere(1.2, -0.55, 2.6, 0.25);
    k.sphere(1.1, 0.65, 2.75, -0.3);
    k.sphere(1.0, 0.1, 3.45, 0.1);
  },
  poplar(k) {
    k.cylinder(0.11, 0.15, 1.1, 0, 0, 0, { segments: 6 });
    k.sphere(0.72, 0, 3.0, 0, { sy: 2.6 });
  },
  bush(k) {
    k.sphere(0.75, 0, 0.42, 0, { sy: 0.72, detail: 1 });
  },
  person(k) {
    k.add(new THREE.CapsuleGeometry(0.21, 0.72, 3, 8), trs(0, 0.6, 0));
    k.sphere(0.18, 0, 1.36, 0, { detail: 1 });
  },
  hay(k) {
    k.cylinder(0.62, 0.62, 1.15, 0, 0.62, 0, { rx: Math.PI / 2, segments: 14, center: true });
  },
  lamp(k) {
    k.cylinder(0.06, 0.08, 3.4, 0, 0, 0, { segments: 6 });
    k.box(0.9, 0.08, 0.08, 0.4, 3.35, 0);
    k.box(0.5, 0.12, 0.26, 0.8, 3.22, 0, { bevel: 0.04 });
  },
  post(k) {
    k.box(0.14, 1.0, 0.14, 0, 0, 0);
  },
  cow(k) {
    k.box(0.82, 0.78, 1.75, 0, 0.55, 0, { bevel: 0.25 });
    k.box(0.46, 0.5, 0.62, 0, 1.0, 1.02, { bevel: 0.16 });
    for (const [x, z] of [[-0.27, -0.62], [0.27, -0.62], [-0.27, 0.62], [0.27, 0.62]]) k.box(0.17, 0.62, 0.17, x, 0, z);
  },
  umbrella(k) {
    k.cylinder(0.05, 0.05, 2.3, 0, 0, 0, { segments: 6 });
    k.cone(1.25, 0.55, 0, 1.85, 0, { segments: 10 });
    k.box(0.9, 0.06, 1.8, 0.9, 0, 0.5);
  },
  bollard(k) {
    k.cylinder(0.18, 0.22, 0.45, 0, 0, 0, { segments: 8 });
    k.cylinder(0.26, 0.26, 0.08, 0, 0.45, 0, { segments: 8 });
  },
};

const prototypeCache = new Map();

function prototype(type) {
  if (!prototypeCache.has(type)) {
    const k = new Kit({ seed: 7 });
    PROTOTYPES[type](k);
    const geometry = mergeGeometries(k.parts, false);
    for (const part of k.parts) part.dispose();
    prototypeCache.set(type, geometry);
  }
  return prototypeCache.get(type);
}
