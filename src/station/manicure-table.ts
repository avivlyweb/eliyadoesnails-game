import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { sound } from "../engine/audio";

export interface NailState {
  length: number; // 0 (filed) to 1 (raw)
  color: THREE.Color;
  syrupOpacity: number;
  auraIntensity: number;
  hasCatEye: boolean;
  charms: Array<{ id: string; mesh: THREE.Group }>;
}

export class ManicureStation {
  public scene: THREE.Scene;
  public group: THREE.Group;
  public loader: GLTFLoader;

  // Manicure props
  public handGroup: THREE.Group;
  public nailMeshes: THREE.Mesh[] = [];
  public nailStates: NailState[] = [];
  public activeTool: string = "file"; // 'file' | 'brush' | 'airbrush' | 'wand' | 'tweezer' | 'cure'

  // UV lamp curing state
  public isCuring: boolean = false;
  private uvLight: THREE.PointLight | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.loader = new GLTFLoader();

    this.handGroup = new THREE.Group();
    this.group.add(this.handGroup);

    this.setupStationTable();
    this.setupClientHand();
  }

  // Load the desktop travertine table & props
  private setupStationTable() {
    // 1. Manicure Station Deluxe
    this.loader.load("/models/furniture/manicure-station-deluxe.glb", (gltf) => {
      const table = gltf.scene;
      table.position.set(0, 0, 0);
      table.scale.setScalar(1.0);
      this.group.add(table);
    });

    // 2. Desktop UV Tunnel Lamp ("The Halo")
    this.loader.load("/models/station/desktop-uv-tunnel-lamp.glb", (gltf) => {
      const lamp = gltf.scene;
      lamp.position.set(0.65, 0.95, -0.2);
      lamp.scale.setScalar(0.9);
      this.group.add(lamp);

      // Violet UV cure light
      this.uvLight = new THREE.PointLight(0x7048e8, 0, 4);
      this.uvLight.position.set(0.65, 1.1, -0.2);
      this.group.add(this.uvLight);
    });

    // 3. Boucle Hand Pillow
    this.loader.load("/models/station/linen-velvet-hand-pillow.glb", (gltf) => {
      const pillow = gltf.scene;
      pillow.position.set(0, 0.94, 0.15);
      pillow.scale.setScalar(0.9);
      this.group.add(pillow);
    });

    // 4. Steaming Matcha Mug
    this.loader.load("/models/station/steaming-ceramic-matcha-mug.glb", (gltf) => {
      const mug = gltf.scene;
      mug.position.set(-0.6, 0.95, -0.15);
      mug.scale.setScalar(0.85);
      this.group.add(mug);
    });

    // 5. Scalloped Ceramic Charm Palette
    this.loader.load("/models/station/scalloped-ceramic-charm-palette.glb", (gltf) => {
      const palette = gltf.scene;
      palette.position.set(-0.5, 0.95, 0.35);
      palette.scale.setScalar(0.8);
      this.group.add(palette);
    });
  }

  // Build 5-finger client hand resting on the bouclé pillow
  private setupClientHand() {
    this.handGroup.position.set(0, 1.02, 0.12);

    // Palm / Hand base
    const palmGeo = new THREE.BoxGeometry(0.32, 0.06, 0.28);
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffe0d2,
      roughness: 0.55,
    });
    const palm = new THREE.Mesh(palmGeo, skinMat);
    palm.position.set(0, 0, 0);
    this.handGroup.add(palm);

    // 5 Fingers with Nails
    const fingerOffsets = [
      { x: -0.14, z: -0.12, len: 0.24, rot: 0.25, name: "Thumb" },
      { x: -0.07, z: -0.22, len: 0.30, rot: 0.05, name: "Index" },
      { x: 0.00, z: -0.25, len: 0.34, rot: 0.00, name: "Middle" },
      { x: 0.07, z: -0.22, len: 0.31, rot: -0.05, name: "Ring" },
      { x: 0.14, z: -0.17, len: 0.25, rot: -0.15, name: "Pinky" },
    ];

    fingerOffsets.forEach((f, idx) => {
      const fingerGeo = new THREE.CylinderGeometry(0.024, 0.028, f.len, 16);
      const finger = new THREE.Mesh(fingerGeo, skinMat);
      finger.rotation.x = Math.PI / 2;
      finger.rotation.z = f.rot;
      finger.position.set(f.x, 0, f.z);
      this.handGroup.add(finger);

      // Fingernail mesh (Almond / Oval shape)
      const nailGeo = new THREE.CylinderGeometry(0.019, 0.022, 0.055, 16);
      const nailMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0xf6d5cf),
        roughness: 0.25,
        transmission: 0.6,
        thickness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
      });

      const nail = new THREE.Mesh(nailGeo, nailMat);
      nail.rotation.x = Math.PI / 2;
      nail.rotation.z = f.rot;
      nail.position.set(f.x, 0.02, f.z - f.len / 2 + 0.02);
      this.handGroup.add(nail);
      this.nailMeshes.push(nail);

      // Initialize Nail State
      this.nailStates.push({
        length: 1.0,
        color: new THREE.Color(0xf6d5cf),
        syrupOpacity: 0.6,
        auraIntensity: 0,
        hasCatEye: false,
        charms: [],
      });
    });
  }

  // Action: File Nails (ASMR Glass file)
  public applyFile(fingerIndex: number) {
    if (fingerIndex < 0 || fingerIndex >= this.nailStates.length) return;
    const state = this.nailStates[fingerIndex];
    state.length = Math.max(0.65, state.length - 0.1);
    
    // Scale nail mesh slightly to reflect shaped almond edge
    const nail = this.nailMeshes[fingerIndex];
    nail.scale.set(0.95, state.length, 0.95);

    // Audio trigger
    sound.playGlassFile();
  }

  // Action: Brush Syrup Gel Tint
  public applySyrupShade(colorHex: number, shadeName: string) {
    this.nailStates.forEach((state, i) => {
      state.color.setHex(colorHex);
      state.syrupOpacity = THREE.MathUtils.clamp(state.syrupOpacity + 0.2, 0.4, 0.95);

      const mat = this.nailMeshes[i].material as THREE.MeshPhysicalMaterial;
      mat.color.copy(state.color);
      mat.transmission = 0.85 - state.syrupOpacity * 0.4;
      mat.clearcoat = 1.0;
    });

    // Gentle tactile brush sound
    sound.playGlassFile();
  }

  // Action: Aura Airbrush Spray
  public applyAuraSpray(centerColorHex: number) {
    this.nailStates.forEach((state, i) => {
      state.auraIntensity = Math.min(1.0, state.auraIntensity + 0.35);
      const mat = this.nailMeshes[i].material as THREE.MeshPhysicalMaterial;
      // Blend towards center aura shade
      mat.color.lerp(new THREE.Color(centerColorHex), 0.35);
    });

    sound.playAirbrushHiss(1.2);
  }

  // Action: Magnetic Cat-Eye Wand Sweep
  public applyCatEyeWand() {
    this.nailStates.forEach((state, i) => {
      state.hasCatEye = true;
      const mat = this.nailMeshes[i].material as THREE.MeshPhysicalMaterial;
      mat.roughness = 0.05;
      mat.sheen = 1.0;
      mat.sheenColor = new THREE.Color(0xffffff);
    });

    sound.playMagneticShimmer();
  }

  // Action: Attach 3D Korean Charm (e.g. Sculpted bow, molten drop, pearl)
  public attachCharm(fingerIndex: number, charmModelName: string) {
    if (fingerIndex < 0 || fingerIndex >= this.nailMeshes.length) return;
    const nail = this.nailMeshes[fingerIndex];

    this.loader.load(`/models/charms/${charmModelName}.glb`, (gltf) => {
      const charm = gltf.scene;
      charm.scale.setScalar(0.045);
      charm.position.copy(nail.position);
      charm.position.y += 0.015;
      this.handGroup.add(charm);

      this.nailStates[fingerIndex].charms.push({
        id: charmModelName,
        mesh: charm,
      });

      // Shimmer feedback sound
      sound.playMagneticShimmer();
    });
  }

  // Action: Desktop UV Lamp Curing ("The Halo")
  public startUVCure(onComplete?: () => void) {
    if (this.isCuring) return;
    this.isCuring = true;

    // Slide hand smoothly into UV tunnel lamp
    const origHandPos = this.handGroup.position.clone();
    this.handGroup.position.set(0.65, 0.98, -0.2);

    if (this.uvLight) {
      this.uvLight.intensity = 5.0;
    }

    sound.playUVLampCure();

    setTimeout(() => {
      // Finished curing: high-gloss glass coat lock
      if (this.uvLight) {
        this.uvLight.intensity = 0;
      }
      this.handGroup.position.copy(origHandPos);
      this.isCuring = false;

      // Lock glass clearcoat
      this.nailMeshes.forEach((nail) => {
        const mat = nail.material as THREE.MeshPhysicalMaterial;
        mat.roughness = 0.02;
        mat.clearcoat = 1.0;
        mat.clearcoatRoughness = 0.01;
      });

      if (onComplete) onComplete();
    }, 2800);
  }

  public setVisible(visible: boolean) {
    this.group.visible = visible;
  }
}
