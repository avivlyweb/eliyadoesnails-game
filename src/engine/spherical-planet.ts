import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export interface PlanetLandmark {
  id: string;
  name: string;
  role: string;
  normal: THREE.Vector3;
  position: THREE.Vector3;
  modelPath?: string;
  dialogue: string;
}

export class SphericalPlanet {
  public scene: THREE.Scene;
  public root: THREE.Group;
  public readonly radius: number = 26; // Planetoid radius
  public loader: GLTFLoader;

  public landmarks: PlanetLandmark[] = [];
  public npcs: THREE.Group[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.loader = new GLTFLoader();

    this.buildTerrain();
    this.spawnAtelierAndCanalHouses();
    this.spawnQuayStreetProps();
    this.spawnBoutiquesAndBridges();
    this.spawnNatureAndCanalFlora();
    this.spawnTownNeighbors();
  }

  // Spherical polar coordinate helper
  public getSphericalPoint(theta: number, phi: number, rOffset = 0): { pos: THREE.Vector3; norm: THREE.Vector3 } {
    const r = this.radius + rOffset;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    const norm = new THREE.Vector3(sinPhi * sinTheta, cosPhi, sinPhi * cosTheta).normalize();
    const pos = norm.clone().multiplyScalar(r);
    return { pos, norm };
  }

  // Align an object's Up to normal and orient Yaw
  public orientToNormal(object: THREE.Object3D, normal: THREE.Vector3, yaw = 0) {
    const up = new THREE.Vector3(0, 1, 0);
    const qNorm = new THREE.Quaternion().setFromUnitVectors(up, normal);
    const qYaw = new THREE.Quaternion().setFromAxisAngle(normal, yaw);
    object.quaternion.copy(qNorm).premultiply(qYaw);
  }

