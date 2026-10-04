import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { sound } from "./audio";
import { isGameplayInputBlocked } from "./input-guard";

export class SphericalCharacter {
  public scene: THREE.Scene;
  public root: THREE.Group;
  public loader: GLTFLoader;

  // Character Mesh Hierarchy
  public model: THREE.Group | null = null;
  public leftArm: THREE.Object3D | null = null;
  public rightArm: THREE.Object3D | null = null;
  public leftLeg: THREE.Object3D | null = null;
  public rightLeg: THREE.Object3D | null = null;
  public head: THREE.Object3D | null = null;
  public traySocket: THREE.Object3D | null = null;
  // Facial Morph Targets (Wink & Smile)
  public eyeLMesh: THREE.Mesh | null = null;
  public eyeRMesh: THREE.Mesh | null = null;
  public mouthMesh: THREE.Mesh | null = null;
  public blushLMesh: THREE.Mesh | null = null;
  public blushRMesh: THREE.Mesh | null = null;
  private blinkTimer: number = 2.2;
  private isBlinking: boolean = false;
  private blinkProgress: number = 0;
  private winkMode: "both" | "right" | "left" = "both";
  private emoteWinkTimer: number = 0;
  private currentSmile: number = 0;

  // Bicycle Model & Sub-nodes
  public bicycle: THREE.Group | null = null;
  public frontWheel: THREE.Object3D | null = null;
  public rearWheel: THREE.Object3D | null = null;
  public isRidingBicycle: boolean = false;

  // Spherical Coordinates & Movement
  public normal: THREE.Vector3 = new THREE.Vector3(0, 1, 0); // Up vector on sphere
  public facing: THREE.Vector3 = new THREE.Vector3(0, 0, 1); // Tangent forward vector on sphere

  public planetRadius: number = 17.5;
  public heightAboveGround: number = 0;
  public verticalVelocity: number = 0;
  public isGrounded: boolean = true;
  public isOnPath: boolean = false;
  public isGathering: boolean = false;
  private gatherTimer: number = 0;

  public playGatherAnimation(duration = 0.8) {
    this.isGathering = true;
    this.gatherTimer = duration;
  }

  public walkCycle: number = 0;
  public currentSpeed: number = 0;
  public moving: boolean = false;
  public carriedBox: THREE.Group | null = null;

  // Keys tracking
  private keys: Record<string, boolean> = {};

  constructor(scene: THREE.Scene, planetRadius = 17.5) {
    this.scene = scene;
    this.planetRadius = planetRadius;
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.loader = new GLTFLoader();

    // Start on planet surface near Atelier Gloss cobblestone street
    this.normal.set(0, 0.7071, 0.7071).normalize();
    this.facing.set(1, 0, 0).projectOnPlane(this.normal).normalize();
    this.updatePosition();

    this.loadEliyaModel();
    this.loadBicycle();
    this.setupInput();
    this.setupCourierBoxes();
  }

  public currentModelKey: "cloud-mascot" | "mochi-bunny" | "artisan" = "cloud-mascot";

