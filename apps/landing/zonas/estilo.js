import * as THREE from 'three';

// Vieram do shader de vectrfl.com (painel "Shading" + posição da luz), onde
// eram azuladas. Aqui estão neutras, na mesma luminosidade do original: a
// página é branca e a cena acompanha, então o que separa um volume do outro é
// a sombra e a oclusão, não a cor. background precisa ser igual ao --bg do
// style.css — é por ele que a névoa dissolve a cena na página.
export const STYLE = {
  background: '#FFFFFF',
  main: '#cdcdcb',
  floor: '#b9b9b6',
  primary: '#3932DC',
  lightDirection: new THREE.Vector3(0.25, 1.5, 0.5).normalize(),
};

export const WATER_LEVEL = -0.6;

const ACES_IN = [
  [0.59719, 0.35458, 0.04823],
  [0.076, 0.90834, 0.01566],
  [0.0284, 0.13383, 0.83777],
];
const ACES_OUT = [
  [1.60475, -0.53108, -0.07367],
  [-0.10208, 1.10813, -0.00605],
  [-0.00327, -0.07276, 1.07602],
];

function multiply(m, v) {
  return m.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
}

function invert(m) {
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [
    [A / det, -(b * i - c * h) / det, (b * f - c * e) / det],
    [B / det, (a * i - c * g) / det, -(a * f - c * d) / det],
    [C / det, -(a * h - b * g) / det, (a * e - b * d) / det],
  ];
}

function invertFit(t) {
  const a = 1 - 0.983729 * t;
  const b = 0.0245786 - 0.432951 * t;
  const c = -(0.000090537 + 0.238081 * t);
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
}

// Converte a cor que deve aparecer na tela para o valor que a cena precisa ter
// antes do ACES. Assim o fundo e a névoa batem com o fundo da página.
export function displayToScene(hex) {
  const target = new THREE.Color(hex);
  let v = multiply(invert(ACES_OUT), [target.r, target.g, target.b]);
  v = v.map(invertFit);
  v = multiply(invert(ACES_IN), v).map((x) => x * 0.6);
  return new THREE.Color().setRGB(v[0], v[1], v[2]);
}

export function createMaterials() {
  const floor = new THREE.Color(STYLE.floor);
  const light = STYLE.lightDirection.y;

  const clay = new THREE.MeshLambertMaterial({
    color: new THREE.Color().setRGB(0.5, 0.5, 0.5),
    emissive: new THREE.Color(STYLE.main),
  });

  // A referência ilumina o chão só pela inclinação; aqui 40% é luz fixa para a sombra não pesar.
  const ground = new THREE.MeshLambertMaterial({
    color: floor.clone().multiplyScalar(2 * 0.6),
    emissive: floor.clone().multiplyScalar(2 * light * 0.4),
  });
  // Encostas perdem parte da luz fixa: é o que faz morros e margens aparecerem.
  ground.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vUp;')
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvUp = normalize(mat3(modelMatrix) * objectNormal).y;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vUp;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= mix(0.3, 1.0, smoothstep(0.7, 0.995, vUp));');
  };

  const water = new THREE.MeshLambertMaterial({
    color: floor.clone().multiplyScalar(0.34),
    emissive: floor.clone().multiplyScalar(0.72),
    transparent: true,
    opacity: 0.9,
  });
  // Reflexos ondulados que andam devagar: é o que faz a água se ler como água.
  const time = { value: 0 };
  water.userData.time = time;
  water.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorld;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorld;\nuniform float uTime;')
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float u = (vWorld.x - vWorld.z) * 0.7071;
        float v = (vWorld.x + vWorld.z) * 0.7071;
        float a = sin(u * 0.22 + sin(v * 0.13 + uTime * 0.3) * 2.0 + uTime * 0.5);
        float b = sin(v * 1.35 + sin(u * 0.09 - uTime * 0.2) * 3.0 - uTime * 0.4);
        float patches = smoothstep(0.35, 0.95, sin(u * 0.045 + uTime * 0.05) * sin(v * 0.06 - 1.3) * 0.5 + 0.5);
        float glint = smoothstep(0.92, 1.0, a * b) * patches;
        totalEmissiveRadiance += vec3(0.42, 0.48, 0.55) * glint;`,
      );
  };

  return { clay, ground, water };
}
