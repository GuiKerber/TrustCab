/* ==========================================================================
   TrustCab · a viagem entre as quatro zonas

   As maquetes vêm prontas do kit em ./zonas. A viagem passa por quatro
   lugares, nesta ordem: centro financeiro, porto de cargas, fazenda e vale
   dos ventos.

   Duas regras mandam na montagem:

   1. Uma zona de cada vez. Quatro composições no mesmo quadro é caro demais —
      cada uma é um mundo inteiro. A zona só é construída quando a viagem se
      aproxima dela, e some da cena quando fica para trás. No meio do caminho
      entre duas, as duas aparecem por um instante, já quase comidas pela
      névoa.

   2. A linha corre pela rua. O percurso não atravessa prédio, galpão nem
      morro: dentro de cada lugar ele segue a via que a própria composição
      desenha — a avenida do centro, a pista do cais, a estrada da fazenda e,
      no vale, a estrada do vilarejo passando pela ponte de pedra. Entre um
      lugar e outro ele corre por campo aberto.
   ========================================================================== */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { STYLE, WATER_LEVEL, createMaterials, displayToScene } from './zonas/estilo.js';
import { Kit } from './zonas/kit.js';
import { smoothstep, mix } from './zonas/terreno.js';
import { COMPOSITIONS } from './zonas/composicoes.js';

const canvas = document.getElementById('cena');
const fallback = document.getElementById('semWebgl');
const story = document.querySelector('.story');
const stage = document.querySelector('.story__stage');
const chapters = Array.from(document.querySelectorAll('.chapter'));
const trackItems = Array.from(document.querySelectorAll('.track__item'));

const trilha = document.getElementById('trilha');
const grade = document.querySelector('.story__grid');

// Os títulos fora da história só revelam quando entram na tela. A classe na
// raiz é o interruptor: é ela que liga o estado escondido no CSS, então uma
// página sem script nenhum mostra o texto no lugar em vez de esconder.
document.documentElement.classList.add('js');
const revelador = new IntersectionObserver((entradas) => {
  for (const e of entradas) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('is-on');
    revelador.unobserve(e.target);
  }
}, { threshold: 0.35 });
document.querySelectorAll('.close__title, .faq__title').forEach((el) => revelador.observe(el));

function alinharTrilha() {
  if (!trilha || !grade) return;
  // Abaixo de 1100 a trilha vira uma fileira no topo e não há o que alinhar.
  if (window.innerWidth < 1100) { trilha.style.marginTop = ''; return; }
  const titulo = document.querySelector('.chapter.is-on h2');
  if (!titulo) return;
  trilha.style.marginTop = '0px';
  const delta = titulo.getBoundingClientRect().top - trilha.getBoundingClientRect().top;
  trilha.style.marginTop = Math.max(0, Math.round(delta)) + 'px';
}

window.addEventListener('resize', alinharTrilha);
if (document.fonts) document.fonts.ready.then(alinharTrilha);

const DEG = Math.PI / 180;
const plano = () => 0;
const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// A linha e o ícone são a única cor da cena. Vão sem tone mapping e sem névoa
// para sair exatamente no amarelo da marca em qualquer distância.
const AMARELO = 0xf2cf12;

class KitSeco extends Kit {
  add() {}
  instance() {}
  child() {}
  box() {}
  cylinder() {}
  torus() {}
  prism() {}
  sphere() {}
  dome() {}
  cone() {}
  profile() {}
  extrude() {}
  slab() {}
  beam() {}
}

// O kit reserva com folga em volta de cada peça, e para peças giradas guarda a
// caixa alinhada aos eixos, bem maior que a planta. A folga é descontada: sem
// isso a rua passaria a desviar de uma igreja torta que está a metros dali.
const FOLGA = 1.3;