  public setCharacterModel(modelKey: "cloud-mascot" | "mochi-bunny" | "artisan") {
    if (this.model) {
      this.root.remove(this.model);
      this.model = null;
      this.leftArm = null;
      this.rightArm = null;
      this.leftLeg = null;
      this.rightLeg = null;
      this.head = null;
      this.traySocket = null;
      this.eyeLMesh = null;
      this.eyeRMesh = null;
      this.mouthMesh = null;
      this.blushLMesh = null;
      this.blushRMesh = null;
    }
    this.currentModelKey = modelKey;
    const modelPath =
      modelKey === "cloud-mascot"
        ? "/models/characters/eliya-cloud-mascot.glb"
        : modelKey === "mochi-bunny"
        ? "/models/characters/peach-mochi-bunny.glb"
        : "/models/eliyadoesnails/eliya-artisan.glb";
    const modelScale =
      modelKey === "cloud-mascot" ? 1.20 : modelKey === "mochi-bunny" ? 1.25 : 0.95;

    this.loader.load(
      modelPath,
      (gltf) => {
        this.model = gltf.scene;
        this.model.scale.setScalar(modelScale);

        // Blender scene helpers (studio backdrop planes, preview cameras/targets)
        // must never come into the world: the bunny export ships an 8x8 m backdrop.
        const helpers: THREE.Object3D[] = [];
        this.model.traverse((child) => {
          const mat = (child as THREE.Mesh).material as THREE.Material | undefined;
          if (/backdrop|cam_target/i.test(child.name) || (mat && /backdrop/i.test(mat.name || ""))) {
            helpers.push(child);
          }
        });
        helpers.forEach((h) => h.parent?.remove(h));

        this.model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Articulated Sockets & Limbs
        this.leftArm = this.model.getObjectByName("eliya_LeftArm") || null;
        this.rightArm = this.model.getObjectByName("eliya_RightArm") || null;
        this.leftLeg = this.model.getObjectByName("eliya_LeftLeg") || null;
        this.rightLeg = this.model.getObjectByName("eliya_RightLeg") || null;
        this.head = this.model.getObjectByName("eliya_Head") || null;
        this.traySocket = this.model.getObjectByName("eliya_TraySocket") || null;

        // Facial Morph Target Meshes (Wink & Smile)
        this.eyeLMesh = (this.model.getObjectByName("Eye_L") as THREE.Mesh) || null;
        this.eyeRMesh = (this.model.getObjectByName("Eye_R") as THREE.Mesh) || null;
        this.mouthMesh = (this.model.getObjectByName("Mouth") as THREE.Mesh) || null;
        this.blushLMesh = (this.model.getObjectByName("Blush_L") as THREE.Mesh) || null;
        this.blushRMesh = (this.model.getObjectByName("Blush_R") as THREE.Mesh) || null;

        this.root.add(this.model);
      },
      undefined,
      (err) => {
        console.warn("Using procedural fallback avatar:", err);
        this.createProceduralAvatar();
      }
    );
  }

