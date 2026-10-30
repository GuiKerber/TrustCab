/* ==========================================================================
   TrustCab · a abertura

   A cidade atrás do aparelho. É a mesma maquete do resto da página — mesmo
   kit, mesma tinta de barro, mesma luz — montada aqui como um bairro inteiro,
   com o carro do motorista cumprindo um itinerário dentro dele.

   O itinerário é o ponto. Um carro dando voltas num quarteirão lê como
   enfeite; um carro que desce uma avenida, vira duas esquinas, para num
   passageiro e segue para o outro lado do bairro lê como trabalho. Por isso
   o percurso tem nove trechos e quatro paradas espalhadas, e a velocidade não
   é constante: ela cai na curva pelo raio da curva, e cai de novo antes de
   cada passageiro. O que a cena conta é o produto inteiro — o carro chega, o
   passageiro entra, a viagem vira dinheiro.

   O carro é a única coisa escura da maquete. Ele é o motorista, e precisa ser
   achado de relance no meio de uma cidade branca.

   Os passageiros não são 3D: são HTML por cima da tela, colocados a cada
   quadro no ponto 3D onde eles estão. Assim a letra e o valor saem do design
   system do app — fonte de verdade, contraste de verdade, e nada de texto
   desenhado em textura.

   Sem WebGL o bloco inteiro some e a abertura fica com o título, o texto, o
   botão e o aparelho, que é o que ela precisa dizer de qualquer jeito.
   ========================================================================== */

import * as THREE from 'three';
import { createMaterials, displayToScene, STYLE } from './zonas/estilo.js';
import { Kit } from './zonas/kit.js';
import * as P from './zonas/pecas.js';

const palco = document.getElementById('palco-abertura');
const tela = document.getElementById('cena-abertura');
const pinos = [...document.querySelectorAll('#pinos .pino')];
if (palco && tela) montar();