// Empurra cada ponto da rua para fora de qualquer construção, pela saída mais
// curta. Duas passadas, porque sair de uma caixa pode entrar na vizinha.
function desviar(pontos, reservados) {
  const fora = pontos.map(([x, z]) => [x, z]);
  for (let passada = 0; passada < 2; passada++) {
    for (const ponto of fora) {
      for (const [x0, z0, x1, z1] of reservados) {
        const a = x0 + FOLGA;
        const b = z0 + FOLGA;
        const c = x1 - FOLGA;
        const d = z1 - FOLGA;
        if (c <= a || d <= b) continue;
        if (!(ponto[0] > a && ponto[0] < c && ponto[1] > b && ponto[1] < d)) continue;
        const saidas = [[a - ponto[0] - 0.8, 0], [c - ponto[0] + 0.8, 0], [0, b - ponto[1] - 0.8], [0, d - ponto[1] + 0.8]];
        saidas.sort((p, q) => Math.hypot(p[0], p[1]) - Math.hypot(q[0], q[1]));
        ponto[0] += saidas[0][0];
        ponto[1] += saidas[0][1];
      }
    }
  }
  return fora;
}

const PATCH = 248;

// A rua de cada lugar, em coordenadas locais da composição. Não são linhas
// inventadas: cada uma segue a via que a composição já desenha.
const RUAS = {
  // Avenida entre dois quarteirões: as quadras vão até z 10 e recomeçam em 16.
  centro: [[-58, 13], [-20, 13], [18, 13], [56, 13], [96, 13]],
  // A pista do cais, entre o apron e o pátio de contêineres. Os pórticos
  // passam por cima dela — é para isso que eles têm vão.
  porto: [[-96, 2], [-48, 2], [0, 2], [48, 2], [96, 2]],
  // A estrada da fazenda, entre o curral e as lavouras.
  fazenda: [[-96, 15.5], [-48, 15.5], [0, 15.5], [48, 15.5], [96, 15.5]],
  // A estrada do vilarejo, subindo até a ponte de pedra e cruzando o rio.
  vale: [[-78, -58], [-44, -42], [-16, -24], [-6, -16], [4, -6], [12.6, 0.4], [10, 10], [7.4, 19.6], [4, 30], [-6, 37]],
};

const LUGARES = [
  { id: 'centro', x: 0, z: 0 },
  { id: 'porto', x: 420, z: 0 },
  { id: 'fazenda', x: 840, z: 0 },
  { id: 'vale', x: 1260, z: 0 },
];

/* ── a história continua sem 3D ───────────────────────────────────────────── */

let PARADAS = [0.12, 0.37, 0.62, 0.88];

function lerRolagem() {
  if (!story || !stage) return 0;
  const rect = story.getBoundingClientRect();
  const curso = story.offsetHeight - stage.offsetHeight;
  if (curso <= 0) return 0;
  return Math.min(1, Math.max(0, -rect.top / curso));
}

function capituloDe(u) {
  for (let i = PARADAS.length - 1; i >= 0; i--) {
    const inicio = i === 0 ? 0 : (PARADAS[i - 1] + PARADAS[i]) / 2;
    if (u >= inicio) return i;
  }
  return 0;
}

// Clicar num ponto da trilha leva a rolagem até a parada inteira. Os âncoras
// do HTML não servem para isso: os capítulos moram dentro de um palco grudado e
// ficam todos praticamente na mesma altura da página, então o salto do
// navegador anda alguns pixels e para. Aqui a conta é a mesma de lerRolagem(),
// ao contrário: de qual rolagem sai o u da parada.
function irPara(i) {
  if (!story || !stage) return;
  const curso = story.offsetHeight - stage.offsetHeight;
  if (curso <= 0) return;
  const topo = window.scrollY + story.getBoundingClientRect().top;
  window.scrollTo({
    top: Math.round(topo + PARADAS[i] * curso),
    behavior: reduzido ? 'auto' : 'smooth',
  });
}

trackItems.forEach((item, i) => {
  const link = item.querySelector('a');
  if (!link) return;
  link.addEventListener('click', (evento) => {
    evento.preventDefault();
    irPara(i);
  });
});

function falhar(erro) {
  if (erro) console.error(erro);
  if (canvas) canvas.hidden = true;
  if (fallback) fallback.hidden = false;
  window.addEventListener('scroll', () => {
    const i = capituloDe(lerRolagem());
    chapters.forEach((el, n) => el.classList.toggle('is-on', n === i));
    trackItems.forEach((el, n) => el.classList.toggle('is-on', n === i));
    alinharTrilha();
  }, { passive: true });
}

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
} catch (e) {
  falhar(e);
}
if (renderer) montar();

