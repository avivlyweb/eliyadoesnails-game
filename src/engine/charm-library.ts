import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Nail charms that can be placed on nail tips.
 * - "procedural" charms are built in code (cute placeholders until Blender versions exist:
 *   see docs/game-plan/07-CHARMS-BLENDER.md). When a GLB with the same id appears at
 *   /models/charms/<id>.glb, set `src` and it replaces the procedural one.
 * - "glb" charms are existing Blender models.
 * Every charm is normalised so its largest side is 1 unit; callers scale it to the nail.
 */
export interface CharmDef {
  id: string;
  name: string;
  icon: string;
  src?: string;
  build?: () => THREE.Group;
  /** Quest "requestedCharm" names this charm satisfies */
  matches?: string[];
}

const mat = (color: number, rough = 0.35, metal = 0, emissive = 0x000000) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, emissive, emissiveIntensity: emissive ? 0.25 : 0 });

const GLOSS_PINK = () => mat(0xf6a5b9, 0.25);
const PEARL = () => mat(0xfaf3ee, 0.18, 0.15);

function petalShape(len = 0.5, width = 0.26): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(width, len * 0.25, width * 0.9, len * 0.85, 0, len);
  s.bezierCurveTo(-width * 0.9, len * 0.85, -width, len * 0.25, 0, 0);
  return s;
}

function extruded(shape: THREE.Shape, depth: number, material: THREE.Material, bevel = 0.04) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 18,
  });
  geo.center();
  return new THREE.Mesh(geo, material);
}

function flower(petals: number, petalColor: number, centerColor: number, len = 0.5, width = 0.26, notch = false) {
  const g = new THREE.Group();
  const pm = mat(petalColor, 0.3);
  for (let i = 0; i < petals; i++) {
    const shape = petalShape(len, width);
    if (notch) {
      // sakura notch at the tip
      shape.curves = [];
      shape.moveTo(0, 0);
      shape.bezierCurveTo(width, len * 0.25, width, len * 0.8, width * 0.35, len);
      shape.lineTo(0, len * 0.86);
      shape.lineTo(-width * 0.35, len);
      shape.bezierCurveTo(-width, len * 0.8, -width, len * 0.25, 0, 0);
    }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3, curveSegments: 14 });
    const m = new THREE.Mesh(geo, pm);
    m.rotation.z = (i / petals) * Math.PI * 2;
    m.rotation.x = -0.18; // cupped
    g.add(m);
  }
  const c = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 14), mat(centerColor, 0.4));
  c.scale.z = 0.6;
  c.position.z = 0.06;
  g.add(c);
  g.rotation.x = -Math.PI / 2; // lie flat, facing +Y
  const wrap = new THREE.Group();
  wrap.add(g);
  return wrap;
}

function heartShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, -0.42);
  s.bezierCurveTo(-0.15, -0.28, -0.5, -0.05, -0.5, 0.17);
  s.bezierCurveTo(-0.5, 0.42, -0.2, 0.5, 0, 0.3);
  s.bezierCurveTo(0.2, 0.5, 0.5, 0.42, 0.5, 0.17);
  s.bezierCurveTo(0.5, -0.05, 0.15, -0.28, 0, -0.42);
  return s;
}

