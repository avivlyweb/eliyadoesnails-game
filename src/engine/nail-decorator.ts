import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CharmDef, createCharm, getCharm } from "./charm-library";

export interface PlacedCharm {
  charmId: string;
  nail: string;
  object: THREE.Object3D;
}

/**
 * A small 3D view of a nail set where the player taps a nail to stick the selected charm on it.
 * Tap a placed charm to remove it. Drag to rotate, scroll/pinch to zoom.
 */
export class NailDecorator {
  public placed: PlacedCharm[] = [];
  public selectedCharmId: string | null = null;
  public onChange: (placed: PlacedCharm[]) => void = () => {};

  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(35, 1, 0.01, 50);
  private controls: OrbitControls;
  private setRoot = new THREE.Group();
  private nails: THREE.Mesh[] = [];
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private downAt: { x: number; y: number } | null = null;
  private loader = new GLTFLoader();
  private currentSrc = "";
  private hovered: THREE.Mesh | null = null;
  private hoverMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  private disposed = false;
  private glowMaterials = new Map<THREE.Mesh, THREE.Material>();

  constructor(private container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.domElement.style.cssText = "width:100%;height:100%;display:block;touch-action:none;cursor:grab;";
    container.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.HemisphereLight(0xfff6f2, 0xd9c5bf, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(2, 4, 3);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xf6c1cc, 0.8);
    rim.position.set(-3, 2, -2);
    this.scene.add(rim);
    this.scene.add(this.setRoot);

    this.camera.position.set(0, 2.2, 3.4);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.minDistance = 1.2;
    this.controls.maxDistance = 6;
    this.controls.target.set(0, 0.2, 0);

    const el = this.renderer.domElement;
    el.addEventListener("pointerdown", (e) => (this.downAt = { x: e.clientX, y: e.clientY }));
    el.addEventListener("pointerup", (e) => {
      if (!this.downAt) return;
      const moved = Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y);
      this.downAt = null;
      if (moved < 6) this.handleTap(e);
    });
    el.addEventListener("pointermove", (e) => this.handleHover(e));
    el.addEventListener("pointerleave", () => this.setHover(null));