function montar() {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));

  const tela = renderer.domElement;
  tela.style.cssText = 'display:block;width:100%;height:100%';
  tela.setAttribute('role', 'img');
  tela.setAttribute('aria-label', 'Maquete 3D do percurso: centro financeiro, porto de cargas, fazenda e vale dos ventos.');
  canvas.replaceWith(tela);

  const materiais = createMaterials();
  materiais.clay.emissive.multiplyScalar(0.74);
  materiais.ground.emissive.multiplyScalar(0.84);
  const fundo = displayToScene(STYLE.background);

  const scene = new THREE.Scene();
  scene.background = fundo;
  // Névoa curta de propósito: é ela que esconde a zona que entra e a que sai.
  scene.fog = new THREE.Fog(fundo, 220, 480);

  for (const l of LUGARES) {
    l.def = COMPOSITIONS.find((c) => c.id === l.id);
    l.altura = l.def.height || plano;
    l.pecas = null;
    const seco = new KitSeco({ height: l.altura, seed: l.def.seed || 1 });
    l.def.build(seco);
    l.reservados = seco.reserved;
    l.rua = desviar(RUAS[l.id], l.reservados);
  }

  /* ── o percurso ─────────────────────────────────────────────────────────── */

  // A rota é costurada: a rua de cada lugar, e entre uma e outra dois pontos
  // de arremate que fazem a curva no campo aberto.
  const bruto = [];
  LUGARES.forEach((l, i) => {
    const rua = l.rua.map(([x, z]) => [x + l.x, z + l.z]);
    l.deRua = rua[0];
    l.ateRua = rua[rua.length - 1];
    if (i > 0) {
      const a = bruto[bruto.length - 1];
      const b = rua[0];
      bruto.push([mix(a[0], b[0], 0.34), mix(a[1], b[1], 0.16)]);
      bruto.push([mix(a[0], b[0], 0.68), mix(a[1], b[1], 0.84)]);
    }
    bruto.push(...rua);
  });

  const curva = new THREE.CatmullRomCurve3(bruto.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const AMOSTRAS = 460;
  const amostrados = curva.getSpacedPoints(AMOSTRAS);

  function tMaisPerto([x, z]) {
    let melhor = 0;
    let dist = Infinity;
    amostrados.forEach((p, i) => {
      const d = (p.x - x) ** 2 + (p.z - z) ** 2;
      if (d < dist) { dist = d; melhor = i; }
    });
    return melhor / AMOSTRAS;
  }
  for (const l of LUGARES) {
    l.tEntra = tMaisPerto(l.deRua);
    l.tSai = tMaisPerto(l.ateRua);
  }

  // Ritmo: a rolagem anda devagar dentro dos lugares e depressa no campo
  // aberto. Sem isso, metade da página é estrada vazia.
  const RUA_U = 0.20;
  const CAMPO_U = 0.04;
  const trechos = [];
  let anterior = 0;
  LUGARES.forEach((l, i) => {
    if (i > 0) trechos.push({ t0: anterior, t1: l.tEntra, u: CAMPO_U });
    trechos.push({ t0: l.tEntra, t1: l.tSai, u: RUA_U, lugar: l });
    anterior = l.tSai;
  });
  if (anterior < 0.999) trechos.push({ t0: anterior, t1: 1, u: 1 - (RUA_U * 4 + CAMPO_U * 3) });
  let acumulado = 0;
  for (const g of trechos) {
    g.u0 = acumulado;
    acumulado += g.u;
    g.u1 = acumulado;
  }
  // Arredonda a última fatia para fechar exatamente em 1.
  trechos[trechos.length - 1].u1 = 1;
  PARADAS = trechos.filter((g) => g.lugar).map((g) => (g.u0 + g.u1) / 2);

  function ritmo(u) {
    for (const g of trechos) {
      if (u <= g.u1) return mix(g.t0, g.t1, g.u1 === g.u0 ? 0 : (u - g.u0) / (g.u1 - g.u0));
    }
    return 1;
  }

  const linha = new THREE.Mesh(
    fitaDoPercurso(curva, AMOSTRAS, 1.9),
    new THREE.MeshBasicMaterial({ color: AMARELO, toneMapped: false, fog: false }),
  );
  linha.geometry.setDrawRange(0, 0);
  linha.renderOrder = 2;
  scene.add(linha);

  const seta = criarSeta();
  scene.add(seta);

  const agua = chaoDoMundo(materiais);
  scene.add(agua.grupo);

  /* ── luz ────────────────────────────────────────────────────────────────── */

  const luz = new THREE.DirectionalLight(0xffffff, Math.PI * 1.22);
  luz.castShadow = true;
  luz.shadow.mapSize.set(2048, 2048);
  luz.shadow.bias = -0.0003;
  luz.shadow.normalBias = 0.05;
  const caixa = luz.shadow.camera;
  caixa.left = -140;
  caixa.right = 140;
  caixa.top = 140;
  caixa.bottom = -140;
  caixa.near = 10;
  caixa.far = 420;
  caixa.updateProjectionMatrix();
  scene.add(luz, luz.target);

  /* ── as zonas, uma por vez ──────────────────────────────────────────────── */

  // Construir é caro: só acontece quando a viagem chega perto. Depois de
  // pronta, a zona fica guardada e é só ligada e desligada.
  function construir(lugar) {
    const kit = new Kit({ height: lugar.altura, seed: lugar.def.seed || 1 });
    lugar.def.build(kit);
    const montado = kit.finish(materiais.clay);
    montado.group.position.set(lugar.x, 0, lugar.z);
    scene.add(montado.group);

    const terreno = chaoDaZona(lugar.altura);
    terreno.material = materiais.ground;
    terreno.position.set(lugar.x, 0, lugar.z);
    scene.add(terreno);

    lugar.pecas = { grupo: montado.group, terreno, update: montado.update, visivel: true };
    conferirRua(lugar, kit.reserved);
    renderer.shadowMap.needsUpdate = true;
  }

  // A rua precisa estar livre. Se algum trecho cair dentro do espaço reservado
  // de uma construção, o aviso sai no console com o ponto exato — é mais
  // honesto do que a linha atravessar um galpão em silêncio.
  function conferirRua(lugar, reservados) {
    if (!reservados || !reservados.length) return;
    // Já foi desviada na montagem da rota; isto só confirma que sobrou livre.
    // O kit reserva com 1,2 de folga em volta de cada peça, e para peças
    // giradas guarda a caixa alinhada aos eixos, bem maior que a planta real.
    // A conferência desconta a folga, senão acusa a rua passando ao lado de
    // uma igreja torta como se passasse por dentro dela.
    const presos = [];
    for (const [x, z] of lugar.rua) {
      for (const [x0, z0, x1, z1] of reservados) {
        if (x > x0 + FOLGA && x < x1 - FOLGA && z > z0 + FOLGA && z < z1 - FOLGA) presos.push([x, z]);
      }
    }
    if (presos.length) console.warn(`[rota] ${lugar.id} cruza construção em ${JSON.stringify(presos)}`);
  }

  let zonaDaLuz = -1;
  function firmarLuz(i) {
    if (i === zonaDaLuz) return;
    zonaDaLuz = i;
    const l = LUGARES[i];
    luz.position.set(l.x, 0, l.z).addScaledVector(STYLE.lightDirection, 210);
    luz.target.position.set(l.x, 0, l.z);
    luz.target.updateMatrixWorld();
    renderer.shadowMap.needsUpdate = true;
  }

  function alcance(alvoX, alvoZ) {
    let mudou = false;
    for (const l of LUGARES) {
      const d = Math.hypot(l.x - alvoX, l.z - alvoZ);
      if (d < 400 && !l.pecas) { construir(l); continue; }
      if (!l.pecas) continue;
      const visivel = d < 360;
      if (visivel === l.pecas.visivel) continue;
      l.pecas.visivel = visivel;
      l.pecas.grupo.visible = visivel;
      l.pecas.terreno.visible = visivel;
      mudou = true;
    }
    if (mudou) renderer.shadowMap.needsUpdate = true;
  }

  /* ── câmera ─────────────────────────────────────────────────────────────── */

  const camera = new THREE.PerspectiveCamera(28, 1, 1, 1800);
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
  const ao = new GTAOPass(scene, camera, 1, 1);
  ao.output = GTAOPass.OUTPUT.Default;
  ao.blendIntensity = 1;
  ao.updateGtaoMaterial({ radius: 2.4, distanceExponent: 1.6, thickness: 3, scale: 1.25, samples: 8, distanceFallOff: 1 });
  ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, rings: 1, samples: 8 });
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(ao);
  composer.addPass(new OutputPass());

  let larguraTela = 0;
  let alturaTela = 0;
  let distancia = 230;
  function redimensionar() {
    const r = stage.getBoundingClientRect();
    larguraTela = r.width;
    alturaTela = r.height;
    if (!larguraTela || !alturaTela) return;
    renderer.setSize(larguraTela, alturaTela, false);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(larguraTela, alturaTela);
    const prop = larguraTela / alturaTela;
    camera.aspect = prop;
    // Em tela estreita a câmera abre e recua, para o lugar continuar inteiro.
    camera.fov = prop < 1.6 ? mix(28, 40, smoothstep(1.6, 0.5, prop)) : 28;
    camera.updateProjectionMatrix();
    distancia = prop < 1.6 ? mix(230, 300, smoothstep(1.6, 0.55, prop)) : 230;
    scene.fog.near = distancia * 0.95;
    scene.fog.far = distancia * 2.1;
  }

  const alvo = new THREE.Vector3();
  const alvoSuave = new THREE.Vector3();

  // A câmera mira abaixo do percurso, e não nele: o lugar sobe no quadro e
  // aparece já na fresta que sobra embaixo da abertura, antes de qualquer
  // rolagem. Embaixo fica o chão vazio, que é onde o texto dos capítulos cai.
  const SUBIR = 26;
  const olhar = new THREE.Vector3();

  function posicionar() {
    const az = 45 * DEG;
    const el = 42 * DEG;
    camera.position.set(
      alvoSuave.x + distancia * Math.cos(el) * Math.sin(az),
      alvoSuave.y + distancia * Math.sin(el),
      alvoSuave.z + distancia * Math.cos(el) * Math.cos(az),
    );
    olhar.set(alvoSuave.x, alvoSuave.y - SUBIR, alvoSuave.z);
    camera.lookAt(olhar);
  }

  /* ── rolagem ────────────────────────────────────────────────────────────── */

  let destino = 0;
  let mostrado = 0;
  let atual = -1;

  function trocarCapitulo(i) {
    if (i === atual) return;
    atual = i;
    chapters.forEach((el, n) => el.classList.toggle('is-on', n === i));
    trackItems.forEach((el, n) => el.classList.toggle('is-on', n === i));
    alinharTrilha();
  }

  function aoRolar() {
    destino = lerRolagem();
    trocarCapitulo(capituloDe(destino));
  }

  const relogio = new THREE.Clock();
  let pronto = false;
  // Medição dos primeiros quadros: em máquina lenta, o AO sai de cena. É o
  // passe mais caro e o único que a maquete perde sem deixar de ler.
  const BASE = Math.min(window.devicePixelRatio || 1, 1.25);
  // As peças que andam — carros, barcos, o trator, a gente na calçada — mudam
  // de lugar a cada quadro. O mapa de sombra não é refeito sozinho, então a
  // sombra ficava parada no chão onde o objeto passou. Agora ele é refeito
  // junto; passoSombra é de quantos em quantos quadros isso acontece, e é a
  // primeira coisa que o governo abaixo espaça quando o quadro aperta: uma
  // sombra um quadro atrasada não se vê, um quadro perdido se vê.
  let passoSombra = 1;
  let quadros = 0;
  let escala = 1;
  let mediaMs = 16;
  let proximoAjuste = 0;
  let comAO = true;

  function aplicarEscala() {
    renderer.setPixelRatio(BASE * escala);
    composer.setPixelRatio(BASE * escala);
    composer.setSize(larguraTela, alturaTela);
  }

  function ajustar(agora) {
    if (agora < proximoAjuste) return;
    if (mediaMs > 26 && passoSombra < 3) {
      passoSombra += 1;
      proximoAjuste = agora + 1.2;
    } else if (mediaMs > 34 && escala > 0.55) {
      escala = Math.max(0.55, escala - 0.12);
      aplicarEscala();
      proximoAjuste = agora + 1.2;
    } else if (mediaMs > 55 && comAO) {
      // Último recurso: só quando nem na resolução mínima o quadro fecha.
      comAO = false;
      ao.enabled = false;
      proximoAjuste = agora + 1.2;
    } else if (mediaMs < 17 && escala < 1) {
      escala = Math.min(1, escala + 0.08);
      aplicarEscala();
      proximoAjuste = agora + 2;
    } else if (mediaMs < 15 && passoSombra > 1) {
      passoSombra -= 1;
      proximoAjuste = agora + 2;
    }
  }

  function quadro() {
    requestAnimationFrame(quadro);
    if (!naTela) { relogio.getDelta(); return; }
    const dt = Math.min(0.05, relogio.getDelta());
    const agora = relogio.getElapsedTime();

    // Suavização independente do framerate: a câmera persegue a rolagem em vez
    // de saltar com ela. Com "remover animações" o salto é imediato.
    mostrado = reduzido ? destino : mostrado + (destino - mostrado) * (1 - Math.pow(0.0016, dt));
    const t = ritmo(mostrado);

    const p = curva.getPointAt(Math.min(1, Math.max(0, t)));
    alvo.set(p.x, 5, p.z);
    if (reduzido) alvoSuave.copy(alvo);
    else alvoSuave.lerp(alvo, 1 - Math.pow(0.0025, dt));
    posicionar();

    const capitulo = capituloDe(mostrado);
    firmarLuz(capitulo);
    agua.lamina.visible = Boolean(LUGARES[capitulo].def.water);
    alcance(alvoSuave.x, alvoSuave.z);

    const d = curva.getTangentAt(Math.min(1, Math.max(0, t)));
    seta.position.set(p.x, alturaDoMundo(p.x, p.z) + 5.4, p.z);
    seta.rotation.y = Math.atan2(d.x, d.z) - Math.PI / 2;
    if (!reduzido) seta.position.y += Math.sin(agora * 1.6) * 0.8;
    // Cada trecho da fita são dois triângulos: seis vértices. O percurso
    // desenhado termina exatamente onde o ícone está.
    linha.geometry.setDrawRange(0, Math.max(0, Math.floor(AMOSTRAS * t)) * 6);

    if (!reduzido) {
      const atualiza = LUGARES[capitulo].pecas;
      if (atualiza && atualiza.visivel && atualiza.update) {
        atualiza.update(agora, dt);
        if (quadros % passoSombra === 0) renderer.shadowMap.needsUpdate = true;
      }
      materiais.water.userData.time.value = agora;
    }
    quadros += 1;

    composer.render();

    mediaMs = mediaMs * 0.88 + dt * 1000 * 0.12;
    ajustar(agora);

    if (!pronto) {
      pronto = true;
      stage.dataset.pronto = 'sim';
    }
  }

  let naTela = true;
  new IntersectionObserver(([e]) => { naTela = e.isIntersecting; }).observe(story);

  window.addEventListener('resize', redimensionar);
  window.addEventListener('scroll', aoRolar, { passive: true });

  redimensionar();
  aoRolar();
  mostrado = destino;
  const t0 = ritmo(mostrado);
  const p0 = curva.getPointAt(t0);
  alvo.set(p0.x, 5, p0.z);
  alvoSuave.copy(alvo);
  posicionar();
  firmarLuz(capituloDe(destino));
  agua.lamina.visible = Boolean(LUGARES[capituloDe(destino)].def.water);
  trocarCapitulo(capituloDe(destino));
  requestAnimationFrame(() => {
    alcance(alvoSuave.x, alvoSuave.z);
    quadro();
  });
}