function starShape(points = 5, outer = 0.5, inner = 0.22): THREE.Shape {
  const s = new THREE.Shape();
  for (let i = 0; i <= points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  return s;
}

function flatFace(mesh: THREE.Object3D) {
  // Built in XY facing +Z -> lay flat facing +Y
  const g = new THREE.Group();
  mesh.rotation.x = -Math.PI / 2;
  g.add(mesh);
  return g;
}

function buildCat(): THREE.Group {
  // Original ginger tabby "Stroopje": orange fur, cream muzzle, forehead stripes, :3 mouth
  const g = new THREE.Group();
  const fur = mat(0xf2a65a, 0.5);
  const cream = mat(0xfff1dd, 0.5);
  const dark = mat(0xc9733a, 0.5);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 28, 20), fur);
  head.scale.set(1.05, 0.86, 0.55);
  g.add(head);
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 14), cream);
  muzzle.scale.set(1.25, 0.8, 0.5);
  muzzle.position.set(0, -0.1, 0.17);
  g.add(muzzle);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.24, 4), fur);
    ear.position.set(side * 0.25, 0.34, 0);
    ear.rotation.z = -side * 0.45;
    ear.scale.z = 0.5;
    g.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.13, 4), cream);
    inner.position.set(side * 0.245, 0.32, 0.06);
    inner.rotation.z = -side * 0.45;
    inner.scale.z = 0.4;
    g.add(inner);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), mat(0x2b1d14, 0.1));
    eye.position.set(side * 0.15, 0.05, 0.2);
    eye.scale.set(0.8, 1.1, 0.5);
    g.add(eye);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), mat(0xffffff, 0.1));
    shine.position.set(side * 0.15 + 0.02, 0.08, 0.23);
    g.add(shine);
    // half of the ":3" mouth
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 12, Math.PI), mat(0x6b3b22, 0.5));
    mouth.rotation.z = Math.PI;
    mouth.position.set(side * 0.035, -0.12, 0.255);
    g.add(mouth);
  }
  for (let i = -1; i <= 1; i++) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.12 - Math.abs(i) * 0.03, 0.04), dark);
    stripe.position.set(i * 0.07, 0.26, 0.15);
    stripe.rotation.z = i * 0.25;
    g.add(stripe);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), mat(0xd9776b, 0.4));
  nose.scale.set(1.3, 0.8, 0.7);
  nose.position.set(0, -0.07, 0.26);
  g.add(nose);
  return flatFace(g);
}

function buildBow(color = 0xf6a5b9): THREE.Group {
  const g = new THREE.Group();
  const m = mat(color, 0.3);
  for (const side of [-1, 1]) {
    const loop = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 14), m);
    loop.scale.set(1.15, 0.75, 0.45);
    loop.position.x = side * 0.22;
    loop.rotation.z = side * 0.2;
    g.add(loop);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.32, 0.05), m);
    tail.position.set(side * 0.1, -0.24, 0);
    tail.rotation.z = side * 0.35;
    g.add(tail);
  }
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), m);
  knot.scale.z = 0.7;
  g.add(knot);
  return flatFace(g);
}

function buildWhisk(): THREE.Group {
  const g = new THREE.Group();
  const bamboo = mat(0xe7cf9c, 0.6);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.45, 14), bamboo);
  handle.position.y = 0.25;
  g.add(handle);
  const tines = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 0.35, 18, 1, true), bamboo);
  tines.position.y = -0.14;
  g.add(tines);
  const matcha = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 10), mat(0x8fb27a, 0.5));
  matcha.position.y = -0.27;
  matcha.scale.y = 0.45;
  g.add(matcha);
  g.rotation.z = Math.PI / 2;
  const w = new THREE.Group();
  w.add(g);
  return w;
}

