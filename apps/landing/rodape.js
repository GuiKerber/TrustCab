/* ==========================================================================
   TrustCab · a marca no rodapé

   A mesma maquete da história, reduzida a uma ilha: o símbolo de pé no meio,
   a linha amarela dando a volta e os carros correndo nela, com árvores,
   postes e gente em torno.

   É uma cena própria, não um pedaço da outra: aqui não há percurso, não há
   zonas e não há oclusão de ambiente — só o necessário para a marca ter
   volume. Se não houver WebGL, o bloco some e o rodapé fica só com o texto,
   que é o que ele precisa dizer de qualquer jeito.
   ========================================================================== */

import * as THREE from 'three';
import { STYLE, createMaterials, displayToScene } from './zonas/estilo.js';
import { Kit } from './zonas/kit.js';
import { roundedRect, car, bench, follow } from './zonas/pecas.js';

const palco = document.getElementById('palco-rodape');
const tela = document.getElementById('cena-rodape');
if (palco && tela) montar();

function montar() {
  const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: tela, antialias: true, powerPreference: 'low-power' });
  } catch (e) {
    palco.hidden = true;
    return;
  }

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  tela.setAttribute('role', 'img');
  tela.setAttribute('aria-label', 'Maquete 3D do símbolo da TrustCab, com carros dando a volta nele.');

  const materiais = createMaterials();
  materiais.clay.emissive.multiplyScalar(0.74);
  materiais.ground.emissive.multiplyScalar(0.84);

  const fundo = displayToScene(STYLE.background);
  const scene = new THREE.Scene();
  scene.background = fundo;
  scene.fog = new THREE.Fog(fundo, 150, 320);

  // Tudo pendurado neste grupo: é ele que gira devagar.
  const mundo = new THREE.Group();
  scene.add(mundo);

  /* ── a ilha ─────────────────────────────────────────────────────────────── */

  // Disco, e não placa quadrada: o mundo gira, e um quadrado passaria as
  // quatro quinas pela frente da câmera. Ele é bem maior do que o que se vê —
  // é a névoa que termina a ilha, em vez de uma borda reta.
  // Bem maior do que o que se vê: a borda do disco precisa cair fundo na
  // névoa, senão ela aparece de lado como uma faixa cinza atravessando a
  // faixa inteira. Com a névoa começando no meio da cena, 96 já não bastava.
  const RAIO = 170;
  const POVOADO = 44;
  const chao = new Kit({ seed: 11 });
  chao.cylinder(RAIO, RAIO, 1.4, 0, -1.4, 0, { segments: 72 });
  const ilha = chao.finish(materiais.ground).group;
  ilha.receiveShadow = true;
  ilha.traverse((o) => { o.receiveShadow = true; });
  mundo.add(ilha);

  /* ── o símbolo ──────────────────────────────────────────────────────────── */

  // As três formas saem do mesmo SVG da marca (viewBox 1024). Aqui elas só
  // mudam de escala e ganham espessura: a placa escura, a cunha amarela e o
  // "T" claro, cada uma no seu plano, para a luz separar uma da outra.
  const LADO = 20;
  const E = 1024 / LADO;
  const pt = (x, y) => new THREE.Vector2((x - 512) / E, (512 - y) / E);
  const poli = (pontos) => {
    const forma = new THREE.Shape();
    pontos.forEach(([x, y], i) => {
      const v = pt(x, y);
      if (i) forma.lineTo(v.x, v.y); else forma.moveTo(v.x, v.y);
    });
    forma.closePath();
    return forma;
  };

  const placa = new THREE.Shape();
  {
    const m = LADO / 2;
    const r = (232 / 1024) * LADO;
    placa.moveTo(-m + r, -m);
    placa.lineTo(m - r, -m);
    placa.absarc(m - r, -m + r, r, -Math.PI / 2, 0, false);
    placa.lineTo(m, m - r);
    placa.absarc(m - r, m - r, r, 0, Math.PI / 2, false);
    placa.lineTo(-m + r, m);
    placa.absarc(-m + r, m - r, r, Math.PI / 2, Math.PI, false);
    placa.lineTo(-m, -m + r);
    placa.absarc(-m + r, -m + r, r, Math.PI, Math.PI * 1.5, false);
  }

  // A placa é iluminada, para ter volume. A cunha e o "T" saem do tom: são
  // cor de marca, e cor de marca não pode depender de onde o sol está.
  // O volume é um prédio como os outros: mesma tinta de barro, mesma luz,
  // mesma névoa. O que muda é o teto — a cunha e o "T" ficam fora do tom e
  // fora da névoa, porque cor de marca não pode depender de onde o sol está
  // nem de quanto branco tem entre ela e a câmera. Sobre o barro claro o "T"
  // vem em tinta cheia: é a mesma marca, lida ao contrário.
  const corpo = materiais.clay;
  const amarelo = new THREE.MeshBasicMaterial({ color: 0xf4e04d, toneMapped: false, fog: false });
  const creme = new THREE.MeshBasicMaterial({ color: 0x141414, toneMapped: false, fog: false });

  const fatia = (forma, profundidade, bisel) => new THREE.ExtrudeGeometry(forma, {
    depth: profundidade - bisel * 2,
    bevelEnabled: true, bevelSize: bisel, bevelThickness: bisel, bevelSegments: 3,
    curveSegments: 10,
  });

  // Deitada no chão e levantada em altura: a marca é uma construção da
  // maquete, como os prédios do centro, e não uma placa de pé.
  const ALTURA = 7;
  const simbolo = new THREE.Group();
  const base = new THREE.Mesh(fatia(placa, ALTURA, 0.26), corpo);
  base.position.z = 0.26;
  simbolo.add(base);

  const cunha = new THREE.Mesh(
    fatia(poli([[230, 283], [408, 283], [462, 381], [230, 381]]), 0.6, 0.08),
    amarelo,
  );
  cunha.position.z = ALTURA - 0.1;
  simbolo.add(cunha);

  const te = new THREE.Mesh(
    fatia(poli([[465, 283], [753, 283], [790, 332], [753, 381], [558, 381], [558, 735], [465, 735]]), 0.6, 0.08),
    creme,
  );
  te.position.z = ALTURA - 0.1;
  simbolo.add(te);

  simbolo.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  // Dois grupos, e não duas rotações no mesmo objeto: assim a ordem é a que eu
  // quero — primeiro deita, depois vira. O giro de 45° joga o topo da marca
  // para longe da câmera, que é o que a deixa de pé para quem olha.
  simbolo.rotation.x = -Math.PI / 2;
  const predio = new THREE.Group();
  predio.rotation.y = Math.PI / 4;
  predio.add(simbolo);
  mundo.add(predio);

  /* ── a volta ────────────────────────────────────────────────────────────── */

  // A volta abre o bastante para a construção caber dentro dela com folga:
  // girada 45°, a marca chega a 14 de raio nas quinas.
  const VOLTA = roundedRect(-24, -24, 24, 24, 14, 7);
  const curva = new THREE.CatmullRomCurve3(
    VOLTA.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal',
  );

  // Fita plana, como a do percurso: dois triângulos por trecho.
  const AMOSTRAS = 180;
  const LARGURA = 2.6;
  {
    const pos = [];
    const cima = new THREE.Vector3(0, 1, 0);
    const tan = new THREE.Vector3();
    const lado = new THREE.Vector3();
    const esq = [];
    const dir = [];
    for (let i = 0; i <= AMOSTRAS; i++) {
      const t = i / AMOSTRAS;
      const p = curva.getPointAt(t);
      tan.copy(curva.getTangentAt(t)).normalize();
      lado.crossVectors(tan, cima).normalize().multiplyScalar(LARGURA / 2);
      esq.push([p.x - lado.x, 0.14, p.z - lado.z]);
      dir.push([p.x + lado.x, 0.14, p.z + lado.z]);
    }
    for (let i = 0; i < AMOSTRAS; i++) {
      pos.push(...esq[i], ...dir[i], ...esq[i + 1], ...dir[i], ...dir[i + 1], ...esq[i + 1]);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    const fita = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: 0xf4e04d, toneMapped: false, fog: false,
    }));
    fita.renderOrder = 1;
    mundo.add(fita);
  }

  /* ── o que vive em volta ────────────────────────────────────────────────── */

  const k = new Kit({ seed: 23 });

  // Grupo à parte só por organização: a tinta é a mesma do resto da maquete,
  // igual à dos carros que correm nas quatro zonas da história.
  const frota = new Kit({ seed: 5 });
  const VELOCIDADE = [5.2, 4.4, 6.1, 3.6];
  for (let i = 0; i < 4; i++) {
    frota.child(
      (c) => car(c, { truck: i === 3 }),
      follow(VOLTA, { speed: VELOCIDADE[i], offset: i / 4, closed: true, y: 0.16 }),
    );
  }
  const veiculos = frota.finish(materiais.clay);
  mundo.add(veiculos.group);

  // Gente andando numa volta um pouco maior, para não disputar a pista.
  const CALCADA = roundedRect(-29, -29, 29, 29, 16, 6);
  for (let i = 0; i < 5; i++) {
    k.child(
      (c) => c.instance('person'),
      follow(CALCADA, { speed: 1.1, offset: i / 5, closed: true, y: 0 }),
    );
  }

  // Postes acompanhando a pista, de quatro em quatro pontos.
  VOLTA.forEach(([x, z], i) => {
    if (i % 4) return;
    const d = Math.hypot(x, z);
    k.instance('lamp', x * (1 + 2.6 / d), 0, z * (1 + 2.6 / d), { ry: Math.atan2(-x, -z) });
  });

  // Árvores e arbustos no anel de fora, sem nunca encostar na pista.
  const ARVORES = ['pine', 'round', 'oak', 'poplar'];
  for (let i = 0; i < 64; i++) {
    const a = k.rand(0, Math.PI * 2);
    const d = k.rand(30, POVOADO);
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;

    const tipo = k.chance(0.3) ? 'bush' : k.pick(ARVORES);
    k.instance(tipo, x, 0, z, { ry: k.rand(0, Math.PI * 2), s: k.rand(0.8, 1.25) });
  }

  // Dois bancos e os pinos virados para o símbolo.
  for (const [x, z] of [[-31, 9], [31, -9]]) {
    k.local(x, 0, z, Math.atan2(-x, -z), () => bench(k));
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    k.instance('bollard', Math.cos(a) * 16.5, 0, Math.sin(a) * 16.5);
  }

  const ilhota = k.finish(materiais.clay);
  mundo.add(ilhota.group);

  /* ── luz ────────────────────────────────────────────────────────────────── */

  const luz = new THREE.DirectionalLight(0xffffff, Math.PI * 1.22);
  luz.castShadow = true;
  luz.shadow.mapSize.set(1024, 1024);
  luz.shadow.bias = -0.0004;
  luz.shadow.normalBias = 0.05;
  const caixa = luz.shadow.camera;
  caixa.left = -58;
  caixa.right = 58;
  caixa.top = 58;
  caixa.bottom = -58;
  caixa.near = 10;
  caixa.far = 300;
  caixa.updateProjectionMatrix();
  luz.position.set(0, 0, 0).addScaledVector(STYLE.lightDirection, 150);
  scene.add(luz, luz.target);
  renderer.shadowMap.needsUpdate = true;

  /* ── câmera ─────────────────────────────────────────────────────────────── */

  const DEG = Math.PI / 180;
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 900);
  const MIRA = new THREE.Vector3(0, 3, 0);
  // Meia-altura e meia-largura do que precisa aparecer. A altura é menor do
  // que a ilha de propósito: numa faixa larga as pontas da frente e do fundo
  // saem do quadro, que é onde a névoa já estava comendo tudo mesmo.
  const ALTO = 29;
  const LARGO = 56;

  function redimensionar() {
    const r = palco.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    const prop = r.width / r.height;
    camera.aspect = prop;
    camera.updateProjectionMatrix();
    const tanV = Math.tan((camera.fov / 2) * DEG);
    const dist = Math.max(ALTO / tanV, LARGO / (tanV * prop));
    const az = 45 * DEG;
    const el = 36 * DEG;
    camera.position.set(
      MIRA.x + dist * Math.cos(el) * Math.sin(az),
      MIRA.y + dist * Math.sin(el),
      MIRA.z + dist * Math.cos(el) * Math.cos(az),
    );
    camera.lookAt(MIRA);
    // A névoa começa no meio da cena, e não antes dele: enquanto ela mordia o
    // centro, o prédio de barro claro virava branco no branco e sumia. Daqui
    // para trás ela segue dissolvendo a ilha, que é o que ela existe para fazer.
    scene.fog.near = dist * 0.98;
    scene.fog.far = dist * 1.7;
  }

  /* ── quadro ─────────────────────────────────────────────────────────────── */

  let naTela = false;
  new IntersectionObserver(([e]) => { naTela = e.isIntersecting; }).observe(palco);

  const relogio = new THREE.Clock();
  function quadro() {
    requestAnimationFrame(quadro);
    if (!naTela) { relogio.getDelta(); return; }
    const dt = Math.min(0.05, relogio.getDelta());
    const agora = relogio.getElapsedTime();

    if (!reduzido) {
      ilhota.update(agora, dt);
      veiculos.update(agora, dt);
      // Os carros andam: o mapa de sombra tem de andar com eles.
      renderer.shadowMap.needsUpdate = true;
    }
    renderer.render(scene, camera);
  }

  window.addEventListener('resize', redimensionar);
  redimensionar();
  if (reduzido) {
    // Parado, mas não vazio: os carros assumem a posição onde a volta começa.
    ilhota.update(0, 0);
    veiculos.update(0, 0);
    renderer.shadowMap.needsUpdate = true;
  }
  requestAnimationFrame(quadro);
}