/* ── terreno ──────────────────────────────────────────────────────────────── */

// A borda do pedaço de terreno volta a zero, para encostar sem degrau no chão
// plano que existe entre as zonas.
function chaoDaZona(altura) {
  const geo = new THREE.PlaneGeometry(PATCH, PATCH, 104, 104);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, altura(pos.getX(i), pos.getZ(i)) * borda(pos.getX(i), pos.getZ(i)));
  }
  geo.computeVertexNormals();
  const malha = new THREE.Mesh(geo);
  malha.receiveShadow = true;
  malha.castShadow = true;
  return malha;
}

function borda(x, z) {
  const meio = PATCH / 2;
  return 1 - smoothstep(meio * 0.93, meio * 0.995, Math.max(Math.abs(x), Math.abs(z)));
}

// Altura do mundo em qualquer ponto: a da zona cujo pedaço cobre o ponto, e
// zero fora de todas. Serve para pousar a linha e o ícone.
function alturaDoMundo(x, z) {
  const meio = PATCH / 2;
  for (const l of LUGARES) {
    const lx = x - l.x;
    const lz = z - l.z;
    if (Math.abs(lx) < meio && Math.abs(lz) < meio) return l.altura(lx, lz) * borda(lx, lz);
  }
  return 0;
}

// Chão entre as zonas: uma placa enorme furada onde cada pedaço de terreno
// entra, mais a lâmina d'água por baixo. Sem os furos, a placa cobriria a baía
// do porto, o açude da fazenda e o rio do vale, que são escavados.
function chaoDoMundo(materiais) {
  const grupo = new THREE.Group();
  const meio = PATCH / 2 - 0.4;
  let lamina = null;

  const forma = new THREE.Shape([
    new THREE.Vector2(-3000, -3000),
    new THREE.Vector2(3000, -3000),
    new THREE.Vector2(3000, 3000),
    new THREE.Vector2(-3000, 3000),
  ]);
  for (const l of LUGARES) {
    forma.holes.push(new THREE.Path([
      new THREE.Vector2(l.x - meio, -(l.z - meio)),
      new THREE.Vector2(l.x - meio, -(l.z + meio)),
      new THREE.Vector2(l.x + meio, -(l.z + meio)),
      new THREE.Vector2(l.x + meio, -(l.z - meio)),
    ]));
  }
  const geo = new THREE.ShapeGeometry(forma);
  geo.rotateX(-Math.PI / 2);
  const placa = new THREE.Mesh(geo, materiais.ground);
  placa.receiveShadow = true;
  grupo.add(placa);

  const folha = new THREE.PlaneGeometry(8000, 8000);
  folha.rotateX(-Math.PI / 2);
  folha.translate(0, WATER_LEVEL, 0);
  lamina = new THREE.Mesh(folha, materiais.water);
  lamina.receiveShadow = true;
  lamina.renderOrder = 1;
  grupo.add(lamina);

  return { grupo, lamina };
}