export const CHARMS: CharmDef[] = [
  // --- Batch A 3D Blender charms (with procedural fallback) ---
  { id: "charm-tulip", name: "Dutch Tulip", icon: "🌷", src: "/models/charms/charm-tulip.glb", matches: ["Dutch Tulip Bulb Charm", "Tulip Petal Press"],
    build: () => {
      const g = new THREE.Group();
      const red = mat(0xe8577a, 0.3);
      for (let i = 0; i < 3; i++) {
        const p = extruded(petalShape(0.62, 0.26), 0.05, red, 0.03);
        p.position.set((i - 1) * 0.15, 0.08, i === 1 ? 0.03 : 0);
        p.rotation.z = (i - 1) * -0.28;
        g.add(p);
      }
      const leaf = extruded(petalShape(0.45, 0.12), 0.03, mat(0x7fa36b, 0.5), 0.02);
      leaf.position.set(0.18, -0.32, -0.02);
      leaf.rotation.z = -0.9;
      g.add(leaf);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.36, 8), mat(0x7fa36b, 0.5));
      stem.position.y = -0.32;
      g.add(stem);
      return flatFace(g);
    } },
  { id: "charm-daisy", name: "Daisy", icon: "🌼", src: "/models/charms/charm-daisy.glb", build: () => flower(10, 0xffffff, 0xf6c445, 0.42, 0.13) },
  { id: "charm-sakura", name: "Sakura Blossom", icon: "🌸", src: "/models/charms/charm-sakura.glb", build: () => flower(5, 0xf9c2d2, 0xf2d27a, 0.46, 0.27, true) },
  { id: "charm-puffy-heart", name: "Puffy Heart", icon: "💗", src: "/models/charms/charm-puffy-heart.glb", build: () => flatFace(extruded(heartShape(), 0.12, GLOSS_PINK(), 0.09)) },
  { id: "charm-kitty", name: "Ginger Kitty", icon: "🐱", src: "/models/charms/charm-kitty.glb", build: buildCat },
  { id: "charm-star", name: "Glitter Star", icon: "⭐", src: "/models/charms/charm-star.glb", matches: ["Glitter Star Shard"],
    build: () => flatFace(extruded(starShape(), 0.1, mat(0xf6d77a, 0.2, 0.6), 0.05)) },
  { id: "charm-pearl", name: "Freshwater Pearl", icon: "🤍", src: "/models/charms/charm-pearl.glb",
    build: () => {
      const g = new THREE.Group();
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 24), PEARL());
      p.scale.y = 0.85;
      g.add(p);
      return g;
    } },
  { id: "charm-satin-bow", name: "Satin Bow", icon: "🎀", src: "/models/charms/charm-satin-bow.glb", matches: ["Fine Silk Ribbon", "Silk Ribbon Spool"], build: () => buildBow() },
  { id: "charm-matcha-whisk", name: "Matcha Whisk", icon: "🍵", src: "/models/charms/charm-matcha-whisk.glb", matches: ["Ceremonial Whisk Charm", "Matcha Ceramic Whisk"], build: buildWhisk },

  // --- Existing Blender charms ---
  { id: "sculpted-ribbon-bow", name: "Sculpted Ribbon Bow", icon: "🎀", src: "/models/high-detail/charms/sculpted-ribbon-bow.glb", matches: ["Sculpted Ribbon Bow"] },
  { id: "baroque-nacre-pearl", name: "Baroque Pearl", icon: "🦪", src: "/models/high-detail/charms/baroque-nacre-pearl.glb", matches: ["Baroque Nacre Pearl"] },
  { id: "molten-chrome-drops", name: "Molten Chrome Drops", icon: "💧", src: "/models/high-detail/charms/molten-chrome-drops.glb", matches: ["Molten Chrome Drops"] },
  { id: "barbed-wire-cyber-heart", name: "Cyber Heart", icon: "🖤", src: "/models/high-detail/charms/barbed-wire-cyber-heart.glb", matches: ["Barbed Wire Cyber Heart"] },
  { id: "faceted-aurora-teardrop-gem", name: "Aurora Gem", icon: "💎", src: "/models/high-detail/charms/faceted-aurora-teardrop-gem.glb" },
  { id: "saturn-orbital-charm", name: "Saturn", icon: "🪐", src: "/models/high-detail/charms/saturn-orbital-charm.glb", matches: ["Saturn Orbital Charm"] },
  { id: "charm-y2k-cyber-stars", name: "Y2K Stars", icon: "✦", src: "/models/high-detail/charms/charm-y2k-cyber-stars.glb" },
  { id: "charm-chrome-monkey", name: "Chrome Monkey", icon: "🐒", src: "/models/high-detail/charms/charm-chrome-monkey.glb" },

  // --- Batch B 3D Blender charms (07-CHARMS-BLENDER.md §4) ---
  { id: "charm-mini-windmill", name: "Mini Windmill", icon: "💨", src: "/models/charms/charm-mini-windmill.glb", matches: ["Mini Windmill Charm", "Windmill Hill Keepsake"] },
  { id: "charm-stroopwafel", name: "Stroopwafel", icon: "🧇", src: "/models/charms/charm-stroopwafel.glb", matches: ["Stroopwafel Charm", "Gouda Caramel Cookie"] },
  { id: "charm-omafiets", name: "Omafiets Bike", icon: "🚲", src: "/models/charms/charm-omafiets.glb", matches: ["Omafiets Charm", "Amsterdam Bicycle Charm"] },
  { id: "charm-canal-house", name: "Canal House", icon: "🏛️", src: "/models/charms/charm-canal-house.glb", matches: ["Canal House Charm", "Stepped Gable Charm"] },
  { id: "charm-clog", name: "Wooden Clog", icon: "👡", src: "/models/charms/charm-clog.glb", matches: ["Wooden Clog Charm", "Yellow Klomp Charm"] },
  { id: "charm-mochi-bunny", name: "Mochi Bunny", icon: "🐰", src: "/models/charms/charm-mochi-bunny.glb", matches: ["Mochi Bunny Charm", "Peach Bunny Face"] },
  { id: "charm-strawberry", name: "Glossy Strawberry", icon: "🍓", src: "/models/charms/charm-strawberry.glb", matches: ["Strawberry Charm", "Glossy Berry Charm"] },
  { id: "charm-butterfly", name: "Pastel Butterfly", icon: "🦋", src: "/models/charms/charm-butterfly.glb", matches: ["Butterfly Charm", "Lavender Butterfly"] },
  { id: "charm-moon", name: "Crescent Moon", icon: "🌙", src: "/models/charms/charm-moon.glb", matches: ["Crescent Moon Charm", "Gold Moon Charm"] },
  { id: "charm-cloud", name: "Smiling Cloud", icon: "☁️", src: "/models/charms/charm-cloud.glb", matches: ["Cloud Charm", "Smiling Cloud Charm"] },
  { id: "charm-shell", name: "Scallop Shell", icon: "🐚", src: "/models/charms/charm-shell.glb", matches: ["Scallop Shell Charm", "Nacre Shell Charm"] },
  { id: "charm-cherry", name: "Cherry Pair", icon: "🍒", src: "/models/charms/charm-cherry.glb", matches: ["Cherry Pair Charm", "Glossy Cherry Charm"] },
];

