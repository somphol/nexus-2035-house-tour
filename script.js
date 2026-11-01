/* ============================================================
   NEXUS 2035 — Futuristic 4BR House Tour Studio
   Interactive architectural engine · Three.js r128
   Built with OpenCode · DeepSeek V4.1 Flash
   ============================================================ */

(function () {
  "use strict";

  const T = window.THREE;
  const canvas = document.getElementById("scene-canvas");
  const loader = document.getElementById("loader");
  const loaderBar = document.getElementById("loader-bar");
  const loaderPct = document.getElementById("loader-pct");
  const loaderLabel = document.getElementById("loader-label");

  const APP_ID = "nexus-2035";
  const APP_VERSION = "1.0.0";
  const STORAGE_KEY = "nexus2035.tour.v1";
  const STATE_VERSION = 1;

  const IS_MOBILE = window.matchMedia("(max-width: 900px)").matches;
  const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MAX_DPR = IS_MOBILE ? 1.6 : 2;

  /* ── Room data ──────────────────────────────────────────── */
  const ROOM_DEFS = [
    {
      id: "living", index: "01", name: "Living & Kitchen", icon: "◍",
      area: "96 m²", meta: "OPEN PLAN · SOUTH",
      camera: [2.4, 2.7, 8.4], target: [-5.8, 1.1, 4.4],
      blurb: "Sunken lounge, glass chef's island, panoramic smart glass."
    },
    {
      id: "master", index: "02", name: "Master Suite", icon: "◒",
      area: "42 m²", meta: "BEDROOM 01 · NORTH-WEST",
      camera: [-9.7, 2.7, -2.8], target: [-6.3, 1.0, -6.7],
      blurb: "Floating platform bed, translucent bath, ring-lit vanity."
    },
    {
      id: "studio", index: "03", name: "AR Studio", icon: "◧",
      area: "28 m²", meta: "BEDROOM 02 · NORTH",
      camera: [0, 2.55, -2.8], target: [0, 1.0, -7.4],
      blurb: "Dual curved displays, acoustic hex field, glowing tech rack."
    },
    {
      id: "eco", index: "04", name: "Eco Bedroom", icon: "❖",
      area: "24 m²", meta: "BEDROOM 03 · NORTH-EAST",
      camera: [3.25, 2.75, -2.85], target: [5.55, 0.85, -6.7],
      blurb: "Warm timber, living terrariums, circadian pendant light."
    },
    {
      id: "guest", index: "05", name: "Guest Suite", icon: "◇",
      area: "22 m²", meta: "BEDROOM 04 · NORTH-EAST",
      camera: [8.05, 2.75, -2.85], target: [10.1, 0.85, -6.6],
      blurb: "Minimalist pod bed, ambient wall cinema, quiet luxury."
    },
    {
      id: "foyer", index: "06", name: "Central Foyer", icon: "◎",
      area: "18 m²", meta: "CIRCULATION · CORE",
      camera: [0, 2.15, 5.2], target: [0, 1.3, -0.8],
      blurb: "Volumetric hologram core and a vertical hydroponic moss wall."
    },
    {
      id: "balcony", index: "07", name: "Sky Balcony", icon: "⌂",
      area: "54 m²", meta: "OUTDOOR · SKYLINE",
      camera: [0, 1.7, 9.4], target: [0, 1.7, 22.0],
      blurb: "Cantilevered deck, fire lounge, and the 2035 skyline."
    }
  ];

  const OVERVIEW = { camera: [23, 17, 27], target: [0, 0.4, 1.5] };

  /* ── Smart glass presets ───────────────────────────────── */
  const GLASS_PRESETS = {
    clear: {
      label: "Clear", short: "CRYSTAL CLEAR", color: 0xbfe9ff,
      opacity: 0.14, roughness: 0.05, metalness: 0.0
    },
    privacy: {
      label: "Privacy", short: "PRIVACY TINT", color: 0x081420,
      opacity: 0.86, roughness: 0.16, metalness: 0.32
    },
    night: {
      label: "Night", short: "NIGHT MODE", color: 0x040b14,
      opacity: 0.58, roughness: 0.09, metalness: 0.18
    }
  };
  const GLASS_ORDER = ["clear", "privacy", "night"];

  /* ── Circadian lighting presets ─────────────────────────── */
  const LIGHT_PRESETS = {
    daylight: {
      label: "Daylight", short: "DAYLIGHT WHITE",
      skyTop: 0x63b4ef, skyBottom: 0xe8f5fc, fog: 0xcfe6f2,
      sun: 0xfff4e0, sunIntensity: 1.85, sunPos: [42, 48, 34],
      hemiSky: 0xe9f6ff, hemiGround: 0x5f5a52, hemiIntensity: 0.82,
      led: 0xbfe9ff, led2: 0x9d7bff, ledIntensity: 1.5, led2Intensity: 1.1,
      stars: 0.1, city: 0.72, sunSprite: 0.8, exposure: 1.0,
      lightColors: [0xfff4e6, 0xfff2df, 0xdff7ff, 0xfff0df, 0xdff7ff, 0xffd8a6, 0xffe9cf, 0xff9a4c],
      lightIntensities: [0.95, 0.95, 0.8, 0.9, 0.85, 0.85, 0.8, 1.0]
    },
    sunset: {
      label: "Sunset", short: "WARM EVENING",
      skyTop: 0x394b8f, skyBottom: 0xff9d6a, fog: 0xd89578,
      sun: 0xff8a4c, sunIntensity: 1.55, sunPos: [34, 12, 42],
      hemiSky: 0xffc5a0, hemiGround: 0x3c302d, hemiIntensity: 0.52,
      led: 0xffb26b, led2: 0xff6f61, ledIntensity: 1.9, led2Intensity: 1.4,
      stars: 0.38, city: 0.9, sunSprite: 0.85, exposure: 0.98,
      lightColors: [0xffc188, 0xffb277, 0xffd1a0, 0xffb98a, 0xffcfa8, 0xffb26b, 0xffc59b, 0xff7a3d],
      lightIntensities: [1.0, 1.0, 0.8, 1.05, 0.9, 0.95, 0.8, 1.1]
    },
    neon: {
      label: "Neon", short: "CYBERPUNK NEON",
      skyTop: 0x02030b, skyBottom: 0x25103f, fog: 0x160d29,
      sun: 0x7f8cff, sunIntensity: 0.38, sunPos: [-32, 34, -26],
      hemiSky: 0x4c37a8, hemiGround: 0x080a12, hemiIntensity: 0.26,
      led: 0xff4df0, led2: 0x5ee7ff, ledIntensity: 2.6, led2Intensity: 2.4,
      stars: 0.95, city: 1.75, sunSprite: 0.08, exposure: 1.1,
      lightColors: [0x5ee7ff, 0xff4df0, 0x8d7bff, 0xff4df0, 0x5ee7ff, 0xff9b4d, 0x7f8cff, 0xff6a3d],
      lightIntensities: [1.25, 1.3, 1.1, 1.3, 1.2, 1.15, 1.0, 1.25]
    }
  };
  const LIGHT_ORDER = ["daylight", "sunset", "neon"];

  /* ── Inspectable features ──────────────────────────────── */
  const FEATURES = {
    hologram: {
      title: "Aura Hologram Core", cat: "FOYER · SPATIAL INTERFACE", icon: "◈", id: "NX-HOLO-01",
      desc: "The home's beating heart. A volumetric lithium-glass projector renders eight simultaneous light fields, turning the foyer into a gesture-driven control surface for climate, security, and media.",
      specs: [["PROJECTION", "8K volumetric"], ["LATENCY", "0.8 ms"], ["INPUT", "Gesture + voice"], ["LINK", "Quantum mesh"]],
      focus: { pos: [0, 2.1, 4.4], target: [0, 1.35, 0] },
      action: { label: "CYCLE PROJECTION", run: "holoPalette" }
    },
    bed: {
      title: "Gravity-Float Platform Bed", cat: "MASTER SUITE · SLEEP SYSTEM", icon: "◒", id: "NX-BED-01",
      desc: "A magnetically suspended sleep platform with zero-pressure memory foam, under-bed circadian glow, and biomonitoring woven into the headboard. Wake sequences sync to the sunrise spectrum.",
      specs: [["SURFACE", "Zero-G memory"], ["GLOW", "Circadian LED"], ["SENSORS", "HRV + thermal"], ["MASS", "Floating 12 mm"]],
      focus: { pos: [-4.2, 2.8, -3.4], target: [-6.3, 0.8, -6.8] },
      action: { label: "TOGGLE UNDER-GLOW", run: "bedGlow" }
    },
    island: {
      title: "Nebula Kitchen Island", cat: "LIVING & KITCHEN · CULINARY LAB", icon: "▤", id: "NX-KIT-04",
      desc: "A single slab of smart glass floats above a recycled-aluminium chassis. Three induction halos read cookware placement and project heat maps directly through the surface.",
      specs: [["SURFACE", "Smart glass"], ["BURNERS", "3× induction"], ["EFFICIENCY", "97.4%"], ["CONTROL", "Haptic trace"]],
      focus: { pos: [8.2, 2.5, 9.2], target: [8.2, 0.9, 6.2] },
      action: { label: "TOGGLE INDUCTION", run: "induction" }
    },
    hydrowall: {
      title: "Vertical Hydro-Moss Wall", cat: "FOYER · BIO-ARCHITECTURE", icon: "❖", id: "NX-BIO-02",
      desc: "A living wall of 48 modular moss cells, fed by a closed-loop greywater system. It regulates humidity, scrubs VOCs, and washes the foyer in a soft bioluminescent green.",
      specs: [["CELLS", "48 modular"], ["SPECIES", "12 bryophytes"], ["AIR", "−38% VOC"], ["WATER", "Closed loop"]],
      focus: { pos: [-1.2, 2.0, 1.5], target: [2.8, 1.65, -1.2] },
      action: { label: "TOGGLE GROW LIGHTS", run: "growLights" }
    },
    media: {
      title: "Halo Media Wall", cat: "LIVING & KITCHEN · AMBIENCE", icon: "▭", id: "NX-MED-07",
      desc: "A 4.2-metre micro-LED canvas bonded to the architectural wall. It shifts between cinema, generative art, and a transparent window mode that disappears into the concrete.",
      specs: [["PANEL", "4.2 m micro-LED"], ["HDR", "4,000 nits"], ["REFRESH", "240 Hz"], ["MODE", "Art · Cinema"]],
      focus: { pos: [-8.0, 2.2, 8.2], target: [-11.7, 1.9, 4.8] }
    },
    desk: {
      title: "AR Creation Desk", cat: "AR STUDIO · WORKSTATION", icon: "◧", id: "NX-AR-03",
      desc: "Dual curved light-field monitors hover over a haptic desk that can raise, tilt, and split into a standing studio. Acoustic hex panels tune the room for spatial audio capture.",
      specs: [["DISPLAYS", "2× curved 8K"], ["DESK", "Haptic rise"], ["AUDIO", "Spatial 9.1"], ["ACOUSTIC", "Hex felt field"]],
      focus: { pos: [0, 2.2, -4.2], target: [0, 1.2, -7.9] }
    },
    terrarium: {
      title: "Bio-Dome Terrarium", cat: "ECO BEDROOM · LIVING SYSTEM", icon: "❖", id: "NX-ECO-05",
      desc: "Self-sustaining glass biodomes host a miniature understory of ferns and moss. Internal misters and spectrum grow lights maintain a sealed microclimate year-round.",
      specs: [["DOMES", "2 sealed"], ["CLIMATE", "Auto-mist"], ["SPECTRUM", "Full PAR"], ["AGE", "4 years"]],
      focus: { pos: [4.8, 2.0, -4.1], target: [5.8, 0.9, -7.8] },
      action: { label: "TOGGLE GROW LIGHTS", run: "growLights" }
    },
    pod: {
      title: "Quiet Pod Guest Bed", cat: "GUEST SUITE · REST MODULE", icon: "◇", id: "NX-GST-06",
      desc: "A cocooning guest pod with a sound-absorbing shell, concealed reading light, and a wall cinema that wakes with the room. Designed to make a 22 m² suite feel expansive.",
      specs: [["SHELL", "Acoustic felt"], ["LIGHT", "Concealed halo"], ["CINEMA", "Fold-flat 4K"], ["GUESTS", "2 adults"]],
      focus: { pos: [7.2, 2.3, -4.2], target: [10.0, 0.9, -6.6] }
    },
    vanity: {
      title: "Halo Vanity Station", cat: "MASTER SUITE · WELLNESS", icon: "◯", id: "NX-BATH-02",
      desc: "A ring-lit vanity with spectral mirror glass, humidity-aware defog, and a daylight-matched light engine that renders true colour at any hour.",
      specs: [["LIGHT", "CRI 98 ring"], ["MIRROR", "Spectral glass"], ["DEFOG", "Auto"], ["FINISH", "Brushed alloy"]],
      focus: { pos: [-6.3, 2.1, -7.4], target: [-10.6, 1.5, -8.4] }
    },
    firepit: {
      title: "Zero-Ember Fire Lounge", cat: "SKY BALCONY · OUTDOOR", icon: "△", id: "NX-SKY-09",
      desc: "A flameless plasma fire pit calibrated to the evening wind. It throws real warmth without smoke, and its spectrum drifts from amber to violet as the city lights come up.",
      specs: [["FLAME", "Plasma array"], ["HEAT", "4.2 kW"], ["EMISSIONS", "Zero"], ["SPECTRUM", "Amber → violet"]],
      focus: { pos: [0, 2.4, 15.2], target: [0, 0.8, 11.4] }
    }
  };

  /* ── State ──────────────────────────────────────────────── */
  const state = {
    mode: "orbit",
    room: "overview",
    lighting: "daylight",
    glass: "clear",
    autoTour: false,
    roomPresets: {},
    ready: false
  };

  const params = new URLSearchParams(window.location.search);
  if (params.get("room") && ROOM_DEFS.some((r) => r.id === params.get("room"))) state.room = params.get("room");
  if (params.get("light") && LIGHT_PRESETS[params.get("light")]) state.lighting = params.get("light");
  if (params.get("glass") && GLASS_PRESETS[params.get("glass")]) state.glass = params.get("glass");

  /* ── DOM refs ───────────────────────────────────────────── */
  const els = {
    clock: document.getElementById("clock"),
    roomList: document.getElementById("room-list"),
    minimap: document.getElementById("minimap"),
    mapRoomName: document.getElementById("map-room-name"),
    banner: document.getElementById("room-banner"),
    bannerIndex: document.getElementById("banner-index"),
    bannerName: document.getElementById("banner-name"),
    bannerMeta: document.getElementById("banner-meta"),
    autosave: document.getElementById("autosave"),
    glassState: document.getElementById("glass-state"),
    lightState: document.getElementById("light-state"),
    glassLabel: document.getElementById("glass-label"),
    lightLabel: document.getElementById("light-label"),
    glassBtn: document.getElementById("glass-btn"),
    lightBtn: document.getElementById("light-btn"),
    tourBtn: document.getElementById("tour-btn"),
    tourLabel: document.getElementById("tour-label"),
    exportBtn: document.getElementById("export-btn"),
    importBtn: document.getElementById("import-btn"),
    importFile: document.getElementById("import-file"),
    resetBtn: document.getElementById("reset-btn"),
    saveViewBtn: document.getElementById("save-view-btn"),
    helpBtn: document.getElementById("help-btn"),
    helpCard: document.getElementById("help-card"),
    helpBackdrop: document.getElementById("help-backdrop"),
    helpClose: document.getElementById("help-close"),
    featureCard: document.getElementById("feature-card"),
    featureBackdrop: document.getElementById("feature-backdrop"),
    featureClose: document.getElementById("feature-close"),
    featureClose2: document.getElementById("feature-close-2"),
    featureIcon: document.getElementById("feature-icon"),
    featureCat: document.getElementById("feature-cat"),
    featureTitle: document.getElementById("feature-title"),
    featureDesc: document.getElementById("feature-desc"),
    featureSpecs: document.getElementById("feature-specs"),
    featureId: document.getElementById("feature-id"),
    featureFocus: document.getElementById("feature-focus"),
    featureAction: document.getElementById("feature-action"),
    inspectHint: document.getElementById("inspect-hint"),
    walkHint: document.getElementById("walk-hint"),
    crosshair: document.getElementById("crosshair"),
    toasts: document.getElementById("toasts"),
    compassNeedle: document.getElementById("compass-needle"),
    headingValue: document.getElementById("heading-value"),
    fpsValue: document.getElementById("fps-value"),
    mapDot: null,
    mapHeading: null,
    roomsToggle: document.getElementById("rooms-toggle"),
    roomDrawer: document.getElementById("room-drawer"),
    energy: document.getElementById("energy-value"),
    temp: document.getElementById("temp-value"),
    air: document.getElementById("air-value"),
    water: document.getElementById("water-value")
  };

  /* ── Utilities ──────────────────────────────────────────── */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const round = (v, p) => Number(v.toFixed(p || 3));
  const nextFrame = () => new Promise((resolve) => setTimeout(resolve, 24));
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function toast(message, kind) {
    if (!els.toasts) return;
    const node = document.createElement("div");
    node.className = "toast" + (kind === "warn" ? " warn" : "");
    node.textContent = message;
    els.toasts.appendChild(node);
    requestAnimationFrame(() => node.classList.add("show"));
    setTimeout(() => {
      node.classList.remove("show");
      setTimeout(() => node.remove(), 420);
    }, 3200);
  }

  function setLoader(pct, label) {
    if (loaderBar) loaderBar.style.width = pct + "%";
    if (loaderPct) loaderPct.textContent = Math.round(pct) + "%";
    if (loaderLabel && label) loaderLabel.textContent = label;
  }

  function fatal(message) {
    if (loaderLabel) loaderLabel.textContent = message;
    if (loaderPct) loaderPct.textContent = "ERR";
    if (loaderBar) loaderBar.style.background = "#ff6b8a";
    console.error("[NEXUS 2035]", message);
  }

  function download(filename, text) {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  function formatClock() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    if (els.clock) els.clock.textContent = hh + ":" + mm + ":" + ss;
  }

  /* ── Engine globals ─────────────────────────────────────── */
  let renderer, scene, camera, controls, clock, raycaster;
  let skyMat, skyMesh, sunSprite, stars, starsMat;
  let sunLight, hemiLight;
  let house, cityGroup, propsGroup;
  let glassTarget, envTarget, envCurrent;
  let glassMaterial;
  let ledA, ledB, holoCoreMat, holoWireMat, holoRingMat, inductionMat, growMat, bedGlowMat;
  let cityMats = [];
  let roomLights = [];
  let interactables = [];
  let colliders = [];
  let traffic = [];
  let animatedRings = [];
  let inductionRings = [];
  let holoGroup = null;
  let fireLight = null;
  let featureKey = null;
  let pendingFocus = null;
  let camTween = null;
  let saveTimer = null;
  let tourTimer = null;
  let lastHoverCheck = 0;
  let pointerDownInfo = null;
  let walkKeys = { forward: false, back: false, left: false, right: false, boost: false };
  let yaw = 0;
  let pitch = 0;
  const pointer = new T.Vector2();
  const tmpVec = new T.Vector3();
  const tmpVec2 = new T.Vector3();
  const tmpColor = new T.Color();
  const yAxis = new T.Vector3(0, 1, 0);

  const M = {}; // shared materials
  const G = {}; // shared geometries where useful

  /* ============================================================
     RENDERER / SCENE / CAMERA
     ============================================================ */
  function initEngine() {
    renderer = new T.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      stencil: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;

    scene = new T.Scene();
    scene.fog = new T.Fog(0xcfe6f2, 55, 235);

    camera = new T.PerspectiveCamera(window.innerWidth < 900 ? 64 : 52, window.innerWidth / window.innerHeight, 0.08, 500);
    camera.position.set(OVERVIEW.camera[0], OVERVIEW.camera[1], OVERVIEW.camera[2]);
    camera.rotation.order = "YXZ";

    if (!T.OrbitControls) {
      throw new Error("OrbitControls failed to load");
    }

    controls = new T.OrbitControls(camera, canvas);
    controls.target.set(OVERVIEW.target[0], OVERVIEW.target[1], OVERVIEW.target[2]);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.rotateSpeed = 0.62;
    controls.panSpeed = 0.85;
    controls.zoomSpeed = 0.82;
    controls.minDistance = 1.1;
    controls.maxDistance = 62;
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.minPolarAngle = 0.08;
    controls.screenSpacePanning = true;
    controls.autoRotate = false;
    controls.update();
    controls.addEventListener("change", scheduleSave);
    controls.addEventListener("start", () => {
      hideInspectHint();
      if (state.autoTour) stopAutoTour(true);
    });

    clock = new T.Clock();
    raycaster = new T.Raycaster();
    raycaster.far = 60;

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) saveLocal();
    });
  }

  function onResize() {
    if (!renderer || !camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.fov = window.innerWidth < 900 ? 64 : 52;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /* ============================================================
     PROCEDURAL TEXTURES
     ============================================================ */
  function canvasTexture(w, h, draw, repeatX, repeatY) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    draw(ctx, w, h);
    const tex = new T.CanvasTexture(c);
    tex.wrapS = T.RepeatWrapping;
    tex.wrapT = T.RepeatWrapping;
    tex.repeat.set(repeatX || 1, repeatY || 1);
    tex.encoding = T.sRGBEncoding;
    tex.anisotropy = renderer ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 4;
    return tex;
  }

  function makeTerrazzo() {
    return canvasTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = "#e9e5dc";
      ctx.fillRect(0, 0, w, h);
      const palette = ["#b9b3a7", "#7d817c", "#cfc8bb", "#a9b5b2", "#8f7f6c", "#5f6563", "#d8d2c6", "#c4a68f"];
      for (let i = 0; i < 1700; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = rand(0.6, 3.6);
        ctx.globalAlpha = rand(0.18, 0.55);
        ctx.fillStyle = pickOne(palette);
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * rand(0.5, 1.4), Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = "#9c9487";
      ctx.lineWidth = 0.7;
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        let x = rand(0, w);
        let y = rand(0, h);
        ctx.moveTo(x, y);
        for (let j = 0; j < 4; j++) {
          x += rand(-60, 60);
          y += rand(-40, 40);
          ctx.quadraticCurveTo(x + rand(-30, 30), y + rand(-30, 30), x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }, 5, 4);
  }

  function makeWood() {
    return canvasTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = "#6d4c34";
      ctx.fillRect(0, 0, w, h);
      const plank = 64;
      for (let x = 0; x < w; x += plank) {
        const tone = pickOne(["#75553b", "#674730", "#7d5b40", "#5e402c", "#87654a"]);
        ctx.fillStyle = tone;
        ctx.fillRect(x + 1, 0, plank - 2, h);
        ctx.strokeStyle = "rgba(38,24,16,0.55)";
        ctx.lineWidth = 1;
        for (let g = 0; g < 15; g++) {
          ctx.beginPath();
          ctx.globalAlpha = rand(0.08, 0.3);
          const gx = x + rand(4, plank - 4);
          ctx.moveTo(gx, 0);
          for (let y = 0; y <= h; y += 32) {
            ctx.lineTo(gx + Math.sin(y * 0.02 + g) * rand(1, 4), y);
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(35,22,14,0.5)";
        ctx.fillRect(x, 0, 1, h);
      }
    }, 3.5, 3.5);
  }

  function makeConcrete() {
    return canvasTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = "#b5b2ac";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) {
        ctx.globalAlpha = rand(0.02, 0.11);
        ctx.fillStyle = Math.random() > 0.5 ? "#ffffff" : "#4f4e4b";
        const r = rand(0.4, 2);
        ctx.fillRect(Math.random() * w, Math.random() * h, r, r);
      }
      ctx.globalAlpha = 1;
    }, 4, 4);
  }

  function makeRug(base, accent) {
    return canvasTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = base || "#1b2630";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = accent || "rgba(94,231,255,0.22)";
      ctx.lineWidth = 2;
      ctx.strokeRect(18, 18, w - 36, h - 36);
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < 7; i++) {
        const off = 40 + i * 30;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, off, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.12;
      for (let i = 0; i < 240; i++) {
        ctx.fillStyle = i % 2 ? "#ffffff" : "#000000";
        ctx.fillRect(rand(0, w), rand(0, h), rand(1, 4), 1);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = accent || "rgba(94,231,255,0.3)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(60, h - 60);
      ctx.lineTo(w - 60, 60);
      ctx.stroke();
    }, 1, 1);
  }

  function makeArt(seed) {
    return canvasTexture(512, 384, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      const palettes = [
        ["#0a1724", "#14405c", "#5ee7ff", "#9d7bff"],
        ["#1b1020", "#4a183b", "#ff6f91", "#ffb26b"],
        ["#101c16", "#244a35", "#71f7b1", "#d7ff9e"],
        ["#171430", "#2f2a66", "#8d7bff", "#5ee7ff"]
      ];
      const p = palettes[seed % palettes.length];
      g.addColorStop(0, p[0]);
      g.addColorStop(0.55, p[1]);
      g.addColorStop(1, p[0]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = p[2];
      ctx.beginPath();
      ctx.arc(w * 0.68, h * 0.42, h * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = p[3];
      ctx.beginPath();
      ctx.arc(w * 0.36, h * 0.62, h * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      for (let i = 0; i < 34; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (i / 34) * h);
        ctx.lineTo(w, (i / 34) * h + rand(-30, 30));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }, 1, 1);
  }

  function makeScreen(kind) {
    return canvasTexture(768, 432, (ctx, w, h) => {
      const isMedia = kind === "media";
      const isGuest = kind === "guest";
      const accent = isMedia ? "#5ee7ff" : isGuest ? "#ffb26b" : "#8d7bff";
      const second = isMedia ? "#ff5cf4" : isGuest ? "#ff6f91" : "#5ee7ff";
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, isMedia ? "#06131c" : isGuest ? "#1a100a" : "#0a0718");
      bg.addColorStop(1, "#02040a");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 48) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 48) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      ctx.fillStyle = "rgba(255,255,255,0.035)";
      ctx.fillRect(0, 0, w, 46);
      ctx.fillStyle = accent;
      ctx.font = "600 13px monospace";
      ctx.fillText(isMedia ? "NEXUS / MEDIA WALL" : isGuest ? "GUEST SUITE / AMBIENT" : "NEXUS OS / AR STUDIO", 24, 29);
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fillText("2035.11.01", w - 24, 29);
      ctx.textAlign = "left";

      if (isMedia) {
        ctx.fillStyle = accent;
        ctx.font = "700 74px sans-serif";
        ctx.fillText("HORIZON", 38, 168);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "300 30px sans-serif";
        ctx.fillText("a film by the city", 42, 210);
        ctx.fillStyle = second;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(38, 250, 250, 4);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "12px monospace";
        ctx.fillText("02:14:38 / 4K HDR / DOLBY SPATIAL", 38, 285);
        ctx.strokeStyle = "rgba(255,255,255,0.14)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(38, 330);
        ctx.lineTo(w - 38, 330);
        ctx.stroke();
        ctx.strokeStyle = accent;
        ctx.beginPath();
        ctx.moveTo(38, 330);
        ctx.lineTo(380, 330);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.beginPath();
        ctx.arc(w - 80, 120, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#051019";
        ctx.beginPath();
        ctx.moveTo(w - 92, 102);
        ctx.lineTo(w - 68, 120);
        ctx.lineTo(w - 92, 138);
        ctx.closePath();
        ctx.fill();
      } else if (isGuest) {
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.font = "300 60px sans-serif";
        ctx.fillText("REST", 40, 160);
        ctx.fillStyle = accent;
        ctx.font = "700 60px sans-serif";
        ctx.fillText("WELL.", 40, 224);
        ctx.fillStyle = "rgba(255,255,255,0.38)";
        ctx.font = "12px monospace";
        ctx.fillText("ROOM TEMPERATURE 21.5°C", 42, 275);
        ctx.fillText("SUNRISE WAKE 06:42", 42, 298);
        ctx.strokeStyle = "rgba(255,178,107,0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(w - 130, 180, 66, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(w - 130, 180, 44, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(w - 130, 180, 9, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < 300; x += 4) {
          const y = 210 + Math.sin(x * 0.035) * 34 * Math.sin(x * 0.009) + rand(-5, 5);
          if (x === 0) ctx.moveTo(38 + x, y); else ctx.lineTo(38 + x, y);
        }
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.font = "700 44px monospace";
        ctx.fillText("88.4", 38, 148);
        ctx.fillStyle = accent;
        ctx.font = "12px monospace";
        ctx.fillText("RENDER LOAD / %", 40, 172);
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.fillRect(400, 88, 320, 210);
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.strokeRect(400, 88, 320, 210);
        ctx.strokeStyle = second;
        ctx.beginPath();
        ctx.arc(560, 193, 62, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(560, 193, 34, -1.2, 2.1);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "10px monospace";
        ctx.fillText("SPATIAL CANVAS", 426, 330);
        ctx.fillText("GESTURE TRACKING ACTIVE", 426, 350);
      }

      ctx.globalAlpha = 0.5;
      ctx.fillStyle = accent;
      ctx.font = "10px monospace";
      ctx.fillText("NEXUS OS", w - 110, h - 22);
      ctx.globalAlpha = 1;
    }, 1, 1);
  }

  function makeCityTexture(seed) {
    return canvasTexture(128, 256, (ctx, w, h) => {
      ctx.fillStyle = "#070b12";
      ctx.fillRect(0, 0, w, h);
      const cols = 8;
      const rows = 20;
      const cw = w / cols;
      const ch = h / rows;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (Math.random() < 0.34) {
            const colors = ["#9fdcff", "#5ee7ff", "#ffd9a0", "#ff8fd9", "#c4c9ff"];
            ctx.globalAlpha = rand(0.35, 0.95);
            ctx.fillStyle = pickOne(colors);
            ctx.fillRect(x * cw + 2, y * ch + 2, cw - 4, ch - 4);
          }
        }
      }
      ctx.globalAlpha = 0.13;
      ctx.fillStyle = "#5ee7ff";
      for (let i = 0; i < 5; i++) ctx.fillRect(rand(0, w), rand(0, h), 1, rand(10, 60));
      ctx.globalAlpha = 1;
    }, 1, 1);
  }

  function makeGlowTexture() {
    return canvasTexture(128, 128, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.18, "rgba(255,255,255,0.85)");
      g.addColorStop(0.45, "rgba(255,255,255,0.22)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }, 1, 1);
  }

  /* ============================================================
     MATERIALS
     ============================================================ */
  function buildMaterials() {
    const terrazzo = makeTerrazzo();
    const wood = makeWood();
    const concrete = makeConcrete();
    const rugMain = makeRug("#141f2a", "rgba(94,231,255,0.28)");
    const rugWarm = makeRug("#2a2118", "rgba(255,178,107,0.3)");
    const art0 = makeArt(0);
    const art1 = makeArt(1);
    const art2 = makeArt(2);
    const art3 = makeArt(3);
    const mediaScreen = makeScreen("media");
    const monitorScreen = makeScreen("studio");
    const guestScreen = makeScreen("guest");
    const cityTex0 = makeCityTexture(0);
    const cityTex1 = makeCityTexture(1);
    const cityTex2 = makeCityTexture(2);
    const glow = makeGlowTexture();

    M.terrazzo = terrazzo;
    M.woodTex = wood;
    M.concreteTex = concrete;
    M.glowTex = glow;

    M.wall = new T.MeshStandardMaterial({ color: 0xefece5, roughness: 0.86, metalness: 0.015 });
    M.wallWarm = new T.MeshStandardMaterial({ color: 0xe6ded0, roughness: 0.9, metalness: 0.01 });
    M.exterior = new T.MeshStandardMaterial({ color: 0x222a33, roughness: 0.92, metalness: 0.08 });
    M.exteriorLight = new T.MeshStandardMaterial({ color: 0x343d47, roughness: 0.86, metalness: 0.12 });
    M.floor = new T.MeshStandardMaterial({ map: terrazzo, color: 0xffffff, roughness: 0.3, metalness: 0.05 });
    M.floorMaster = new T.MeshStandardMaterial({ map: terrazzo, color: 0xcfd6dc, roughness: 0.22, metalness: 0.08 });
    M.floorStudio = new T.MeshStandardMaterial({ color: 0x2b3139, roughness: 0.38, metalness: 0.16 });
    M.floorGuest = new T.MeshStandardMaterial({ map: terrazzo, color: 0xdfe2df, roughness: 0.34, metalness: 0.04 });
    M.floorEco = new T.MeshStandardMaterial({ map: wood, color: 0xcbb59a, roughness: 0.58, metalness: 0.02 });
    M.deck = new T.MeshStandardMaterial({ map: wood, color: 0xb59a7d, roughness: 0.72, metalness: 0.02 });
    M.concrete = new T.MeshStandardMaterial({ map: concrete, color: 0xd0cdc6, roughness: 0.8, metalness: 0.03 });
    M.darkStone = new T.MeshStandardMaterial({ color: 0x1a222b, roughness: 0.3, metalness: 0.22 });
    M.marble = new T.MeshStandardMaterial({ color: 0x242c35, roughness: 0.18, metalness: 0.3 });
    M.metal = new T.MeshStandardMaterial({ color: 0xaab8c7, roughness: 0.24, metalness: 0.92 });
    M.darkMetal = new T.MeshStandardMaterial({ color: 0x141b24, roughness: 0.32, metalness: 0.82 });
    M.brass = new T.MeshStandardMaterial({ color: 0xba8c5c, roughness: 0.3, metalness: 0.88 });
    M.black = new T.MeshStandardMaterial({ color: 0x080b0f, roughness: 0.55, metalness: 0.2 });
    M.fabric = new T.MeshStandardMaterial({ color: 0x5c6774, roughness: 0.96, metalness: 0 });
    M.fabricLight = new T.MeshStandardMaterial({ color: 0x9aa5b1, roughness: 0.95, metalness: 0 });
    M.fabricDeep = new T.MeshStandardMaterial({ color: 0x27313c, roughness: 0.98, metalness: 0 });
    M.cream = new T.MeshStandardMaterial({ color: 0xd9d2c6, roughness: 0.92, metalness: 0 });
    M.leather = new T.MeshStandardMaterial({ color: 0x3b2e2a, roughness: 0.6, metalness: 0.04 });
    M.wood = new T.MeshStandardMaterial({ map: wood, color: 0xd8b896, roughness: 0.55, metalness: 0.02 });
    M.woodLight = new T.MeshStandardMaterial({ map: wood, color: 0xf0d8b8, roughness: 0.6, metalness: 0.01 });
    M.woodDark = new T.MeshStandardMaterial({ map: wood, color: 0x7c5a3e, roughness: 0.6, metalness: 0.04 });
    M.plant = new T.MeshStandardMaterial({ color: 0x3d7a4a, roughness: 0.85, metalness: 0 });
    M.plantLight = new T.MeshStandardMaterial({ color: 0x69a95e, roughness: 0.82, metalness: 0 });
    M.moss = new T.MeshStandardMaterial({ color: 0x2f6b3a, roughness: 0.96, metalness: 0 });
    M.mossLight = new T.MeshStandardMaterial({ color: 0x4f8f48, roughness: 0.94, metalness: 0 });
    M.rugMain = new T.MeshStandardMaterial({ map: rugMain, color: 0xffffff, roughness: 1, metalness: 0 });
    M.rugWarm = new T.MeshStandardMaterial({ map: rugWarm, color: 0xffffff, roughness: 1, metalness: 0 });
    M.art0 = new T.MeshStandardMaterial({ map: art0, roughness: 0.6, metalness: 0.05, emissive: 0xffffff, emissiveMap: art0, emissiveIntensity: 0.14 });
    M.art1 = new T.MeshStandardMaterial({ map: art1, roughness: 0.6, metalness: 0.05, emissive: 0xffffff, emissiveMap: art1, emissiveIntensity: 0.14 });
    M.art2 = new T.MeshStandardMaterial({ map: art2, roughness: 0.6, metalness: 0.05, emissive: 0xffffff, emissiveMap: art2, emissiveIntensity: 0.14 });
    M.art3 = new T.MeshStandardMaterial({ map: art3, roughness: 0.6, metalness: 0.05, emissive: 0xffffff, emissiveMap: art3, emissiveIntensity: 0.14 });
    M.media = new T.MeshStandardMaterial({ map: mediaScreen, emissive: 0xffffff, emissiveMap: mediaScreen, emissiveIntensity: 1.25, roughness: 0.32, metalness: 0.1 });
    M.monitor = new T.MeshStandardMaterial({ map: monitorScreen, emissive: 0xffffff, emissiveMap: monitorScreen, emissiveIntensity: 1.05, roughness: 0.28, metalness: 0.12, side: T.DoubleSide });
    M.guestScreen = new T.MeshStandardMaterial({ map: guestScreen, emissive: 0xffffff, emissiveMap: guestScreen, emissiveIntensity: 1.0, roughness: 0.3, metalness: 0.1 });
    M.mirror = new T.MeshStandardMaterial({ color: 0xb9d9e4, roughness: 0.04, metalness: 0.95, envMapIntensity: 1.2 });
    M.glass = new T.MeshPhysicalMaterial({
      color: 0xbfe9ff, transparent: true, opacity: 0.14, roughness: 0.05,
      metalness: 0.0, side: T.DoubleSide, depthWrite: false,
      clearcoat: 1.0, clearcoatRoughness: 0.04, reflectivity: 0.45
    });
    glassMaterial = M.glass;
    M.partition = new T.MeshPhysicalMaterial({
      color: 0xd8f2ff, transparent: true, opacity: 0.2, roughness: 0.08,
      metalness: 0.0, side: T.DoubleSide, depthWrite: false,
      clearcoat: 0.8, clearcoatRoughness: 0.06
    });
    M.railing = new T.MeshPhysicalMaterial({
      color: 0xbfe9ff, transparent: true, opacity: 0.16, roughness: 0.05,
      metalness: 0.0, side: T.DoubleSide, depthWrite: false,
      clearcoat: 1.0, clearcoatRoughness: 0.03
    });
    M.water = new T.MeshPhysicalMaterial({
      color: 0x6fd8ff, transparent: true, opacity: 0.42, roughness: 0.08,
      metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.02
    });

    M.ledA = new T.MeshStandardMaterial({ color: 0x101820, emissive: 0xbfe9ff, emissiveIntensity: 1.5, roughness: 0.45, metalness: 0.2 });
    M.ledB = new T.MeshStandardMaterial({ color: 0x101820, emissive: 0x9d7bff, emissiveIntensity: 1.1, roughness: 0.45, metalness: 0.2 });
    ledA = M.ledA;
    ledB = M.ledB;

    M.holoCore = new T.MeshStandardMaterial({ color: 0x061019, emissive: 0x2fe6ff, emissiveIntensity: 1.5, roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.94 });
    M.holoWire = new T.MeshBasicMaterial({ color: 0x2fe6ff, wireframe: true, transparent: true, opacity: 0.42 });
    M.holoRing = new T.MeshBasicMaterial({ color: 0x2fe6ff, transparent: true, opacity: 0.62 });
    holoCoreMat = M.holoCore;
    holoWireMat = M.holoWire;
    holoRingMat = M.holoRing;

    M.induction = new T.MeshStandardMaterial({ color: 0x0a1218, emissive: 0x5ee7ff, emissiveIntensity: 1.8, roughness: 0.25, metalness: 0.3, side: T.DoubleSide });
    inductionMat = M.induction;

    M.grow = new T.MeshStandardMaterial({ color: 0x101a12, emissive: 0x71f7b1, emissiveIntensity: 1.4, roughness: 0.5 });
    growMat = M.grow;

    M.bedGlow = new T.MeshStandardMaterial({ color: 0x0a1218, emissive: 0x5ee7ff, emissiveIntensity: 1.7, roughness: 0.4 });
    bedGlowMat = M.bedGlow;

    M.fire = new T.MeshBasicMaterial({ color: 0xff9a4c, transparent: true, opacity: 0.88 });
    M.fireGlow = new T.MeshBasicMaterial({ map: glow, color: 0xff8a3d, transparent: true, opacity: 0.65, blending: T.AdditiveBlending, depthWrite: false });

    M.city = [
      new T.MeshStandardMaterial({ color: 0x1e2733, roughness: 0.86, metalness: 0.2, map: cityTex0, emissive: 0xaad8ff, emissiveMap: cityTex0, emissiveIntensity: 0.72 }),
      new T.MeshStandardMaterial({ color: 0x232c37, roughness: 0.86, metalness: 0.2, map: cityTex1, emissive: 0x8fd4ff, emissiveMap: cityTex1, emissiveIntensity: 0.72 }),
      new T.MeshStandardMaterial({ color: 0x1b232e, roughness: 0.86, metalness: 0.2, map: cityTex2, emissive: 0xffc3a1, emissiveMap: cityTex2, emissiveIntensity: 0.72 })
    ];
    cityMats = M.city;
  }

  /* ============================================================
     MESH HELPERS
     ============================================================ */
  function addMesh(geo, mat, x, y, z, parent, opts) {
    const m = new T.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    const o = opts || {};
    m.castShadow = o.cast !== false;
    m.receiveShadow = o.receive !== false;
    if (o.name) m.name = o.name;
    if (o.rotation) m.rotation.set(o.rotation[0], o.rotation[1], o.rotation[2]);
    if (o.renderOrder !== undefined) m.renderOrder = o.renderOrder;
    (parent || scene).add(m);
    return m;
  }

  function box(w, h, d, mat, x, y, z, parent, opts) {
    return addMesh(new T.BoxGeometry(w, h, d), mat, x, y, z, parent, opts);
  }

  function plane(w, h, mat, x, y, z, parent, opts) {
    return addMesh(new T.PlaneGeometry(w, h), mat, x, y, z, parent, opts);
  }

  function cyl(rt, rb, h, mat, x, y, z, parent, seg, opts) {
    return addMesh(new T.CylinderGeometry(rt, rb, h, seg || 24), mat, x, y, z, parent, opts);
  }

  function sphere(r, mat, x, y, z, parent, ws, hs, opts) {
    return addMesh(new T.SphereGeometry(r, ws || 24, hs || 16), mat, x, y, z, parent, opts);
  }

  function torus(r, tube, mat, x, y, z, parent, rs, ts, opts) {
    return addMesh(new T.TorusGeometry(r, tube, ts || 12, rs || 40), mat, x, y, z, parent, opts);
  }

  function ring(inner, outer, mat, x, y, z, parent, seg, opts) {
    return addMesh(new T.RingGeometry(inner, outer, seg || 48), mat, x, y, z, parent, opts);
  }

  function roundedBox(w, h, d, r, mat, x, y, z, parent, opts) {
    const radius = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
    const s = new T.Shape();
    const hw = w / 2;
    const hh = h / 2;
    s.moveTo(-hw + radius, -hh);
    s.lineTo(hw - radius, -hh);
    s.quadraticCurveTo(hw, -hh, hw, -hh + radius);
    s.lineTo(hw, hh - radius);
    s.quadraticCurveTo(hw, hh, hw - radius, hh);
    s.lineTo(-hw + radius, hh);
    s.quadraticCurveTo(-hw, hh, -hw, hh - radius);
    s.lineTo(-hw, -hh + radius);
    s.quadraticCurveTo(-hw, -hh, -hw + radius, -hh);
    s.closePath();
    const depth = Math.max(0.01, d - radius * 0.7);
    const geo = new T.ExtrudeGeometry(s, {
      depth: depth,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: radius * 0.32,
      bevelThickness: radius * 0.32,
      curveSegments: 5
    });
    geo.center();
    return addMesh(geo, mat, x, y, z, parent, opts);
  }

  function addCollider(cx, cz, w, d) {
    colliders.push({ minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2 });
  }

  /* ============================================================
     LIGHTING RIG & SKY
     ============================================================ */
  function buildLighting() {
    hemiLight = new T.HemisphereLight(0xe9f6ff, 0x5f5a52, 0.92);
    hemiLight.position.set(0, 24, 0);
    scene.add(hemiLight);

    sunLight = new T.DirectionalLight(0xfff4e0, 2.1);
    sunLight.position.set(42, 48, 34);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(IS_MOBILE ? 1024 : 2048, IS_MOBILE ? 1024 : 2048);
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 25;
    sunLight.shadow.camera.bottom = -25;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 120;
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.normalBias = 0.025;
    scene.add(sunLight);
    scene.add(sunLight.target);

    // Soft fill from the glass facade
    const fill = new T.DirectionalLight(0xbcdcff, 0.35);
    fill.position.set(-18, 12, 26);
    scene.add(fill);
  }

  function buildSky() {
    skyMat = new T.ShaderMaterial({
      uniforms: {
        topColor: { value: new T.Color(LIGHT_PRESETS.daylight.skyTop) },
        bottomColor: { value: new T.Color(LIGHT_PRESETS.daylight.skyBottom) },
        offset: { value: 28 },
        exponent: { value: 0.62 }
      },
      vertexShader: [
        "varying vec3 vWorldPosition;",
        "void main() {",
        "  vec4 worldPosition = modelMatrix * vec4(position, 1.0);",
        "  vWorldPosition = worldPosition.xyz;",
        "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform vec3 topColor;",
        "uniform vec3 bottomColor;",
        "uniform float offset;",
        "uniform float exponent;",
        "varying vec3 vWorldPosition;",
        "void main() {",
        "  float h = normalize(vWorldPosition + offset).y;",
        "  gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);",
        "}"
      ].join("\n"),
      side: T.BackSide,
      depthWrite: false
    });
    skyMesh = new T.Mesh(new T.SphereGeometry(240, 32, 18), skyMat);
    skyMesh.renderOrder = -10;
    scene.add(skyMesh);

    // Stars
    const starCount = IS_MOBILE ? 520 : 980;
    const pos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(rand(0.02, 0.98));
      const r = rand(150, 210);
      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      pos[i * 3 + 1] = Math.cos(phi) * r;
      pos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;
    }
    const starGeo = new T.BufferGeometry();
    starGeo.setAttribute("position", new T.BufferAttribute(pos, 3));
    starsMat = new T.PointsMaterial({
      color: 0xffffff,
      size: 1.15,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      blending: T.AdditiveBlending
    });
    stars = new T.Points(starGeo, starsMat);
    stars.renderOrder = -8;
    scene.add(stars);

    // Sun / moon glow sprite
    const sunMat = new T.SpriteMaterial({
      map: M.glowTex,
      color: 0xfff1cf,
      transparent: true,
      opacity: 0.82,
      blending: T.AdditiveBlending,
      depthWrite: false,
      depthTest: true
    });
    sunSprite = new T.Sprite(sunMat);
    sunSprite.position.set(74, 58, 64);
    sunSprite.scale.set(34, 34, 1);
    sunSprite.renderOrder = -9;
    scene.add(sunSprite);
  }

  function addRoomLight(x, z, color, intensity, distance) {
    const light = new T.PointLight(color, intensity, distance || 9, 2);
    light.position.set(x, 2.92, z);
    light.castShadow = false;
    house.add(light);
    roomLights.push(light);
    return light;
  }

  /* ============================================================
     ARCHITECTURE
     ============================================================ */
  const WALL_H = 3.35;
  const WALL_T = 0.18;

  function wallX(x, z1, z2, mat, opts) {
    const len = Math.abs(z2 - z1);
    const m = box(WALL_T, WALL_H, len, mat || M.wall, x, WALL_H / 2, (z1 + z2) / 2, house, opts);
    addCollider(x, (z1 + z2) / 2, WALL_T + 0.04, len);
    return m;
  }

  function wallZ(z, x1, x2, mat, opts) {
    const len = Math.abs(x2 - x1);
    const m = box(len, WALL_H, WALL_T, mat || M.wall, (x1 + x2) / 2, WALL_H / 2, z, house, opts);
    addCollider((x1 + x2) / 2, z, len, WALL_T + 0.04);
    return m;
  }

  function addGlassPanel(w, h, x, y, z, rotY, mat) {
    const m = box(w, h, 0.035, mat || M.glass, x, y, z, house, { cast: false, receive: false });
    m.rotation.y = rotY || 0;
    m.renderOrder = 6;
    return m;
  }

  function addDoorFrame(cx, cz, width, alongX, height) {
    const h = height || 2.72;
    const posts = 0.085;
    const depth = 0.28;
    if (alongX) {
      box(width + 0.24, 0.11, depth, M.darkMetal, cx, h, cz, house, { cast: false });
      box(posts, h, depth, M.darkMetal, cx - width / 2, h / 2, cz, house, { cast: false });
      box(posts, h, depth, M.darkMetal, cx + width / 2, h / 2, cz, house, { cast: false });
      box(width - 0.06, 0.025, 0.04, M.ledA, cx, h - 0.08, cz - 0.16, house, { cast: false, receive: false });
    } else {
      box(depth, 0.11, width + 0.24, M.darkMetal, cx, h, cz, house, { cast: false });
      box(depth, h, posts, M.darkMetal, cx, h / 2, cz - width / 2, house, { cast: false });
      box(depth, h, posts, M.darkMetal, cx, h / 2, cz + width / 2, house, { cast: false });
    }
  }

  function ledStrip(w, d, x, y, z, mat) {
    return box(w, 0.035, d, mat || M.ledA, x, y, z, house, { cast: false, receive: false });
  }

  function buildShell() {
    // Foundation
    box(24.6, 0.22, 18.6, M.exterior, 0, -0.13, 0, house, { cast: true, receive: true });

    // Main terrazzo floor
    addMesh(new T.PlaneGeometry(24, 18), M.floor, 0, 0.002, 0, house, {
      rotation: [-Math.PI / 2, 0, 0], cast: false, receive: true
    });

    // Room floor inlays
    const inlays = [
      [-7.5, -5.75, 8.95, 6.45, M.floorMaster],
      [0, -5.75, 5.95, 6.45, M.floorStudio],
      [5.25, -5.75, 4.45, 6.45, M.floorEco],
      [9.75, -5.75, 4.45, 6.45, M.floorGuest]
    ];
    inlays.forEach((f) => {
      addMesh(new T.PlaneGeometry(f[2], f[3]), f[4], f[0], 0.013, f[1], house, {
        rotation: [-Math.PI / 2, 0, 0], cast: false, receive: true
      });
    });

    // Exterior walls
    wallZ(-9, -12, 12, M.wall);
    wallX(-12, -9, 9, M.wall);
    wallX(12, -9, 9, M.wall);

    // Exterior cladding on the outside face
    box(24.2, WALL_H, 0.12, M.exterior, 0, WALL_H / 2, -9.11, house, { cast: false });
    box(0.12, WALL_H, 18.2, M.exterior, -12.11, WALL_H / 2, 0, house, { cast: false });
    box(0.12, WALL_H, 18.2, M.exterior, 12.11, WALL_H / 2, 0, house, { cast: false });

    // Exterior vertical fins
    for (let z = -8.4; z <= 8.4; z += 3.35) {
      box(0.2, 4.25, 0.46, M.exterior, -12.24, 2.12, z, house, { cast: true });
      box(0.2, 4.25, 0.46, M.exterior, 12.24, 2.12, z, house, { cast: true });
    }
    for (let x = -10.5; x <= 10.5; x += 3.5) {
      box(0.46, 4.25, 0.2, M.exterior, x, 2.12, -9.24, house, { cast: true });
    }

    // Front smart-glass facade
    const frontZ = 9;
    const spans = [
      [-12, -9.6], [-9.6, -7.2], [-7.2, -4.8], [-4.8, -3.0],
      [-3.0, -1.5], [1.5, 3.0],
      [3.0, 4.8], [4.8, 7.2], [7.2, 9.6], [9.6, 12]
    ];
    spans.forEach((s) => {
      const w = s[1] - s[0];
      addGlassPanel(w - 0.06, 3.22, (s[0] + s[1]) / 2, 1.66, frontZ, 0, M.glass);
      addCollider((s[0] + s[1]) / 2, frontZ, w, 0.2);
    });

    // Facade mullions
    [-12, -9.6, -7.2, -4.8, -3.0, -1.5, 1.5, 3.0, 4.8, 7.2, 9.6, 12].forEach((x) => {
      box(0.055, 3.34, 0.14, M.darkMetal, x, 1.67, frontZ, house, { cast: false });
    });
    box(24.1, 0.09, 0.2, M.darkMetal, 0, 3.32, frontZ, house, { cast: false });
    box(24.1, 0.07, 0.22, M.darkMetal, 0, 0.035, frontZ, house, { cast: false });
    // Sliding-door track and handles
    box(6.2, 0.06, 0.24, M.darkMetal, 0, 3.28, frontZ, house, { cast: false });
    box(0.035, 0.7, 0.06, M.metal, -1.6, 1.45, frontZ - 0.1, house, { cast: false });
    box(0.035, 0.7, 0.06, M.metal, 1.6, 1.45, frontZ - 0.1, house, { cast: false });

    // Rear interior wall with door openings
    const rearZ = -2.5;
    const rearSegments = [
      [-12, -10.3], [-8.7, -1.3], [1.3, 4.6], [6.0, 9.0], [10.4, 12]
    ];
    rearSegments.forEach((s) => wallZ(rearZ, s[0], s[1], M.wall));
    addDoorFrame(-9.5, rearZ, 1.6, true);
    addDoorFrame(0, rearZ, 2.6, true, 2.82);
    addDoorFrame(5.3, rearZ, 1.4, true);
    addDoorFrame(9.7, rearZ, 1.4, true);

    // Bedroom partitions
    wallX(-3, -9, rearZ, M.wall);
    wallX(3, -9, rearZ, M.wall);
    wallX(7.5, -9, rearZ, M.wall);

    // Master bathroom translucent partition
    wallX(-9, -9, -6.4, M.partition, { cast: false, receive: false });
    wallZ(-6.4, -12, -10.9, M.partition, { cast: false, receive: false });
    wallZ(-6.4, -9.9, -9, M.partition, { cast: false, receive: false });
    // partition frames
    box(0.07, 2.9, 2.65, M.darkMetal, -9, 1.45, -7.7, house, { cast: false });
    box(2.2, 0.07, 0.1, M.darkMetal, -10.45, 2.86, -6.4, house, { cast: false });

    // Ceiling structure / beams (open-roof dollhouse)
    [-9, -6, -3, 0, 3, 6, 9].forEach((z) => {
      box(24, 0.1, 0.13, M.exteriorLight, 0, 3.42, z, house, { cast: false, receive: false });
    });
    [-12, -6, 0, 6, 12].forEach((x) => {
      box(0.13, 0.1, 18, M.exteriorLight, x, 3.42, 0, house, { cast: false, receive: false });
    });

    // Recessed linear LED channels
    ledStrip(23.6, 0.045, 0, 3.12, -8.8, M.ledA);
    ledStrip(0.045, 17.5, -11.8, 3.12, 0, M.ledA);
    ledStrip(0.045, 17.5, 11.8, 3.12, 0, M.ledA);
    ledStrip(23.6, 0.045, 0, 3.18, 8.84, M.ledB);
    ledStrip(8.7, 0.04, -7.5, 3.12, -2.62, M.ledB);
    ledStrip(5.7, 0.04, 0, 3.12, -2.62, M.ledA);
    ledStrip(4.3, 0.04, 5.25, 3.12, -2.62, M.ledB);
    ledStrip(4.3, 0.04, 9.75, 3.12, -2.62, M.ledA);
    ledStrip(0.04, 6.2, -2.88, 3.1, -5.75, M.ledB);
    ledStrip(0.04, 6.2, 2.88, 3.1, -5.75, M.ledB);
    ledStrip(0.04, 6.2, 7.38, 3.1, -5.75, M.ledA);

    // Foyer floor inlay
    ring(1.55, 1.72, M.darkMetal, 0, 0.022, 0, house, 64, { rotation: [-Math.PI / 2, 0, 0], cast: false });
    ring(1.38, 1.46, M.ledA, 0, 0.026, 0, house, 64, { rotation: [-Math.PI / 2, 0, 0], cast: false, receive: false });

    // Room point lights (order must match LIGHT_PRESETS)
    addRoomLight(-7.2, 5.2, 0xfff4e6, 0.95, 10);
    addRoomLight(7.3, 5.0, 0xfff2df, 0.95, 10);
    addRoomLight(0, 0, 0xdff7ff, 0.8, 7);
    addRoomLight(-8.0, -6.0, 0xfff0df, 0.9, 8);
    addRoomLight(0, -6.4, 0xdff7ff, 0.85, 8);
    addRoomLight(5.3, -6.4, 0xffd8a6, 0.85, 7);
    addRoomLight(9.8, -6.4, 0xffe9cf, 0.8, 7);
    fireLight = addRoomLight(0, 11.25, 0xff9a4c, 1.0, 7);
    fireLight.position.y = 0.75;
  }

  function buildPlinth() {
    // The residence sits on a cantilevered architectural plinth above the city.
    const plinthMat = new T.MeshStandardMaterial({ color: 0x03060a, roughness: 0.95, metalness: 0.0 });
    box(32, 0.32, 28, M.exterior, 0, -0.24, 0.8, house, { cast: false, receive: true });
    addMesh(new T.PlaneGeometry(31.8, 27.8), plinthMat, 0, -0.075, 0.8, house, {
      rotation: [-Math.PI / 2, 0, 0], cast: false, receive: true
    });
    // Perimeter light signature
    box(31.6, 0.035, 0.06, M.ledA, 0, -0.015, -13.1, house, { cast: false, receive: false });
    box(31.6, 0.035, 0.06, M.ledA, 0, -0.015, 14.7, house, { cast: false, receive: false });
    box(0.06, 0.035, 27.8, M.ledB, -15.85, -0.015, 0.8, house, { cast: false, receive: false });
    box(0.06, 0.035, 27.8, M.ledB, 15.85, -0.015, 0.8, house, { cast: false, receive: false });

    // Corner landscape planters
    [[-14.3, 10.6], [14.3, 10.6], [-14.3, -10.4], [14.3, -10.4]].forEach((p) => {
      box(1.8, 0.42, 0.72, M.woodDark, p[0], 0.14, p[1], house, {});
      box(1.64, 0.05, 0.58, M.darkStone, p[0], 0.36, p[1], house, { cast: false });
      plant(p[0] - 0.38, p[1], 0.62, "shrub");
      plant(p[0] + 0.34, p[1], 0.5, "shrub");
    });

    // Front arrival steps
    box(6.2, 0.16, 0.7, plinthMat, 0, -0.14, 14.05, house, { cast: false });
    box(7.0, 0.16, 0.7, plinthMat, 0, -0.26, 14.55, house, { cast: false });
  }

  /* ============================================================
     BALCONY
     ============================================================ */
  function buildBalcony() {
    // Deck
    addMesh(new T.PlaneGeometry(16.2, 3.6), M.deck, 0, 0.025, 10.78, house, {
      rotation: [-Math.PI / 2, 0, 0], cast: false, receive: true
    });
    box(16.3, 0.12, 3.7, M.exterior, 0, -0.05, 10.78, house, { cast: false });
    ledStrip(16.0, 0.035, 0, 0.07, 12.48, M.ledA);

    // Glass railing
    for (let x = -6; x <= 6; x += 4) {
      addGlassPanel(3.96, 1.12, x, 0.66, 12.5, 0, M.railing);
    }
    [-8, -4, 0, 4, 8].forEach((x) => {
      box(0.06, 1.24, 0.06, M.darkMetal, x, 0.65, 12.5, house, { cast: false });
    });
    box(16.1, 0.06, 0.09, M.darkMetal, 0, 1.28, 12.5, house, { cast: false });
    // Side railings
    [-8, 8].forEach((x) => {
      addGlassPanel(3.4, 1.12, x, 0.66, 10.75, Math.PI / 2, M.railing);
      box(0.06, 1.24, 0.06, M.darkMetal, x, 0.65, 9.1, house, { cast: false });
      box(0.06, 1.24, 0.06, M.darkMetal, x, 0.65, 12.5, house, { cast: false });
      box(0.09, 0.06, 3.5, M.darkMetal, x, 1.28, 10.75, house, { cast: false });
    });

    // Cantilevered canopy + solar array
    box(17.4, 0.18, 2.7, M.exterior, 0, 3.72, 10.0, house, { cast: true, receive: true });
    ledStrip(16.6, 0.045, 0, 3.6, 10.0, M.ledA);
    box(0.18, 3.7, 0.18, M.darkMetal, -8.3, 1.85, 11.15, house, { cast: true });
    box(0.18, 3.7, 0.18, M.darkMetal, 8.3, 1.85, 11.15, house, { cast: true });
    addCollider(-8.3, 11.15, 0.3, 0.3);
    addCollider(8.3, 11.15, 0.3, 0.3);
    for (let i = -1; i <= 1; i++) {
      const p = box(3.5, 0.07, 1.5, M.darkStone, i * 4.2, 3.92, 10.0, house, { cast: false });
      p.rotation.x = -0.18;
      box(3.2, 0.012, 1.28, new T.MeshStandardMaterial({ color: 0x0c2740, roughness: 0.18, metalness: 0.55, emissive: 0x0b3b66, emissiveIntensity: 0.4 }), i * 4.2, 3.97, 10.0, house, { cast: false });
    }

    // Loungers
    [-4.9, 4.9].forEach((x, i) => {
      const g = new T.Group();
      g.position.set(x, 0, 10.9);
      g.rotation.y = i === 0 ? -0.16 : 0.16;
      house.add(g);
      box(0.86, 0.16, 2.15, M.darkMetal, 0, 0.32, 0, g, {});
      roundedBox(0.82, 0.16, 2.0, 0.08, M.cream, 0, 0.44, 0, g, {});
      const back = roundedBox(0.82, 0.14, 0.92, 0.08, M.cream, 0, 0.68, -0.72, g, {});
      back.rotation.x = -0.42;
      box(0.1, 0.32, 0.1, M.darkMetal, -0.36, 0.16, 0.8, g, {});
      box(0.1, 0.32, 0.1, M.darkMetal, 0.36, 0.16, 0.8, g, {});
    });

    // Fire pit
    cyl(0.72, 0.62, 0.38, M.darkStone, 0, 0.19, 11.25, house, 32, {});
    cyl(0.58, 0.58, 0.06, M.metal, 0, 0.4, 11.25, house, 32, {});
    const fireDisc = cyl(0.42, 0.42, 0.03, M.fire, 0, 0.43, 11.25, house, 32, { cast: false, receive: false });
    fireDisc.material = M.fire;
    const flame = addMesh(new T.ConeGeometry(0.27, 0.7, 12, 1, true), M.fire, 0, 0.8, 11.25, house, { cast: false, receive: false });
    flame.renderOrder = 7;
    const fireSprite = new T.Sprite(new T.SpriteMaterial({
      map: M.glowTex, color: 0xff8a3d, transparent: true, opacity: 0.7,
      blending: T.AdditiveBlending, depthWrite: false
    }));
    fireSprite.position.set(0, 0.7, 11.25);
    fireSprite.scale.set(2.6, 2.6, 1);
    house.add(fireSprite);
    animatedRings.push({ type: "fire", mesh: flame, sprite: fireSprite });

    // Planters
    [-7.2, 7.2].forEach((x) => {
      box(1.15, 0.48, 0.62, M.woodDark, x, 0.24, 9.55, house, {});
      box(1.02, 0.06, 0.5, M.darkStone, x, 0.5, 9.55, house, { cast: false });
      plant(x - 0.2, 9.55, 0.58, "shrub");
      plant(x + 0.24, 9.55, 0.42, "shrub");
    });

    // Low side table
    cyl(0.34, 0.3, 0.36, M.darkStone, 2.35, 0.18, 11.3, house, 24, {});
    cyl(0.4, 0.4, 0.035, M.metal, 2.35, 0.38, 11.3, house, 24, { cast: false });

    // Railing herbaceous planter
    box(16.0, 0.12, 0.2, M.woodDark, 0, 1.36, 12.5, house, { cast: false });
    box(15.8, 0.04, 0.16, M.moss, 0, 1.43, 12.5, house, { cast: false });
    for (let x = -7.2; x <= 7.2; x += 0.85) {
      const tuft = sphere(rand(0.05, 0.085), Math.random() > 0.5 ? M.plantLight : M.mossLight, x, 1.47 + rand(0, 0.09), 12.5 + rand(-0.04, 0.04), house, 7, 5, { cast: false });
      tuft.scale.set(rand(0.8, 1.5), rand(0.7, 1.3), rand(0.8, 1.5));
    }

    // Observation telescope
    const scope = new T.Group();
    scope.position.set(2.6, 0, 11.55);
    house.add(scope);
    const mount = new T.Vector3(0, 1.24, 0);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const base = new T.Vector3(Math.sin(a) * 0.36, 0.02, Math.cos(a) * 0.36);
      const leg = new T.Mesh(new T.CylinderGeometry(0.018, 0.022, base.distanceTo(mount), 6), M.darkMetal);
      leg.position.copy(base).add(mount).multiplyScalar(0.5);
      leg.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), mount.clone().sub(base).normalize());
      leg.castShadow = true;
      scope.add(leg);
    }
    sphere(0.09, M.metal, 0, 1.24, 0, scope, 14, 10, {});
    const tube = new T.Mesh(new T.CylinderGeometry(0.075, 0.095, 0.92, 18), M.cream);
    tube.position.set(0, 1.3, 0.18);
    tube.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(0, 0.15, 1).normalize());
    tube.castShadow = true;
    scope.add(tube);
    const lens = torus(0.08, 0.014, M.metal, 0, 1.37, 0.63, scope, 20, 8, { cast: false });
    lens.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), new T.Vector3(0, 0.15, 1).normalize());
    addCollider(2.6, 11.55, 0.8, 0.8);

    // Step / threshold
    box(3.2, 0.12, 0.32, M.darkStone, 0, 0.06, 9.02, house, { cast: false });
  }

  /* ============================================================
     2035 SKYLINE
     ============================================================ */
  function buildCity() {
    cityGroup = new T.Group();
    scene.add(cityGroup);

    addMesh(new T.PlaneGeometry(420, 420), new T.MeshBasicMaterial({ color: 0x010205, fog: true }), 0, -0.38, 80, cityGroup, {
      rotation: [-Math.PI / 2, 0, 0], cast: false, receive: false
    });

    // Skyline towers
    const count = IS_MOBILE ? 38 : 58;
    for (let i = 0; i < count; i++) {
      const x = rand(-120, 120);
      let z = rand(62, 148);
      // Keep the near field around the residence clear so the skyline never
      // obscures the overview camera or the glass facade.
      if (z < 88 && Math.abs(x) < 42) z = rand(88, 112);
      const w = rand(3.5, 12);
      const d = rand(3.5, 12);
      const h = rand(4, 46) * (z > 55 ? 1.25 : 1);
      const mat = M.city[i % M.city.length];
      const b = box(w, h, d, mat, x, h / 2 - 0.35, z, cityGroup, { cast: false, receive: false });
      b.rotation.y = rand(-0.15, 0.15);

      if (i % 4 === 0) {
        const strip = box(0.07, h * 0.72, 0.05, i % 8 === 0 ? M.ledA : M.ledB, x + w * 0.32, h * 0.43, z - d / 2 - 0.04, cityGroup, { cast: false, receive: false });
        strip.rotation.y = b.rotation.y;
      }
      if (i % 7 === 0 && h > 24) {
        box(w * 0.12, 2.4, d * 0.12, M.darkMetal, x, h + 1.0, z, cityGroup, { cast: false, receive: false });
        box(0.15, 0.15, 0.15, M.ledA, x, h + 2.3, z, cityGroup, { cast: false, receive: false });
      }
    }

    // Low-rise city fabric below the skyline
    const cityLowMat = new T.MeshBasicMaterial({ color: 0x03060b, fog: true });
    const roadMat = new T.MeshStandardMaterial({ color: 0x0a1620, emissive: 0x1b4d66, emissiveIntensity: 0.22, roughness: 0.6 });
    const lowCount = IS_MOBILE ? 80 : 145;
    for (let i = 0; i < lowCount; i++) {
      const x = rand(-105, 105);
      const z = rand(17, 78);
      const w = rand(1.4, 6.2);
      const d = rand(1.4, 6.2);
      const h = rand(0.7, z < 32 ? 2.4 : 5.2);
      const b = box(w, h, d, cityLowMat, x, h / 2 - 0.36, z, cityGroup, { cast: false, receive: false });
      b.rotation.y = rand(-0.2, 0.2);
    }

    // Luminous transit grid
    [22, 34, 48, 64, 82, 102].forEach((z) => {
      box(180, 0.035, 0.14, roadMat, 0, -0.33, z, cityGroup, { cast: false, receive: false });
    });
    [-62, -31, 0, 31, 62, 92].forEach((x) => {
      box(0.14, 0.035, 96, roadMat, x, -0.33, 58, cityGroup, { cast: false, receive: false });
    });

    // Air traffic
    const craftMat = new T.MeshStandardMaterial({ color: 0x0a0f15, emissive: 0x5ee7ff, emissiveIntensity: 2.4, roughness: 0.4, metalness: 0.4 });
    const craftMat2 = new T.MeshStandardMaterial({ color: 0x0a0f15, emissive: 0xff6f91, emissiveIntensity: 2.2, roughness: 0.4, metalness: 0.4 });
    for (let i = 0; i < (IS_MOBILE ? 6 : 10); i++) {
      const g = new T.Group();
      const body = box(1.2, 0.18, 0.32, i % 3 === 0 ? craftMat2 : craftMat, 0, 0, 0, g, { cast: false, receive: false });
      body.rotation.z = 0.06;
      const glow = new T.Sprite(new T.SpriteMaterial({
        map: M.glowTex, color: i % 3 === 0 ? 0xff6f91 : 0x5ee7ff,
        transparent: true, opacity: 0.8, blending: T.AdditiveBlending, depthWrite: false
      }));
      glow.scale.set(1.9, 1.9, 1);
      g.add(glow);
      g.position.set(rand(-85, 85), rand(10, 34), rand(30, 82));
      cityGroup.add(g);
      traffic.push({
        group: g,
        speed: rand(2.2, 6.5) * (Math.random() > 0.5 ? 1 : -1),
        baseY: g.position.y,
        phase: rand(0, Math.PI * 2),
        bob: rand(0.15, 0.7)
      });
    }

    // Horizon glow
    const horizon = new T.Mesh(
      new T.PlaneGeometry(360, 34),
      new T.MeshBasicMaterial({ map: M.glowTex, color: 0x2f6f9f, transparent: true, opacity: 0.18, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })
    );
    horizon.position.set(0, 8, 118);
    cityGroup.add(horizon);
  }

  function buildWorld() {
    house = new T.Group();
    house.name = "Nexus2035";
    scene.add(house);

    buildLighting();
    buildSky();
    buildPlinth();
    buildShell();
    buildBalcony();
    buildCity();
    buildInteriors();
  }

  /* ============================================================
     INTERIOR HELPERS
     ============================================================ */
  function plant(x, z, scale, type) {
    const s = scale || 1;
    const g = new T.Group();
    g.position.set(x, 0, z);
    house.add(g);
    cyl(0.22 * s, 0.17 * s, 0.3 * s, Math.random() > 0.5 ? M.darkStone : M.woodDark, 0, 0.15 * s, 0, g, 18, {});
    cyl(0.2 * s, 0.2 * s, 0.02 * s, M.black, 0, 0.3 * s, 0, g, 16, { cast: false });
    if (type === "shrub") {
      for (let i = 0; i < 8; i++) {
        const leaf = sphere(rand(0.1, 0.17) * s, i % 2 ? M.plant : M.plantLight, rand(-0.2, 0.2) * s, (0.36 + rand(0, 0.2)) * s, rand(-0.2, 0.2) * s, g, 9, 7, {});
        leaf.scale.set(rand(0.8, 1.4), rand(0.6, 1.1), rand(0.8, 1.4));
      }
    } else {
      cyl(0.035 * s, 0.055 * s, 1.25 * s, M.woodDark, 0, 0.86 * s, 0, g, 7, {});
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + rand(-0.3, 0.3);
        const leaf = sphere(rand(0.15, 0.24) * s, i % 2 ? M.plant : M.plantLight, Math.cos(a) * rand(0.12, 0.42) * s, (1.38 + rand(0, 0.5)) * s, Math.sin(a) * rand(0.12, 0.42) * s, g, 9, 7, {});
        leaf.scale.set(rand(0.9, 1.6), rand(0.35, 0.65), rand(0.9, 1.6));
        leaf.rotation.set(rand(-0.4, 0.4), a, rand(-0.4, 0.4));
      }
      for (let i = 0; i < 4; i++) {
        const leaf = sphere(rand(0.13, 0.2) * s, M.plantLight, rand(-0.28, 0.28) * s, (1.15 + rand(0, 0.3)) * s, rand(-0.28, 0.28) * s, g, 8, 6, {});
        leaf.scale.set(1.4, 0.4, 1.4);
      }
    }
    return g;
  }

  function pendant(x, z, y, r, mat) {
    const top = WALL_H;
    const cable = top - y;
    cyl(0.008, 0.008, cable, M.darkMetal, x, y + cable / 2, z, house, 6, { cast: false });
    const globe = sphere(r || 0.12, mat || M.pendantWarm, x, y, z, house, 18, 12, { cast: false, receive: false });
    torus((r || 0.12) + 0.045, 0.008, M.metal, x, y, z, house, 24, 8, { rotation: [Math.PI / 2, 0, 0], cast: false });
    return globe;
  }

  function addArt(w, h, mat, x, y, z, rotY) {
    const g = new T.Group();
    g.position.set(x, y, z);
    g.rotation.y = rotY || 0;
    house.add(g);
    box(w + 0.1, h + 0.1, 0.05, M.darkMetal, 0, 0, 0, g, { cast: false });
    plane(w, h, mat, 0, 0, 0.033, g, { cast: false, receive: false });
    return g;
  }

  function rug(w, d, x, z, mat) {
    return addMesh(new T.PlaneGeometry(w, d), mat, x, 0.032, z, house, {
      rotation: [-Math.PI / 2, 0, 0], cast: false, receive: true
    });
  }

  function vase(x, y, z, s, mat, parent) {
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const r = (0.06 + Math.sin(t * Math.PI) * 0.11 + (t > 0.78 ? -0.03 : 0)) * s;
      pts.push(new T.Vector2(Math.max(0.015, r), t * 0.42 * s));
    }
    const mesh = new T.Mesh(new T.LatheGeometry(pts, 20), mat || M.cream);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    (parent || house).add(mesh);
    return mesh;
  }

  function bookStack(x, y, z, parent, scale) {
    const s = scale || 1;
    const g = new T.Group();
    g.position.set(x, y, z);
    g.rotation.y = rand(-0.3, 0.3);
    (parent || house).add(g);
    const mats = [M.fabricDeep, M.leather, M.cream, M.darkStone];
    for (let i = 0; i < 4; i++) {
      box(0.32 * s, 0.045 * s, 0.23 * s, mats[i % mats.length], rand(-0.015, 0.015), i * 0.048 * s, rand(-0.015, 0.015), g, { cast: false });
    }
    return g;
  }

  function curvedScreen(w, h, curve) {
    const geo = new T.PlaneGeometry(w, h, 28, 1);
    const pos = geo.attributes.position;
    const half = w / 2;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setZ(i, curve * (1 - Math.pow(x / half, 2)));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }

  function diningChair(x, z, rot) {
    const g = new T.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    house.add(g);
    roundedBox(0.5, 0.08, 0.48, 0.05, M.leather, 0, 0.46, 0, g, {});
    const back = roundedBox(0.5, 0.58, 0.07, 0.04, M.leather, 0, 0.73, -0.22, g, {});
    back.rotation.x = -0.1;
    box(0.035, 0.45, 0.035, M.metal, -0.19, 0.23, -0.18, g, {});
    box(0.035, 0.45, 0.035, M.metal, 0.19, 0.23, -0.18, g, {});
    box(0.035, 0.45, 0.035, M.metal, -0.19, 0.23, 0.18, g, {});
    box(0.035, 0.45, 0.035, M.metal, 0.19, 0.23, 0.18, g, {});
    return g;
  }

  function techRack(x, z) {
    const g = new T.Group();
    g.position.set(x, 0, z);
    house.add(g);
    box(0.68, 1.72, 0.58, M.black, 0, 0.86, 0, g, {});
    box(0.72, 0.06, 0.62, M.metal, 0, 1.75, 0, g, { cast: false });
    box(0.58, 0.02, 0.5, M.darkStone, 0, 0.02, 0, g, { cast: false });
    for (let i = 0; i < 6; i++) {
      box(0.5, 0.025, 0.015, i % 2 ? M.ledA : M.ledB, 0, 1.45 - i * 0.18, 0.3, g, { cast: false, receive: false });
      box(0.025, 0.025, 0.01, i % 3 ? M.grow : M.fire, -0.22 + (i % 4) * 0.07, 1.56 - i * 0.18, 0.306, g, { cast: false, receive: false });
    }
    box(0.03, 1.3, 0.03, M.ledB, 0.3, 0.86, 0.3, g, { cast: false, receive: false });
    return g;
  }

  function monitorDesk() {
    const g = new T.Group();
    g.position.set(0, 0, -7.82);
    house.add(g);
    roundedBox(3.45, 0.075, 0.92, 0.035, M.woodDark, 0, 0.78, 0, g, {});
    box(0.05, 0.76, 0.05, M.metal, -1.58, 0.39, -0.34, g, {});
    box(0.05, 0.76, 0.05, M.metal, 1.58, 0.39, -0.34, g, {});
    box(0.05, 0.76, 0.05, M.metal, -1.58, 0.39, 0.34, g, {});
    box(0.05, 0.76, 0.05, M.metal, 1.58, 0.39, 0.34, g, {});
    box(3.2, 0.025, 0.62, M.darkStone, 0, 0.44, 0, g, { cast: false });

    // Curved dual monitors
    const screenGeo = curvedScreen(1.55, 0.8, 0.055);
    [-0.84, 0.84].forEach((sx, i) => {
      const shell = box(1.58, 0.83, 0.035, M.darkMetal, sx, 1.6, -0.75, g, { cast: false });
      shell.rotation.y = i === 0 ? 0.145 : -0.145;
      const screen = new T.Mesh(screenGeo, M.monitor);
      screen.position.set(sx, 1.6, -0.725);
      screen.rotation.y = i === 0 ? 0.145 : -0.145;
      screen.renderOrder = 2;
      g.add(screen);
    });
    cyl(0.035, 0.035, 0.72, M.metal, 0, 1.06, -0.82, g, 10, {});
    box(1.5, 0.035, 0.08, M.darkMetal, 0, 1.44, -0.8, g, { cast: false });
    box(0.55, 0.018, 0.14, M.metal, 0, 0.98, -0.82, g, { cast: false });

    // Keyboard, mouse, pad
    box(0.92, 0.024, 0.27, M.black, 0, 0.835, 0.02, g, { cast: false });
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 12; c++) {
        box(0.055, 0.008, 0.045, M.darkMetal, -0.38 + c * 0.069, 0.849, -0.075 + r * 0.06, g, { cast: false, receive: false });
      }
    }
    roundedBox(0.13, 0.035, 0.2, 0.03, M.darkMetal, 0.68, 0.84, 0.03, g, {});
    roundedBox(0.42, 0.012, 0.32, 0.02, M.fabricDeep, 0.62, 0.818, 0.02, g, { cast: false });

    // Lamp
    cyl(0.09, 0.11, 0.025, M.metal, 1.38, 0.83, 0.15, g, 16, {});
    cyl(0.012, 0.012, 0.52, M.metal, 1.38, 1.08, 0.15, g, 8, {});
    const arm = box(0.42, 0.018, 0.018, M.metal, 1.18, 1.33, 0.15, g, { cast: false });
    arm.rotation.z = 0.28;
    sphere(0.07, M.pendantWarm, 0.98, 1.28, 0.15, g, 12, 8, { cast: false, receive: false });

    // Small speaker + plant
    cyl(0.045, 0.06, 0.15, M.darkMetal, -1.5, 0.89, 0.18, g, 12, {});
    g.userData.feature = "desk";
    interactables.push(g);
    addCollider(0, -7.82, 3.6, 1.1);
    return g;
  }

  function officeChair() {
    const g = new T.Group();
    g.position.set(0, 0, -6.55);
    g.rotation.y = Math.PI;
    house.add(g);
    roundedBox(0.68, 0.11, 0.66, 0.08, M.fabricDeep, 0, 0.48, 0, g, {});
    const back = roundedBox(0.64, 0.78, 0.12, 0.07, M.fabricDeep, 0, 0.9, -0.3, g, {});
    back.rotation.x = -0.08;
    box(0.08, 0.32, 0.08, M.metal, 0, 0.3, 0, g, {});
    cyl(0.32, 0.32, 0.035, M.darkMetal, 0, 0.035, 0, g, 18, {});
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      box(0.06, 0.045, 0.28, M.darkMetal, Math.cos(a) * 0.16, 0.06, Math.sin(a) * 0.16, g, { cast: false }).rotation.y = -a;
      sphere(0.035, M.black, Math.cos(a) * 0.28, 0.035, Math.sin(a) * 0.28, g, 8, 6, { cast: false });
    }
    box(0.06, 0.28, 0.06, M.metal, -0.36, 0.55, 0, g, {});
    box(0.06, 0.28, 0.06, M.metal, 0.36, 0.55, 0, g, {});
    return g;
  }

  /* ============================================================
     INTERIORS
     ============================================================ */
  function buildInteriors() {
    M.pendantWarm = new T.MeshStandardMaterial({ color: 0x3a2414, emissive: 0xffb26b, emissiveIntensity: 2.15, roughness: 0.45 });
    M.acoustic1 = new T.MeshStandardMaterial({ color: 0x25333d, roughness: 0.98, metalness: 0 });
    M.acoustic2 = new T.MeshStandardMaterial({ color: 0x3b2a4e, roughness: 0.98, metalness: 0 });
    M.acoustic3 = new T.MeshStandardMaterial({ color: 0x1d2f2a, roughness: 0.98, metalness: 0 });
    M.glassTop = new T.MeshPhysicalMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.3, roughness: 0.04, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.02 });
    M.duvetWarm = new T.MeshStandardMaterial({ color: 0xc7ab88, roughness: 0.96, metalness: 0 });
    M.terrariumGlass = new T.MeshPhysicalMaterial({ color: 0xd8f6ff, transparent: true, opacity: 0.19, roughness: 0.05, metalness: 0.0, side: T.DoubleSide, depthWrite: false, clearcoat: 1 });

    buildLivingKitchen();
    buildFoyer();
    buildMasterSuite();
    buildARStudio();
    buildEcoBedroom();
    buildGuestSuite();
    buildAmbientDetails();
  }

  /* ── Living / Kitchen / Dining ─────────────────────────── */
  function buildLivingKitchen() {
    // Sunken lounge plinth + rug
    box(8.5, 0.08, 5.9, M.darkStone, -7.2, 0.04, 5.25, house, { cast: false });
    rug(7.7, 5.1, -7.2, 5.25, M.rugMain);

    // Sectional sofa
    const sofa = new T.Group();
    sofa.position.set(-7.2, 0, 6.45);
    house.add(sofa);
    roundedBox(5.25, 0.42, 1.16, 0.16, M.fabric, 0, 0.32, 0, sofa, {});
    [-1.45, 0, 1.45].forEach((x) => {
      roundedBox(1.38, 0.18, 1.0, 0.12, M.fabricLight, x, 0.58, 0.03, sofa, {});
    });
    [-1.7, -0.56, 0.56, 1.7].forEach((x) => {
      const cushion = roundedBox(1.02, 0.56, 0.2, 0.1, M.fabricDeep, x, 0.86, -0.45, sofa, {});
      cushion.rotation.x = -0.1;
    });
    roundedBox(0.2, 0.48, 1.05, 0.08, M.fabricDeep, -2.55, 0.62, 0.02, sofa, {});
    roundedBox(0.2, 0.48, 1.05, 0.08, M.fabricDeep, 2.55, 0.62, 0.02, sofa, {});
    // Throw pillows
    [[-1.8, 0.9, 0.15, 0.3], [0.6, 0.92, 0.18, -0.4], [1.75, 0.9, 0.1, 0.15]].forEach((p) => {
      const pillow = roundedBox(0.5, 0.4, 0.16, 0.08, p[0] > 1 ? M.cream : M.fabricLight, p[0], p[1], p[2], sofa, {});
      pillow.rotation.z = p[3];
    });

    // Chaise
    const chaise = new T.Group();
    chaise.position.set(-9.9, 0, 4.95);
    chaise.rotation.y = 0.05;
    house.add(chaise);
    roundedBox(1.18, 0.4, 2.55, 0.16, M.fabric, 0, 0.3, 0, chaise, {});
    roundedBox(1.02, 0.16, 2.38, 0.12, M.fabricLight, 0, 0.55, 0, chaise, {});
    const chBack = roundedBox(0.2, 0.62, 2.3, 0.1, M.fabricDeep, -0.5, 0.82, 0, chaise, {});
    chBack.rotation.z = -0.08;
    addCollider(-7.2, 6.45, 5.8, 1.5);
    addCollider(-9.9, 4.95, 1.5, 2.8);

    // Coffee table
    const ct = new T.Group();
    ct.position.set(-7.2, 0, 4.55);
    house.add(ct);
    box(2.35, 0.055, 1.08, M.glassTop, 0, 0.46, 0, ct, { cast: false });
    box(2.2, 0.02, 0.92, M.darkStone, 0, 0.41, 0, ct, { cast: false });
    [-0.95, 0.95].forEach((x) => {
      box(0.05, 0.42, 0.05, M.metal, x, 0.22, -0.38, ct, {});
      box(0.05, 0.42, 0.05, M.metal, x, 0.22, 0.38, ct, {});
    });
    bookStack(-7.75, 0.49, 4.55, house, 1.0);
    vase(-6.55, 0.49, 4.55, 1.1, M.cream, house);
    addCollider(-7.2, 4.55, 2.5, 1.2);

    // Poufs
    [[-4.85, 5.5], [-5.1, 4.35]].forEach((p) => {
      roundedBox(0.62, 0.34, 0.62, 0.16, M.fabricDeep, p[0], 0.2, p[1], house, {});
    });

    // Floor lamp
    const lamp = new T.Group();
    lamp.position.set(-11.15, 0, 7.55);
    house.add(lamp);
    cyl(0.28, 0.32, 0.03, M.darkMetal, 0, 0.02, 0, lamp, 24, { cast: false });
    cyl(0.018, 0.018, 2.1, M.metal, 0, 1.06, 0, lamp, 8, {});
    const ringLamp = torus(0.32, 0.035, M.ledA, 0, 2.08, 0, lamp, 32, 10, { rotation: [Math.PI / 2, 0, 0], cast: false, receive: false });
    ringLamp.renderOrder = 3;
    cylinderBeam(lamp, 0, 2.02, 0, 0.26, 0.08, M.ledA);

    // Media wall
    const media = new T.Group();
    media.position.set(-11.82, 2.02, 4.8);
    house.add(media);
    box(0.055, 1.52, 4.05, M.darkMetal, 0, 0, 0, media, { cast: false });
    plane(3.82, 1.32, M.media, 0.035, 0, 0, media, { rotation: [0, Math.PI / 2, 0], cast: false, receive: false });
    box(0.11, 0.11, 3.5, M.black, 0.09, -0.86, 0, media, { cast: false });
    box(0.1, 0.04, 3.2, M.ledB, 0.1, -0.96, 0, media, { cast: false, receive: false });
    // Media console
    box(0.48, 0.42, 4.0, M.woodDark, -11.62, 0.31, 4.8, house, { cast: true });
    box(0.5, 0.04, 4.05, M.darkStone, -11.61, 0.54, 4.8, house, { cast: false });
    media.userData.feature = "media";
    interactables.push(media);

    // Living plants
    plant(-11.1, 8.35, 1.15, "tall");
    plant(-3.55, 7.65, 0.9, "shrub");
    plant(-10.9, 2.45, 0.9, "shrub");

    // Dining table (hex)
    const dining = new T.Group();
    dining.position.set(4.35, 0, 3.85);
    house.add(dining);
    const top = cyl(1.3, 1.3, 0.075, M.woodDark, 0, 0.77, 0, dining, 6, {});
    top.rotation.y = Math.PI / 6;
    cyl(1.24, 1.24, 0.012, M.metal, 0, 0.812, 0, dining, 6, { cast: false }).rotation.y = Math.PI / 6;
    cyl(0.16, 0.22, 0.72, M.metal, 0, 0.4, 0, dining, 18, {});
    cyl(0.62, 0.68, 0.045, M.darkMetal, 0, 0.035, 0, dining, 24, { cast: false });
    vase(0.2, 0.83, 0.05, 1.3, M.darkStone, dining);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      diningChair(4.35 + Math.cos(a) * 1.94, 3.85 + Math.sin(a) * 1.94, Math.atan2(-Math.cos(a), -Math.sin(a)));
    }
    addCollider(4.35, 3.85, 4.2, 4.2);
    // Dining ring pendant
    const dp = torus(0.62, 0.03, M.ledA, 4.35, 2.35, 3.85, house, 48, 10, { rotation: [Math.PI / 2, 0, 0], cast: false, receive: false });
    dp.renderOrder = 3;
    cyl(0.008, 0.008, 1.0, M.darkMetal, 4.35, 2.9, 3.85, house, 6, { cast: false });
    const dpGlow = new T.PointLight(0xffe4c4, 0.35, 4, 2);
    dpGlow.position.set(4.35, 2.2, 3.85);
    house.add(dpGlow);

    // Kitchen cabinetry along right wall
    box(0.66, 0.86, 4.7, M.woodDark, 11.58, 0.44, 5.9, house, {});
    box(0.74, 0.06, 4.8, M.darkStone, 11.55, 0.9, 5.9, house, { cast: false });
    box(0.36, 0.78, 3.2, M.wall, 11.76, 2.32, 5.75, house, { cast: false });
    box(0.03, 0.03, 3.2, M.ledA, 11.57, 1.9, 5.75, house, { cast: false, receive: false });
    // Tall pantry / fridge
    box(0.7, 2.38, 0.96, M.darkMetal, 11.58, 1.19, 8.45, house, {});
    box(0.02, 1.9, 0.02, M.ledB, 11.22, 1.21, 8.45, house, { cast: false, receive: false });
    cyl(0.025, 0.025, 0.5, M.metal, 11.2, 1.4, 8.15, house, 8, { cast: false });
    // Open shelves + ceramics
    [2.18, 2.58].forEach((y, i) => {
      box(0.3, 0.045, 2.1, M.wood, 11.7, y, 3.9, house, { cast: false });
      for (let j = 0; j < 4; j++) {
        vase(11.65, y + 0.03, 3.2 + j * 0.42, 0.8 + (j % 2) * 0.25, j % 2 ? M.cream : M.darkStone, house);
      }
    });

    // Kitchen island
    const island = new T.Group();
    island.position.set(8.05, 0, 6.2);
    house.add(island);
    roundedBox(3.6, 0.82, 1.08, 0.1, M.darkStone, 0, 0.42, 0, island, {});
    box(3.94, 0.075, 1.34, M.glassTop, 0, 0.86, 0, island, { cast: false });
    box(3.45, 0.035, 0.055, M.ledB, 0, 0.08, 0.56, island, { cast: false, receive: false });
    box(3.45, 0.035, 0.055, M.ledB, 0, 0.08, -0.56, island, { cast: false, receive: false });
    [-1.2, 0, 1.2].forEach((x) => {
      const r = ring(0.155, 0.225, M.induction, x, 0.904, 0, island, 36, { rotation: [-Math.PI / 2, 0, 0], cast: false, receive: false });
      inductionRings.push(r);
      ring(0.04, 0.06, M.induction, x, 0.905, 0, island, 24, { rotation: [-Math.PI / 2, 0, 0], cast: false, receive: false });
    });
    // Sink
    box(0.72, 0.025, 0.42, M.black, 1.45, 0.905, 0, island, { cast: false });
    cyl(0.02, 0.02, 0.38, M.metal, 1.45, 1.05, -0.18, island, 8, {});
    const spout = box(0.24, 0.02, 0.02, M.metal, 1.33, 1.23, -0.18, island, { cast: false });
    spout.rotation.z = 0.1;
    // Stools
    [-1.1, 0, 1.1].forEach((x) => {
      const st = new T.Group();
      st.position.set(x, 0, -0.94);
      island.add(st);
      cyl(0.22, 0.2, 0.06, M.leather, 0, 0.68, 0, st, 20, {});
      cyl(0.03, 0.03, 0.64, M.metal, 0, 0.35, 0, st, 8, {});
      cyl(0.2, 0.24, 0.025, M.darkMetal, 0, 0.03, 0, st, 20, { cast: false });
      box(0.03, 0.02, 0.18, M.metal, 0, 0.2, 0, st, { cast: false });
    });
    // Island pendants
    [-1.2, 0, 1.2].forEach((x) => {
      pendant(8.05 + x, 6.2, 2.42, 0.11, M.ledA);
    });
    island.userData.feature = "island";
    interactables.push(island);
    addCollider(8.05, 6.2, 4.0, 1.5);

    // Kitchen plant + counter accessories
    plant(11.15, 3.0, 0.75, "shrub");
    bookStack(10.7, 0.93, 4.6, house, 0.8);
    vase(10.9, 0.93, 7.2, 0.9, M.cream, house);
  }

  function cylinderBeam(parent, x, y, z, r, h, mat) {
    const beam = new T.Mesh(
      new T.CylinderGeometry(r, r, h, 18, 1, true),
      new T.MeshBasicMaterial({ color: 0x5ee7ff, transparent: true, opacity: 0.055, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })
    );
    beam.position.set(x, y, z);
    parent.add(beam);
    return beam;
  }

  /* ── Foyer ─────────────────────────────────────────────── */
  function buildFoyer() {
    // Hologram projector
    holoGroup = new T.Group();
    holoGroup.position.set(0, 0, 0);
    house.add(holoGroup);

    cyl(0.72, 0.8, 0.16, M.darkMetal, 0, 0.08, 0, holoGroup, 36, {});
    cyl(0.6, 0.62, 0.03, M.metal, 0, 0.17, 0, holoGroup, 36, { cast: false });
    ring(0.43, 0.49, M.ledA, 0, 0.18, 0, holoGroup, 48, { rotation: [-Math.PI / 2, 0, 0], cast: false, receive: false });
    cylinderBeam(holoGroup, 0, 0.8, 0, 0.42, 1.2, M.ledA);

    const core = addMesh(new T.IcosahedronGeometry(0.42, 1), M.holoCore, 0, 1.42, 0, holoGroup, { cast: false, receive: false });
    const wire = addMesh(new T.IcosahedronGeometry(0.56, 1), M.holoWire, 0, 1.42, 0, holoGroup, { cast: false, receive: false });
    const shell = addMesh(new T.IcosahedronGeometry(0.7, 1), new T.MeshBasicMaterial({ color: 0x5ee7ff, wireframe: true, transparent: true, opacity: 0.16 }), 0, 1.42, 0, holoGroup, { cast: false, receive: false });
    const r1 = torus(0.78, 0.008, M.holoRing, 0, 1.42, 0, holoGroup, 64, 8, { rotation: [Math.PI / 2, 0, 0], cast: false, receive: false });
    const r2 = torus(0.62, 0.006, M.holoRing, 0, 1.42, 0, holoGroup, 64, 8, { rotation: [Math.PI / 2.4, 0.6, 0], cast: false, receive: false });
    const r3 = torus(0.9, 0.005, M.holoRing, 0, 1.42, 0, holoGroup, 64, 8, { rotation: [Math.PI / 1.7, -0.5, 0], cast: false, receive: false });

    // Particle field
    const count = IS_MOBILE ? 45 : 80;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const b = Math.acos(rand(-1, 1));
      const r = rand(0.6, 1.05);
      positions[i * 3] = Math.sin(b) * Math.cos(a) * r;
      positions[i * 3 + 1] = 1.42 + Math.cos(b) * r * 0.8;
      positions[i * 3 + 2] = Math.sin(b) * Math.sin(a) * r;
    }
    const pGeo = new T.BufferGeometry();
    pGeo.setAttribute("position", new T.BufferAttribute(positions, 3));
    const pMat = new T.PointsMaterial({ color: 0x5ee7ff, size: 0.028, transparent: true, opacity: 0.8, blending: T.AdditiveBlending, depthWrite: false });
    const particles = new T.Points(pGeo, pMat);
    holoGroup.add(particles);

    holoGroup.userData.feature = "hologram";
    interactables.push(holoGroup);
    addCollider(0, 0, 1.5, 1.5);
    animatedRings.push({ type: "holo", core: core, wire: wire, shell: shell, rings: [r1, r2, r3], particles: particles });

    // Ceiling halo
    const halo = torus(0.98, 0.025, M.ledA, 0, 3.12, 0, house, 56, 9, { rotation: [Math.PI / 2, 0, 0], cast: false, receive: false });
    halo.renderOrder = 3;
    cyl(0.01, 0.01, 0.24, M.darkMetal, 0, 3.25, 0, house, 6, { cast: false });

    // Hydroponic moss feature wall
    const hw = new T.Group();
    hw.position.set(2.96, 0, -1.2);
    house.add(hw);
    box(0.18, 3.18, 2.8, M.wall, 0, 1.59, 0, hw, { cast: true });
    box(0.15, 3.0, 2.6, M.darkMetal, 0.02, 1.58, 0, hw, { cast: false });
    const mossMats = [M.moss, M.mossLight, M.plant, M.moss];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const z = -1.04 + col * 0.52;
        const y = 0.73 + row * 0.45;
        const cell = box(0.09, 0.4, 0.44, mossMats[(row + col) % mossMats.length], -0.06, y, z, hw, { cast: false });
        cell.rotation.x = rand(-0.03, 0.03);
        for (let k = 0; k < 2; k++) {
          const tuft = sphere(rand(0.035, 0.07), k % 2 ? M.plantLight : M.mossLight, -0.12, y + rand(-0.12, 0.12), z + rand(-0.14, 0.14), hw, 7, 5, { cast: false });
          tuft.scale.set(1.2, 0.8, 1.2);
        }
      }
    }
    for (let col = 0; col < 5; col++) {
      box(0.035, 2.1, 0.035, M.grow, -0.14, 1.78, -1.04 + col * 0.52, hw, { cast: false, receive: false });
    }
    box(0.04, 0.04, 2.55, M.grow, -0.14, 2.86, 0, hw, { cast: false, receive: false });
    hw.userData.feature = "hydrowall";
    interactables.push(hw);
    addCollider(2.96, -1.2, 0.5, 3.0);

    // Foyer console / bench
    roundedBox(1.7, 0.42, 0.46, 0.08, M.woodDark, -2.55, 0.44, 1.4, house, {});
    box(0.06, 0.4, 0.06, M.metal, -3.25, 0.22, 1.2, house, {});
    box(0.06, 0.4, 0.06, M.metal, -3.25, 0.22, 1.6, house, {});
    box(0.06, 0.4, 0.06, M.metal, -1.85, 0.22, 1.2, house, {});
    box(0.06, 0.4, 0.06, M.metal, -1.85, 0.22, 1.6, house, {});
    vase(-2.95, 0.66, 1.35, 1.25, M.cream, house);
    bookStack(-2.2, 0.66, 1.42, house, 0.9);
    addCollider(-2.55, 1.4, 1.8, 0.6);

    // Sculptural plant in the corner
    plant(-2.65, -2.0, 1.0, "tall");
  }

  /* ── Master Suite ──────────────────────────────────────── */
  function buildMasterSuite() {
    rug(5.2, 4.4, -6.6, -6.1, M.rugMain);

    // Upholstered feature wall behind the floating bed
    box(4.7, 2.8, 0.05, M.fabricDeep, -6.3, 1.42, -8.885, house, { cast: false });
    box(0.035, 2.35, 0.055, M.ledB, -8.55, 1.42, -8.84, house, { cast: false, receive: false });
    box(0.035, 2.35, 0.055, M.ledB, -4.05, 1.42, -8.84, house, { cast: false, receive: false });
    box(4.0, 0.035, 0.05, M.ledA, -6.3, 2.83, -8.84, house, { cast: false, receive: false });

    const bed = new T.Group();
    bed.position.set(-6.3, 0, -6.95);
    house.add(bed);
    const platform = roundedBox(3.3, 0.24, 2.62, 0.1, M.woodDark, 0, 0.32, 0, bed, {});
    box(3.05, 0.035, 2.35, M.bedGlow, 0, 0.18, 0, bed, { cast: false, receive: false });
    box(3.38, 0.018, 2.68, M.bedGlow, 0, 0.13, 0, bed, { cast: false, receive: false });
    roundedBox(3.02, 0.36, 2.28, 0.14, M.cream, 0, 0.62, 0, bed, {});
    roundedBox(2.92, 0.17, 1.55, 0.1, M.fabricLight, 0, 0.84, 0.42, bed, {});
    roundedBox(2.9, 0.055, 0.56, 0.02, M.fabricDeep, 0, 0.94, 0.94, bed, {});
    roundedBox(1.2, 0.14, 0.45, 0.06, M.cream, -0.6, 0.86, -0.78, bed, {});
    roundedBox(1.2, 0.14, 0.45, 0.06, M.cream, 0.6, 0.86, -0.78, bed, {});
    const pillowA = roundedBox(0.56, 0.34, 0.16, 0.06, M.fabricDeep, -0.44, 0.94, -0.98, bed, {});
    pillowA.rotation.z = 0.06;
    const pillowB = roundedBox(0.56, 0.34, 0.16, 0.06, M.cream, 0.44, 0.94, -0.98, bed, {});
    pillowB.rotation.z = -0.05;
    const head = roundedBox(3.45, 1.3, 0.18, 0.08, M.fabricDeep, 0, 0.98, -1.3, bed, {});
    head.rotation.x = 0.035;
    box(2.7, 0.025, 0.05, M.ledB, 0, 1.5, -1.39, bed, { cast: false, receive: false });
    bed.userData.feature = "bed";
    interactables.push(bed);
    addCollider(-6.3, -6.95, 3.5, 2.9);

    // Nightstands
    [-1.95, 1.95].forEach((x) => {
      box(0.52, 0.4, 0.48, M.woodDark, x, 0.36, -1.1, bed, {});
      ring(0.09, 0.12, M.ledB, x, 0.575, -1.1, bed, 24, { rotation: [-Math.PI / 2, 0, 0], cast: false, receive: false });
      vase(x + 0.1, 0.58, -1.1, 0.6, M.cream, bed);
    });

    // Art above bed
    addArt(2.7, 1.1, M.art0, -6.3, 2.5, -8.82, 0);

    // Wardrobe / slatted joinery
    box(0.56, 2.65, 2.2, M.woodDark, -11.62, 1.33, -4.55, house, {});
    for (let z = -5.55; z <= -3.55; z += 0.14) {
      box(0.04, 2.45, 0.055, M.wood, -11.31, 1.35, z, house, { cast: false });
    }
    box(0.03, 0.03, 2.0, M.ledA, -11.3, 2.55, -4.55, house, { cast: false, receive: false });
    addCollider(-11.62, -4.55, 0.8, 2.4);

    // Vanity + halo mirror
    const vanity = new T.Group();
    vanity.position.set(-10.55, 0, -8.58);
    house.add(vanity);
    box(1.75, 0.72, 0.5, M.woodDark, 0, 0.48, 0, vanity, {});
    box(1.85, 0.06, 0.58, M.darkStone, 0, 0.88, 0, vanity, { cast: false });
    cyl(0.24, 0.2, 0.11, M.marble, 0, 0.96, 0.05, vanity, 24, { cast: false });
    cyl(0.018, 0.018, 0.32, M.metal, 0.42, 1.08, -0.1, vanity, 8, {});
    box(0.2, 0.018, 0.018, M.metal, 0.33, 1.23, -0.1, vanity, { cast: false });
    plane(1.08, 1.36, M.mirror, 0, 1.98, -0.28, vanity, { cast: false, receive: false });
    const halo = torus(0.55, 0.028, M.ledB, 0, 1.98, -0.255, vanity, 56, 9, { cast: false, receive: false });
    halo.renderOrder = 3;
    vanity.userData.feature = "vanity";
    interactables.push(vanity);

    // Freestanding bath
    const bath = roundedBox(1.5, 0.55, 0.98, 0.2, M.cream, -10.45, 0.28, -7.25, house, {});
    plane(1.25, 0.78, M.water, -10.45, 0.55, -7.25, house, { rotation: [-Math.PI / 2, 0, 0], cast: false, receive: false });
    addCollider(-10.45, -7.25, 1.7, 1.15);
    box(0.03, 0.03, 1.1, M.metal, -11.75, 1.25, -7.2, house, { cast: false });

    // Pendants + plants
    pendant(-7.35, -5.35, 2.42, 0.1, M.pendantWarm);
    pendant(-5.25, -5.35, 2.42, 0.1, M.pendantWarm);
    plant(-11.1, -3.15, 1.0, "tall");
    plant(-3.45, -4.1, 1.05, "tall");
    bookStack(-10.35, 0.92, -8.58, house, 0.7);
  }

  /* ── AR Studio ─────────────────────────────────────────── */
  function buildARStudio() {
    rug(3.6, 2.8, 0, -5.75, M.rugMain);
    monitorDesk();
    officeChair();

    // Acoustic hex field
    const hexGeo = new T.CylinderGeometry(0.21, 0.21, 0.055, 6);
    const hexMats = [M.acoustic1, M.acoustic2, M.acoustic3];
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 8; col++) {
        const x = -2.35 + col * 0.55 + (row % 2) * 0.275;
        const y = 1.02 + row * 0.34;
        if (Math.abs(x) < 1.8 && y > 1.1 && y < 2.1) continue;
        const h = new T.Mesh(hexGeo, hexMats[(row + col) % hexMats.length]);
        h.position.set(x, y, -8.86);
        h.rotation.x = Math.PI / 2;
        h.rotation.z = Math.PI / 6;
        h.castShadow = false;
        h.receiveShadow = true;
        house.add(h);
      }
    }

    // Tech rack
    const rack = techRack(2.45, -8.4);
    rack.userData.feature = "desk";
    // (rack is separate visual; desk feature already covers workstation)

    // Floating shelf + books
    box(0.26, 0.055, 2.0, M.wood, -2.82, 2.1, -5.6, house, { cast: false });
    for (let i = 0; i < 8; i++) {
      box(0.035, rand(0.2, 0.34), 0.18, i % 3 === 0 ? M.fabricDeep : i % 3 === 1 ? M.cream : M.leather, -2.78, 2.24, -6.35 + i * 0.18, house, { cast: false });
    }
    plant(-2.55, -3.45, 0.9, "tall");
    plant(2.55, -3.4, 0.8, "shrub");
    box(3.2, 0.03, 0.05, M.ledB, 0, 3.06, -8.35, house, { cast: false, receive: false });
  }

  /* ── Eco Bedroom ───────────────────────────────────────── */
  function buildEcoBedroom() {
    // Timber slat feature wall
    for (let x = 3.2; x <= 7.3; x += 0.19) {
      box(0.075, 2.95, 0.085, M.wood, x, 1.48, -8.87, house, { cast: false });
    }
    box(4.2, 0.05, 0.12, M.ledA, 5.25, 2.97, -8.9, house, { cast: false, receive: false });

    rug(3.6, 2.6, 5.25, -5.75, M.rugWarm);

    const bed = new T.Group();
    bed.position.set(5.25, 0, -6.75);
    house.add(bed);
    roundedBox(2.35, 0.22, 2.2, 0.1, M.wood, 0, 0.28, 0, bed, {});
    roundedBox(2.18, 0.32, 2.02, 0.14, M.cream, 0, 0.55, 0, bed, {});
    roundedBox(2.08, 0.16, 1.3, 0.1, M.duvetWarm, 0, 0.76, 0.4, bed, {});
    roundedBox(0.85, 0.14, 0.4, 0.06, M.cream, -0.45, 0.77, -0.68, bed, {});
    roundedBox(0.85, 0.14, 0.4, 0.06, M.cream, 0.45, 0.77, -0.68, bed, {});
    const head = roundedBox(2.5, 0.95, 0.16, 0.1, M.woodDark, 0, 0.82, -1.12, bed, {});
    head.rotation.x = 0.04;
    addCollider(5.25, -6.75, 2.6, 2.5);

    // Terrarium units
    const terr = new T.Group();
    terr.position.set(0, 0, 0);
    house.add(terr);
    [-1.65, 1.65].forEach((off, idx) => {
      const x = 5.25 + off;
      cyl(0.32, 0.36, 0.72, M.woodDark, x, 0.36, -8.15, terr, 20, {});
      box(0.8, 1.0, 0.58, M.terrariumGlass, x, 1.2, -8.15, terr, { cast: false, receive: false });
      box(0.84, 0.06, 0.62, M.darkMetal, x, 0.72, -8.15, terr, { cast: false });
      box(0.84, 0.05, 0.62, M.darkMetal, x, 1.71, -8.15, terr, { cast: false });
      box(0.7, 0.02, 0.02, M.grow, x, 1.66, -7.88, terr, { cast: false, receive: false });
      // miniature understory
      for (let i = 0; i < 7; i++) {
        const s = sphere(rand(0.06, 0.12), i % 2 ? M.plant : M.plantLight, x + rand(-0.25, 0.25), 0.84 + rand(0, 0.3), -8.15 + rand(-0.16, 0.16), terr, 7, 5, { cast: false });
        s.scale.set(1, rand(0.8, 1.8), 1);
      }
      box(0.02, 0.55, 0.02, M.woodDark, x + 0.25, 1.2, -7.95, terr, { cast: false });
      if (idx === 1) {
        const lid = box(0.86, 0.02, 0.64, M.terrariumGlass, x, 1.74, -8.15, terr, { cast: false, receive: false });
        lid.renderOrder = 4;
      }
    });
    terr.userData.feature = "terrarium";
    interactables.push(terr);
    addCollider(3.7, -8.15, 1.1, 0.9);
    addCollider(6.9, -8.15, 1.1, 0.9);

    // Pendants
    [4.5, 5.25, 6.0].forEach((x) => pendant(x, -5.55, 2.36, 0.1, M.pendantWarm));

    // Bench at foot of bed
    roundedBox(2.0, 0.34, 0.52, 0.08, M.wood, 5.25, 0.34, -4.95, house, {});
    box(0.05, 0.34, 0.05, M.metal, 4.5, 0.18, -4.95, house, {});
    box(0.05, 0.34, 0.05, M.metal, 6.0, 0.18, -4.95, house, {});
    bookStack(5.6, 0.53, -4.95, house, 0.8);

    plant(3.45, -3.25, 1.0, "tall");
    plant(7.0, -3.3, 0.8, "shrub");
  }

  /* ── Guest Suite ───────────────────────────────────────── */
  function buildGuestSuite() {
    rug(3.4, 2.5, 9.9, -5.75, M.rugWarm);

    const pod = new T.Group();
    pod.position.set(10.0, 0, -6.85);
    house.add(pod);
    roundedBox(2.55, 0.24, 2.35, 0.12, M.woodDark, 0, 0.28, 0, pod, {});
    roundedBox(2.3, 0.32, 2.05, 0.14, M.cream, 0, 0.54, 0, pod, {});
    box(2.2, 0.03, 1.95, M.ledB, 0, 0.17, 0, pod, { cast: false, receive: false });
    roundedBox(0.22, 0.62, 2.25, 0.08, M.cream, -1.21, 0.5, 0, pod, {});
    roundedBox(0.22, 0.62, 2.25, 0.08, M.cream, 1.21, 0.5, 0, pod, {});
    roundedBox(2.6, 1.3, 0.18, 0.08, M.cream, 0, 0.8, -1.2, pod, {});
    roundedBox(0.95, 0.14, 0.42, 0.06, M.fabricLight, -0.5, 0.77, -0.72, pod, {});
    roundedBox(0.95, 0.14, 0.42, 0.06, M.fabricLight, 0.5, 0.77, -0.72, pod, {});
    roundedBox(2.15, 0.15, 1.2, 0.08, M.fabricLight, 0, 0.73, 0.35, pod, {});
    // interior halo
    box(2.0, 0.02, 0.03, M.ledA, 0, 1.4, -1.1, pod, { cast: false, receive: false });
    pod.userData.feature = "pod";
    interactables.push(pod);
    addCollider(10.0, -6.85, 2.8, 2.7);

    // Wall cinema
    const screen = new T.Group();
    screen.position.set(11.82, 1.95, -6.55);
    screen.rotation.y = -Math.PI / 2;
    house.add(screen);
    box(2.35, 1.32, 0.06, M.darkMetal, 0, 0, 0, screen, { cast: false });
    plane(2.2, 1.16, M.guestScreen, 0, 0, 0.037, screen, { cast: false, receive: false });
    screen.userData.feature = "pod";
    interactables.push(screen);

    // Side table
    cyl(0.3, 0.26, 0.44, M.woodDark, 8.55, 0.22, -8.35, house, 20, {});
    cyl(0.34, 0.34, 0.035, M.darkStone, 8.55, 0.46, -8.35, house, 20, { cast: false });
    vase(8.55, 0.48, -8.35, 0.8, M.cream, house);

    // Bench
    roundedBox(1.6, 0.3, 0.48, 0.08, M.fabricDeep, 10.0, 0.3, -4.75, house, {});
    box(0.05, 0.3, 0.05, M.metal, 9.4, 0.15, -4.75, house, {});
    box(0.05, 0.3, 0.05, M.metal, 10.6, 0.15, -4.75, house, {});

    plant(8.25, -3.35, 0.8, "shrub");
    plant(11.15, -3.15, 1.0, "tall");
  }

  /* ── Ambient details ───────────────────────────────────── */
  function buildAmbientDetails() {
    // Floating shelf near the foyer
    box(1.6, 0.05, 0.32, M.wood, -2.55, 2.2, 1.9, house, { cast: false });
    for (let i = 0; i < 4; i++) {
      vase(-3.2 + i * 0.42, 2.23, 1.9, 0.7 + (i % 2) * 0.2, i % 2 ? M.darkStone : M.cream, house);
    }

    // Kitchen / dining art
    addArt(2.4, 1.1, M.art1, 11.87, 2.35, 2.55, -Math.PI / 2);

    // Guest art accent
    addArt(1.4, 0.9, M.art2, 7.62, 2.3, -4.2, Math.PI / 2);

    // Small sculptures
    const sculpture = new T.Group();
    sculpture.position.set(6.6, 0, 2.5);
    house.add(sculpture);
    cyl(0.23, 0.28, 0.6, M.darkStone, 0, 0.3, 0, sculpture, 24, {});
    const tor = torus(0.28, 0.055, M.brass, 0, 0.7, 0, sculpture, 32, 10, { rotation: [Math.PI / 2, 0, 0], cast: false });
    tor.rotation.z = 0.5;
    addCollider(6.6, 2.5, 0.7, 0.7);

    // Ponytail palm near glass
    plant(11.15, 8.45, 1.2, "tall");
    plant(-3.5, 2.6, 1.05, "tall");

    // Soft floor glow umbrellas under key furniture
    const glowMat = new T.MeshBasicMaterial({ map: M.glowTex, color: 0x5ee7ff, transparent: true, opacity: 0.11, blending: T.AdditiveBlending, depthWrite: false });
    const glow1 = new T.Mesh(new T.PlaneGeometry(6.2, 4.2), glowMat);
    glow1.rotation.x = -Math.PI / 2;
    glow1.position.set(-7.2, 0.04, 5.2);
    house.add(glow1);
    const glow2 = new T.Mesh(new T.PlaneGeometry(5.2, 3.5), glowMat);
    glow2.rotation.x = -Math.PI / 2;
    glow2.position.set(0, 0.04, 0);
    house.add(glow2);
  }

  /* ============================================================
     ENVIRONMENT STATE & TRANSITIONS
     ============================================================ */
  function createEnv(p) {
    return {
      skyTop: new T.Color(p.skyTop),
      skyBottom: new T.Color(p.skyBottom),
      fog: new T.Color(p.fog),
      sun: new T.Color(p.sun),
      hemiSky: new T.Color(p.hemiSky),
      hemiGround: new T.Color(p.hemiGround),
      led: new T.Color(p.led),
      led2: new T.Color(p.led2),
      sunPos: new T.Vector3(p.sunPos[0], p.sunPos[1], p.sunPos[2]),
      sunIntensity: p.sunIntensity,
      hemiIntensity: p.hemiIntensity,
      ledIntensity: p.ledIntensity,
      led2Intensity: p.led2Intensity,
      stars: p.stars,
      city: p.city,
      sunSprite: p.sunSprite,
      exposure: p.exposure,
      lightColors: p.lightColors.map((c) => new T.Color(c)),
      lightIntensities: p.lightIntensities.slice()
    };
  }

  function copyEnv(dst, src) {
    dst.skyTop.copy(src.skyTop);
    dst.skyBottom.copy(src.skyBottom);
    dst.fog.copy(src.fog);
    dst.sun.copy(src.sun);
    dst.hemiSky.copy(src.hemiSky);
    dst.hemiGround.copy(src.hemiGround);
    dst.led.copy(src.led);
    dst.led2.copy(src.led2);
    dst.sunPos.copy(src.sunPos);
    dst.sunIntensity = src.sunIntensity;
    dst.hemiIntensity = src.hemiIntensity;
    dst.ledIntensity = src.ledIntensity;
    dst.led2Intensity = src.led2Intensity;
    dst.stars = src.stars;
    dst.city = src.city;
    dst.sunSprite = src.sunSprite;
    dst.exposure = src.exposure;
    dst.lightColors.forEach((c, i) => c.copy(src.lightColors[i]));
    dst.lightIntensities = src.lightIntensities.slice();
  }

  function initEnvironmentState() {
    const preset = LIGHT_PRESETS[state.lighting] || LIGHT_PRESETS.daylight;
    envTarget = createEnv(preset);
    envCurrent = createEnv(preset);
    glassTarget = {
      color: new T.Color(GLASS_PRESETS[state.glass].color),
      opacity: GLASS_PRESETS[state.glass].opacity,
      roughness: GLASS_PRESETS[state.glass].roughness,
      metalness: GLASS_PRESETS[state.glass].metalness
    };
    applyCurrentEnvironment();
    applyCurrentGlass();
  }

  function applyCurrentEnvironment() {
    if (!skyMat || !envCurrent) return;
    skyMat.uniforms.topColor.value.copy(envCurrent.skyTop);
    skyMat.uniforms.bottomColor.value.copy(envCurrent.skyBottom);
    scene.fog.color.copy(envCurrent.fog);

    sunLight.color.copy(envCurrent.sun);
    sunLight.intensity = envCurrent.sunIntensity;
    sunLight.position.copy(envCurrent.sunPos);

    hemiLight.color.copy(envCurrent.hemiSky);
    hemiLight.groundColor.copy(envCurrent.hemiGround);
    hemiLight.intensity = envCurrent.hemiIntensity;

    ledA.emissive.copy(envCurrent.led);
    ledA.emissiveIntensity = envCurrent.ledIntensity;
    ledB.emissive.copy(envCurrent.led2);
    ledB.emissiveIntensity = envCurrent.led2Intensity;

    roomLights.forEach((light, i) => {
      if (envCurrent.lightColors[i]) light.color.copy(envCurrent.lightColors[i]);
      if (envCurrent.lightIntensities[i] !== undefined) light.intensity = envCurrent.lightIntensities[i];
    });

    starsMat.opacity = envCurrent.stars;
    sunSprite.material.color.copy(envCurrent.sun);
    sunSprite.material.opacity = envCurrent.sunSprite;
    cityMats.forEach((m) => { m.emissiveIntensity = envCurrent.city; });
    renderer.toneMappingExposure = envCurrent.exposure;
  }

  function applyCurrentGlass() {
    if (!glassMaterial || !glassTarget) return;
    glassMaterial.color.copy(glassTarget.color);
    glassMaterial.opacity = glassTarget.opacity;
    glassMaterial.roughness = glassTarget.roughness;
    glassMaterial.metalness = glassTarget.metalness;
  }

  function applyLightPreset(name, immediate) {
    const p = LIGHT_PRESETS[name];
    if (!p || !envTarget) return;
    envTarget.skyTop.setHex(p.skyTop);
    envTarget.skyBottom.setHex(p.skyBottom);
    envTarget.fog.setHex(p.fog);
    envTarget.sun.setHex(p.sun);
    envTarget.hemiSky.setHex(p.hemiSky);
    envTarget.hemiGround.setHex(p.hemiGround);
    envTarget.led.setHex(p.led);
    envTarget.led2.setHex(p.led2);
    envTarget.sunPos.set(p.sunPos[0], p.sunPos[1], p.sunPos[2]);
    envTarget.sunIntensity = p.sunIntensity;
    envTarget.hemiIntensity = p.hemiIntensity;
    envTarget.ledIntensity = p.ledIntensity;
    envTarget.led2Intensity = p.led2Intensity;
    envTarget.stars = p.stars;
    envTarget.city = p.city;
    envTarget.sunSprite = p.sunSprite;
    envTarget.exposure = p.exposure;
    p.lightColors.forEach((c, i) => envTarget.lightColors[i].setHex(c));
    envTarget.lightIntensities = p.lightIntensities.slice();
    if (immediate) {
      copyEnv(envCurrent, envTarget);
      applyCurrentEnvironment();
    }
  }

  function applyGlassPreset(name, immediate) {
    const p = GLASS_PRESETS[name];
    if (!p || !glassTarget) return;
    glassTarget.color.setHex(p.color);
    glassTarget.opacity = p.opacity;
    glassTarget.roughness = p.roughness;
    glassTarget.metalness = p.metalness;
    if (immediate) {
      applyCurrentGlass();
    }
  }

  function tickEnvironment(dt) {
    if (!envTarget || !envCurrent) return;
    const k = 1 - Math.exp(-dt * 3.9);
    envCurrent.skyTop.lerp(envTarget.skyTop, k);
    envCurrent.skyBottom.lerp(envTarget.skyBottom, k);
    envCurrent.fog.lerp(envTarget.fog, k);
    envCurrent.sun.lerp(envTarget.sun, k);
    envCurrent.hemiSky.lerp(envTarget.hemiSky, k);
    envCurrent.hemiGround.lerp(envTarget.hemiGround, k);
    envCurrent.led.lerp(envTarget.led, k);
    envCurrent.led2.lerp(envTarget.led2, k);
    envCurrent.sunPos.lerp(envTarget.sunPos, k);
    envCurrent.sunIntensity = lerp(envCurrent.sunIntensity, envTarget.sunIntensity, k);
    envCurrent.hemiIntensity = lerp(envCurrent.hemiIntensity, envTarget.hemiIntensity, k);
    envCurrent.ledIntensity = lerp(envCurrent.ledIntensity, envTarget.ledIntensity, k);
    envCurrent.led2Intensity = lerp(envCurrent.led2Intensity, envTarget.led2Intensity, k);
    envCurrent.stars = lerp(envCurrent.stars, envTarget.stars, k);
    envCurrent.city = lerp(envCurrent.city, envTarget.city, k);
    envCurrent.sunSprite = lerp(envCurrent.sunSprite, envTarget.sunSprite, k);
    envCurrent.exposure = lerp(envCurrent.exposure, envTarget.exposure, k);
    envCurrent.lightColors.forEach((c, i) => c.lerp(envTarget.lightColors[i], k));
    envCurrent.lightIntensities.forEach((v, i) => {
      envCurrent.lightIntensities[i] = lerp(v, envTarget.lightIntensities[i], k);
    });
    applyCurrentEnvironment();

    const kg = 1 - Math.exp(-dt * 5.5);
    glassMaterial.color.lerp(glassTarget.color, kg);
    glassMaterial.opacity = lerp(glassMaterial.opacity, glassTarget.opacity, kg);
    glassMaterial.roughness = lerp(glassMaterial.roughness, glassTarget.roughness, kg);
    glassMaterial.metalness = lerp(glassMaterial.metalness, glassTarget.metalness, kg);
  }

  /* ============================================================
     UI CONSTRUCTION
     ============================================================ */
  const MAP_ROOMS = [
    { id: "master", x: 0, y: 0, w: 90, h: 65, labels: [["MASTER", 45, 34]] },
    { id: "studio", x: 90, y: 0, w: 60, h: 65, labels: [["AR STUDIO", 120, 34]] },
    { id: "eco", x: 150, y: 0, w: 45, h: 65, labels: [["ECO", 172.5, 34]] },
    { id: "guest", x: 195, y: 0, w: 45, h: 65, labels: [["GUEST", 217.5, 34]] },
    { id: "foyer", x: 90, y: 65, w: 60, h: 50, labels: [["FOYER", 120, 94]] },
    { id: "living", x: 0, y: 115, w: 240, h: 65, labels: [["LIVING", 60, 152], ["KITCHEN", 182, 152]] },
    { id: "balcony", x: 40, y: 180, w: 160, h: 35, labels: [["SKY BALCONY", 120, 201]] }
  ];

  function buildUI() {
    els.roomList.innerHTML = ROOM_DEFS.map((r) =>
      '<button type="button" class="room-btn" data-room="' + r.id + '" aria-label="Teleport to ' + r.name + '">' +
        '<span class="room-index">' + r.index + '</span>' +
        '<span class="room-copy"><span class="room-name">' + r.name + '</span><span class="room-meta">' + r.meta + '</span></span>' +
        '<span class="room-icon" aria-hidden="true">' + r.icon + '</span>' +
      '</button>'
    ).join("");

    let svg = '<svg viewBox="0 0 240 215" role="img" aria-label="Interactive floor plan. Select a room to teleport.">';
    svg += '<defs><linearGradient id="mapFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(94,231,255,0.12)"/><stop offset="1" stop-color="rgba(94,231,255,0.02)"/></linearGradient></defs>';
    svg += '<rect class="map-glass" x="40" y="179" width="160" height="1.5" rx="1"/>';
    MAP_ROOMS.forEach((r) => {
      svg += '<g class="map-room" data-room="' + r.id + '" role="button" tabindex="0" aria-label="' + r.id + '">';
      svg += '<rect x="' + (r.x + 1.5) + '" y="' + (r.y + 1.5) + '" width="' + (r.w - 3) + '" height="' + (r.h - 3) + '" rx="2"/>';
      r.labels.forEach((l) => {
        svg += '<text x="' + l[1] + '" y="' + l[2] + '">' + l[0] + '</text>';
      });
      svg += '</g>';
    });
    svg += '<text class="map-north" x="7" y="11">N ↑</text>';
    svg += '<line id="map-heading" class="map-heading" x1="0" y1="0" x2="0" y2="0"/>';
    svg += '<circle id="map-dot" class="map-dot" cx="120" cy="108" r="3.4"/>';
    svg += '</svg>';
    els.minimap.innerHTML = svg;
    els.mapDot = document.getElementById("map-dot");
    els.mapHeading = document.getElementById("map-heading");

    updateModeUI();
    updateGlassUI();
    updateLightUI();
    updateTourUI();
  }

  function updateModeUI() {
    document.body.classList.toggle("mode-walk", state.mode === "walk");
    document.querySelectorAll(".segmented button").forEach((b) => {
      const on = b.dataset.mode === state.mode;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function updateGlassUI() {
    const p = GLASS_PRESETS[state.glass];
    document.body.dataset.glass = state.glass;
    els.glassState.textContent = p.short;
    els.glassLabel.textContent = p.label;
    els.glassBtn.classList.toggle("active", state.glass !== "clear");
  }

  function updateLightUI() {
    const p = LIGHT_PRESETS[state.lighting];
    document.body.dataset.light = state.lighting;
    els.lightState.textContent = p.short;
    els.lightLabel.textContent = p.label;
    els.lightBtn.classList.toggle("active", state.lighting !== "daylight");
  }

  function updateTourUI() {
    els.tourBtn.classList.toggle("active", state.autoTour);
    els.tourLabel.textContent = state.autoTour ? "Touring" : "Idle";
    els.tourBtn.querySelector(".dock-icon").textContent = state.autoTour ? "❚❚" : "▶";
  }

  let bannerTimer = null;
  function setActiveRoom(id, showBanner) {
    state.room = id;
    document.querySelectorAll(".room-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.room === id);
    });
    document.querySelectorAll(".map-room").forEach((g) => {
      g.classList.toggle("active", g.dataset.room === id);
    });

    const room = ROOM_DEFS.find((r) => r.id === id);
    els.mapRoomName.textContent = room ? room.name.toUpperCase() : "OVERVIEW";

    if (!room) {
      els.banner.classList.remove("show");
      return;
    }
    els.bannerIndex.textContent = room.index;
    els.bannerName.textContent = room.name;
    els.bannerMeta.textContent = room.area.toUpperCase() + " · " + room.meta.split(" · ").pop();
    if (showBanner !== false) {
      els.banner.classList.add("show");
      clearTimeout(bannerTimer);
      bannerTimer = setTimeout(() => els.banner.classList.remove("show"), 4200);
    }
  }

  /* ============================================================
     CAMERA / NAVIGATION
     ============================================================ */
  function validVec(v) {
    return Array.isArray(v) && v.length === 3 && v.every((n) => Number.isFinite(Number(n)));
  }

  function getRoomView(id) {
    if (id === "overview") return { pos: OVERVIEW.camera, target: OVERVIEW.target };
    const pin = state.roomPresets[id];
    if (pin && validVec(pin.camera) && validVec(pin.target)) {
      return { pos: pin.camera, target: pin.target };
    }
    const def = ROOM_DEFS.find((r) => r.id === id) || ROOM_DEFS[0];
    return { pos: def.camera, target: def.target };
  }

  function setModeVisuals(mode) {
    state.mode = mode;
    updateModeUI();
    if (controls) controls.enabled = mode === "orbit";
  }

  function setMode(mode, opts) {
    opts = opts || {};
    if (mode === state.mode && !opts.force) {
      updateModeUI();
      return;
    }
    if (mode === "walk") {
      camTween = null;
      stopAutoTour(true);
      setModeVisuals("walk");
      if (!opts.keepCamera) enterWalkView();
      if (!opts.silent) toast("Walk mode · WASD to move, drag to look around");
    } else {
      stopAutoTour(true);
      setModeVisuals("orbit");
      if (!opts.keepCamera) exitWalkView();
      if (!opts.silent) toast("Orbit mode · drag to pan, scroll to zoom");
    }
    if (!opts.skipSave) saveLocal();
  }

  function insideWalkBounds(x, z) {
    if (z > 9.02) return x > -7.65 && x < 7.65 && z < 12.1;
    return x > -11.55 && x < 11.55 && z > -8.55 && z < 9.1;
  }

  function enterWalkView() {
    let x = camera.position.x;
    let z = camera.position.z;
    if (!insideWalkBounds(x, z)) {
      x = 0;
      z = 4.6;
      yaw = 0;
      pitch = 0;
    } else {
      const dir = camera.getWorldDirection(new T.Vector3());
      yaw = Math.atan2(-dir.x, -dir.z);
      pitch = clamp(Math.asin(clamp(dir.y, -1, 1)), -1.25, 1.25);
    }
    camera.position.set(x, 1.62, z);
    camera.rotation.set(pitch, yaw, 0, "YXZ");
    controls.enabled = false;
  }

  function exitWalkView() {
    const dir = camera.getWorldDirection(new T.Vector3());
    const target = camera.position.clone().add(dir.multiplyScalar(4.6));
    target.y = clamp(target.y, 0.7, 2.6);
    controls.target.copy(target);
    controls.enabled = true;
    controls.update();
  }

  function applyWalkRotation() {
    camera.rotation.set(pitch, yaw, 0, "YXZ");
  }

  function flyTo(position, target, duration, roomId) {
    const toPos = position.isVector3 ? position.clone() : new T.Vector3(position[0], position[1], position[2]);
    const toTarget = target.isVector3 ? target.clone() : new T.Vector3(target[0], target[1], target[2]);
    if (state.mode !== "orbit") setModeVisuals("orbit");
    controls.enabled = false;
    camTween = {
      fromPos: camera.position.clone(),
      toPos: toPos,
      fromTarget: controls.target.clone(),
      toTarget: toTarget,
      start: performance.now(),
      duration: REDUCED_MOTION ? 0.02 : (duration || 1.35)
    };
    if (roomId) setActiveRoom(roomId, true);
    hideInspectHint();
  }

  function flyToRoom(id, fromTour) {
    if (!fromTour) stopAutoTour(true);
    const view = getRoomView(id);
    flyTo(view.pos, view.target, 1.5, id);
    if (id === "overview") {
      state.room = "overview";
      setActiveRoom("overview", false);
    }
  }

  function goOverview() {
    stopAutoTour(true);
    flyTo(OVERVIEW.camera, OVERVIEW.target, 1.55, null);
    state.room = "overview";
    setActiveRoom("overview", false);
    scheduleSave();
  }

  function applyRoomInstant(id, showBanner) {
    const view = getRoomView(id);
    setModeVisuals("orbit");
    camera.position.set(view.pos[0], view.pos[1], view.pos[2]);
    controls.target.set(view.target[0], view.target[1], view.target[2]);
    controls.enabled = true;
    controls.update();
    setActiveRoom(id, showBanner);
  }

  function pinCurrentView() {
    if (state.room === "overview" || !ROOM_DEFS.some((r) => r.id === state.room)) {
      toast("Select a room before pinning a view", "warn");
      return;
    }
    const target = state.mode === "walk"
      ? camera.position.clone().add(camera.getWorldDirection(new T.Vector3()).multiplyScalar(4))
      : controls.target.clone();
    state.roomPresets[state.room] = {
      camera: [round(camera.position.x, 3), round(camera.position.y, 3), round(camera.position.z, 3)],
      target: [round(target.x, 3), round(target.y, 3), round(target.z, 3)]
    };
    saveLocal();
    const room = ROOM_DEFS.find((r) => r.id === state.room);
    toast("Camera pinned to " + room.name);
  }

  function roomAtPosition(x, z) {
    if (z < -2.5) {
      if (x < -3) return "master";
      if (x < 3) return "studio";
      if (x < 7.5) return "eco";
      return "guest";
    }
    if (z > 9) return "balcony";
    if (z > 2.5) return "living";
    return "foyer";
  }

  function blocked(x, z) {
    if (!insideWalkBounds(x, z)) return true;
    const r = 0.34;
    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      if (x > c.minX - r && x < c.maxX + r && z > c.minZ - r && z < c.maxZ + r) return true;
    }
    return false;
  }

  function tryMove(dx, dz) {
    const x = camera.position.x;
    const z = camera.position.z;
    if (!blocked(x + dx, z)) camera.position.x = x + dx;
    if (!blocked(camera.position.x, z + dz)) camera.position.z = z + dz;
  }

  let walkRoomClock = 0;
  function updateWalk(dt) {
    const speed = (walkKeys.boost ? 5.5 : 2.85) * dt;
    const f = (walkKeys.forward ? 1 : 0) - (walkKeys.back ? 1 : 0);
    const s = (walkKeys.right ? 1 : 0) - (walkKeys.left ? 1 : 0);
    if (f !== 0 || s !== 0) {
      const inv = 1 / Math.sqrt(f * f + s * s);
      const ff = f * inv;
      const ss = s * inv;
      const sin = Math.sin(yaw);
      const cos = Math.cos(yaw);
      tryMove((-sin * ff + cos * ss) * speed, (-cos * ff - sin * ss) * speed);
      camera.position.y = 1.62;
      scheduleSave();
    }
    camera.rotation.set(pitch, yaw, 0, "YXZ");

    walkRoomClock += dt;
    if (walkRoomClock > 0.35) {
      walkRoomClock = 0;
      const id = roomAtPosition(camera.position.x, camera.position.z);
      if (id !== state.room) {
        setActiveRoom(id, true);
        scheduleSave();
      }
    }
  }

  function updateCamera(dt, now) {
    if (camTween) {
      const t = clamp((now - camTween.start) / (camTween.duration * 1000), 0, 1);
      const e = easeInOutCubic(t);
      camera.position.lerpVectors(camTween.fromPos, camTween.toPos, e);
      controls.target.lerpVectors(camTween.fromTarget, camTween.toTarget, e);
      camera.lookAt(controls.target);
      if (t >= 1) {
        camera.position.copy(camTween.toPos);
        controls.target.copy(camTween.toTarget);
        camTween = null;
        if (state.mode === "orbit") {
          controls.enabled = true;
          controls.update();
        }
        scheduleSave();
      }
    } else if (state.mode === "orbit") {
      controls.update();
    } else {
      updateWalk(dt);
    }
  }

  /* ============================================================
     SMART HOME ACTIONS
     ============================================================ */
  function cycleGlass() {
    const i = GLASS_ORDER.indexOf(state.glass);
    setGlassMode(GLASS_ORDER[(i + 1) % GLASS_ORDER.length]);
  }

  function setGlassMode(mode) {
    if (!GLASS_PRESETS[mode]) return;
    state.glass = mode;
    applyGlassPreset(mode, false);
    updateGlassUI();
    toast("Smart glass · " + GLASS_PRESETS[mode].short.toLowerCase());
    saveLocal();
  }

  function cycleLighting() {
    const i = LIGHT_ORDER.indexOf(state.lighting);
    setLightingMode(LIGHT_ORDER[(i + 1) % LIGHT_ORDER.length]);
  }

  function setLightingMode(mode) {
    if (!LIGHT_PRESETS[mode]) return;
    state.lighting = mode;
    applyLightPreset(mode, false);
    updateLightUI();
    toast("Circadian engine · " + LIGHT_PRESETS[mode].short.toLowerCase());
    saveLocal();
  }

  let inductionOn = true;
  let bedGlowOn = true;
  let growLightsOn = true;
  let holoPaletteIndex = 0;
  const HOLO_PALETTES = [
    { name: "Cyan", primary: 0x5ee7ff, secondary: 0x9d7bff },
    { name: "Magenta", primary: 0xff5cf4, secondary: 0x5ee7ff },
    { name: "Solar", primary: 0xffb26b, secondary: 0xff6f61 }
  ];

  function runFeatureAction(id) {
    if (id === "hologram") {
      holoPaletteIndex = (holoPaletteIndex + 1) % HOLO_PALETTES.length;
      const p = HOLO_PALETTES[holoPaletteIndex];
      holoCoreMat.emissive.setHex(p.primary);
      holoWireMat.color.setHex(p.primary);
      holoRingMat.color.setHex(p.secondary);
      const entry = animatedRings.find((e) => e.type === "holo");
      if (entry && entry.particles) entry.particles.material.color.setHex(p.primary);
      toast("Hologram projection · " + p.name.toLowerCase() + " spectrum");
    } else if (id === "bed") {
      bedGlowOn = !bedGlowOn;
      bedGlowMat.emissiveIntensity = bedGlowOn ? 1.7 : 0.04;
      toast("Under-bed circadian glow " + (bedGlowOn ? "engaged" : "dormant"));
    } else if (id === "island") {
      inductionOn = !inductionOn;
      inductionMat.emissiveIntensity = inductionOn ? 1.8 : 0.04;
      toast("Induction halos " + (inductionOn ? "online" : "offline"));
    } else if (id === "hydrowall" || id === "terrarium") {
      growLightsOn = !growLightsOn;
      growMat.emissiveIntensity = growLightsOn ? 1.4 : 0.04;
      toast("Bio grow spectrum " + (growLightsOn ? "online" : "offline"));
    }
  }

  /* ============================================================
     INSPECTION
     ============================================================ */
  let hoverClock = 0;
  function pick(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(interactables, true);
    for (let i = 0; i < hits.length; i++) {
      let obj = hits[i].object;
      while (obj && !obj.userData.feature) obj = obj.parent;
      if (obj) return obj.userData.feature;
    }
    return null;
  }

  function showInspectHint(x, y, label) {
    els.inspectHint.innerHTML = '<span class="hint-key">CLICK</span> ' + label;
    els.inspectHint.style.left = x + "px";
    els.inspectHint.style.top = y + "px";
    els.inspectHint.classList.add("visible");
  }

  function hideInspectHint() {
    els.inspectHint.classList.remove("visible");
    if (state.mode === "orbit") canvas.style.cursor = "";
  }

  function onPointerMove(e) {
    if (pointerDownInfo) {
      const d = Math.hypot(e.clientX - pointerDownInfo.x, e.clientY - pointerDownInfo.y);
      if (d > pointerDownInfo.drag) pointerDownInfo.drag = d;
    }

    if (state.mode === "walk" && lookDrag && e.pointerId === lookDrag.id) {
      const dx = e.clientX - lookDrag.x;
      const dy = e.clientY - lookDrag.y;
      yaw -= dx * 0.0032;
      pitch = clamp(pitch - dy * 0.0028, -1.32, 1.32);
      lookDrag.x = e.clientX;
      lookDrag.y = e.clientY;
      applyWalkRotation();
      scheduleSave();
    }

    if (state.mode !== "orbit" || pointerDownInfo) return;
    if (e.target !== canvas) {
      hideInspectHint();
      return;
    }
    const now = performance.now();
    if (now - hoverClock < 90) return;
    hoverClock = now;
    const hit = pick(e.clientX, e.clientY);
    if (hit && FEATURES[hit]) {
      showInspectHint(e.clientX, e.clientY, FEATURES[hit].title.toUpperCase());
      canvas.style.cursor = "pointer";
    } else {
      hideInspectHint();
    }
  }

  function openFeature(id) {
    const f = FEATURES[id];
    if (!f) return;
    featureKey = id;
    stopAutoTour(true);
    els.featureIcon.textContent = f.icon;
    els.featureCat.textContent = f.cat;
    els.featureTitle.textContent = f.title;
    els.featureDesc.textContent = f.desc;
    els.featureId.textContent = f.id;
    els.featureSpecs.innerHTML = f.specs.map((s) =>
      '<div class="spec-chip"><span>' + s[0] + '</span><b>' + s[1] + '</b></div>'
    ).join("");
    if (f.action) {
      els.featureAction.hidden = false;
      els.featureAction.textContent = f.action.label;
    } else {
      els.featureAction.hidden = true;
    }
    closeHelp();
    els.featureBackdrop.classList.add("open");
    els.featureCard.classList.add("open");
    els.featureBackdrop.setAttribute("aria-hidden", "false");
    els.featureCard.setAttribute("aria-hidden", "false");
    hideInspectHint();
  }

  function closeFeature() {
    els.featureBackdrop.classList.remove("open");
    els.featureCard.classList.remove("open");
    els.featureBackdrop.setAttribute("aria-hidden", "true");
    els.featureCard.setAttribute("aria-hidden", "true");
    featureKey = null;
  }

  function focusFeature(id) {
    const f = FEATURES[id];
    if (!f || !f.focus) return;
    closeFeature();
    flyTo(f.focus.pos, f.focus.target, 1.35, null);
  }

  function openHelp() {
    closeFeature();
    els.helpBackdrop.classList.add("open");
    els.helpCard.classList.add("open");
    els.helpBackdrop.setAttribute("aria-hidden", "false");
    els.helpCard.setAttribute("aria-hidden", "false");
    stopAutoTour(true);
  }

  function closeHelp() {
    els.helpBackdrop.classList.remove("open");
    els.helpCard.classList.remove("open");
    els.helpBackdrop.setAttribute("aria-hidden", "true");
    els.helpCard.setAttribute("aria-hidden", "true");
  }

  function toggleHelp() {
    if (els.helpCard.classList.contains("open")) closeHelp();
    else openHelp();
  }

  /* ============================================================
     AUTO TOUR
     ============================================================ */
  function startAutoTour() {
    if (state.autoTour) return;
    closeFeature();
    state.autoTour = true;
    updateTourUI();
    let idx = ROOM_DEFS.findIndex((r) => r.id === state.room);
    const step = () => {
      idx = (idx + 1) % ROOM_DEFS.length;
      flyToRoom(ROOM_DEFS[idx].id, true);
    };
    setTimeout(() => { if (state.autoTour) step(); }, 450);
    tourTimer = setInterval(() => { if (state.autoTour) step(); }, 8200);
    toast("Auto tour engaged · the residence will guide itself");
  }

  function stopAutoTour(quiet) {
    if (tourTimer) {
      clearInterval(tourTimer);
      tourTimer = null;
    }
    if (!state.autoTour) return;
    state.autoTour = false;
    updateTourUI();
    if (!quiet) toast("Auto tour disengaged");
  }

  function toggleAutoTour() {
    if (state.autoTour) stopAutoTour(false);
    else startAutoTour();
  }

  /* ============================================================
     PERSISTENCE / EXPORT / IMPORT
     ============================================================ */
  function cameraSnapshot() {
    const target = state.mode === "walk"
      ? camera.position.clone().add(camera.getWorldDirection(new T.Vector3()).multiplyScalar(4))
      : controls.target.clone();
    return {
      position: [round(camera.position.x, 3), round(camera.position.y, 3), round(camera.position.z, 3)],
      target: [round(target.x, 3), round(target.y, 3), round(target.z, 3)],
      yaw: round(yaw, 3),
      pitch: round(pitch, 3)
    };
  }

  function buildTourState() {
    return {
      app: APP_ID,
      version: STATE_VERSION,
      appVersion: APP_VERSION,
      exportedAt: new Date().toISOString(),
      credits: {
        studio: "OpenCode",
        model: "DeepSeek V4.1 Flash",
        engine: "Three.js r128"
      },
      settings: {
        room: state.room,
        mode: state.mode,
        lighting: state.lighting,
        glass: state.glass,
        autoTour: false
      },
      camera: cameraSnapshot(),
      roomPresets: JSON.parse(JSON.stringify(state.roomPresets))
    };
  }

  let autosaveTimer = null;
  function saveLocal() {
    if (!state.ready) return;
    try {
      const data = buildTourState();
      data.savedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      els.autosave.classList.remove("saving");
      els.autosave.textContent = "SAVED · " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (err) {
      console.warn("[NEXUS 2035] Autosave unavailable", err);
      els.autosave.textContent = "AUTOSAVE BLOCKED";
    }
  }

  function scheduleSave() {
    if (!state.ready) return;
    els.autosave.classList.add("saving");
    els.autosave.textContent = "SAVING…";
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(saveLocal, 650);
  }

  function sanitizePresets(rp) {
    const out = {};
    if (!rp || typeof rp !== "object") return out;
    Object.keys(rp).forEach((id) => {
      if (!ROOM_DEFS.some((r) => r.id === id)) return;
      const v = rp[id];
      if (v && validVec(v.camera) && validVec(v.target)) {
        out[id] = { camera: v.camera.map(Number), target: v.target.map(Number) };
      }
    });
    return out;
  }

  function applyTourState(data, opts) {
    opts = opts || {};
    if (!data || typeof data !== "object") {
      toast("That file is not a valid Nexus 2035 tour state", "warn");
      return false;
    }
    const s = data.settings || {};
    if (s.lighting && LIGHT_PRESETS[s.lighting]) {
      state.lighting = s.lighting;
      applyLightPreset(s.lighting, true);
      updateLightUI();
    }
    if (s.glass && GLASS_PRESETS[s.glass]) {
      state.glass = s.glass;
      applyGlassPreset(s.glass, true);
      updateGlassUI();
    }
    if (data.roomPresets) state.roomPresets = sanitizePresets(data.roomPresets);

    const room = ROOM_DEFS.some((r) => r.id === s.room) ? s.room : (s.room === "overview" ? "overview" : "overview");
    state.room = room;
    const mode = s.mode === "walk" ? "walk" : "orbit";
    setModeVisuals(mode);

    const cam = data.camera;
    if (cam && validVec(cam.position)) {
      camera.position.set(Number(cam.position[0]), Number(cam.position[1]), Number(cam.position[2]));
      if (mode === "walk") {
        camera.position.y = 1.62;
        if (Number.isFinite(Number(cam.yaw)) && Number.isFinite(Number(cam.pitch))) {
          yaw = Number(cam.yaw);
          pitch = clamp(Number(cam.pitch), -1.32, 1.32);
        } else if (validVec(cam.target)) {
          const dir = new T.Vector3(Number(cam.target[0]), Number(cam.target[1]), Number(cam.target[2])).sub(camera.position).normalize();
          yaw = Math.atan2(-dir.x, -dir.z);
          pitch = Math.asin(clamp(dir.y, -1, 1));
        }
        applyWalkRotation();
      } else {
        if (validVec(cam.target)) {
          controls.target.set(Number(cam.target[0]), Number(cam.target[1]), Number(cam.target[2]));
        }
        controls.enabled = true;
        controls.update();
      }
    } else {
      applyRoomInstant(room, false);
    }

    setActiveRoom(room, !!opts.banner);
    updateModeUI();
    updateTourUI();
    if (opts.save) saveLocal();
    if (!opts.silent) {
      toast(opts.message || "Tour configuration loaded · residence synchronised");
    }
    return true;
  }

  function exportTour() {
    const data = buildTourState();
    download("nexus2035_house_state.json", JSON.stringify(data, null, 2));
    toast("Tour state exported · nexus2035_house_state.json");
  }

  function importTourFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (data.app !== APP_ID && !data.settings) {
          toast("That JSON is not a Nexus 2035 tour state", "warn");
          return;
        }
        applyTourState(data, { banner: true, save: true, message: "Tour configuration restored from file" });
      } catch (err) {
        toast("Could not parse that tour state file", "warn");
      }
    };
    reader.onerror = () => toast("Could not read that file", "warn");
    reader.readAsText(file);
  }

  function restoreLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        if (state.room && state.room !== "overview") applyRoomInstant(state.room, true);
        return false;
      }
      const data = JSON.parse(raw);
      if (data && data.app === APP_ID) {
        applyTourState(data, { banner: false, silent: true, save: false });
        setTimeout(() => toast("Welcome back · your last tour state was restored"), 1100);
        return true;
      }
    } catch (err) {
      // A corrupt state should never block the residence from loading.
    }
    if (state.room && state.room !== "overview") applyRoomInstant(state.room, true);
    return false;
  }

  function resetTour() {
    stopAutoTour(true);
    closeFeature();
    closeHelp();
    try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignore */ }
    state.roomPresets = {};
    state.lighting = "daylight";
    state.glass = "clear";
    state.autoTour = false;
    state.room = "overview";
    applyLightPreset("daylight", true);
    applyGlassPreset("clear", true);
    updateLightUI();
    updateGlassUI();
    updateTourUI();
    setModeVisuals("orbit");
    camera.position.set(OVERVIEW.camera[0], OVERVIEW.camera[1], OVERVIEW.camera[2]);
    controls.target.set(OVERVIEW.target[0], OVERVIEW.target[1], OVERVIEW.target[2]);
    controls.enabled = true;
    controls.update();
    setActiveRoom("overview", false);
    saveLocal();
    toast("Residence reset · default tour restored");
  }

  /* ============================================================
     TELEMETRY / CLOCK
     ============================================================ */
  function updateClock() {
    if (els.clock) els.clock.textContent = new Date().toLocaleTimeString([], { hour12: false });
  }

  function updateTelemetry() {
    const energy = rand(96, 99);
    const temp = rand(21.1, 21.9);
    const air = Math.round(rand(9, 14));
    const water = rand(84, 88);
    els.energy.innerHTML = Math.round(energy) + "<span>%</span>";
    els.temp.innerHTML = temp.toFixed(1) + "<span>°C</span>";
    els.air.innerHTML = air + "<span>AQI</span>";
    els.water.innerHTML = Math.round(water) + "<span>%</span>";
    const bars = document.querySelectorAll(".readout-bar i");
    if (bars[0]) bars[0].style.width = energy + "%";
    if (bars[1]) bars[1].style.width = ((temp - 18) / 8 * 100) + "%";
    if (bars[2]) bars[2].style.width = (100 - air * 2) + "%";
    if (bars[3]) bars[3].style.width = water + "%";
  }

  function updateMinimapCamera() {
    if (!els.mapDot) return;
    const x = clamp((camera.position.x + 12) * 10, 2, 238);
    const y = clamp((camera.position.z + 9) * 10, 2, 213);
    els.mapDot.setAttribute("cx", x.toFixed(1));
    els.mapDot.setAttribute("cy", y.toFixed(1));

    camera.getWorldDirection(tmpVec);
    const heading = (Math.atan2(tmpVec.x, -tmpVec.z) * 180 / Math.PI + 360) % 360;
    const rad = heading * Math.PI / 180;
    els.mapHeading.setAttribute("x1", x.toFixed(1));
    els.mapHeading.setAttribute("y1", y.toFixed(1));
    els.mapHeading.setAttribute("x2", (x + Math.sin(rad) * 9).toFixed(1));
    els.mapHeading.setAttribute("y2", (y - Math.cos(rad) * 9).toFixed(1));
    els.compassNeedle.style.transform = "rotate(" + heading.toFixed(1) + "deg)";
    els.headingValue.textContent = String(Math.round(heading)).padStart(3, "0") + "°";
  }

  /* ============================================================
     EVENTS
     ============================================================ */
  let lookDrag = null;
  function onPointerDown(e) {
    if (state.mode === "walk" && e.button === 0) {
      lookDrag = { id: e.pointerId, x: e.clientX, y: e.clientY };
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
    pointerDownInfo = { id: e.pointerId, x: e.clientX, y: e.clientY, drag: 0, time: performance.now() };
  }

  function onPointerUp(e) {
    if (!pointerDownInfo || pointerDownInfo.id !== e.pointerId) return;
    const wasClick = pointerDownInfo.drag < 7 && performance.now() - pointerDownInfo.time < 700;
    const isCanvas = e.target === canvas;
    pointerDownInfo = null;
    lookDrag = null;
    try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (wasClick && isCanvas) {
      const hit = pick(e.clientX, e.clientY);
      if (hit) openFeature(hit);
    }
  }

  function onKeyDown(e) {
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    const k = e.key.toLowerCase();

    if (state.mode === "walk") {
      const map = {
        w: "forward", arrowup: "forward",
        s: "back", arrowdown: "back",
        a: "left", arrowleft: "left",
        d: "right", arrowright: "right"
      };
      if (map[k]) {
        walkKeys[map[k]] = true;
        e.preventDefault();
        return;
      }
      if (k === "shift") walkKeys.boost = true;
    }

    if (k === "w" && state.mode === "orbit") {
      setMode("walk");
      e.preventDefault();
      return;
    }
    if (k === "o") {
      setMode("orbit");
      return;
    }
    if (k === "g") {
      cycleGlass();
      return;
    }
    if (k === "l") {
      cycleLighting();
      return;
    }
    if (k === "t") {
      toggleAutoTour();
      return;
    }
    if (k === "h" || k === "?") {
      toggleHelp();
      return;
    }
    if (k === "0") {
      goOverview();
      return;
    }
    if (/^[1-7]$/.test(k)) {
      const room = ROOM_DEFS[Number(k) - 1];
      if (room) flyToRoom(room.id);
      return;
    }
    if (k === "escape") {
      if (els.featureCard.classList.contains("open")) closeFeature();
      else if (els.helpCard.classList.contains("open")) closeHelp();
      else if (document.body.classList.contains("drawer-open")) closeDrawer();
      else if (state.autoTour) stopAutoTour(false);
    }
  }

  function onKeyUp(e) {
    const k = e.key.toLowerCase();
    if (k === "shift") walkKeys.boost = false;
    const map = {
      w: "forward", arrowup: "forward",
      s: "back", arrowdown: "back",
      a: "left", arrowleft: "left",
      d: "right", arrowright: "right"
    };
    if (map[k]) walkKeys[map[k]] = false;
  }

  function closeDrawer() {
    document.body.classList.remove("drawer-open");
    els.roomsToggle.setAttribute("aria-expanded", "false");
  }

  function bindUI() {
    els.roomList.addEventListener("click", (e) => {
      const btn = e.target.closest(".room-btn");
      if (!btn) return;
      flyToRoom(btn.dataset.room);
      closeDrawer();
    });

    els.minimap.addEventListener("click", (e) => {
      const g = e.target.closest(".map-room");
      if (g) flyToRoom(g.dataset.room);
    });
    els.minimap.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const g = e.target.closest(".map-room");
      if (g) {
        e.preventDefault();
        flyToRoom(g.dataset.room);
      }
    });

    document.querySelectorAll(".segmented button").forEach((b) => {
      b.addEventListener("click", () => setMode(b.dataset.mode));
    });

    els.glassBtn.addEventListener("click", cycleGlass);
    els.lightBtn.addEventListener("click", cycleLighting);
    els.tourBtn.addEventListener("click", toggleAutoTour);
    els.exportBtn.addEventListener("click", exportTour);
    els.importBtn.addEventListener("click", () => els.importFile.click());
    els.importFile.addEventListener("change", (e) => {
      importTourFile(e.target.files && e.target.files[0]);
      e.target.value = "";
    });
    els.resetBtn.addEventListener("click", resetTour);
    els.saveViewBtn.addEventListener("click", pinCurrentView);

    els.helpBtn.addEventListener("click", openHelp);
    els.helpClose.addEventListener("click", closeHelp);
    els.helpBackdrop.addEventListener("click", closeHelp);
    els.featureClose.addEventListener("click", closeFeature);
    els.featureClose2.addEventListener("click", closeFeature);
    els.featureBackdrop.addEventListener("click", closeFeature);
    els.featureFocus.addEventListener("click", () => { if (featureKey) focusFeature(featureKey); });
    els.featureAction.addEventListener("click", () => { if (featureKey) runFeatureAction(featureKey); });

    els.roomsToggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("drawer-open");
      els.roomsToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", hideInspectHint);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", () => {
      walkKeys.forward = walkKeys.back = walkKeys.left = walkKeys.right = false;
      walkKeys.boost = false;
    });

    window.addEventListener("beforeunload", saveLocal);
    document.querySelectorAll(".modal-backdrop, .card-close").forEach((el) => {
      el.addEventListener("click", () => hideInspectHint());
    });
  }

  /* ============================================================
     ANIMATION LOOP
     ============================================================ */
  let elapsed = 0;
  let fpsCount = 0;
  let fpsAccum = 0;
  let mapClock = 0;

  function animateScene(dt) {
    // Hologram field
    const holo = animatedRings.find((e) => e.type === "holo");
    if (holo) {
      holo.core.rotation.y += dt * 0.55;
      holo.core.rotation.x = Math.sin(elapsed * 0.7) * 0.14;
      holo.core.position.y = 1.42 + Math.sin(elapsed * 1.5) * 0.045;
      holo.wire.rotation.y -= dt * 0.35;
      holo.wire.rotation.z += dt * 0.18;
      holo.wire.position.y = holo.core.position.y;
      holo.shell.rotation.y += dt * 0.16;
      holo.shell.rotation.x -= dt * 0.08;
      holo.shell.position.y = holo.core.position.y;
      holo.rings.forEach((r, i) => {
        r.rotation.z += dt * (0.25 + i * 0.12) * (i % 2 ? -1 : 1);
        r.rotation.y += dt * 0.1;
        r.position.y = holo.core.position.y;
      });
      holo.particles.rotation.y += dt * 0.22;
      holo.particles.position.y = Math.sin(elapsed * 0.9) * 0.03;
    }

    // Induction halos
    if (inductionOn) {
      inductionMat.emissiveIntensity = 1.6 + Math.sin(elapsed * 2.3) * 0.3;
    } else {
      inductionMat.emissiveIntensity = 0.04;
    }

    // Bed under-glow
    if (bedGlowOn) {
      bedGlowMat.emissiveIntensity = 1.45 + Math.sin(elapsed * 1.15) * 0.22;
    } else {
      bedGlowMat.emissiveIntensity = 0.04;
    }

    // Fire lounge
    const fire = animatedRings.find((e) => e.type === "fire");
    if (fire) {
      const flicker = 0.9 + Math.sin(elapsed * 7.4) * 0.08 + Math.sin(elapsed * 13.7) * 0.04;
      fire.mesh.scale.y = flicker;
      fire.mesh.scale.x = 0.94 + Math.sin(elapsed * 9.1) * 0.06;
      fire.sprite.material.opacity = 0.58 + Math.sin(elapsed * 8.3) * 0.08;
      fire.sprite.scale.set(2.6 * flicker, 2.6 * flicker, 1);
      if (fireLight) fireLight.intensity = envCurrent.lightIntensities[7] * (0.86 + Math.sin(elapsed * 8.1) * 0.08);
    }

    // Air traffic
    traffic.forEach((t) => {
      t.group.position.x += t.speed * dt;
      if (t.group.position.x > 92) t.group.position.x = -92;
      if (t.group.position.x < -92) t.group.position.x = 92;
      t.group.position.y = t.baseY + Math.sin(elapsed * 0.9 + t.phase) * t.bob;
    });

    // Star twinkle
    if (starsMat) starsMat.opacity = Math.max(0, envCurrent.stars + Math.sin(elapsed * 1.7) * 0.012);
  }

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;
    tickEnvironment(dt);
    animateScene(dt);
    updateCamera(dt, performance.now());
    renderer.render(scene, camera);

    mapClock += dt;
    if (mapClock > 0.09) {
      mapClock = 0;
      updateMinimapCamera();
    }

    fpsCount++;
    fpsAccum += dt;
    if (fpsAccum > 0.75) {
      els.fpsValue.textContent = Math.round(fpsCount / fpsAccum) + " FPS";
      fpsCount = 0;
      fpsAccum = 0;
    }
  }

  /* ============================================================
     BOOT
     ============================================================ */
  async function boot() {
    try {
      setLoader(6, "Booting spatial engine");
      await nextFrame();
      initEngine();
      setLoader(20, "Compiling shaders");
      await nextFrame();
      buildMaterials();
      setLoader(38, "Pouring terrazzo");
      await nextFrame();
      buildWorld();
      setLoader(70, "Furnishing residence");
      await nextFrame();
      initEnvironmentState();
      setLoader(84, "Calibrating atmosphere");
      await nextFrame();
      buildUI();
      bindUI();
      setLoader(92, "Restoring tour state");
      await nextFrame();
      clock = clock || new T.Clock();
      clock.start();
      restoreLocal();
      setActiveRoom(state.room, false);
      updateModeUI();
      updateClock();
      updateTelemetry();
      setLoader(99, "Residence online");
      await sleep(520);
      setLoader(100, "Nexus online");
      await sleep(160);
      loader.classList.add("is-done");
      document.body.classList.remove("is-loading");
      state.ready = true;
      if (!localStorage.getItem(STORAGE_KEY)) saveLocal();
      animate();
      setTimeout(() => {
        toast("Nexus 2035 online · select a room or walk inside");
      }, 1200);
      setInterval(updateClock, 1000);
      setInterval(updateTelemetry, 2600);
    } catch (err) {
      console.error(err);
      fatal("Spatial engine failed · " + (err && err.message ? err.message : "unknown error"));
    }
  }

  boot();
})();
