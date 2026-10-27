import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { STYLE, createMaterials, displayToScene } from './estilo.js';
import { Kit } from './kit.js';
import { buildGround, smoothstep, mix } from './terreno.js';
import { COMPOSITIONS } from './composicoes.js';

export { COMPOSITIONS };

const DEG = Math.PI / 180;
const BASE_ASPECT = 16 / 10;
const flat = () => 0;

/**
 * Monta uma composição 3D dentro de `container` (qualquer elemento com tamanho).
 *
 * options.background  cor do fundo da seção onde a cena fica (hex). Padrão: #D0E1EB
 * options.interactive câmera inclina levemente seguindo o cursor. Padrão: true
 * options.animate     barcos, turbinas e carros se movem. Padrão: true
 * options.maxPixelRatio limite de densidade de pixels (desempenho). Padrão: 1.5
 * options.onReady     chamado quando o primeiro quadro aparece
 *
 * Retorna { setComposition(id), destroy(), canvas }.
 */
export function mountZone(container, id, options = {}) {
  const settings = {
    background: STYLE.background,
    interactive: true,
    animate: true,
    maxPixelRatio: 1.5,
    onReady: null,
    ...options,
  };
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, settings.maxPixelRatio));

  const canvas = renderer.domElement;
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.setAttribute('role', 'img');
  container.appendChild(canvas);

  const materials = createMaterials();
  const background = displayToScene(settings.background);

  const camera = new THREE.PerspectiveCamera(28, 1, 1, 1600);
  const light = new THREE.DirectionalLight(0xffffff, Math.PI);
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  light.shadow.bias = -0.0003;
  light.shadow.normalBias = 0.05;

  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
  const renderPass = new RenderPass(new THREE.Scene(), camera);
  const aoPass = new GTAOPass(renderPass.scene, camera, 1, 1);
  aoPass.output = GTAOPass.OUTPUT.Default;
  aoPass.blendIntensity = 1;
  aoPass.updateGtaoMaterial({ radius: 2.4, distanceExponent: 1.6, thickness: 3, scale: 1.25, samples: 16, distanceFallOff: 1 });
  aoPass.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 5, rings: 2, samples: 16 });
  composer.addPass(renderPass);
  composer.addPass(aoPass);
  composer.addPass(new OutputPass());

  const state = {
    def: null,
    scene: null,
    update: null,
    time: 0,
    distance: 100,
    raf: 0,
    last: 0,
    onScreen: true,
    ready: false,
    pointer: new THREE.Vector2(),
    sway: new THREE.Vector2(),
  };

  function disposeScene() {
    if (!state.scene) return;
    state.scene.traverse((o) => {
      if (o.isInstancedMesh) o.dispose();
      if (o.geometry && !o.userData.shared) o.geometry.dispose();
    });
    state.scene = null;
  }

  function build(nextId) {
    const def = COMPOSITIONS.find((c) => c.id === nextId) || COMPOSITIONS[0];
    disposeScene();

    const height = def.height || flat;
    const kit = new Kit({ height, seed: def.seed || 1 });
    def.build(kit);
    const built = kit.finish(materials.clay);

    const scene = new THREE.Scene();
    scene.background = background;
    scene.fog = new THREE.Fog(background, 100, 300);
    scene.add(buildGround({ height, size: def.size, outer: def.outer ?? 0, water: Boolean(def.water) }, materials));
    scene.add(built.group);

    const target = new THREE.Vector3(...def.camera.target);
    const extent = def.extent || 60;
    light.position.copy(target).addScaledVector(STYLE.lightDirection, 160);
    light.target.position.copy(target);
    const cam = light.shadow.camera;
    cam.left = -extent;
    cam.right = extent;
    cam.top = extent;
    cam.bottom = -extent;
    cam.near = 10;
    cam.far = 360;
    cam.updateProjectionMatrix();
    scene.add(light, light.target);

    state.def = def;
    state.scene = scene;
    state.update = built.update;
    renderPass.scene = scene;
    aoPass.scene = scene;
    canvas.setAttribute('aria-label', def.alt || def.name);
    resize();
  }

  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height || !state.def) return;
    renderer.setSize(width, height, false);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(width, height);

    // Em telas mais estreitas que 16:10 a câmera recua para a composição continuar inteira.
    const view = state.def.camera;
    const aspect = width / height;
    let fov = view.fov || 28;
    let distance = view.distance;
    if (aspect < BASE_ASPECT) {
      const keep = mix(1, 0.62, smoothstep(BASE_ASPECT, 0.5, aspect));
      const need = ((Math.tan((fov / 2) * DEG) * BASE_ASPECT) / aspect) * keep;
      const maxTan = Math.tan(19 * DEG);
      if (need <= maxTan) fov = (2 * Math.atan(need)) / DEG;
      else {
        fov = 38;
        distance *= need / maxTan;
      }
    }
    camera.fov = fov;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    state.distance = distance;
    state.scene.fog.near = distance * (view.fog?.[0] ?? 0.95);
    state.scene.fog.far = distance * (view.fog?.[1] ?? 2.1);
    if (!running()) render();
  }

  function placeCamera() {
    const view = state.def.camera;
    const az = (view.azimuth ?? 45) * DEG + state.sway.x;
    const el = (view.elevation ?? 40) * DEG + state.sway.y;
    const [tx, ty, tz] = view.target;
    const d = state.distance;
    camera.position.set(tx + d * Math.cos(el) * Math.sin(az), ty + d * Math.sin(el), tz + d * Math.cos(el) * Math.cos(az));
    camera.lookAt(tx, ty, tz);
  }

  function render() {
    if (!state.scene) return;
    placeCamera();
    renderer.shadowMap.needsUpdate = true;
    composer.render();
    if (!state.ready) {
      state.ready = true;
      settings.onReady?.();
    }
  }

  function animated() {
    return settings.animate && !motion.matches;
  }

  function running() {
    return state.raf !== 0;
  }

  function tick(now) {
    state.raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - (state.last || now)) / 1000);
    state.last = now;
    state.time += dt;
    if (settings.interactive) {
      const ease = 1 - Math.exp(-dt * 2.5);
      state.sway.x += (state.pointer.x * 4 * DEG - state.sway.x) * ease;
      state.sway.y += (-state.pointer.y * 1.8 * DEG - state.sway.y) * ease;
    }
    state.update?.(state.time, dt);
    materials.water.userData.time.value = state.time;
    render();
  }

  function start() {
    if (running() || !animated() || !state.onScreen) return;
    state.last = 0;
    state.raf = requestAnimationFrame(tick);
  }

  function stop() {
    cancelAnimationFrame(state.raf);
    state.raf = 0;
  }

  function onPointer(event) {
    const r = container.getBoundingClientRect();
    state.pointer.set(
      Math.max(-1, Math.min(1, ((event.clientX - r.left) / r.width) * 2 - 1)),
      Math.max(-1, Math.min(1, ((event.clientY - r.top) / r.height) * 2 - 1)),
    );
  }

  function onMotionChange() {
    if (animated()) start();
    else {
      stop();
      state.sway.set(0, 0);
      render();
    }
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const visibility = new IntersectionObserver(([entry]) => {
    state.onScreen = entry.isIntersecting;
    if (state.onScreen) start();
    else stop();
  });
  visibility.observe(container);
  if (settings.interactive) window.addEventListener('pointermove', onPointer, { passive: true });
  motion.addEventListener('change', onMotionChange);

  build(id);
  render();
  start();

  return {
    canvas,
    setComposition(nextId) {
      state.ready = false;
      build(nextId);
      render();
      start();
    },
    destroy() {
      stop();
      resizeObserver.disconnect();
      visibility.disconnect();
      window.removeEventListener('pointermove', onPointer);
      motion.removeEventListener('change', onMotionChange);
      disposeScene();
      composer.dispose();
      aoPass.dispose();
      Object.values(materials).forEach((m) => m.dispose());
      renderer.dispose();
      canvas.remove();
    },
  };
}