  public triggerWinkEmote() {
    this.emoteWinkTimer = 1.4;
    sound.playGlassFile();
    const toast = document.createElement("div");
    toast.style.cssText =
      "position:fixed;bottom:84px;left:50%;transform:translateX(-50%);background:rgba(36,19,14,0.88);color:#faf7f5;padding:8px 18px;border-radius:999px;font-family:var(--font-sans, sans-serif);font-size:12px;font-weight:600;letter-spacing:0.5px;box-shadow:0 4px 16px rgba(0,0,0,0.2);z-index:9999;pointer-events:none;backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.15);transition:opacity 0.3s ease;";
    toast.textContent = "🐰 Wink & Radiant Smile! ♡ (Key: P / J)";
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 1800);
  }

  public setFacialExpression(winkL: number, winkR: number, smile: number) {
    if (this.eyeLMesh?.morphTargetInfluences) this.eyeLMesh.morphTargetInfluences[0] = winkL;
    if (this.eyeRMesh?.morphTargetInfluences) this.eyeRMesh.morphTargetInfluences[0] = winkR;
    if (this.mouthMesh?.morphTargetInfluences) this.mouthMesh.morphTargetInfluences[0] = smile;
    if (this.blushLMesh?.morphTargetInfluences) this.blushLMesh.morphTargetInfluences[0] = smile * 0.8;
    if (this.blushRMesh?.morphTargetInfluences) this.blushRMesh.morphTargetInfluences[0] = smile * 0.8;
  }

  public toggleAvatarSkin() {
    const skins: ("cloud-mascot" | "mochi-bunny" | "artisan")[] = [
      "cloud-mascot",
      "mochi-bunny",
      "artisan",
    ];
    const currentIndex = skins.indexOf(this.currentModelKey);
    const nextKey = skins[(currentIndex + 1) % skins.length];
    this.setCharacterModel(nextKey);

    const labels: Record<string, string> = {
      "cloud-mascot": "✨ Eliya Cloud Mascot (Atelier Edition)",
      "mochi-bunny": "🐰 Peach Mochi Bunny (Korean 3D Creature)",
      "artisan": "🌸 Eliya Classic Artisan",
    };
    const toast = document.createElement("div");
    toast.style.cssText =
      "position:fixed;bottom:84px;left:50%;transform:translateX(-50%);background:rgba(36,19,14,0.88);color:#faf7f5;padding:8px 18px;border-radius:999px;font-family:var(--font-sans, sans-serif);font-size:12px;font-weight:600;letter-spacing:0.5px;box-shadow:0 4px 16px rgba(0,0,0,0.2);z-index:9999;pointer-events:none;backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.15);transition:opacity 0.3s ease;";
    toast.textContent = `Avatar Skin: ${labels[nextKey] || nextKey}`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 2200);

    return nextKey;
  }

  private loadEliyaModel() {
    this.setCharacterModel("cloud-mascot");
  }

  private createProceduralAvatar() {
    const group = new THREE.Group();
    const bodyGeo = new THREE.CylinderGeometry(0.24, 0.36, 0.85, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xfaf7f5, roughness: 0.8 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.8;
    body.castShadow = true;
    group.add(body);

    // Atelier Petal sash/scarf accent (--accent-petal: #a8505e)
    const sashGeo = new THREE.CylinderGeometry(0.26, 0.28, 0.08, 16);
    const sashMat = new THREE.MeshStandardMaterial({ color: 0xa8505e, roughness: 0.5 });
    const sash = new THREE.Mesh(sashGeo, sashMat);
    sash.position.y = 1.15;
    group.add(sash);

    const headGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdfd0, roughness: 0.6 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.35;
    head.castShadow = true;
    group.add(head);

    this.model = group;
    this.root.add(this.model);
  }

  private loadBicycle() {
    this.loader.load("/models/street/vintage-bicycle-eliya.glb", (gltf) => {
      this.bicycle = gltf.scene;
      this.bicycle.scale.setScalar(0.92);
      this.bicycle.visible = false;

      this.bicycle.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Subtle brand accent bow on the front wicker basket (--accent-petal: #a8505e)
      const basketAccent = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xa8505e, roughness: 0.4 })
      );
      basketAccent.position.set(0, 0.82, 0.52);
      this.bicycle.add(basketAccent);

      this.frontWheel = this.bicycle.getObjectByName("bike_Tire_Front") || null;
      this.rearWheel = this.bicycle.getObjectByName("bike_Tire_Rear") || null;

      this.root.add(this.bicycle);
    });
  }

  private setupInput() {
    window.addEventListener("keydown", (e) => {
      if (isGameplayInputBlocked(e)) {
        // Don't walk around behind open menus or on the start screen.
        this.keys = {};
        return;
      }
      this.keys[e.code] = true;
      if (e.repeat) return; // one action per key press, not per auto-repeat
      if (e.code === "Space") {
        e.preventDefault();
        this.jump();
      }
      // NOTE: [B] (bicycle) is handled in main.ts so the HUD button stays in sync.
      if (e.code === "KeyM") {
        this.toggleAvatarSkin();
      }
      if (e.code === "KeyP") {
        this.triggerWinkEmote();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    // Releasing keys while the tab is unfocused would otherwise leave the player walking forever.
    window.addEventListener("blur", () => {
      this.keys = {};
    });
  }

  public jump() {
    if (this.isGrounded) {
      this.verticalVelocity = this.isRidingBicycle ? 7.8 : 9.0;
      this.isGrounded = false;
      if (this.isRidingBicycle) {
        sound.playBicycleBell();
      } else {
        sound.playGlassFile();
      }
    }
  }

  public toggleBicycle() {
    this.isRidingBicycle = !this.isRidingBicycle;
    if (this.bicycle) {
      this.bicycle.visible = this.isRidingBicycle;
    }
    sound.playBicycleBell();

    if (!this.isRidingBicycle && this.model) {
      this.model.position.set(0, 0, 0);
      this.model.rotation.set(0, 0, 0);
    }
  }

  public carriedBoxesGroup: THREE.Group = new THREE.Group();
  public packedBoxCount: number = 0;

  private setupCourierBoxes() {
    this.root.add(this.carriedBoxesGroup);
    this.carriedBoxesGroup.visible = false;
  }

  public updateBoxCount(count: number) {
    this.packedBoxCount = count;
    this.carriedBoxesGroup.clear();

    if (count <= 0) {
      this.carriedBoxesGroup.visible = false;
      return;
    }

    this.carriedBoxesGroup.visible = true;
    const boxGeo = new THREE.BoxGeometry(0.32, 0.08, 0.22);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0xfaf7f5,
      roughness: 0.35,
      metalness: 0.1,
    });
    // Brand token: --accent-petal (#a8505e) for satin ribbon & --accent-rose (#f2c4c4) for bow
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0xa8505e,
      roughness: 0.4,
    });
    const bowMat = new THREE.MeshStandardMaterial({
      color: 0xf2c4c4,
      roughness: 0.35,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.2,
    });

    for (let i = 0; i < count; i++) {
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.y = i * 0.088;
      box.rotation.y = (i % 2 === 0 ? 1 : -1) * 0.05;
      box.castShadow = true;

      // Petal satin ribbon
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.325, 0.084, 0.04), ribbonMat);
      box.add(rib);

      // Rose ribbon knot
      const bowKnot = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), bowMat);
      bowKnot.position.set(0, 0.044, 0);
      box.add(bowKnot);

      // Gold pull tab
      const tab = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.06), goldMat);
      tab.position.set(0, 0, 0.12);
      box.add(tab);

      this.carriedBoxesGroup.add(box);
    }
  }

  public carryBox(boxMesh: THREE.Group) {
    this.carriedBox = boxMesh;
    boxMesh.scale.setScalar(0.45);
    if (this.traySocket) {
      this.traySocket.add(boxMesh);
    } else {
      this.root.add(boxMesh);
      boxMesh.position.set(0, 1.0, 0.35);
    }
  }

  // Companion Pet Tracking
  public activePet: THREE.Group | null = null;
  public activePetKey: string | null = null;
  private petHopTime: number = 0;

  public setCompanionPet(petKey: string | null) {
    if (this.activePet) {
      this.root.remove(this.activePet);
      this.activePet = null;
    }
    this.activePetKey = petKey;
    if (!petKey) return;

    this.loader.load(
      `/models/pets/${petKey}.glb`,
      (gltf) => {
        if (this.activePetKey !== petKey) return;
        this.activePet = gltf.scene;
        this.activePet.scale.setScalar(0.42);
        this.activePet.position.set(0.65, 0, -0.25);
        this.root.add(this.activePet);
      },
      undefined,
      (err) => console.warn("Failed to load pet model:", err)
    );
  }

  /**
   * Main physics step modeled after Little Ritual's engine:
   * Translates 2D input (WASD) relative to the 3D Camera view on the planet's tangent plane.
   */
  public update(delta: number, camera: THREE.PerspectiveCamera) {
    const moveX = (this.keys["KeyD"] || this.keys["ArrowRight"] ? 1 : 0) - (this.keys["KeyA"] || this.keys["ArrowLeft"] ? 1 : 0);
    const moveY = (this.keys["KeyW"] || this.keys["ArrowUp"] ? 1 : 0) - (this.keys["KeyS"] || this.keys["ArrowDown"] ? 1 : 0);

    const hasInput = moveX !== 0 || moveY !== 0;
    const moveDir = new THREE.Vector3();

    if (hasInput) {
      // Little Ritual camera-relative movement:
      // Camera forward vector projected onto the tangent plane
      const camForward = camera.getWorldDirection(new THREE.Vector3()).projectOnPlane(this.normal).normalize();
      // Camera right vector on the tangent plane
      const camRight = new THREE.Vector3().crossVectors(camForward, this.normal).normalize();

      // moveY: W(+1)/S(-1) along camForward
      // moveX: D(+1)/A(-1) along camRight
      moveDir.addScaledVector(camForward, moveY).addScaledVector(camRight, moveX).normalize();
    }

    const petSpeedMult = (this.isRidingBicycle && this.activePetKey === "fireball") ? 1.15 : 1.0;
    const baseSpeed = (this.isRidingBicycle ? (this.isOnPath ? 6.6 : 6.0) : 3.3) * petSpeedMult;
    const targetSpeed = hasInput ? baseSpeed : 0;
    const accelRate = this.isRidingBicycle ? 6.0 : 12.0;
    this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, targetSpeed, delta * accelRate);

    this.moving = Math.abs(this.currentSpeed) > 0.08 && hasInput;

    // Animate Companion Pet (hopping & following)
    if (this.activePet) {
      this.petHopTime += delta * (this.moving ? 8 : 2);
      const hop = Math.abs(Math.sin(this.petHopTime)) * (this.moving ? 0.12 : 0.03);
      this.activePet.position.y = hop;
      this.activePet.rotation.y = Math.sin(this.petHopTime * 0.5) * 0.15;
    }

    // Advance along the spherical planet surface
    if (Math.abs(this.currentSpeed) > 0.05 && moveDir.lengthSq() > 0) {
      const stepDist = this.currentSpeed * delta;

      // Little Ritual advance:
      const nextNormal = this.normal.clone().addScaledVector(moveDir, stepDist / this.planetRadius).normalize();
      this.normal.copy(nextNormal);

      // Smooth facing rotation towards movement direction
      this.facing.lerp(moveDir, 1 - Math.exp(-delta * 14)).projectOnPlane(this.normal).normalize();

      // Cadence update
      this.walkCycle += delta * Math.abs(this.currentSpeed) * (this.isRidingBicycle ? 4.5 : 6.5);
    }

    // Handle Gravity & Jumping
    if (!this.isGrounded) {
      this.heightAboveGround += this.verticalVelocity * delta;
      this.verticalVelocity -= 22.0 * delta;

      if (this.heightAboveGround <= 0) {
        this.heightAboveGround = 0;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    }

    this.updatePosition();
    this.animateCharacter(hasInput, moveX, delta);
  }

  private updatePosition() {
    const curR = this.planetRadius + this.heightAboveGround;
    this.root.position.copy(this.normal).multiplyScalar(curR);

    // Orthonormal basis aligning root's +Y to the spherical surface normal
    const qUp = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.normal);
    this.root.quaternion.copy(qUp);

    // Compute heading in local tangent space
    const localFacing = this.facing.clone().applyQuaternion(qUp.clone().invert());
    const angleY = Math.atan2(localFacing.x, localFacing.z);

    // Apply facing rotation directly to model and bicycle
    if (this.model) {
      this.model.rotation.y = angleY;
    }
    if (this.bicycle) {
      this.bicycle.rotation.y = angleY;
    }
    if (this.carriedBoxesGroup) {
      this.carriedBoxesGroup.rotation.y = angleY;
      const fwd = new THREE.Vector3(Math.sin(angleY), 0, Math.cos(angleY));
      if (this.isRidingBicycle) {
        this.carriedBoxesGroup.position.set(fwd.x * 0.58, 1.02, fwd.z * 0.58);
      } else {
        const bounce = this.model ? this.model.position.y : 0;
        const isBunny = this.currentModelKey === "mochi-bunny";
        const isCloud = this.currentModelKey === "cloud-mascot";
        const boxFwd = isBunny ? 0.28 : isCloud ? 0.26 : 0.32;
        const boxY = isBunny ? 0.58 : isCloud ? 0.72 : 0.88;
        this.carriedBoxesGroup.position.set(fwd.x * boxFwd, boxY + bounce, fwd.z * boxFwd);
      }
    }
  }

  private animateCharacter(hasInput: boolean, steerInput: number, delta: number) {
    if (!this.model) return;

    const isBunny = this.currentModelKey === "mochi-bunny";
    const isCloud = this.currentModelKey === "cloud-mascot";

    if (this.isRidingBicycle) {
      // 1. RIDING BICYCLE POSE & PEDALING
      const bikeY = isBunny ? 0.32 : isCloud ? 0.36 : 0.44;
      const bikeZ = isBunny ? -0.05 : isCloud ? -0.06 : -0.12;
      this.model.position.set(0, bikeY, bikeZ);
      this.model.rotation.set(isBunny ? 0.12 : 0.18, 0, 0);

      // Hands hold swept Dutch handlebars
      if (this.leftArm) this.leftArm.rotation.set(-0.72, 0.12, 0.15);
      if (this.rightArm) this.rightArm.rotation.set(-0.72, -0.12, -0.15);

      // Alternating circular pedaling cadence
      if (this.moving) {
        const pCycle = this.walkCycle;
        if (this.leftLeg) this.leftLeg.rotation.set(Math.sin(pCycle) * 0.42 + 0.32, 0, 0.1);
        if (this.rightLeg) this.rightLeg.rotation.set(-Math.sin(pCycle) * 0.42 + 0.32, 0, -0.1);
      } else {
        if (this.leftLeg) this.leftLeg.rotation.set(0.65, 0, 0.15);
        if (this.rightLeg) this.rightLeg.rotation.set(0.15, 0, -0.1);
      }

      // 2. BICYCLE BANKING & WHEEL ROLL
      if (this.bicycle) {
        const targetBank = steerInput * 0.22;
        this.bicycle.rotation.z = THREE.MathUtils.lerp(this.bicycle.rotation.z, targetBank, delta * 7.0);

        if (Math.abs(this.currentSpeed) > 0.05) {
          const wheelSpin = (this.currentSpeed * delta) / 0.34;
          if (this.frontWheel) this.frontWheel.rotation.x += wheelSpin;
          if (this.rearWheel) this.rearWheel.rotation.x += wheelSpin;
        }
      }
    } else {
      // 3. WALKING & JUMPING ON FOOT
      this.model.position.set(0, 0, 0);
      this.model.rotation.set(0, 0, 0);

      if (this.isGathering) {
        this.gatherTimer -= delta;
        if (this.gatherTimer <= 0) {
          this.isGathering = false;
        } else {
          // Bend down 0.8s: torso lowers, pitches forward, arms reach toward ground
          this.model.position.y = isBunny ? -0.12 : isCloud ? -0.15 : -0.22;
          this.model.rotation.x = 0.40;
          if (this.leftArm) this.leftArm.rotation.set(0.85, 0, -0.15);
          if (this.rightArm) this.rightArm.rotation.set(0.85, 0, 0.15);
          return;
        }
      }

      if (!this.isGrounded) {
        // Airborne jump silhouette: legs tuck back, arms balance
        if (this.leftLeg) this.leftLeg.rotation.set(-0.45, 0, 0.1);
        if (this.rightLeg) this.rightLeg.rotation.set(-0.45, 0, -0.1);
        if (this.leftArm) this.leftArm.rotation.set(0.40, 0, -0.2);
        if (this.rightArm) this.rightArm.rotation.set(0.40, 0, 0.2);
      } else if (this.moving) {
        // Natural fluid walking stride
        const stride = Math.sin(this.walkCycle);
        if (this.leftLeg) this.leftLeg.rotation.set(stride * 0.72, 0, 0);
        if (this.rightLeg) this.rightLeg.rotation.set(-stride * 0.72, 0, 0);
        if (this.leftArm) this.leftArm.rotation.set(-stride * 0.52, 0, 0);
        if (this.rightArm) this.rightArm.rotation.set(stride * 0.52, 0, 0);

        // Subtle realistic torso bounce
        this.model.position.y = Math.abs(Math.sin(this.walkCycle * 2)) * 0.055;

        // Playful ear/head wobble for peach bunny
        if (this.head && isBunny) {
          this.head.rotation.z = Math.sin(this.walkCycle) * 0.08;
          this.head.rotation.x = Math.abs(Math.sin(this.walkCycle * 2)) * 0.06;
        }
      } else {
        // Relaxed idle breathing
        if (this.leftLeg) this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, delta * 6);
        if (this.rightLeg) this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, delta * 6);
        if (this.leftArm) this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, delta * 6);
        if (this.rightArm) this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, delta * 6);
        if (this.head && isBunny) {
          this.head.rotation.z = THREE.MathUtils.lerp(this.head.rotation.z, 0, delta * 6);
          this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, 0, delta * 6);
        }
        this.model.position.y = THREE.MathUtils.lerp(this.model.position.y, 0, delta * 6);
      }

      // If carrying packed boxes on foot, hold them up
      if (this.packedBoxCount > 0 && this.isGrounded) {
        if (this.leftArm) this.leftArm.rotation.set(-0.62, 0.22, 0.12);
        if (this.rightArm) this.rightArm.rotation.set(-0.62, -0.22, -0.12);
      }
    }

    // 4. DYNAMIC FACIAL ANIMATIONS (Winking & Smiling)
    if (this.currentModelKey === "mochi-bunny") {
      let targetSmile =
        this.isRidingBicycle || this.packedBoxCount > 0 || this.isGathering
          ? 1.0
          : this.moving
          ? 0.35
          : 0.0;
      let targetWinkL = 0;
      let targetWinkR = 0;

      if (this.emoteWinkTimer > 0) {
        this.emoteWinkTimer -= delta;
        targetSmile = 1.0;
        targetWinkR = 1.0; // Playful one-eye wink!
      } else {
        // Natural blink & auto-wink loop
        this.blinkTimer -= delta;
        if (this.blinkTimer <= 0) {
          if (!this.isBlinking) {
            this.isBlinking = true;
            this.blinkProgress = 0;
            const rand = Math.random();
            this.winkMode = rand < 0.22 ? "right" : rand < 0.35 ? "left" : "both";
          }
        }

        if (this.isBlinking) {
          this.blinkProgress += delta / 0.16;
          if (this.blinkProgress >= 1.0) {
            this.isBlinking = false;
            this.blinkTimer = 2.4 + Math.random() * 3.5;
          } else {
            const blinkValue = Math.sin(this.blinkProgress * Math.PI);
            if (this.winkMode === "both" || this.winkMode === "left") targetWinkL = blinkValue;
            if (this.winkMode === "both" || this.winkMode === "right") targetWinkR = blinkValue;
          }
        }
      }

      this.currentSmile = THREE.MathUtils.lerp(this.currentSmile, targetSmile, delta * 8.0);
      this.setFacialExpression(targetWinkL, targetWinkR, this.currentSmile);
    }
  }

  public getPosition(): THREE.Vector3 {
    return this.root.position;
  }

  public getForward(): THREE.Vector3 {
    return this.facing.clone().normalize();
  }

  public isMoving(): boolean {
    return this.moving;
  }
}