    new ResizeObserver(() => this.resize()).observe(container);
    this.resize();
    this.loop();
  }

  private resize() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    const aspectChanged = Math.abs(this.camera.aspect - w / h) > 0.01;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (aspectChanged && this.currentSrc && this.placed.length === 0) this.frameNails();
  }

  private loop = () => {
    if (this.disposed) return;
    requestAnimationFrame(this.loop);
    if (!this.container.offsetParent) return; // hidden: don't render
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  public async loadSet(src: string): Promise<void> {
    if (src === this.currentSrc) return;
    this.currentSrc = src;
    this.clearCharms(false);
    this.setRoot.clear();
    this.nails = [];
    const gltf = await new Promise<any>((res, rej) => this.loader.load(src, res, undefined, rej));
    if (src !== this.currentSrc) return; // a newer set was requested meanwhile
    const model = gltf.scene as THREE.Group;

    // Fit to view: largest side = 2 units, centred, resting on y = 0
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const scale = 2 / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(scale);
    const box2 = new THREE.Box3().setFromObject(model);
    const c = box2.getCenter(new THREE.Vector3());
    model.position.set(-c.x, -box2.min.y, -c.z);
    this.setRoot.add(model);

    // Nails: meshes named *Tip* / *Nail* (or inside such a node); fallback: every mesh except stands/cards.
    const isNailName = (n: string) => /tip|nail/i.test(n);
    const isStandName = (n: string) => /card|stand|velvet|bar|base|display|plinth|board/i.test(n);
    const meshes: THREE.Mesh[] = [];
    model.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
    });
    const withAncestorName = (m: THREE.Object3D, test: (n: string) => boolean) => {
      for (let p: THREE.Object3D | null = m; p; p = p.parent) if (test(p.name)) return true;
      return false;
    };
    this.nails = meshes.filter((m) => withAncestorName(m, isNailName));
    if (this.nails.length === 0) this.nails = meshes.filter((m) => !withAncestorName(m, isStandName));

    this.frameNails();
    this.onChange(this.placed);
  }

  /** Point the camera at the nails (not the whole display card) so they fill the view. */
  private frameNails() {
    const box = new THREE.Box3();
    (this.nails.length ? this.nails : [this.setRoot]).forEach((n) => box.expandByObject(n));
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const span = Math.max(size.x, size.z, 0.4) * 1.22;
    const halfFov = THREE.MathUtils.degToRad(this.camera.fov / 2);
    const aspect = Math.max(0.6, this.camera.aspect);
    const dist = Math.max(span / (2 * Math.tan(halfFov) * aspect), span * 0.9);
    const dir = new THREE.Vector3(0, 1.15, 1).normalize();
    this.controls.target.copy(center);
    this.camera.position.copy(center).addScaledVector(dir, dist);
    this.controls.minDistance = dist * 0.35;
    this.controls.maxDistance = dist * 2.5;
    this.controls.update();
  }

  public selectCharm(id: string | null) {
    this.selectedCharmId = id;
    this.renderer.domElement.style.cursor = id ? "copy" : "grab";
  }

  public clearCharms(notify = true) {
    for (const p of this.placed) p.object.parent?.remove(p.object);
    this.placed = [];
    if (notify) this.onChange(this.placed);
  }

  private pick(e: PointerEvent, targets: THREE.Object3D[]) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.intersectObjects(targets, true)[0] || null;
  }

  private handleHover(e: PointerEvent) {
    if (!this.selectedCharmId || this.downAt) return this.setHover(null);
    const hit = this.pick(e, this.nails);
    this.setHover(hit ? (hit.object as THREE.Mesh) : null);
  }

  private setHover(mesh: THREE.Mesh | null) {
    if (this.hovered === mesh) return;
    if (this.hovered) {
      const orig = this.hoverMaterials.get(this.hovered);
      if (orig) this.hovered.material = orig;
    }
    this.hovered = mesh;
    if (mesh) {
      if (!this.hoverMaterials.has(mesh)) this.hoverMaterials.set(mesh, mesh.material);
      let glow = this.glowMaterials.get(mesh);
      if (!glow) {
        const orig = this.hoverMaterials.get(mesh)!;
        const base = (Array.isArray(orig) ? orig[0] : orig) as THREE.MeshStandardMaterial;
        const g = base.clone() as THREE.MeshStandardMaterial;
        if (g.emissive) {
          g.emissive = new THREE.Color(0xf6a5b9);
          g.emissiveIntensity = 0.45;
        }
        glow = g;
        this.glowMaterials.set(mesh, g);
      }
      mesh.material = glow;
    }
  }

  private async handleTap(e: PointerEvent) {
    // 1. Tapping a placed charm removes it
    const charmHit = this.pick(e, this.placed.map((p) => p.object));
    if (charmHit) {
      const idx = this.placed.findIndex((p) => {
        let o: THREE.Object3D | null = charmHit.object;
        for (; o; o = o.parent) if (o === p.object) return true;
        return false;
      });
      if (idx >= 0) {
        this.placed[idx].object.parent?.remove(this.placed[idx].object);
        this.placed.splice(idx, 1);
        this.onChange(this.placed);
        return;
      }
    }
    // 2. Tapping a nail places the selected charm
    if (!this.selectedCharmId) return;
    const hit = this.pick(e, this.nails);
    if (!hit || !hit.face) return;
    const def = getCharm(this.selectedCharmId);
    if (!def) return;
    await this.placeCharm(def, hit.object as THREE.Mesh, hit.point, hit.face.normal);
  }

  /** Place a charm on a nail at a world point, standing out along the surface normal. */
  public async placeCharm(def: CharmDef, nail: THREE.Mesh, worldPoint: THREE.Vector3, localNormal: THREE.Vector3) {
    const charm = await createCharm(def);
    const normal = localNormal.clone().transformDirection(nail.matrixWorld).normalize();

    // Size the charm to the nail: about 85% of the nail's width
    const nb = new THREE.Box3().setFromObject(nail).getSize(new THREE.Vector3());
    const dims = [nb.x, nb.y, nb.z].sort((a, b) => a - b);
    const size = Math.max(0.08, dims[1] * 0.85);
    charm.scale.setScalar(size);

    charm.position.copy(worldPoint).addScaledVector(normal, 0.004);
    charm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    charm.rotateY(Math.random() * 0.6 - 0.3);
    this.scene.add(charm);
    nail.attach(charm); // keep it on the nail if the set moves

    // pop-in
    const target = charm.scale.clone();
    charm.scale.multiplyScalar(0.2);
    const t0 = performance.now();
    const grow = () => {
      const t = Math.min(1, (performance.now() - t0) / 220);
      const k = 0.2 + 0.8 * (1 - Math.pow(1 - t, 3)) + Math.sin(t * Math.PI) * 0.15;
      charm.scale.copy(target).multiplyScalar(k);
      if (t < 1) requestAnimationFrame(grow);
      else charm.scale.copy(target);
    };
    grow();

    this.placed.push({ charmId: def.id, nail: nail.name, object: charm });
    this.onChange(this.placed);
  }

  /** Put a charm on the middle of the n-th nail (used for auto-decorating and tests). */
  public async placeOnNail(charmId: string, nailIndex: number) {
    const def = getCharm(charmId);
    const nail = this.nails[nailIndex];
    if (!def || !nail) return;
    nail.geometry.computeBoundingBox();
    const bb = nail.geometry.boundingBox!;
    const center = bb.getCenter(new THREE.Vector3());
    const top = new THREE.Vector3(center.x, bb.max.y, center.z);
    nail.updateWorldMatrix(true, false);
    await this.placeCharm(def, nail, top.applyMatrix4(nail.matrixWorld), new THREE.Vector3(0, 1, 0));
  }

  public get nailCount() {
    return this.nails.length;
  }

  public dispose() {
    this.disposed = true;
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