  // 1. Planetoid Core Surface with Eliya's Warm Cream & Muted Sage Palette
  private buildTerrain() {
    // Planet Surface (Soft Sage Green)
    const earthGeo = new THREE.SphereGeometry(this.radius, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x768f72, // Eliya Muted Sage
      roughness: 0.92,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.receiveShadow = true;
    this.root.add(earth);

    // Warm Silk-Cream Cobblestone Street Belt
    const streetGeo = new THREE.CylinderGeometry(this.radius + 0.04, this.radius + 0.04, 12, 64, 1, true);
    const streetMat = new THREE.MeshStandardMaterial({
      color: 0xeae4db, // Warm cream cobblestone (#FAF7F5 palette complement)
      roughness: 0.78,
    });
    const streetBelt = new THREE.Mesh(streetGeo, streetMat);
    streetBelt.receiveShadow = true;
    this.root.add(streetBelt);

    // Deep Canal Water Ring
    const canalGeo = new THREE.CylinderGeometry(this.radius - 0.12, this.radius - 0.12, 6, 64, 1, true);
    const canalMat = new THREE.MeshStandardMaterial({
      color: 0x24464c, // Amsterdam canal water
      roughness: 0.12,
      metalness: 0.88,
    });
    const canalRing = new THREE.Mesh(canalGeo, canalMat);
    canalRing.position.y = -3.0;
    this.root.add(canalRing);
  }

  // 2. Spawn Eliya's Atelier Gloss & Amsterdam Canal Architecture
  private spawnAtelierAndCanalHouses() {
    // 1. ELIYA'S ATELIER GLOSS (Stepped Gable Canal House + Full Salon Atelier)
    const { pos: atPos, norm: atNorm } = this.getSphericalPoint(0.8, 0.8, 0);
    this.loader.load("/models/architecture/canal-house-stepped-gable.glb", (gltf) => {
      const house = gltf.scene;
      house.position.copy(atPos);
      house.scale.setScalar(1.25);
      this.orientToNormal(house, atNorm, 0.2);

      // Atelier Boutique Awning in --accent-petal (#a8505e) & Rose entrance trim
      const awningGeo = new THREE.BoxGeometry(1.8, 0.08, 0.8);
      const awningMat = new THREE.MeshStandardMaterial({
        color: 0xa8505e,
        roughness: 0.5,
      });
      const awning = new THREE.Mesh(awningGeo, awningMat);
      awning.position.set(0, 2.6, 0.9);
      awning.rotation.x = 0.22;
      house.add(awning);

      this.root.add(house);
    });

    // Parked Vintage Bicycle in front of Atelier
    const { pos: bikePos, norm: bikeNorm } = this.getSphericalPoint(0.74, 0.86, 0.05);
    this.loader.load("/models/street/vintage-bicycle-eliya.glb", (gltf) => {
      const bike = gltf.scene;
      bike.position.copy(bikePos);
      bike.scale.setScalar(0.75);
      this.orientToNormal(bike, bikeNorm, 0.6);
      this.root.add(bike);
    });

    // DELUXE MANICURE STATION & TABLETOP CLUTTER
    const { pos: stPos, norm: stNorm } = this.getSphericalPoint(0.86, 0.84, 0.05);
    this.loader.load("/models/furniture/manicure-station-deluxe.glb", (gltf) => {
      const station = gltf.scene;
      station.position.copy(stPos);
      station.scale.setScalar(0.9);
      this.orientToNormal(station, stNorm, 0.4);
      this.root.add(station);
    });

    // Tabletop Prop 1: Desktop UV Tunnel Lamp ("The Halo")
    const { pos: uvPos, norm: uvNorm } = this.getSphericalPoint(0.87, 0.835, 0.06);
    this.loader.load("/models/station/desktop-uv-tunnel-lamp.glb", (gltf) => {
      const uv = gltf.scene;
      uv.position.copy(uvPos);
      uv.scale.setScalar(0.7);
      this.orientToNormal(uv, uvNorm, 0.4);
      this.root.add(uv);

      const uvLight = new THREE.PointLight(0xa582f7, 0.9, 3.5);
      uvLight.position.copy(uvPos.clone().addScaledVector(uvNorm, 0.3));
      this.root.add(uvLight);
    });

    // Tabletop Prop 2: Linen Velvet Hand Pillow
    const { pos: pilPos, norm: pilNorm } = this.getSphericalPoint(0.86, 0.842, 0.06);
    this.loader.load("/models/station/linen-velvet-hand-pillow.glb", (gltf) => {
      const pillow = gltf.scene;
      pillow.position.copy(pilPos);
      pillow.scale.setScalar(0.75);
      this.orientToNormal(pillow, pilNorm, 0.4);
      this.root.add(pillow);
    });

    // Tabletop Prop 3: Scalloped Ceramic Charm Palette
    const { pos: palPos, norm: palNorm } = this.getSphericalPoint(0.852, 0.844, 0.06);
    this.loader.load("/models/station/scalloped-ceramic-charm-palette.glb", (gltf) => {
      const pal = gltf.scene;
      pal.position.copy(palPos);
      pal.scale.setScalar(0.65);
      this.orientToNormal(pal, palNorm, 0.1);
      this.root.add(pal);
    });

    // Tabletop Prop 4: Steaming Ceramic Matcha Mug
    const { pos: mugPos, norm: mugNorm } = this.getSphericalPoint(0.855, 0.836, 0.06);
    this.loader.load("/models/station/steaming-ceramic-matcha-mug.glb", (gltf) => {
      const mug = gltf.scene;
      mug.position.copy(mugPos);
      mug.scale.setScalar(0.7);
      this.orientToNormal(mug, mugNorm, 0.8);
      this.root.add(mug);
    });

    // Tabletop Prop 5: Couture Press-On Drawer Box
    const { pos: boxPos, norm: boxNorm } = this.getSphericalPoint(0.868, 0.848, 0.06);
    this.loader.load("/models/station/couture-press-on-drawer-box.glb", (gltf) => {
      const box = gltf.scene;
      box.position.copy(boxPos);
      box.scale.setScalar(0.7);
      this.orientToNormal(box, boxNorm, 0.3);
      this.root.add(box);
    });

    // Tabletop Prop 6: Glass Syrup Swatch Discs
    const { pos: discPos, norm: discNorm } = this.getSphericalPoint(0.862, 0.846, 0.06);
    this.loader.load("/models/tools/glass-syrup-swatch-discs.glb", (gltf) => {
      const discs = gltf.scene;
      discs.position.copy(discPos);
      discs.scale.setScalar(0.65);
      this.orientToNormal(discs, discNorm, 0.2);
      this.root.add(discs);
    });

    // Client Boucle Tub Chair
    const { pos: chPos, norm: chNorm } = this.getSphericalPoint(0.89, 0.855, 0.05);
    this.loader.load("/models/furniture/client-boucle-tub-chair.glb", (gltf) => {
      const chair = gltf.scene;
      chair.position.copy(chPos);
      chair.scale.setScalar(0.85);
      this.orientToNormal(chair, chNorm, -0.6);
      this.root.add(chair);
    });

    // Stylist Swivel Stool
    const { pos: stoolPos, norm: stoolNorm } = this.getSphericalPoint(0.835, 0.835, 0.05);
    this.loader.load("/models/furniture/stylist-swivel-stool.glb", (gltf) => {
      const stool = gltf.scene;
      stool.position.copy(stoolPos);
      stool.scale.setScalar(0.8);
      this.orientToNormal(stool, stoolNorm, 1.2);
      this.root.add(stool);
    });

    // Rolling Treatment Cart with Tools
    const { pos: cartPos, norm: cartNorm } = this.getSphericalPoint(0.84, 0.85, 0.05);
    this.loader.load("/models/furniture/rolling-treatment-cart.glb", (gltf) => {
      const cart = gltf.scene;
      cart.position.copy(cartPos);
      cart.scale.setScalar(0.8);
      this.orientToNormal(cart, cartNorm, 0.1);
      this.root.add(cart);
    });

    // Potted Fiddle Leaf Fig
    const { pos: figPos, norm: figNorm } = this.getSphericalPoint(0.76, 0.83, 0.05);
    this.loader.load("/models/furniture/potted-fiddle-leaf-fig.glb", (gltf) => {
      const fig = gltf.scene;
      fig.position.copy(figPos);
      fig.scale.setScalar(0.9);
      this.orientToNormal(fig, figNorm, 0);
      this.root.add(fig);
    });

    // Brass Arc Floor Lamp
    const { pos: lampPos, norm: lampNorm } = this.getSphericalPoint(0.82, 0.81, 0.05);
    this.loader.load("/models/furniture/brass-arc-floor-lamp.glb", (gltf) => {
      const lamp = gltf.scene;
      lamp.position.copy(lampPos);
      lamp.scale.setScalar(0.9);
      this.orientToNormal(lamp, lampNorm, 0.5);
      this.root.add(lamp);

      const lampLight = new THREE.PointLight(0xffecd0, 1.4, 5);
      lampLight.position.copy(lampPos.clone().addScaledVector(lampNorm, 2.2));
      this.root.add(lampLight);
    });

    // Floating Lacquer Display Rack
    const { pos: lacqPos, norm: lacqNorm } = this.getSphericalPoint(0.78, 0.85, 0.05);
    this.loader.load("/models/furniture/floating-lacquer-display.glb", (gltf) => {
      const lacq = gltf.scene;
      lacq.position.copy(lacqPos);
      lacq.scale.setScalar(0.8);
      this.orientToNormal(lacq, lacqNorm, 0);
      this.root.add(lacq);
    });

    // Washi Folding Privacy Screen
    const { pos: washiPos, norm: washiNorm } = this.getSphericalPoint(0.92, 0.82, 0.05);
    this.loader.load("/models/furniture/washi-folding-screen.glb", (gltf) => {
      const screen = gltf.scene;
      screen.position.copy(washiPos);
      screen.scale.setScalar(0.85);
      this.orientToNormal(screen, washiNorm, -0.4);
      this.root.add(screen);
    });

    // Celadon Tea Ceremony Set on Pedestal
    const { pos: teaPos, norm: teaNorm } = this.getSphericalPoint(0.73, 0.84, 0.05);
    this.loader.load("/models/station/celadon-tea-ceremony-set.glb", (gltf) => {
      const tea = gltf.scene;
      tea.position.copy(teaPos);
      tea.scale.setScalar(0.75);
      this.orientToNormal(tea, teaNorm, 0.5);
      this.root.add(tea);
    });

    // AR Hand Mannequin Pedestal
    const { pos: arPos, norm: arNorm } = this.getSphericalPoint(0.71, 0.87, 0.05);
    this.loader.load("/models/furniture/ar-hand-mannequin-pedestal.glb", (gltf) => {
      const ar = gltf.scene;
      ar.position.copy(arPos);
      ar.scale.setScalar(0.8);
      this.orientToNormal(ar, arNorm, 0.8);
      this.root.add(ar);
    });

    this.landmarks.push({
      id: "atelier",
      name: "Eliya's Atelier Gloss",
      role: "Bespoke Glass Nails Studio",
      normal: atNorm,
      position: atPos,
      dialogue: "Welcome to Atelier Gloss. Step up to the travertine manicure desk to shape, tint, and sculpt custom glass nails.",
    });

    // 2. Historic Neck Gable Canal House
    const { pos: neckPos, norm: neckNorm } = this.getSphericalPoint(1.4, 0.92, 0);
    this.loader.load("/models/architecture/canal-house-neck-gable.glb", (gltf) => {
      const neck = gltf.scene;
      neck.position.copy(neckPos);
      neck.scale.setScalar(1.2);
      this.orientToNormal(neck, neckNorm, 1.2);
      this.root.add(neck);
    });

    // 3. Bell Gable Canal House (Nell's Ceramic Workshop)
    const { pos: bellPos, norm: bellNorm } = this.getSphericalPoint(4.85, 0.9, 0);
    this.loader.load("/models/architecture/canal-house-bell-gable.glb", (gltf) => {
      const bell = gltf.scene;
      bell.position.copy(bellPos);
      bell.scale.setScalar(1.2);
      this.orientToNormal(bell, bellNorm, 4.8);
      this.root.add(bell);
    });

    this.landmarks.push({
      id: "potter_house",
      name: "Bell Gable Ceramic House",
      role: "Nell the Potter",
      normal: bellNorm,
      position: bellPos,
      dialogue: "My custom short almond set! Molten chrome drops that won't chip even at the pottery wheel!",
    });
  }

  // 3. Spawn Bridges, Salon Boat & Photobooth
  private spawnBoutiquesAndBridges() {
    // 1. Arched Brick Canal Bridge
    const { pos: brPos, norm: brNorm } = this.getSphericalPoint(2.85, 1.1, 0);
    this.loader.load("/models/architecture/arched-brick-canal-bridge.glb", (gltf) => {
      const bridge = gltf.scene;
      bridge.position.copy(brPos);
      bridge.scale.setScalar(1.15);
      this.orientToNormal(bridge, brNorm, 2.85);
      this.root.add(bridge);
    });

    // 2. Moored Wooden Salon Boat in the Canal
    const { pos: boatPos, norm: boatNorm } = this.getSphericalPoint(3.2, 1.25, -0.15);
    this.loader.load("/models/architecture/moored-wooden-salon-boat.glb", (gltf) => {
      const boat = gltf.scene;
      boat.position.copy(boatPos);
      boat.scale.setScalar(1.05);
      this.orientToNormal(boat, boatNorm, 3.2);
      this.root.add(boat);
    });

    // Boucle Chair on Boat Deck
    const { pos: boatChairPos, norm: boatChairNorm } = this.getSphericalPoint(3.22, 1.23, -0.1);
    this.loader.load("/models/furniture/client-boucle-chair.glb", (gltf) => {
      const chair = gltf.scene;
      chair.position.copy(boatChairPos);
      chair.scale.setScalar(0.75);
      this.orientToNormal(chair, boatChairNorm, 2.8);
      this.root.add(chair);
    });

    this.landmarks.push({
      id: "salon_boat",
      name: "Moored Canal Houseboat",
      role: "Canal Neighbor",
      normal: boatNorm,
      position: boatPos,
      dialogue: "The liquid chrome set shimmers on the water like molten moonlight. Thank you, Eliya!",
    });

    // 3. Hongdae Life4Cuts Photobooth Kiosk
    const { pos: boothPos, norm: boothNorm } = this.getSphericalPoint(0.35, 1.05, 0.05);
    this.loader.load("/models/architecture/photobooth-kiosk.glb", (gltf) => {
      const booth = gltf.scene;
      booth.position.copy(boothPos);
      booth.scale.setScalar(1.1);
      this.orientToNormal(booth, boothNorm, 0.35);
      this.root.add(booth);
    });

    // Life4Cuts Photo Strip Prop by Booth
    const { pos: stripPos, norm: stripNorm } = this.getSphericalPoint(0.38, 1.07, 0.06);
    this.loader.load("/models/station/life4cuts-photo-strip.glb", (gltf) => {
      const strip = gltf.scene;
      strip.position.copy(stripPos);
      strip.scale.setScalar(0.9);
      this.orientToNormal(strip, stripNorm, 0.2);
      this.root.add(strip);
    });

    this.landmarks.push({
      id: "photobooth",
      name: "Hongdae Life4Cuts Photobooth",
      role: "4-Cut Photo Strip Studio",
      normal: boothNorm,
      position: boothPos,
      dialogue: "Step inside to capture aesthetic 4-cut snapshot strips of your completed manicure!",
    });

    // 4. Dutch Windmill on the Horizon Ridge
    const { pos: millPos, norm: millNorm } = this.getSphericalPoint(5.6, 0.72, 0);
    this.loader.load("/models/world/windmill.glb", (gltf) => {
      const mill = gltf.scene;
      mill.position.copy(millPos);
      mill.scale.setScalar(1.1);
      this.orientToNormal(mill, millNorm, 5.6);
      this.root.add(mill);
    });
  }

  // 4. Street Clutter: Flower Carts, Lanterns, Benches, Cast Iron Bollards
  private spawnQuayStreetProps() {
    // 1. Florist Flower Cart by the Canal Bridge
    const { pos: cartPos, norm: cartNorm } = this.getSphericalPoint(2.55, 1.02, 0.05);
    this.loader.load("/models/street/florist-flower-cart.glb", (gltf) => {
      const cart = gltf.scene;
      cart.position.copy(cartPos);
      cart.scale.setScalar(1.1);
      this.orientToNormal(cart, cartNorm, 1.4);
      this.root.add(cart);
    });

    this.landmarks.push({
      id: "florist",
      name: "Mira's Flower Cart",
      role: "The Florist",
      normal: cartNorm,
      position: cartPos,
      dialogue: "Eliya! Are those the cherry blossom syrup press-ons? They match my fresh peonies perfectly!",
    });

    // 2. Cast-iron mooring bollards along the water's edge
    for (let i = 0; i < 8; i++) {
      const theta = (i * Math.PI * 2) / 8 + 0.1;
      const { pos, norm } = this.getSphericalPoint(theta, 1.18, 0);
      this.loader.load("/models/street/cast-iron-mooring-bollard.glb", (gltf) => {
        const bollard = gltf.scene;
        bollard.position.copy(pos);
        bollard.scale.setScalar(0.7);
        this.orientToNormal(bollard, norm, theta);
        this.root.add(bollard);
      });
    }

    // 3. Glowing Amsterdam Street Lanterns
    for (let i = 0; i < 14; i++) {
      const theta = (i * Math.PI * 2) / 14 + 0.2;
      const { pos, norm } = this.getSphericalPoint(theta, 0.95, 0);

      this.loader.load("/models/street/amsterdam-lantern-post.glb", (gltf) => {
        const post = gltf.scene;
        post.position.copy(pos);
        post.scale.setScalar(0.75);
        this.orientToNormal(post, norm, theta);
        this.root.add(post);

        const light = new THREE.PointLight(0xffbe6b, 1.3, 7.5);
        light.position.copy(pos.clone().addScaledVector(norm, 2.5));
        this.root.add(light);
      });
    }
  }

  // 5. Nature & Botanical Greenery
  private spawnNatureAndCanalFlora() {
    const trees = [
      { model: "discoveries/bird-tree.glb", theta: 0.5, phi: 0.72, scale: 1.1 },
      { model: "discoveries/petal-tree.glb", theta: 1.8, phi: 0.75, scale: 1.2 },
      { model: "discoveries/forest-pine.glb", theta: 2.2, phi: 0.65, scale: 1.0 },
      { model: "discoveries/flower-patch.glb", theta: 0.95, phi: 0.84, scale: 1.0 },
      { model: "discoveries/flower-patch.glb", theta: 2.65, phi: 0.95, scale: 1.1 },
      { model: "discoveries/wind-chime.glb", theta: 4.2, phi: 0.82, scale: 1.0 },
      { model: "discoveries/fern-clump.glb", theta: 1.15, phi: 0.78, scale: 1.1 },
    ];

    trees.forEach((t) => {
      const { pos, norm } = this.getSphericalPoint(t.theta, t.phi, 0);
      this.loader.load(`/models/${t.model}`, (gltf) => {
        const mesh = gltf.scene;
        mesh.position.copy(pos);
        mesh.scale.setScalar(t.scale);
        this.orientToNormal(mesh, norm, t.theta);
        mesh.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });
        this.root.add(mesh);
      });
    });
  }

  // 6. Living Town Neighbors (8 NPCs)
  private spawnTownNeighbors() {
    const residents = [
      { id: "dewey", model: "pets/dewey.glb", theta: 1.1, phi: 0.88, name: "Dewey by Canal Path" },
      { id: "rocky", model: "pets/rocky.glb", theta: 2.7, phi: 1.02, name: "Rocky at Bridge" },
      { id: "seedy", model: "pets/seedy.glb", theta: 0.92, phi: 0.82, name: "Seedy at Salon" },
      { id: "fireball", model: "pets/fireball.glb", theta: 4.88, phi: 0.92, name: "Fireball at Ceramic House" },
      { id: "hoots", model: "pets/hoots.glb", theta: 3.55, phi: 1.02, name: "Hoots at Library" },
      { id: "null-signal", model: "pets/null-signal.glb", theta: 5.58, phi: 0.78, name: "Null-Signal at Windmill" },
      { id: "codex", model: "pets/codex.glb", theta: 0.72, phi: 0.86, name: "Codex at Tea Desk" },
    ];

    residents.forEach((r) => {
      const { pos, norm } = this.getSphericalPoint(r.theta, r.phi, 0);
      this.loader.load(`/models/${r.model}`, (gltf) => {
        const npc = gltf.scene;
        npc.position.copy(pos);
        npc.scale.setScalar(0.85);
        this.orientToNormal(npc, norm, r.theta + Math.PI);
        npc.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });
        this.root.add(npc);
        this.npcs.push(npc);
      });
    });
  }

  // Nearest landmark query
  public getNearestLandmark(playerPos: THREE.Vector3): { landmark: PlanetLandmark; dist: number } | null {
    let nearest: PlanetLandmark | null = null;
    let minDist = Infinity;

    for (const lm of this.landmarks) {
      const d = playerPos.distanceTo(lm.position);
      if (d < minDist) {
        minDist = d;
        nearest = lm;
      }
    }

    if (nearest && minDist < 6.8) {
      return { landmark: nearest, dist: minDist };
    }
    return null;
  }
}