export function getCharm(id: string): CharmDef | undefined {
  return CHARMS.find((c) => c.id === id);
}

/** Charm that fulfils a client's requested charm name (exact match list, then fuzzy). */
export function charmForRequest(requested: string): CharmDef | undefined {
  const r = requested.toLowerCase();
  return (
    CHARMS.find((c) => c.matches?.some((m) => m.toLowerCase() === r)) ||
    CHARMS.find((c) => r.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(r))
  );
}

const loader = new GLTFLoader();
const glbCache = new Map<string, Promise<THREE.Group>>();

function normalise(obj: THREE.Object3D): THREE.Group {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSide = Math.max(size.x, size.y, size.z) || 1;
  obj.position.sub(center);
  const wrap = new THREE.Group();
  wrap.add(obj);
  wrap.scale.setScalar(1 / maxSide);
  // sit the charm's underside at y = 0 (so it rests on the nail)
  const outer = new THREE.Group();
  outer.add(wrap);
  wrap.position.y = (size.y / maxSide) / 2;
  return outer;
}

/** Returns a fresh, normalised instance of the charm (largest side = 1, resting on y = 0). */
export async function createCharm(def: CharmDef): Promise<THREE.Group> {
  if (def.src) {
    if (!glbCache.has(def.src)) {
      glbCache.set(
        def.src,
        new Promise((resolve, reject) => loader.load(def.src!, (g) => resolve(g.scene), undefined, reject))
      );
    }
    try {
      const scene = await glbCache.get(def.src)!;
      return normalise(scene.clone(true));
    } catch {
      if (!def.build) return normalise(new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), GLOSS_PINK()));
    }
  }
  const g = def.build ? def.build() : new THREE.Group();
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });
  return normalise(g);
}