/* ── a linha e o ícone ────────────────────────────────────────────────────── */

// Fita plana ao longo do percurso, pousada sobre o relevo.
function fitaDoPercurso(curva, amostras, largura) {
  const pos = [];
  const cima = new THREE.Vector3(0, 1, 0);
  const tan = new THREE.Vector3();
  const lado = new THREE.Vector3();
  const esq = [];
  const dir = [];
  for (let i = 0; i <= amostras; i++) {
    const t = i / amostras;
    const p = curva.getPointAt(t);
    tan.copy(curva.getTangentAt(t)).normalize();
    lado.crossVectors(tan, cima).normalize().multiplyScalar(largura / 2);
    const y = alturaDoMundo(p.x, p.z) + 0.26;
    esq.push([p.x - lado.x, y, p.z - lado.z]);
    dir.push([p.x + lado.x, y, p.z + lado.z]);
  }
  for (let i = 0; i < amostras; i++) {
    pos.push(...esq[i], ...dir[i], ...esq[i + 1], ...dir[i], ...dir[i + 1], ...esq[i + 1]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return geo;
}

// O ícone de navegação do app: disco com a seta em tinta, pairando sobre a linha.
function criarSeta() {
  const grupo = new THREE.Group();

  grupo.add(new THREE.Mesh(
    new THREE.CylinderGeometry(6.2, 6.2, 1.5, 48),
    new THREE.MeshBasicMaterial({ color: AMARELO, toneMapped: false, fog: false }),
  ));

  const forma = new THREE.Shape();
  forma.moveTo(2.9, 0);
  forma.lineTo(-2.2, -2.55);
  forma.lineTo(-0.9, 0);
  forma.lineTo(-2.2, 2.55);
  forma.lineTo(2.9, 0);
  const geo = new THREE.ExtrudeGeometry(forma, {
    depth: 0.8, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.14, bevelSegments: 2,
  });
  geo.rotateX(-Math.PI / 2);
  const ponta = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x141414, toneMapped: false, fog: false }));
  ponta.position.y = 0.76;
  grupo.add(ponta);

  return grupo;
}
