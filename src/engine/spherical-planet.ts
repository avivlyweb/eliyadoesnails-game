import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  DISTRICTS,
  DistrictConfig,
  sphericalToNormal,
  slerpNormals,
  createMulberry32,
  stringToSeed,
} from "./planet-layout";
import { gameConvex } from "../net/convex";
import { questSystem } from "./game-quest";

export interface PlanetLandmark {
  id: string;
  name: string;
  role: string;
  normal: THREE.Vector3;
  position: THREE.Vector3;
  modelPath?: string;
  dialogue: string;
  districtKey?: string;
  nodeKey?: string;
  npcKey?: string;
}

interface PathSample {
  normal: THREE.Vector3;
  pos: THREE.Vector3;
  isDistrictCenter: boolean;
}

export class SphericalPlanet {
  public scene: THREE.Scene;
  public root: THREE.Group;
  public readonly radius: number = 17.5; // Spec §1: smaller planet radius (~70s walk around)
  public loader: GLTFLoader;

  public landmarks: PlanetLandmark[] = [];
  public npcs: THREE.Group[] = [];

  // Material Pickups tracking
  public pickupMeshes: Map<string, THREE.Group> = new Map();
  public depletedNodes: Map<string, number> = new Map();

  // Procedural Paths data
  private pathSamples: PathSample[] = [];
  private pathMeshGroup: THREE.Group = new THREE.Group();

  // Filler Instancing
  private fillerGroup: THREE.Group = new THREE.Group();
  private windUniforms: { uTime: { value: number } } = { uTime: { value: 0 } };

  // Dynamic props (windmill blades, canal water, night lanterns)
  private windmillBlades: THREE.Object3D | null = null;
  private lanternLights: THREE.PointLight[] = [];
  private lanternMaterials: THREE.MeshStandardMaterial[] = [];
  private pickupGlows: THREE.Object3D[] = [];
  private npcQuestMarkers: Array<{
    npcKey: string;
    marker: THREE.Group;
    basePos: THREE.Vector3;
    normal: THREE.Vector3;
  }> = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.root.add(this.pathMeshGroup);
    this.root.add(this.fillerGroup);

    this.loader = new GLTFLoader();