function montar() {
  /* ── medidas ──────────────────────────────────────────────────────────────
     Enquadrar a cena é mexer nestes números e olhar o resultado. Por isso
     todos moram aqui em cima, e não espalhados no meio do arquivo. */

  // O fundo da cena é o fundo da página — é por esta cor que a névoa dissolve
  // a maquete nela. Vem de estilo.js, como nas outras duas cenas do site.
  const FUNDO = STYLE.background;

  const RUAS = [-102, -72, -42, -12, 18, 48, 78, 108, 138]; // eixos, de 30 em 30
  const PISTA = 9;        // largura da rua
  const MAO = 2.4;        // o carro anda na mão da direita, não no eixo
  const CALCADA = 4.8;    // do eixo da rua até onde o passageiro espera
  const ESQUINA = 7;      // raio da curva que o carro faz

  // Deslocada para o fundo da cidade: é ela que sobe a cena na tela, e com ela
  // as quatro paradas do carro, que precisam caber na primeira dobra.
  const MIRA = new THREE.Vector3(27, 1.5, 27);
  const AZIMUTE = 45;
  const ELEVACAO = 40;
  const CAMPO = 28;
  const LARGO = 125;      // meia-largura do que precisa caber
  const ALTO = 62;        // meia-altura do que precisa caber
  const ATE_OS_PINOS = 95; // meia-largura quando a tela é estreita: só até os passageiros

  const VELOCIDADE = 34;  // na reta, unidades por segundo
  const LATERAL = 42;     // conforto na curva: v = raiz(LATERAL / curvatura)
  const FREIO = 14;       // distância em que ele começa a reduzir no passageiro
  const ESPERA = 1.2;     // parado em cada passageiro
  const ANTES_DO_PILL = 0.35;

  // O itinerário, esquina por esquina, pelo eixo das ruas. Nove trechos que
  // atravessam o bairro inteiro: nada aqui volta pelo caminho que veio.
  const ITINERARIO = [
    [-12, 48], [-12, -12], [108, -12], [108, 18],
    [18, 18], [18, 108], [-42, 108], [-42, 48],
  ];

  // Onde cada passageiro espera, no eixo da rua. A ordem é a do HTML: D, A, C, B.
  // Eles estão espalhados mais ou menos a cada quarto do caminho — não porque
  // a cidade seja simétrica, mas porque com dois deles juntos a cena fica meio
  // minuto sem nada acontecendo.
  const PASSAGEIROS = [[60, -12], [100, 18], [18, 84], [-42, 67]];

  const DEG = Math.PI / 180;
  const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ── a tela ─────────────────────────────────────────────────────────────── */

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: tela, antialias: true, powerPreference: 'high-performance' });
  } catch (erro) {
    palco.hidden = true;
    return;
  }

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const materiais = createMaterials();
  const fundo = displayToScene(FUNDO);
  const scene = new THREE.Scene();
  scene.background = fundo;
  scene.fog = new THREE.Fog(fundo, 160, 460);

  /* ── o chão ─────────────────────────────────────────────────────────────── */

  // O parque, à direita e bem ao fundo: é o vazio que tira o bairro da
  // repetição e dá ao olho onde descansar depois de tanta aresta reta.
  const PARQUE = [13, -107, 83, -47];
  const noParque = (x, z) => x > PARQUE[0] && x < PARQUE[2] && z > PARQUE[1] && z < PARQUE[3];

  // Disco, e não placa: a borda precisa cair dentro da névoa por todos os
  // lados, senão ela aparece de lado como uma linha reta atravessando a cena.
  const terreno = new Kit({ seed: 3 });
  terreno.cylinder(330, 330, 2, MIRA.x, -2, MIRA.z, { segments: 72 });
  const chao = terreno.finish(materiais.ground).group;
  chao.traverse((o) => { o.receiveShadow = true; });
  scene.add(chao);

  /* ── o traçado ──────────────────────────────────────────────────────────── */

  const versor = (de, para) => {
    const dx = para[0] - de[0];
    const dz = para[1] - de[1];
    const m = Math.hypot(dx, dz) || 1;
    return [dx / m, dz / m];
  };

  // Joga a linha do eixo para a mão da direita. Andando em (dx,dz), a direita
  // é (-dz,dx): cada trecho desliza para lá, e a esquina nova é o encontro dos
  // dois trechos já deslizados.
  function maoDireita(esquinas, recuo) {
    const n = esquinas.length;
    const desvio = esquinas.map((p, i) => {
      const [dx, dz] = versor(p, esquinas[(i + 1) % n]);
      return [-dz * recuo, dx * recuo];
    });
    return esquinas.map((p, i) => {
      const antes = desvio[(i - 1 + n) % n];
      const agora = desvio[i];
      // O trecho que chegou fixa uma coordenada; o que sai fixa a outra.
      const chegouEmX = esquinas[(i - 1 + n) % n][1] === p[1];
      return chegouEmX ? [p[0] + agora[0], p[1] + antes[1]] : [p[0] + antes[0], p[1] + agora[1]];
    });
  }

  // A polilinha com as esquinas arredondadas, amostrada de metro em metro.
  // Reta de verdade na reta e arco de verdade na curva: uma spline passando
  // pelas mesmas esquinas abauloaria as retas, e aí o carro andaria de lado.
  function trilha(esquinas, raio, passo = 1) {
    const n = esquinas.length;
    const chave = [];
    for (let i = 0; i < n; i++) {
      const b = esquinas[i];
      const ent = versor(esquinas[(i - 1 + n) % n], b);
      const sai = versor(b, esquinas[(i + 1) % n]);
      const p0 = [b[0] - ent[0] * raio, b[1] - ent[1] * raio];
      const p1 = [b[0] + sai[0] * raio, b[1] + sai[1] * raio];
      const cx = p0[0] + sai[0] * raio;
      const cz = p0[1] + sai[1] * raio;
      const a0 = Math.atan2(p0[1] - cz, p0[0] - cx);
      let giro = Math.atan2(p1[1] - cz, p1[0] - cx) - a0;
      while (giro > Math.PI) giro -= Math.PI * 2;
      while (giro < -Math.PI) giro += Math.PI * 2;
      chave.push(p0);
      const partes = Math.max(3, Math.round((Math.abs(giro) * raio) / passo));
      for (let s = 1; s < partes; s++) {
        const ang = a0 + (giro * s) / partes;
        chave.push([cx + Math.cos(ang) * raio, cz + Math.sin(ang) * raio]);
      }
      chave.push(p1);
    }

    const pontos = [];
    for (let i = 0; i < chave.length; i++) {
      const a = chave[i];
      const b = chave[(i + 1) % chave.length];
      pontos.push(a);
      const comp = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const partes = Math.floor(comp / passo);
      for (let s = 1; s < partes; s++) {
        pontos.push([a[0] + ((b[0] - a[0]) * s) / partes, a[1] + ((b[1] - a[1]) * s) / partes]);
      }
    }
    return pontos;
  }

  const CAMINHO = trilha(maoDireita(ITINERARIO, MAO), ESQUINA);
  const N = CAMINHO.length;

  // Comprimento acumulado e curvatura, ponto a ponto.
  const metro = new Float32Array(N + 1);
  const curva = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const a = CAMINHO[i];
    const b = CAMINHO[(i + 1) % N];
    metro[i + 1] = metro[i] + Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  const VOLTA = metro[N];
  for (let i = 0; i < N; i++) {
    const a = CAMINHO[(i - 1 + N) % N];
    const b = CAMINHO[i];
    const c = CAMINHO[(i + 1) % N];
    const e = versor(a, b);
    const s = versor(b, c);
    const giro = Math.abs(Math.atan2(e[0] * s[1] - e[1] * s[0], e[0] * s[0] + e[1] * s[1]));
    const passo = Math.hypot(c[0] - a[0], c[1] - a[1]) / 2 || 1;
    curva[i] = giro / passo;
  }

  /* ── as paradas ─────────────────────────────────────────────────────────── */

  // Cada passageiro é um ponto no eixo da rua. O lugar onde o carro encosta é
  // o ponto do caminho mais perto dele; o passageiro mesmo fica meia faixa
  // adiante, no meio-fio.
  function maisPerto(x, z) {
    let melhor = 0;
    let menor = Infinity;
    for (let i = 0; i < N; i++) {
      const d = (CAMINHO[i][0] - x) ** 2 + (CAMINHO[i][1] - z) ** 2;
      if (d < menor) { menor = d; melhor = i; }
    }
    return melhor;
  }

  const paradas = PASSAGEIROS.map(([x, z], indice) => {
    const i = maisPerto(x, z);
    const [dx, dz] = versor(CAMINHO[(i - 1 + N) % N], CAMINHO[(i + 1) % N]);
    const fora = CALCADA - MAO;
    return {
      indice,
      amostra: i,
      pino: new THREE.Vector3(CAMINHO[i][0] - dz * fora, 0.3, CAMINHO[i][1] + dx * fora),
    };
  }).sort((a, b) => a.amostra - b.amostra);

  // Distância até o passageiro mais próximo, pelos dois lados da volta: é ela
  // que faz o carro chegar devagar e sair devagar.
  const aoPassageiro = new Float32Array(N).fill(Infinity);
  for (const parada of paradas) {
    for (let i = 0; i < N; i++) {
      const bruta = Math.abs(metro[i] - metro[parada.amostra]);
      const d = Math.min(bruta, VOLTA - bruta);
      if (d < aoPassageiro[i]) aoPassageiro[i] = d;
    }
  }

  /* ── o relógio da volta ─────────────────────────────────────────────────── */

  // Velocidade possível em cada ponto, e o tempo que se leva para chegar nele.
  // A curva limita pelo raio, como um carro de verdade; o passageiro limita
  // pela distância que falta para ele.
  const suave = (t) => t * t * (3 - 2 * t);
  const chegada = new Float64Array(N + 1);
  const saida = new Float64Array(N + 1);
  const paradaNa = new Int8Array(N).fill(-1);
  for (const parada of paradas) paradaNa[parada.amostra] = parada.indice;

  for (let i = 0; i < N; i++) {
    saida[i] = chegada[i] + (paradaNa[i] >= 0 ? ESPERA : 0);
    const naCurva = curva[i] > 1e-4 ? Math.sqrt(LATERAL / curva[i]) : Infinity;
    const noPonto = 0.1 + 0.9 * suave(Math.min(1, aoPassageiro[i] / FREIO));
    const v = Math.max(1.2, Math.min(VELOCIDADE, naCurva) * noPonto);
    chegada[i + 1] = saida[i] + (metro[i + 1] - metro[i]) / v;
  }
  saida[N] = chegada[N];
  const CICLO = chegada[N];

  const ondeEstou = new THREE.Vector3();

  // Em que ponto da volta o carro está neste instante, e qual passageiro já
  // virou dinheiro.
  function dirigir(tempo) {
    const t = CICLO ? tempo % CICLO : 0;
    let lo = 0;
    let hi = N;
    while (lo < hi - 1) {
      const meio = (lo + hi) >> 1;
      if (chegada[meio] <= t) lo = meio;
      else hi = meio;
    }
    const i = lo;
    const parado = t < saida[i];
    const prox = (i + 1) % N;
    const f = parado ? 0 : Math.min(1, (t - saida[i]) / Math.max(1e-6, chegada[i + 1] - saida[i]));
    const a = CAMINHO[i];
    const b = CAMINHO[prox];
    ondeEstou.set(a[0] + (b[0] - a[0]) * f, 0.02, a[1] + (b[1] - a[1]) * f);
    const olhar = versor(CAMINHO[(i - 1 + N) % N], CAMINHO[(prox + 1) % N]);
    const pago = parado && paradaNa[i] >= 0 && t - chegada[i] > ANTES_DO_PILL ? paradaNa[i] : -1;
    return { olhar, pago };
  }

  /* ── a cidade ───────────────────────────────────────────────────────────── */

  const k = new Kit({ seed: 29 });
  const TOPO = 0.3;
  const on = { y: TOPO };
  const BORDA = PISTA / 2 + 0.5;

  // A praça fica no quarteirão do meio, bem atrás do aparelho. Não é enfeite:
  // a câmera olha de cima e de lado, então o que está na frente de uma rua
  // tapa essa rua. Duas das ruas do itinerário passam atrás deste quarteirão —
  // com ele baixo, elas continuam à vista.
  const PRACA = [-12 + BORDA, -12 + BORDA, 18 - BORDA, 18 - BORDA];

  // Dois quarteirões emendados, com a rua do meio engolida: é o que um campus
  // e um museu ocupam numa cidade de verdade, e é o que quebra a malha de
  // caixas iguais. Só emendam por rua que o carro não usa.
  const GRANDES = [
    { x: [-7, 13], z: [53, 103], tipo: 'faculdade' },
    { x: [53, 103], z: [-37, -17], tipo: 'museu' },
  ];

  // Pelo mesmo motivo da praça, prédio alto só nas bandas do fundo, onde não
  // há rua nenhuma do percurso atrás dele. No resto do bairro o teto é quatro
  // andares — doze metros, que é o que a inclinação da câmera deixa passar.
  function porteDe(cx, cz) {
    if (cx <= -47 || cz <= -47) return 'alto';
    if (cx >= 93 || cz >= 93) return 'baixo';
    return 'medio';
  }

  // Uma construção, medida em peça e não em mundo: quem gira a pegada quando
  // ry muda é o próprio place.
  function predio(px, pz, comprido, raso, ry, porte) {
    const comum = { ...on, ry, foot: [comprido, raso], w: comprido, d: raso };
    if (porte === 'alto' && k.chance(0.6)) {
      k.place(P.tower, px, pz, { ...comum, h: k.rand(15, 26), style: k.pick(['bands', 'grid', 'fins']), crown: k.chance(0.25) });
      return;
    }
    if (porte === 'baixo' && k.chance(0.5)) {
      k.place(P.house, px, pz, { ...comum, w: Math.min(comprido, 7), d: Math.min(raso, 7), floors: 2, roof: k.pick(['gable', 'hip']), porch: k.chance(0.4) });
      return;
    }
    k.place(P.apartments, px, pz, {
      ...comum,
      floors: porte === 'baixo' ? 2 : 3 + Math.floor(k.rand(0, 2)),
      balconies: porte !== 'baixo' && k.chance(0.6),
    });
  }

  // O quarteirão sorteia o que vai dentro dele. Antes era sempre o mesmo par
  // de prédios, e de cima isso vira papel de parede: a cidade inteira lida
  // como uma textura repetida em vez de um lugar.
  function quarteirao(x0, z0, x1, z1, porte, forcado) {
    const w = x1 - x0;
    const d = z1 - z0;
    if (w < 6 || d < 6) return;
    P.platform(k, x0, z0, x1, z1, { h: TOPO, r: 2 });

    const cx = (x0 + x1) / 2;
    const cz = (z0 + z1) / 2;
    const aoLongoDeX = w >= d;
    const maior = aoLongoDeX ? w : d;
    const menor = aoLongoDeX ? d : w;
    const ry = aoLongoDeX ? 0 : Math.PI / 2;
    const em = (t) => (aoLongoDeX ? [cx + t, cz] : [cx, cz + t]);

    const sorte = forcado === 'praca' ? 0 : k.rand(0, 1);

    if (sorte < 0.1) {
      // Praça de bairro: chafariz, bancos e árvores.
      k.place(P.fountain, cx, cz, { ...on, r: 2.2, foot: [6, 6] });
      for (const [bx, bz, bry] of [[4, 0, Math.PI / 2], [-4, 0, -Math.PI / 2], [0, 4, 0], [0, -4, Math.PI]]) {
        k.place(P.bench, cx + bx, cz + bz, { ...on, ry: bry });
      }
      for (let i = 0; i < 5; i++) {
        const a = k.rand(0, Math.PI * 2);
        k.instance('person', cx + Math.cos(a) * k.rand(3, 7), TOPO, cz + Math.sin(a) * k.rand(3, 7), { ry: k.rand(0, Math.PI * 2) });
      }
    } else if (sorte < 0.18) {
      // Quadra de esporte, que é o que mais aparece de cima num bairro.
      k.place(P.court, cx, cz, { ...on, ry, foot: [Math.min(maior - 4, 16), Math.min(menor - 4, 12)], w: Math.min(menor - 4, 12), d: Math.min(maior - 4, 18) });
    } else if (sorte < 0.42) {
      // Um prédio só, ocupando o quarteirão inteiro.
      predio(cx, cz, Math.min(maior - 4, 22), Math.min(menor - 3, 10), ry, porte);
    } else if (sorte < 0.68) {
      // Três menores, lado a lado.
      const largura = Math.min(maior / 3 - 1.6, 8);
      for (const t of [-maior / 3, 0, maior / 3]) {
        const [px, pz] = em(t);
        predio(px, pz, largura, Math.min(menor - 3, 9), ry, porte);
      }
    } else {
      // O par de antes, agora como mais uma possibilidade e não como regra.
      const comprido = Math.min(maior / 2 - 2.5, 13);
      const raso = Math.min(menor - 3, 9);
      for (const sinal of [-1, 1]) {
        const [px, pz] = em((sinal * maior) / 4);
        predio(px, pz, comprido, raso, ry, porte);
      }
    }

    P.scatter(k, { bounds: [x0 + 1, z0 + 1, x1 - 1, z1 - 1], count: 6, minDist: 3, types: [['round', 3], ['oak', 1], ['bush', 1]], scale: [0.55, 0.8] });
    if (k.chance(0.7)) k.instance('lamp', x0 + 1.4, TOPO, z0 + 1.4, { ry: Math.PI / 4 });
    if (k.chance(0.7)) k.instance('lamp', x1 - 1.4, TOPO, z1 - 1.4, { ry: (Math.PI * 5) / 4 });
  }

  // Campus e museu: construções que não cabem num quarteirão e por isso
  // tomam dois. São elas que dão um ponto de referência à cidade.
  function instituicao({ x: [x0, x1], z: [z0, z1], tipo }) {
    const cx = (x0 + x1) / 2;
    const cz = (z0 + z1) / 2;
    const w = x1 - x0;
    const d = z1 - z0;
    P.platform(k, x0, z0, x1, z1, { h: TOPO, r: 3 });
    const deitado = w >= d;
    const comp = deitado ? w : d;
    const esp = deitado ? d : w;
    const giro = deitado ? 0 : Math.PI / 2;
    const em = (a, b) => (deitado ? [cx + a, cz + b] : [cx + b, cz + a]);

    if (tipo === 'faculdade') {
      // Três alas em U em volta de um pátio com árvores.
      const ala = Math.min(esp - 4, 9);
      const [ax, az] = em(-comp / 2 + ala / 2 + 1, 0);
      k.place(P.apartments, ax, az, { ...on, ry: giro + Math.PI / 2, foot: [esp - 4, ala], w: esp - 4, d: ala, floors: 3, balconies: false });
      for (const lado of [-1, 1]) {
        const [bx, bz] = em(2, (lado * (esp - ala)) / 2);
        k.place(P.apartments, bx, bz, { ...on, ry: giro, foot: [comp - ala - 6, ala], w: comp - ala - 6, d: ala, floors: 3, balconies: false });
      }
      const [px, pz] = em(comp / 4, 0);
      P.scatter(k, { bounds: [px - comp / 6, pz - esp / 5, px + comp / 6, pz + esp / 5], count: 10, minDist: 3, types: [['round', 3], ['oak', 1]], scale: [0.6, 0.85] });
      for (let i = 0; i < 8; i++) k.instance('person', px + k.rand(-comp / 6, comp / 6), TOPO, pz + k.rand(-esp / 5, esp / 5), { ry: k.rand(0, Math.PI * 2) });
      return;
    }

    // Museu: um corpo baixo e comprido, uma cúpula no meio e a escadaria na
    // frente. É a única peça da cidade com curva — e é por isso que o olho
    // acha ela no meio das caixas.
    const corpoW = Math.min(comp - 6, 34);
    const corpoD = Math.min(esp - 6, 13);
    k.local(cx, TOPO, cz, giro, () => {
      k.box(corpoW, 7.2, corpoD, 0, 0, 0, { bevel: 0.18 });
      P.parapet(k, corpoW, corpoD, 7.2, { h: 0.7, t: 0.3 });
      k.cylinder(corpoD * 0.33, corpoD * 0.36, 2.4, 0, 7.2, 0, { segments: 20 });
      k.dome(corpoD * 0.31, 0, 9.5, 0, { sy: 0.85, segments: 20 });
      k.cylinder(0.22, 0.3, 1.4, 0, 9.5 + corpoD * 0.26, 0, { segments: 8 });
      // Colunata e escada na fachada da frente.
      for (let i = -3; i <= 3; i++) {
        k.cylinder(0.42, 0.46, 6.4, (i * corpoW) / 8, 0, corpoD / 2 + 1.1, { segments: 10 });
      }
      k.box(corpoW * 0.82, 0.4, 2.6, 0, 6.4, corpoD / 2 + 1.1, { bevel: 0.1 });
      k.prism(corpoW * 0.5, 1.6, 2.6, 0, 6.8, corpoD / 2 + 1.1);
      for (let i = 0; i < 4; i++) k.box(corpoW * 0.6, 0.26, 1.1 + i * 0.6, 0, -0.26 * (i + 1) + TOPO - 0.3, corpoD / 2 + 2.6 + i * 0.55);
    });
    k.reserveRect(x0, z0, x1, z1);
    P.scatter(k, { bounds: [x0 + 1, z0 + 1, x1 - 1, z1 - 1], count: 8, minDist: 3.4, types: [['round', 2], ['bush', 1]], scale: [0.6, 0.9] });
  }

  for (const grande of GRANDES) instituicao(grande);

  // Quarteirão por quarteirão, pulando o que a névoa já comeu, o do meio, a
  // parque e o que já virou campus ou museu.
  // Uma praça fixa no canto esquerdo: sem ela, aquele lado vira uma parede de
  // torres, porque é onde o porte alto mora.
  const SEMPRE_PRACA = [[1, 4]];
  const noMiolo = (i) => i === 1 || i === 2;
  const dentroDe = (cx, cz, g) => cx > g.x[0] - 6 && cx < g.x[1] + 6 && cz > g.z[0] - 6 && cz < g.z[1] + 6;
  for (let i = 0; i < RUAS.length - 1; i++) {
    for (let j = 0; j < RUAS.length - 1; j++) {
      if (noMiolo(i) && noMiolo(j)) continue;
      const x0 = RUAS[i] + BORDA;
      const x1 = RUAS[i + 1] - BORDA;
      const z0 = RUAS[j] + BORDA;
      const z1 = RUAS[j + 1] - BORDA;
      const cx = (x0 + x1) / 2;
      const cz = (z0 + z1) / 2;
      if (x0 === PRACA[0] && z0 === PRACA[1]) continue;
      if (cx + cz < -150 || cx + cz > 200 || Math.abs(cx - cz) > 210) continue;
      if (noParque(cx, cz)) continue;
      if (GRANDES.some((g) => dentroDe(cx, cz, g))) continue;
      quarteirao(x0, z0, x1, z1, porteDe(cx, cz), SEMPRE_PRACA.some(([a, b]) => a === i && b === j) ? 'praca' : null);
    }
  }

  /* ── o parque ───────────────────────────────────────────────────────────── */

  // Bem no fundo, à direita. Árvore espalhada ao acaso lia como ruído: de cima,
  // árvore jogada ao acaso não vira floresta, vira sujeira na imagem. Agora é
  // um parque desenhado — largo redondo no meio, duas alamedas cruzando e os
  // bosques em fileira. O que o olho reconhece de longe é a ordem, não a
  // quantidade.
  {
    const [px0, pz0, px1, pz1] = PARQUE;
    const cx = (px0 + px1) / 2;
    const cz = (pz0 + pz1) / 2;
    const RAIO = 12;

    // As duas alamedas, cruzando no largo.
    P.platform(k, px0 + 4, cz - 2.4, px1 - 4, cz + 2.4, { h: 0.14, r: 1 });
    P.platform(k, cx - 2.4, pz0 + 4, cx + 2.4, pz1 - 4, { h: 0.14, r: 1 });

    // O largo: uma laje redonda com o coreto em cima.
    const anel = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      anel.push([cx + Math.cos(a) * RAIO, cz + Math.sin(a) * RAIO]);
    }
    k.slab(anel, TOPO, 0, { bevel: 0.08, curve: 10 });
    k.reserveRect(cx - RAIO, cz - RAIO, cx + RAIO, cz + RAIO);
    k.local(cx, TOPO, cz, 0, () => {
      k.cylinder(4.3, 4.7, 0.7, 0, 0, 0, { segments: 18 });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        k.cylinder(0.17, 0.2, 3.2, Math.cos(a) * 3.7, 0.7, Math.sin(a) * 3.7, { segments: 6 });
      }
      k.cylinder(4.5, 4.5, 0.32, 0, 3.9, 0, { segments: 18 });
      k.dome(4, 0, 4.22, 0, { sy: 0.62, segments: 18 });
      k.cylinder(0.13, 0.17, 1.2, 0, 6.6, 0, { segments: 6 });
    });

    // Bancos virados para o coreto e gente dando a volta nele.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.4;
      k.place(P.bench, cx + Math.cos(a) * 8.6, cz + Math.sin(a) * 8.6, { y: TOPO, ry: -a + Math.PI / 2 });
    }
    const VOLTA_PARQUE = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      VOLTA_PARQUE.push([cx + Math.cos(a) * 15.5, cz + Math.sin(a) * 15.5]);
    }
    for (let i = 0; i < 4; i++) {
      k.child((c) => c.instance('person'), P.follow(VOLTA_PARQUE, { speed: 1.2, offset: i / 4, closed: true, y: TOPO }));
    }

    // Árvores acompanhando as alamedas, nos dois lados de cada uma.
    for (const lado of [-4.4, 4.4]) {
      P.treeRow(k, [[px0 + 5, cz + lado], [px1 - 5, cz + lado]], { spacing: 6, type: 'poplar', scale: [0.85, 1.05] });
      P.treeRow(k, [[cx + lado, pz0 + 5], [cx + lado, pz1 - 5]], { spacing: 6, type: 'poplar', scale: [0.85, 1.05] });
    }

    // Os quatro bosques, em fileira e não ao acaso.
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          const afasta = 10 + i * 6;
          P.treeRow(
            k,
            [[cx + sx * afasta, cz + sz * 8], [cx + sx * afasta, cz + sz * 25]],
            { spacing: 5.4, type: i % 2 ? 'round' : 'oak', scale: [0.8, 1] },
          );
        }
      }
    }

    // A cerca viva da borda, que é o que fecha o parque contra o quarteirão.
    P.treeRow(
      k,
      [[px0 + 3, pz0 + 3], [px1 - 3, pz0 + 3], [px1 - 3, pz1 - 3], [px0 + 3, pz1 - 3], [px0 + 3, pz0 + 3]],
      { spacing: 5.6, type: 'pine', scale: [0.9, 1.15] },
    );
  }

  // A praça do meio: chafariz, bancos virados para ele, árvores e gente. Nada
  // aqui passa de quatro metros.
  {
    const [x0, z0, x1, z1] = PRACA;
    const cx = (x0 + x1) / 2;
    const cz = (z0 + z1) / 2;
    P.platform(k, x0, z0, x1, z1, { h: TOPO, r: 3 });
    k.place(P.fountain, cx, cz, { ...on, r: 2.6, foot: [8, 8] });
    for (const [bx, bz, ry] of [[4.6, 0, Math.PI / 2], [-4.6, 0, -Math.PI / 2], [0, 4.6, 0], [0, -4.6, Math.PI]]) {
      k.place(P.bench, cx + bx, cz + bz, { ...on, ry });
    }
    P.scatter(k, { bounds: [x0 + 1.5, z0 + 1.5, x1 - 1.5, z1 - 1.5], count: 16, minDist: 3, types: [['round', 3], ['bush', 2]], scale: [0.55, 0.78] });
    for (let i = 0; i < 9; i++) {
      const a = k.rand(0, Math.PI * 2);
      const r = k.rand(4, 8);
      k.instance('person', cx + Math.cos(a) * r, TOPO, cz + Math.sin(a) * r, { ry: k.rand(0, Math.PI * 2) });
    }
  }

  // As faixas do meio da rua, de quatro em quatro metros, apagadas no
  // cruzamento e debaixo do parque.
  for (const eixo of RUAS) {
    for (let s = RUAS[0]; s < RUAS[RUAS.length - 1]; s += 4.5) {
      const onde = s + 0.9;
      if (RUAS.some((c) => Math.abs(onde - c) < PISTA)) continue;
      if (!noParque(onde, eixo)) k.box(1.8, 0.04, 0.22, onde, 0, eixo);
      if (!noParque(eixo, onde)) k.box(0.22, 0.04, 1.8, eixo, 0, onde);
    }
  }

  // Trânsito de fundo, numa volta que não encosta na do motorista: sem outros
  // carros a rua fica larga demais para o que passa nela, e o carro preto
  // deixa de ser "aquele carro" para virar "o carro".
  const OUTRA = P.roundedRect(48 + MAO, -42 + MAO, 78 - MAO, 48 - MAO, 8, 5);
  for (let i = 0; i < 3; i++) {
    k.child((c) => P.car(c, { truck: i === 2 }), P.follow(OUTRA, { speed: 8 + i * 2, offset: i / 3, closed: true, y: 0 }));
  }
  for (const [px, pz, ry] of [[36, -12 - MAO, Math.PI / 2], [-6, 18 + MAO, Math.PI / 2], [-12 - MAO, 66, 0], [108 + MAO, -30, 0]]) {
    k.place(P.car, px, pz, { y: 0, ry, foot: [2.6, 4.6] });
  }

  // Gente andando na calçada da praça.
  const A_PE = P.roundedRect(PRACA[0] + 1, PRACA[1] + 1, PRACA[2] - 1, PRACA[3] - 1, 4, 4);
  for (let i = 0; i < 5; i++) {
    k.child((c) => c.instance('person'), P.follow(A_PE, { speed: 1.1, offset: i / 5, closed: true, y: TOPO }));
  }

  const cidade = k.finish(materiais.clay);
  scene.add(cidade.group);

  /* ── o carro do motorista ───────────────────────────────────────────────── */

  // Fora do tom e fora da névoa, como a marca no rodapé: preto de marca não
  // pode clarear porque o carro andou para longe. A luz ainda bate nele — sem
  // isso ele vira um borrão sem forma no meio da cidade branca.
  const tintaCarro = new THREE.MeshLambertMaterial({ color: 0x141414, emissive: 0x242424, fog: false });
  const tintaLuminoso = new THREE.MeshBasicMaterial({ color: 0xf4e04d, toneMapped: false, fog: false });

  const chassi = new Kit({ seed: 7 });
  P.car(chassi, {});
  const carro = chassi.finish(tintaCarro).group;
  carro.traverse((o) => { o.castShadow = true; });

  // A plaquinha amarela em cima da cabine, que termina em 1,46: é o que diz,
  // sem legenda, que aquele carro é o do aplicativo e não um dos outros.
  const letreiro = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.22, 0.3), tintaLuminoso);
  letreiro.position.set(0, 1.57, -0.25);
  carro.add(letreiro);
  scene.add(carro);

  /* ── luz ────────────────────────────────────────────────────────────────── */

  const luz = new THREE.DirectionalLight(0xffffff, Math.PI);
  luz.castShadow = true;
  luz.shadow.mapSize.set(2048, 2048);
  luz.shadow.bias = -0.0004;
  luz.shadow.normalBias = 0.06;
  const caixa = luz.shadow.camera;
  caixa.left = -170;
  caixa.right = 170;
  caixa.top = 170;
  caixa.bottom = -170;
  caixa.near = 10;
  caixa.far = 680;
  caixa.updateProjectionMatrix();
  luz.position.copy(MIRA).addScaledVector(STYLE.lightDirection, 320);
  luz.target.position.copy(MIRA);
  scene.add(luz, luz.target);

  /* ── câmera ─────────────────────────────────────────────────────────────── */

  const camera = new THREE.PerspectiveCamera(CAMPO, 1, 1, 1600);
  const balanco = new THREE.Vector2();
  const cursor = new THREE.Vector2();
  let distancia = 250;

  function redimensionar() {
    const r = palco.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    const prop = r.width / r.height;
    camera.aspect = prop;
    camera.updateProjectionMatrix();
    // A maior das duas distâncias que fazem caber: a da altura e a da largura.
    // Só uma delas deixaria o bairro escapar do quadro quando a tela vira uma
    // faixa — baixa num monitor largo, estreita num celular.
    //
    // Em tela estreita o que precisa caber deixa de ser o bairro e passa a ser
    // só até os quatro passageiros: cabendo o bairro inteiro, ele vira pó, e os
    // pinos — que são a história — saem do quadro de qualquer jeito.
    const tanV = Math.tan((CAMPO / 2) * DEG);
    const largo = prop >= 1.3 ? LARGO : ATE_OS_PINOS;
    distancia = Math.max(ALTO / tanV, largo / (tanV * Math.max(prop, 0.55)));
    scene.fog.near = distancia * 1.02;
    scene.fog.far = distancia * 2.4;
  }

  function porCamera() {
    const az = AZIMUTE * DEG + balanco.x;
    const el = ELEVACAO * DEG + balanco.y;
    camera.position.set(
      MIRA.x + distancia * Math.cos(el) * Math.sin(az),
      MIRA.y + distancia * Math.sin(el),
      MIRA.z + distancia * Math.cos(el) * Math.cos(az),
    );
    camera.lookAt(MIRA);
  }

  /* ── os passageiros, em HTML ────────────────────────────────────────────── */

  const projetado = new THREE.Vector3();
  function colarPinos() {
    const r = palco.getBoundingClientRect();
    if (!r.width) return;
    for (const parada of paradas) {
      const elemento = pinos[parada.indice];
      if (!elemento) continue;
      projetado.copy(parada.pino).project(camera);
      const x = (projetado.x * 0.5 + 0.5) * r.width;
      const y = (-projetado.y * 0.5 + 0.5) * r.height;
      elemento.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
    }
  }

  let pagoAgora = -1;
  function marcarPago(indice) {
    if (indice === pagoAgora) return;
    pagoAgora = indice;
    pinos.forEach((elemento, i) => {
      elemento.dataset.estado = i === indice ? 'pago' : 'espera';
    });
  }

  /* ── quadro ─────────────────────────────────────────────────────────────── */

  let pronto = false;
  function desenhar() {
    porCamera();
    renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
    colarPinos();
    if (pronto) return;
    pronto = true;
    palco.dataset.pronto = 'sim';
  }

  function porCarro(tempo) {
    const passo = dirigir(tempo);
    carro.position.copy(ondeEstou);
    carro.rotation.y = Math.atan2(passo.olhar[0], passo.olhar[1]);
    marcarPago(passo.pago);
  }

  let naTela = true;
  let pedido = 0;
  const relogio = new THREE.Clock();

  function quadro() {
    pedido = requestAnimationFrame(quadro);
    const dt = Math.min(0.05, relogio.getDelta());
    const agora = relogio.getElapsedTime();
    porCarro(agora);
    cidade.update?.(agora, dt);
    const amortece = 1 - Math.exp(-dt * 2.5);
    balanco.x += (cursor.x * 2.4 * DEG - balanco.x) * amortece;
    balanco.y += (-cursor.y * 1.1 * DEG - balanco.y) * amortece;
    desenhar();
  }

  function rodar() {
    if (pedido || !naTela || reduzido.matches) return;
    relogio.getDelta();
    pedido = requestAnimationFrame(quadro);
  }

  function parar() {
    cancelAnimationFrame(pedido);
    pedido = 0;
  }

  // Parado, a cena não fica vazia: o carro assume a primeira parada, com o
  // passageiro dela já virado em dinheiro. A história continua legível sem
  // nada se mexer.
  function congelar() {
    parar();
    balanco.set(0, 0);
    porCarro(paradas.length ? chegada[paradas[0].amostra] + ESPERA * 0.7 : 0);
    cidade.update?.(0, 0);
    desenhar();
  }

  new IntersectionObserver(([entrada]) => {
    naTela = entrada.isIntersecting;
    if (naTela) rodar();
    else parar();
  }).observe(palco);

  new ResizeObserver(() => {
    redimensionar();
    if (!pedido) desenhar();
  }).observe(palco);

  window.addEventListener('pointermove', (evento) => {
    const r = palco.getBoundingClientRect();
    cursor.set(
      Math.max(-1, Math.min(1, ((evento.clientX - r.left) / r.width) * 2 - 1)),
      Math.max(-1, Math.min(1, ((evento.clientY - r.top) / r.height) * 2 - 1)),
    );
  }, { passive: true });

  reduzido.addEventListener('change', () => {
    if (reduzido.matches) congelar();
    else rodar();
  });

  redimensionar();
  if (reduzido.matches) congelar();
  else {
    porCarro(0);
    desenhar();
    rodar();
  }
}