    this.buildTerrain();
    this.buildProceduralPaths();
    this.buildCanalWater();
    this.spawnDistrictAnchors();
    this.spawnPathLanterns();
    this.loadInstancedFillerModels();
    this.spawnNPCCharacters();
  }

  // Spherical polar coordinate helper
  public getSphericalPoint(
    theta: number,
    phi: number,
    rOffset = 0
  ): { pos: THREE.Vector3; norm: THREE.Vector3 } {
    const norm = sphericalToNormal(theta, phi);
    const pos = norm.clone().multiplyScalar(this.radius + rOffset);
    return { pos, norm };
  }

  // Align an object's Up to normal and orient Yaw
  public orientToNormal(object: THREE.Object3D, normal: THREE.Vector3, yaw = 0) {
    const up = new THREE.Vector3(0, 1, 0);
    const qNorm = new THREE.Quaternion().setFromUnitVectors(up, normal);
    const qYaw = new THREE.Quaternion().setFromAxisAngle(normal, yaw);
    object.quaternion.copy(qNorm).premultiply(qYaw);
  }

  // =========================================================================
  // 1. TERRAIN SPHERE WITH VERTEX NOISE (Spec §1)
  // =========================================================================
  private buildTerrain() {
    // 96x96 sphere geometry for subtle organic topography
    const earthGeo = new THREE.SphereGeometry(this.radius, 96, 96);
    const posAttr = earthGeo.attributes.position;
    const v = new THREE.Vector3();

    // Noise function: gentle ±0.15m low frequency, 0 under districts and paths
    for (let i = 0; i < posAttr.count; i++) {
      v.fromBufferAttribute(posAttr, i);
      const norm = v.clone().normalize();

      // Check proximity to any district center
      let minDistrictDist = 999;
      for (const d of DISTRICTS) {
        const dNorm = sphericalToNormal(d.centerTheta, d.centerPhi);
        const dist = norm.distanceTo(dNorm);
        if (dist < minDistrictDist) minDistrictDist = dist;
      }

      // Check proximity to path centerline (sample check)
      let minPathDist = 999;
      for (let s = 0; s < this.pathSamples.length; s += 8) {
        const pDist = norm.distanceTo(this.pathSamples[s].normal);
        if (pDist < minPathDist) minPathDist = pDist;
      }

      // Only add noise away from districts and paths
      const flattenFactor = THREE.MathUtils.smoothstep(minDistrictDist, 0.15, 0.45) *
                            THREE.MathUtils.smoothstep(minPathDist, 0.08, 0.25);

      // Low frequency 3D simplex-like sine noise
      const noise =
        (Math.sin(norm.x * 5.0) * Math.cos(norm.y * 5.0) +
         Math.sin(norm.z * 4.5) * Math.cos(norm.x * 4.5)) * 0.14 * flattenFactor;

      v.setLength(this.radius + noise);
      posAttr.setXYZ(i, v.x, v.y, v.z);
    }

    earthGeo.computeVertexNormals();

    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x768f72, // pal_grass / Eliya Muted Sage
      roughness: 0.92,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.receiveShadow = true;
    this.root.add(earth);
  }

  // =========================================================================
  // 2. PROCEDURAL PATHS (Spec §3)
  // =========================================================================
  private buildProceduralPaths() {
    // Connect districts in a continuous ring + 1 shortcut over north pole
    const connections: Array<[number, number]> = [
      [0, 1], // canal -> market
      [1, 2], // market -> meadow
      [2, 3], // meadow -> windmill
      [3, 4], // windmill -> harbour
      [4, 0], // harbour -> canal
      [0, 2], // shortcut: canal across north pole to meadow
    ];

    const pathGeometries: THREE.BufferGeometry[] = [];
    const stepMeters = 0.5;
    const arcStep = stepMeters / this.radius;

    for (const [idxA, idxB] of connections) {
      const distA = DISTRICTS[idxA];
      const distB = DISTRICTS[idxB];
      const normA = sphericalToNormal(distA.centerTheta, distA.centerPhi);
      const normB = sphericalToNormal(distB.centerTheta, distB.centerPhi);

      const angularDist = Math.acos(THREE.MathUtils.clamp(normA.dot(normB), -1, 1));
      const steps = Math.max(12, Math.floor(angularDist / arcStep));

      const ribbonVertices: number[] = [];
      const ribbonNormals: number[] = [];
      const ribbonIndices: number[] = [];

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const baseNorm = slerpNormals(normA, normB, t);

        // Sine wiggle (amp 0.6m, wavelength 12m)
        const arcMeters = t * angularDist * this.radius;
        const wiggleOffset = Math.sin(arcMeters * ((2 * Math.PI) / 12)) * 0.5;

        // Path tangent direction & perpendicular tangent on sphere
        const nextNorm = slerpNormals(normA, normB, Math.min(1, t + 0.02));
        const forward = nextNorm.clone().sub(baseNorm).normalize();
        const perp = new THREE.Vector3().crossVectors(forward, baseNorm).normalize();

        // Width: 2.4m in district centers, 1.8m in gaps
        const isNearCenter = t < 0.15 || t > 0.85;
        const halfWidth = (isNearCenter ? 1.2 : 0.9);

        // Extrude ribbon 0.02m above surface
        const centerPos = baseNorm.clone().multiplyScalar(this.radius + 0.02);
        centerPos.addScaledVector(perp, wiggleOffset);

        const leftPos = centerPos.clone().addScaledVector(perp, -halfWidth);
        const rightPos = centerPos.clone().addScaledVector(perp, halfWidth);

        ribbonVertices.push(leftPos.x, leftPos.y, leftPos.z);
        ribbonVertices.push(rightPos.x, rightPos.y, rightPos.z);

        ribbonNormals.push(baseNorm.x, baseNorm.y, baseNorm.z);
        ribbonNormals.push(baseNorm.x, baseNorm.y, baseNorm.z);

        // Store sample for player path boost & lantern placement
        this.pathSamples.push({
          normal: baseNorm.clone(),
          pos: centerPos.clone(),
          isDistrictCenter: isNearCenter,
        });

        if (i < steps) {
          const row1 = i * 2;
          const row2 = (i + 1) * 2;
          ribbonIndices.push(row1, row1 + 1, row2);
          ribbonIndices.push(row1 + 1, row2 + 1, row2);
        }
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.Float32BufferAttribute(ribbonVertices, 3));
      geom.setAttribute("normal", new THREE.Float32BufferAttribute(ribbonNormals, 3));
      geom.setIndex(ribbonIndices);
      pathGeometries.push(geom);
    }

    // Material: pal_taupe (#C2AC94) with 0.95 roughness
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0xc2ac94, // pal_taupe
      roughness: 0.95,
      metalness: 0.05,
    });

    for (const g of pathGeometries) {
      const mesh = new THREE.Mesh(g, pathMat);
      mesh.receiveShadow = true;
      this.pathMeshGroup.add(mesh);
    }

    // Edge kerb stones: instance cobble-edge-stone every ~0.7m along paths
    this.spawnPathEdgeStones();
  }

  private spawnPathEdgeStones() {
    this.loader.load("/models/filler/cobble-edge-stone.glb", (gltf) => {
      let stoneMesh: THREE.Mesh | null = null;
      gltf.scene.traverse((c) => {
        if ((c as THREE.Mesh).isMesh && !stoneMesh) {
          stoneMesh = c as THREE.Mesh;
        }
      });
      if (!stoneMesh) return;

      const count = Math.min(600, Math.floor(this.pathSamples.length * 0.8));
      const inst = new THREE.InstancedMesh(
        (stoneMesh as any).geometry,
        (stoneMesh as any).material,
        count * 2
      );

      const mat = new THREE.Matrix4();
      const pos = new THREE.Vector3();
      const q = new THREE.Quaternion();
      const s = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);

      let instIdx = 0;
      for (let i = 0; i < this.pathSamples.length && instIdx < count * 2; i += 2) {
        const sample = this.pathSamples[i];
        const nextSample = this.pathSamples[Math.min(this.pathSamples.length - 1, i + 1)];
        const fwd = nextSample.pos.clone().sub(sample.pos).normalize();
        const perp = new THREE.Vector3().crossVectors(fwd, sample.normal).normalize();

        const halfWidth = sample.isDistrictCenter ? 1.25 : 0.95;

        // Left stone
        pos.copy(sample.pos).addScaledVector(perp, -halfWidth);
        const qNormL = new THREE.Quaternion().setFromUnitVectors(up, sample.normal);
        const qYawL = new THREE.Quaternion().setFromAxisAngle(sample.normal, (Math.random() - 0.5) * 0.2);
        q.copy(qNormL).premultiply(qYawL);
        const scaleValL = 0.9 + Math.random() * 0.2;
        s.set(scaleValL, scaleValL, scaleValL);
        mat.compose(pos, q, s);
        inst.setMatrixAt(instIdx++, mat);

        // Right stone
        pos.copy(sample.pos).addScaledVector(perp, halfWidth);
        const qNormR = new THREE.Quaternion().setFromUnitVectors(up, sample.normal);
        const qYawR = new THREE.Quaternion().setFromAxisAngle(sample.normal, (Math.random() - 0.5) * 0.2);
        q.copy(qNormR).premultiply(qYawR);
        const scaleValR = 0.9 + Math.random() * 0.2;
        s.set(scaleValR, scaleValR, scaleValR);
        mat.compose(pos, q, s);
        inst.setMatrixAt(instIdx++, mat);
      }

      inst.instanceMatrix.needsUpdate = true;
      inst.computeBoundingSphere();
      inst.receiveShadow = true;
      this.pathMeshGroup.add(inst);
    });
  }

  // =========================================================================
  // 3. CANAL WATER STRIP (Spec §3)
  // =========================================================================
  private buildCanalWater() {
    // 3m wide curved canal ribbon in the canal district
    const canalTheta = 0.8;
    const canalPhiStart = 0.65;
    const canalPhiEnd = 0.95;
    const steps = 30;

    const canalGeo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= steps; i++) {
      const phi = THREE.MathUtils.lerp(canalPhiStart, canalPhiEnd, i / steps);
      const theta = canalTheta + Math.sin(i * 0.2) * 0.06;
      const norm = sphericalToNormal(theta, phi);

      // Tangent perpendicular to north-south canal flow
      const perp = new THREE.Vector3(Math.cos(theta), 0, -Math.sin(theta)).normalize();

      // Recessed slightly below ground (-0.08m)
      const centerPos = norm.clone().multiplyScalar(this.radius - 0.08);
      const leftPos = centerPos.clone().addScaledVector(perp, -1.6);
      const rightPos = centerPos.clone().addScaledVector(perp, 1.6);

      vertices.push(leftPos.x, leftPos.y, leftPos.z);
      vertices.push(rightPos.x, rightPos.y, rightPos.z);

      normals.push(norm.x, norm.y, norm.z);
      normals.push(norm.x, norm.y, norm.z);

      if (i < steps) {
        const r1 = i * 2;
        const r2 = (i + 1) * 2;
        indices.push(r1, r1 + 1, r2);
        indices.push(r1 + 1, r2 + 1, r2);
      }
    }

    canalGeo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    canalGeo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    canalGeo.setIndex(indices);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x9ec4c7, // Amsterdam canal water shimmer
      roughness: 0.1,
      metalness: 0.45,
    });

    const canalMesh = new THREE.Mesh(canalGeo, waterMat);
    this.root.add(canalMesh);

    // Arched canal bridge crossing over the canal
    const { pos: brPos, norm: brNorm } = this.getSphericalPoint(0.8, 0.8, 0.02);
    this.loader.load("/models/architecture/arched-brick-canal-bridge.glb", (gltf) => {
      const bridge = gltf.scene;
      bridge.position.copy(brPos);
      bridge.scale.setScalar(1.0);
      this.orientToNormal(bridge, brNorm, 0.8);
      this.root.add(bridge);
    });
  }

  // =========================================================================
  // 4. DISTRICT ANCHORS & LANDMARKS (Spec §2 & §5)
  // =========================================================================
  private spawnDistrictAnchors() {
    // -----------------------------------------------------------------------
    // DISTRICT 1: CANAL STREET (θ=0.8, φ=0.8)
    // -----------------------------------------------------------------------
    // Eliya's Atelier Gloss (Stepped Gable Canal House)
    const { pos: atPos, norm: atNorm } = this.getSphericalPoint(0.86, 0.74, 0);
    this.loader.load("/models/architecture/canal-house-stepped-gable.glb", (gltf) => {
      const house = gltf.scene;
      house.position.copy(atPos);
      house.scale.setScalar(1.15);
      this.orientToNormal(house, atNorm, 0.2);

      // Pink Petal Awning
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.08, 0.75),
        new THREE.MeshStandardMaterial({ color: 0xa8505e, roughness: 0.5 })
      );
      awning.position.set(0, 2.4, 0.8);
      awning.rotation.x = 0.2;
      house.add(awning);
      this.root.add(house);
    });

    this.landmarks.push({
      id: "atelier",
      name: "Eliya's Atelier Gloss",
      role: "Bespoke Glass Nails Studio",
      normal: atNorm,
      position: atPos,
      dialogue: "Welcome to Atelier Gloss. Step up to the manicure desk to shape, tint, and sculpt bespoke glass nails.",
      districtKey: "canal",
    });

    // Parked Vintage Bicycle
    const { pos: bikePos, norm: bikeNorm } = this.getSphericalPoint(0.83, 0.78, 0.02);
    this.loader.load("/models/street/vintage-bicycle-eliya.glb", (gltf) => {
      const bike = gltf.scene;
      bike.position.copy(bikePos);
      bike.scale.setScalar(0.7);
      this.orientToNormal(bike, bikeNorm, 0.4);
      this.root.add(bike);
    });

    // Canal House Neck Gable
    const { pos: neckPos, norm: neckNorm } = this.getSphericalPoint(0.98, 0.78, 0);
    this.loader.load("/models/architecture/canal-house-neck-gable.glb", (gltf) => {
      const neck = gltf.scene;
      neck.position.copy(neckPos);
      neck.scale.setScalar(1.05);
      this.orientToNormal(neck, neckNorm, 0.8);
      this.root.add(neck);
    });

    // Canal House Bell Gable (Nell the Potter)
    const { pos: bellPos, norm: bellNorm } = this.getSphericalPoint(0.72, 0.86, 0);
    this.loader.load("/models/architecture/canal-house-bell-gable.glb", (gltf) => {
      const bell = gltf.scene;
      bell.position.copy(bellPos);
      bell.scale.setScalar(1.05);
      this.orientToNormal(bell, bellNorm, 2.4);
      this.root.add(bell);
    });

    this.landmarks.push({
      id: "potter_house",
      name: "Bell Gable Ceramic House",
      role: "Nell the Potter",
      normal: bellNorm,
      position: bellPos,
      dialogue: "My pottery studio! Short almond nails with molten chrome drops that won't chip even at the wheel.",
      districtKey: "canal",
    });

    // Florist Flower Cart (Mira the Florist)
    const { pos: cartPos, norm: cartNorm } = this.getSphericalPoint(0.74, 0.76, 0.02);
    this.loader.load("/models/street/florist-flower-cart.glb", (gltf) => {
      const cart = gltf.scene;
      cart.position.copy(cartPos);
      cart.scale.setScalar(0.85);
      this.orientToNormal(cart, cartNorm, 1.1);
      this.root.add(cart);
    });

    this.landmarks.push({
      id: "florist_cart",
      name: "Mira's Flower Cart",
      role: "Mira the Florist",
      normal: cartNorm,
      position: cartPos,
      dialogue: "Eliya! My hands feel so bare… could you make me Cherry Blossom French with a little ribbon bow?",
      districtKey: "canal",
    });

    // 2 Petal Trees along Canal
    const { pos: ptPos1, norm: ptNorm1 } = this.getSphericalPoint(0.88, 0.88, 0);
    this.loader.load("/models/discoveries/petal-tree.glb", (gltf) => {
      const tree = gltf.scene;
      tree.position.copy(ptPos1);
      tree.scale.setScalar(0.85);
      this.orientToNormal(tree, ptNorm1, 0.3);
      this.root.add(tree);
    });

    const { pos: ptPos2, norm: ptNorm2 } = this.getSphericalPoint(0.68, 0.72, 0);
    this.loader.load("/models/discoveries/petal-tree.glb", (gltf) => {
      const tree = gltf.scene;
      tree.position.copy(ptPos2);
      tree.scale.setScalar(0.75);
      this.orientToNormal(tree, ptNorm2, 1.4);
      this.root.add(tree);
    });

    // Material Pickups in Canal: Sakura Petals & Freshwater Pearl
    this.spawnPickup("sakura-petal-bundle", 0.86, 0.86, "Sakura Petal · 벚꽃잎", "node_canal_sakura_1");
    this.spawnPickup("freshwater-pearl-oyster", 0.76, 0.82, "Freshwater Pearl Oyster · 담수진주", "node_canal_pearl_1");

    // -----------------------------------------------------------------------
    // DISTRICT 2: MARKET SQUARE (θ=2.1, φ=0.8)
    // -----------------------------------------------------------------------
    // Photobooth Kiosk (Pip)
    const { pos: photoPos, norm: photoNorm } = this.getSphericalPoint(2.14, 0.76, 0);
    this.loader.load("/models/architecture/photobooth-kiosk.glb", (gltf) => {
      const photo = gltf.scene;
      photo.position.copy(photoPos);
      photo.scale.setScalar(0.9);
      this.orientToNormal(photo, photoNorm, 2.1);
      this.root.add(photo);
    });

    this.landmarks.push({
      id: "photobooth",
      name: "Hongdae Life4Cuts Studio",
      role: "Pip the Photo Collector",
      normal: photoNorm,
      position: photoPos,
      dialogue: "Pip here! Ready to shoot vintage 4-cut film strips of your newest glass manicure designs?",
      districtKey: "market",
    });

    // Cafe Table Set & Market Stall Booths (Market Square center)
    const { pos: mktPos, norm: mktNorm } = this.getSphericalPoint(2.05, 0.84, 0.02);
    const marketStall = this.createStylizedMarketStall();
    marketStall.position.copy(mktPos);
    this.orientToNormal(marketStall, mktNorm, 0.5);
    this.root.add(marketStall);

    this.landmarks.push({
      id: "market_stall",
      name: "Sanne's Atelier Market Stall",
      role: "Sanne the Stall Owner",
      normal: mktNorm,
      position: mktPos,
      dialogue: "Fresh syrup bases and fine silk ribbons! Trade your excess gathered botanicals for atelier gloss.",
      districtKey: "market",
    });

    // Joon's Cafe Kiosk
    const { pos: cafePos, norm: cafeNorm } = this.getSphericalPoint(2.2, 0.84, 0.02);
    const cafeKiosk = this.createStylizedCafeKiosk();
    cafeKiosk.position.copy(cafePos);
    this.orientToNormal(cafeKiosk, cafeNorm, -0.4);
    this.root.add(cafeKiosk);

    this.landmarks.push({
      id: "joon_cafe",
      name: "Joon's Slow Matcha Kiosk",
      role: "Joon the Barista",
      normal: cafeNorm,
      position: cafePos,
      dialogue: "A warm cup of ceremonial matcha before you craft your next manicure. Take your time.",
      districtKey: "market",
    });

    // Material Pickups in Market: Silk Ribbon & Syrup Base
    this.spawnPickup("silk-ribbon-spool", 2.08, 0.72, "Silk Ribbon Spool · 실크 리본", "node_market_ribbon_1");
    this.spawnPickup("syrup-glass-vial", 2.18, 0.88, "Syrup Base Vial · 시럽 베이스", "node_market_syrup_1");

    // -----------------------------------------------------------------------
    // DISTRICT 3: TULIP MEADOW (θ=3.4, φ=0.8)
    // -----------------------------------------------------------------------
    // Greenhouse Conservatory
    const { pos: ghPos, norm: ghNorm } = this.getSphericalPoint(3.38, 0.74, 0.02);
    const greenhouse = this.createStylizedGreenhouse();
    greenhouse.position.copy(ghPos);
    this.orientToNormal(greenhouse, ghNorm, 0.2);
    this.root.add(greenhouse);

    this.landmarks.push({
      id: "greenhouse",
      name: "Oma Truus's Tulip Greenhouse",
      role: "Oma Truus the Tulip Grower",
      normal: ghNorm,
      position: ghPos,
      dialogue: "Look at these vibrant Dutch tulips! Slow, careful tending produces the richest pigments.",
      districtKey: "meadow",
    });

    // Flower Patches & Wind Chime
    const { pos: chimePos, norm: chimeNorm } = this.getSphericalPoint(3.48, 0.86, 0.02);
    this.loader.load("/models/discoveries/wind-chime.glb", (gltf) => {
      const chime = gltf.scene;
      chime.position.copy(chimePos);
      chime.scale.setScalar(0.7);
      this.orientToNormal(chime, chimeNorm, 0);
      this.root.add(chime);
    });

    this.landmarks.push({
      id: "wind_chime",
      name: "Meadow Wind Chime",
      role: "Atelier Discovery",
      normal: chimeNorm,
      position: chimePos,
      dialogue: "The breeze chimes softly over the tulip rows. +10 Gloss discovery bonus!",
      districtKey: "meadow",
    });

    // Material Pickups in Meadow: Daisy Sprig & Sakura Petal
    this.spawnPickup("daisy-sprig", 3.32, 0.82, "Daisy Sprig · 데이지", "node_meadow_daisy_1");
    this.spawnPickup("sakura-petal-bundle", 3.45, 0.78, "Meadow Sakura Petal · 벚꽃잎", "node_meadow_sakura_1");

    // -----------------------------------------------------------------------
    // DISTRICT 4: WINDMILL HILL (θ=4.7, φ=0.8)
    // -----------------------------------------------------------------------
    // Historic Windmill (Tall Landmark)
    const { pos: millPos, norm: millNorm } = this.getSphericalPoint(4.7, 0.78, 0);
    this.loader.load("/models/world/windmill.glb", (gltf) => {
      const mill = gltf.scene;
      mill.position.copy(millPos);
      mill.scale.setScalar(1.2);
      this.orientToNormal(mill, millNorm, 1.2);

      // Find rotating sails
      mill.traverse((c) => {
        if (c.name.toLowerCase().includes("blade") || c.name.toLowerCase().includes("sail")) {
          this.windmillBlades = c;
        }
      });
      this.root.add(mill);
    });

    this.landmarks.push({
      id: "windmill",
      name: "Historic Canal Windmill",
      role: "Landmark & Milling Post",
      normal: millNorm,
      position: millPos,
      dialogue: "The ancient sails turn slowly in the Dutch wind, grinding minerals into shimmering pearl mica.",
      districtKey: "windmill",
    });

    // Pines & Bird Tree
    const { pos: btPos, norm: btNorm } = this.getSphericalPoint(4.82, 0.86, 0);
    this.loader.load("/models/discoveries/bird-tree.glb", (gltf) => {
      const bt = gltf.scene;
      bt.position.copy(btPos);
      bt.scale.setScalar(0.75);
      this.orientToNormal(bt, btNorm, 0.5);
      this.root.add(bt);
    });

    const { pos: pinePos, norm: pineNorm } = this.getSphericalPoint(4.58, 0.74, 0);
    this.loader.load("/models/discoveries/forest-pine.glb", (gltf) => {
      const pine = gltf.scene;
      pine.position.copy(pinePos);
      pine.scale.setScalar(0.85);
      this.orientToNormal(pine, pineNorm, 1.0);
      this.root.add(pine);
    });

    // Material Pickups in Windmill: Chrome Droplets & Aurora Crystals
    this.spawnPickup("chrome-droplet", 4.65, 0.84, "Chrome Droplet · 크롬 방울", "node_windmill_chrome_1");
    this.spawnPickup("aurora-crystal-shard", 4.76, 0.72, "Aurora Crystal Shard · 오로라 크리스탈", "node_windmill_aurora_1");

    // -----------------------------------------------------------------------
    // DISTRICT 5: HARBOUR (θ=5.9, φ=1.05)
    // -----------------------------------------------------------------------
    // Moored Wooden Salon Boat (Bea)
    const { pos: boatPos, norm: boatNorm } = this.getSphericalPoint(5.92, 1.06, -0.06);
    this.loader.load("/models/architecture/moored-wooden-salon-boat.glb", (gltf) => {
      const boat = gltf.scene;
      boat.position.copy(boatPos);
      boat.scale.setScalar(0.95);
      this.orientToNormal(boat, boatNorm, 5.92);
      this.root.add(boat);
    });

    this.landmarks.push({
      id: "salon_boat",
      name: "Moored Wooden Salon Boat",
      role: "Bea the Houseboat Muse",
      normal: boatNorm,
      position: boatPos,
      dialogue: "Welcome aboard my houseboat salon! Soft candlelight, lapping water, and deep moonlight cat-eye polish.",
      districtKey: "harbour",
    });

    // Harbour Dock Jetty
    const { pos: dockPos, norm: dockNorm } = this.getSphericalPoint(5.82, 1.02, 0.02);
    const dockJetty = this.createStylizedHarbourDock();
    dockJetty.position.copy(dockPos);
    this.orientToNormal(dockJetty, dockNorm, 0.6);
    this.root.add(dockJetty);

    // Mooring Bollards
    const { pos: bolPos, norm: bolNorm } = this.getSphericalPoint(5.85, 1.08, 0.02);
    this.loader.load("/models/street/cast-iron-mooring-bollard.glb", (gltf) => {
      const bol = gltf.scene;
      bol.position.copy(bolPos);
      bol.scale.setScalar(0.7);
      this.orientToNormal(bol, bolNorm, 0);
      this.root.add(bol);
    });

    // Material Pickups in Harbour: Gold Leaf & Aurora Crystal
    this.spawnPickup("gold-leaf-flake", 5.86, 0.98, "Gold Leaf Flake · 금박", "node_harbour_gold_1");
    this.spawnPickup("aurora-crystal-shard", 5.98, 1.12, "Harbour Aurora Crystal · 오로라 크리스탈", "node_harbour_aurora_1");
  }

  // =========================================================================
  // 4b. NPC CHARACTERS & FLOATING QUEST MARKERS (Spec B4 & B5)
  // =========================================================================
  private spawnNPCCharacters() {
    const npcsConfig: Array<{
      key: string;
      name: string;
      role: string;
      district: string;
      theta: number;
      phi: number;
      yaw: number;
      modelId: string;
      greeting: string;
      scale?: number;
    }> = [
      {
        key: "mira",
        name: "Mira",
        role: "Florist",
        district: "canal",
        theta: 0.85,
        phi: 0.82,
        yaw: 1.1,
        modelId: "mira-florist",
        greeting: "Eliya! The morning market is opening, but my hands feel so bare without your floral jelly press-ons!",
      },
      {
        key: "nell",
        name: "Nell",
        role: "Potter",
        district: "canal",
        theta: 0.78,
        phi: 0.76,
        yaw: 2.4,
        modelId: "nell-potter",
        greeting: "Eliya! Normal polish chips in five seconds at the pottery wheel. I need your sculpted nail armor!",
      },
      {
        key: "pip",
        name: "Pip",
        role: "Photo Collector",
        district: "market",
        theta: 2.12,
        phi: 0.80,
        yaw: 2.1,
        modelId: "pip-photo",
        greeting: "Eliya! The Life4Cuts arcade booth is primed, but we need your iconic Glass Manicure for today's lookbook strip!",
      },
      {
        key: "joon",
        name: "Joon",
        role: "Barista",
        district: "market",
        theta: 2.15,
        phi: 0.78,
        yaw: -0.4,
        modelId: "joon-barista",
        greeting: "Eliya, an-nyeong! A calm morning calls for deep jade matcha tint with gold rim.",
      },
      {
        key: "sanne",
        name: "Sanne",
        role: "Market Stall Owner",
        district: "market",
        theta: 2.05,
        phi: 0.82,
        yaw: 0.5,
        modelId: "sanne-stall",
        greeting: "Fresh syrup bases and fine silk ribbons! Trade your excess gathered botanicals for atelier gloss.",
      },
      {
        key: "truus",
        name: "Oma Truus",
        role: "Tulip Grower",
        district: "meadow",
        theta: 3.42,
        phi: 0.80,
        yaw: 0.2,
        modelId: "truus-tulips",
        greeting: "Dag kindje! The tulip bulbs are blooming in the greenhouse. Something soft and floral for an old grower?",
      },
      {
        key: "lotte",
        name: "Lotte",
        role: "Junior Apprentice",
        district: "meadow",
        theta: 3.38,
        phi: 0.82,
        yaw: 1.5,
        scale: 0.72,
        modelId: "lotte-junior",
        greeting: "Eliya!! Look look! I'm practicing my brush strokes! Can you show me how a real Master crafts rainbow jelly nails?",
      },
      {
        key: "bea",
        name: "Bea",
        role: "Houseboat Muse",
        district: "harbour",
        theta: 5.92,
        phi: 1.05,
        yaw: 5.92,
        modelId: "bea-houseboat",
        greeting: "Eliya, darling! The canal reflects the street lanterns so softly tonight, but my nails are waiting for your cosmic velvet touch.",
      },
    ];

    for (const npc of npcsConfig) {
      const { pos, norm } = this.getSphericalPoint(npc.theta, npc.phi, 0);

      // Register interactable landmark for the NPC
      this.landmarks.push({
        id: `npc_${npc.key}`,
        name: `${npc.name} (${npc.role})`,
        role: npc.role,
        normal: norm,
        position: pos,
        dialogue: npc.greeting,
        districtKey: npc.district,
        npcKey: npc.key,
      });

      // Load 3D Character Model
      this.loader.load(
        `/models/npcs/${npc.modelId}.glb`,
        (gltf) => {
          const char = gltf.scene;
          char.position.copy(pos);
          const s = npc.scale ?? 0.85;
          char.scale.setScalar(s);
          this.orientToNormal(char, norm, npc.yaw);
          (char as any).userData = { npcKey: npc.key, lastSway: 0 };
          this.npcs.push(char);
          this.root.add(char);
        },
        undefined,
        (err) => console.warn(`[Planet] Failed to load NPC model ${npc.modelId}:`, err)
      );

      // Load Floating Quest Marker Diamond above head
      this.loader.load(
        "/models/ui/quest-marker.glb",
        (gltf) => {
          const marker = gltf.scene;
          const markerBasePos = norm.clone().multiplyScalar(this.radius + 1.45);
          marker.position.copy(markerBasePos);
          marker.scale.setScalar(0.7);
          this.orientToNormal(marker, norm, 0);
          this.root.add(marker);

          this.npcQuestMarkers.push({
            npcKey: npc.key,
            marker,
            basePos: markerBasePos,
            normal: norm,
          });
        },
        undefined,
        (err) => console.warn(`[Planet] Failed to load quest marker for ${npc.key}:`, err)
      );
    }
  }

  // =========================================================================
  // 5. MATERIAL PICKUPS WITH GLOW NODES (Spec B3)
  // =========================================================================
  private spawnPickup(
    modelName: string,
    theta: number,
    phi: number,
    label: string,
    nodeKey: string
  ) {
    const { pos, norm } = this.getSphericalPoint(theta, phi, 0.05);
    const path = `/models/pickups/${modelName}.glb`;

    this.loader.load(path, (gltf) => {
      const model = gltf.scene;
      model.position.copy(pos);
      model.scale.setScalar(0.85);
      this.orientToNormal(model, norm, Math.random() * Math.PI * 2);

      // Track glow node for pulsing animation
      model.traverse((c) => {
        if (c.name.includes("Glow")) {
          this.pickupGlows.push(c);
        }
      });

      this.pickupMeshes.set(nodeKey, model);
      this.root.add(model);
    });

    this.landmarks.push({
      id: `pickup_${nodeKey}`,
      name: label,
      role: "Crafting Resource Pickup",
      normal: norm,
      position: pos,
      dialogue: `Collected material for your manicure charms!`,
      nodeKey,
    });
  }

  public setNodeHarvested(nodeKey: string, readyAt: number) {
    this.depletedNodes.set(nodeKey, readyAt);
    const mesh = this.pickupMeshes.get(nodeKey);
    if (mesh) {
      mesh.visible = false;
    }
  }

  public syncNodeStates(states: Array<{ nodeKey: string; readyAt: number }>) {
    const now = Date.now();
    for (const s of states) {
      if (s.readyAt > now) {
        this.setNodeHarvested(s.nodeKey, s.readyAt);
      }
    }
  }

  // =========================================================================
  // 6. STREET LANTERNS ALONG PATHS (Spec §5)
  // =========================================================================
  private spawnPathLanterns() {
    this.loader.load("/models/street/amsterdam-lantern-post.glb", (gltf) => {
      const lanternTemplate = gltf.scene;
      // Place along path samples every ~10 meters (roughly every 20 samples)
      for (let i = 8; i < this.pathSamples.length; i += 22) {
        const sample = this.pathSamples[i];
        const lantern = lanternTemplate.clone();

        // Place on the side of the path (+1.2m offset)
        const nextSample = this.pathSamples[Math.min(this.pathSamples.length - 1, i + 1)];
        const fwd = nextSample.pos.clone().sub(sample.pos).normalize();
        const perp = new THREE.Vector3().crossVectors(fwd, sample.normal).normalize();

        const placedPos = sample.pos.clone().addScaledVector(perp, 1.2);
        lantern.position.copy(placedPos);
        lantern.scale.setScalar(0.7);
        this.orientToNormal(lantern, sample.normal, 0);

        // Warm light source
        const light = new THREE.PointLight(0xffecd0, 0, 6.0);
        light.position.copy(placedPos.clone().addScaledVector(sample.normal, 1.8));
        this.root.add(light);
        this.lanternLights.push(light);

        // Find glass/bulb material for emissive switching
        lantern.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            const mesh = c as THREE.Mesh;
            const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
            mesh.material = mat;
            this.lanternMaterials.push(mat);
          }
        });

        this.root.add(lantern);
      }
    });
  }

  // =========================================================================
  // 7. INSTANCED FILLER SCATTER (Spec §4)
  // =========================================================================
  private loadInstancedFillerModels() {
    // 1. Meadow Dutch Tulip Rows (Pink, Red, Yellow, White)
    this.spawnMeadowTulipRows();

    // 2. Instanced Grass Tufts across all districts
    this.spawnInstancedDistrictFiller("grass-tuft-a", 160, 0.45);
    this.spawnInstancedDistrictFiller("grass-tuft-b", 160, 0.45);
    this.spawnInstancedDistrictFiller("grass-tuft-c", 160, 0.45);

    // 3. Round Bushes & Clovers
    this.spawnInstancedDistrictFiller("clover-patch", 80, 0.65);
    this.spawnInstancedDistrictFiller("round-bush-small", 45, 1.2);
    this.spawnInstancedDistrictFiller("round-bush-large", 35, 1.6);
    this.spawnInstancedDistrictFiller("pebble-set", 65, 0.8);
    this.spawnInstancedDistrictFiller("mushroom-pair", 35, 1.0);
    this.spawnInstancedDistrictFiller("fallen-petals", 60, 0.6);
  }

  // 6-8 parallel curved rows of tulips alternating colour in Meadow (Spec §4)
  private spawnMeadowTulipRows() {
    const meadow = DISTRICTS.find((d) => d.key === "meadow")!;
    const tulipColors = [
      "tulip-cluster-pink",
      "tulip-cluster-red",
      "tulip-cluster-yellow",
      "tulip-cluster-white",
      "tulip-cluster-pink",
      "tulip-cluster-red",
      "tulip-cluster-yellow",
    ];

    tulipColors.forEach((colorId, rowIdx) => {
      this.loader.load(`/models/filler/${colorId}.glb`, (gltf) => {
        let tulipMesh: THREE.Mesh | null = null;
        gltf.scene.traverse((c) => {
          if ((c as THREE.Mesh).isMesh && !tulipMesh) {
            tulipMesh = c as THREE.Mesh;
          }
        });
        if (!tulipMesh) return;

        const countPerRow = 32;
        const inst = new THREE.InstancedMesh(
          (tulipMesh as any).geometry,
          (tulipMesh as any).material,
          countPerRow
        );

        // Apply wind sway shader
        this.applyWindSwayShader((tulipMesh as any).material);

        const rowPhiOffset = (rowIdx - 3) * 0.045;
        const mat = new THREE.Matrix4();
        const pos = new THREE.Vector3();
        const q = new THREE.Quaternion();
        const s = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);

        for (let i = 0; i < countPerRow; i++) {
          const t = i / countPerRow;
          const theta = meadow.centerTheta - 0.22 + t * 0.44;
          const phi = meadow.centerPhi + rowPhiOffset + Math.sin(t * Math.PI) * 0.03;

          const { pos: pPos, norm: pNorm } = this.getSphericalPoint(theta, phi, 0);
          pos.copy(pPos);

          const qNorm = new THREE.Quaternion().setFromUnitVectors(up, pNorm);
          const qYaw = new THREE.Quaternion().setFromAxisAngle(pNorm, (Math.random() - 0.5) * 0.3);
          q.copy(qNorm).premultiply(qYaw);

          const scaleVal = 0.85 + Math.random() * 0.25;
          s.set(scaleVal, scaleVal, scaleVal);

          mat.compose(pos, q, s);
          inst.setMatrixAt(i, mat);
        }

        inst.instanceMatrix.needsUpdate = true;
        inst.computeBoundingSphere();
        inst.receiveShadow = true;
        this.fillerGroup.add(inst);
      });
    });
  }

  // Poisson-disk scatter per district (Spec §4)
  private spawnInstancedDistrictFiller(modelId: string, totalCount: number, minDist: number) {
    this.loader.load(`/models/filler/${modelId}.glb`, (gltf) => {
      let sourceMesh: THREE.Mesh | null = null;
      gltf.scene.traverse((c) => {
        if ((c as THREE.Mesh).isMesh && !sourceMesh) {
          sourceMesh = c as THREE.Mesh;
        }
      });
      if (!sourceMesh) return;

      // Apply wind shader to grass models
      if (modelId.startsWith("grass-tuft")) {
        this.applyWindSwayShader((sourceMesh as any).material);
      }

      const inst = new THREE.InstancedMesh(
        (sourceMesh as any).geometry,
        (sourceMesh as any).material,
        totalCount
      );

      const mat = new THREE.Matrix4();
      const pos = new THREE.Vector3();
      const q = new THREE.Quaternion();
      const s = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);

      let placed = 0;
      const countPerDistrict = Math.floor(totalCount / DISTRICTS.length);

      for (const d of DISTRICTS) {
        const rng = createMulberry32(stringToSeed(d.key + modelId));
        const centerNorm = sphericalToNormal(d.centerTheta, d.centerPhi);

        for (let i = 0; i < countPerDistrict && placed < totalCount; i++) {
          // Polar sampling within district radius
          const angle = rng() * Math.PI * 2;
          const distRad = Math.sqrt(rng()) * d.radius;

          const theta = d.centerTheta + Math.cos(angle) * distRad;
          const phi = d.centerPhi + Math.sin(angle) * distRad;

          const { pos: pPos, norm: pNorm } = this.getSphericalPoint(theta, phi, 0);

          // Rejection check: don't place on path
          if (this.isPointOnPath(pNorm)) continue;

          pos.copy(pPos);

          const qNorm = new THREE.Quaternion().setFromUnitVectors(up, pNorm);
          const qYaw = new THREE.Quaternion().setFromAxisAngle(pNorm, rng() * Math.PI * 2);
          q.copy(qNorm).premultiply(qYaw);

          const scaleVal = 0.8 + rng() * 0.4;
          s.set(scaleVal, scaleVal, scaleVal);

          mat.compose(pos, q, s);
          inst.setMatrixAt(placed++, mat);
        }
      }

      inst.count = placed;
      inst.instanceMatrix.needsUpdate = true;
      inst.computeBoundingSphere();
      inst.receiveShadow = true;
      this.fillerGroup.add(inst);
    });
  }

  // Wind sway vertex shader using onBeforeCompile (Spec §4)
  private applyWindSwayShader(mat: THREE.MeshStandardMaterial) {
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.windUniforms.uTime;
      shader.vertexShader = `
        uniform float uTime;
        ${shader.vertexShader}
      `;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
        #include <begin_vertex>
        float sway = sin(uTime * 1.5 + position.x * 2.0 + position.z * 2.0) * 0.04 * max(0.0, transformed.y);
        transformed.x += sway;
        transformed.z += sway * 0.5;
        `
      );
    };
  }

  // Path detection for bicycle speed boost (+10% on paths per Spec §3)
  public isPointOnPath(normal: THREE.Vector3): boolean {
    const checkRadius = 1.2 / this.radius; // 1.2m threshold in radians
    for (let i = 0; i < this.pathSamples.length; i += 3) {
      if (normal.distanceTo(this.pathSamples[i].normal) < checkRadius) {
        return true;
      }
    }
    return false;
  }

  // Nearest interactable landmark check
  public getNearestLandmark(
    playerPos: THREE.Vector3,
    maxDistance = 2.8
  ): { landmark: PlanetLandmark; distance: number } | null {
    let nearest: PlanetLandmark | null = null;
    let minDist = maxDistance;

    for (const lm of this.landmarks) {
      const dist = playerPos.distanceTo(lm.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = lm;
      }
    }

    return nearest ? { landmark: nearest, distance: minDist } : null;
  }

  // =========================================================================
  // 8. ANIMATION & NIGHT/DAY CYCLE (Spec §5 & §6)
  // =========================================================================
  public update(delta: number) {
    this.windUniforms.uTime.value += delta;

    // Rotate windmill blades
    if (this.windmillBlades) {
      this.windmillBlades.rotation.z += delta * 0.8;
    }

    // Pulse material pickup glow nodes
    const pulse = 1.0 + Math.sin(this.windUniforms.uTime.value * 3.5) * 0.15;
    for (const glow of this.pickupGlows) {
      glow.scale.set(pulse, pulse, pulse);
    }

    // Respawn depleted pickups when timer expires
    const now = Date.now();
    for (const [key, readyAt] of this.depletedNodes.entries()) {
      if (now >= readyAt) {
        this.depletedNodes.delete(key);
        const mesh = this.pickupMeshes.get(key);
        if (mesh) {
          mesh.visible = true;
        }
      }
    }

    // Switch lanterns on at night (game time >= 20:00 or < 06:00)
    const isNight = gameConvex.isNight();
    const targetLightIntensity = isNight ? 1.6 : 0.0;
    const targetEmissive = isNight ? 0.9 : 0.0;

    for (const l of this.lanternLights) {
      l.intensity = THREE.MathUtils.lerp(l.intensity, targetLightIntensity, delta * 3.0);
    }
    for (const m of this.lanternMaterials) {
      if (m.emissive) {
        m.emissive.setRGB(0.9 * targetEmissive, 0.7 * targetEmissive, 0.4 * targetEmissive);
      }
    }

    // Animate NPC gentle idle sway
    const time = this.windUniforms.uTime.value;
    for (let i = 0; i < this.npcs.length; i++) {
      const npc = this.npcs[i];
      const sway = Math.sin(time * 2.2 + i * 1.3) * 0.02;
      npc.rotation.z += sway - (npc.userData.lastSway || 0);
      npc.userData.lastSway = sway;
    }

    // Animate Quest Markers (spin + bob + visibility based on quests)
    for (const qm of this.npcQuestMarkers) {
      qm.marker.rotateOnAxis(new THREE.Vector3(0, 1, 0), delta * 2.2);
      const bob = Math.sin(time * 3.5 + stringToSeed(qm.npcKey)) * 0.05;
      qm.marker.position.copy(qm.basePos).addScaledVector(qm.normal, bob);

      const ticket = questSystem.getTicket(qm.npcKey);
      qm.marker.visible = !!ticket && ticket.status !== "delivered";
    }
  }

  // =========================================================================
  // STYLIZED PROCEDURAL STRUCTURES (Placeholders per Spec)
  // =========================================================================
  private createStylizedMarketStall(): THREE.Group {
    const group = new THREE.Group();
    // Counter
    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.9, 0.7),
      new THREE.MeshStandardMaterial({ color: 0xac8061, roughness: 0.75 }) // pal_wood
    );
    counter.position.y = 0.45;
    group.add(counter);

    // Striped Awning
    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.1, 1.0),
      new THREE.MeshStandardMaterial({ color: 0xa8505e, roughness: 0.5 }) // pal_petal
    );
    awning.position.set(0, 1.8, 0.1);
    awning.rotation.x = 0.15;
    group.add(awning);

    // Posts
    const postMat = new THREE.MeshStandardMaterial({ color: 0x2a2a38, roughness: 0.6 }); // pal_ink
    for (const x of [-0.65, 0.65]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8), postMat);
      post.position.set(x, 0.9, 0.35);
      group.add(post);
    }
    return group;
  }

  private createStylizedCafeKiosk(): THREE.Group {
    const group = new THREE.Group();
    // Kiosk body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.8, 1.4),
      new THREE.MeshStandardMaterial({ color: 0xf8f6f1, roughness: 0.8 }) // pal_cream
    );
    body.position.y = 0.9;
    group.add(body);

    // Sage Green Counter Top & Awning
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.12, 1.6),
      new THREE.MeshStandardMaterial({ color: 0xb3caba, roughness: 0.6 }) // pal_sage
    );
    roof.position.y = 1.85;
    group.add(roof);

    return group;
  }

  private createStylizedGreenhouse(): THREE.Group {
    const group = new THREE.Group();
    // Glass walls
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xe0cdb3,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.65,
    });
    const house = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.6, 1.8), glassMat);
    house.position.y = 0.8;
    group.add(house);

    // Peaked roof
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(1.4, 0.8, 4),
      new THREE.MeshStandardMaterial({ color: 0xc78a75, roughness: 0.7 }) // pal_terracotta
    );
    roof.position.y = 2.0;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);

    return group;
  }

  private createStylizedHarbourDock(): THREE.Group {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xac8061, roughness: 0.85 }); // pal_wood
    const plank = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 1.0), woodMat);
    plank.position.y = 0.1;
    group.add(plank);

    for (const x of [-0.9, 0.9]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6), woodMat);
      leg.position.set(x, -0.2, 0);
      group.add(leg);
    }
    return group;
  }
}
