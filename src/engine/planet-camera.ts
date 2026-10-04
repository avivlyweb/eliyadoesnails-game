import * as THREE from "three";
import gsap from "gsap";

export type GameViewMode = "overworld" | "station" | "photobooth";

export class PlanetCamera {
  public camera: THREE.PerspectiveCamera;
  public mode: GameViewMode = "overworld";

  // Section 8 & World Rebuild §6.3 Specs: Diorama pitch 40°, dist 9.0, key [V] toggle
  public distance: number = 9.0;
  public baseDistance: number = 9.0;
  public zoomMin: number = 4.8;
  public zoomMax: number = 14.0;
  public isDioramaPitch: boolean = true; // 40° diorama view vs 21° horizon view

  public back: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
  public lastNormal: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  private currentLookTarget: THREE.Vector3 = new THREE.Vector3();
  private initialized: boolean = false;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.camera.fov = 50; // Spec §8: FOV 50
    this.camera.near = 0.1;
    this.camera.far = 300;
    this.camera.updateProjectionMatrix();

    this.setupScrollZoom();
    this.setupViewToggle();
  }

  private setupViewToggle() {
    window.addEventListener("keydown", (e) => {
      if (e.code === "KeyV" && !e.repeat) {
        this.isDioramaPitch = !this.isDioramaPitch;
        this.baseDistance = this.isDioramaPitch ? 9.0 : 7.5;
      }
    });
  }

  private setupScrollZoom() {
    window.addEventListener("wheel", (e) => {
      if (this.mode !== "overworld") return;
      this.baseDistance = THREE.MathUtils.clamp(
        this.baseDistance + e.deltaY * 0.005,
        this.zoomMin,
        this.zoomMax
      );
    }, { passive: true });
  }

  public setMode(mode: GameViewMode, duration = 1.4) {
    this.mode = mode;
    if (mode === "station") {
      gsap.killTweensOf(this.camera.position);
      gsap.to(this.camera.position, {
        x: 0,
        y: 1.42,
        z: 1.1,
        duration,
        ease: "power2.inOut",
      });
      this.camera.up.set(0, 1, 0);
    }
  }

  public update(
    playerPos: THREE.Vector3,
    playerNormal: THREE.Vector3,
    playerFacing: THREE.Vector3,
    isMoving: boolean,
    isBike: boolean,
    delta: number
  ) {
    if (this.mode !== "overworld") return;

    if (!this.initialized) {
      this.lastNormal.copy(playerNormal);
      this.back.copy(playerFacing).negate().projectOnPlane(playerNormal).normalize();
      if (this.back.lengthSq() < 0.1) {
        this.back.set(0, 0, 1).projectOnPlane(playerNormal).normalize();
      }
      this.currentLookTarget.copy(playerPos).addScaledVector(playerNormal, 1.1);
      this.initialized = true;
    }

    // Parallel transport camera `back` vector across the sphere as player moves
    const qNorm = new THREE.Quaternion().setFromUnitVectors(this.lastNormal, playerNormal);
    this.back.applyQuaternion(qNorm).projectOnPlane(playerNormal).normalize();
    this.lastNormal.copy(playerNormal);

    // Camera follow distance & height (Spec §6.3: pitch 40° diorama view vs 21° horizon view)
    const targetDist = isBike ? this.baseDistance * 1.25 : this.baseDistance;
    const targetPitch = this.isDioramaPitch ? 40 : 21;
    const targetHeight = targetDist * Math.tan(THREE.MathUtils.degToRad(targetPitch));
    this.distance = THREE.MathUtils.lerp(this.distance, targetDist, delta * 4.5);

    // Smoothly orbit camera behind character when moving
    if (isMoving && playerFacing.lengthSq() > 0.1) {
      const desiredBack = playerFacing.clone().negate().projectOnPlane(playerNormal).normalize();
      this.back.lerp(desiredBack, delta * 3.2).projectOnPlane(playerNormal).normalize();
    }

    // Look target slightly above player (1.1m)
    const lookTarget = playerPos.clone().addScaledVector(playerNormal, 1.1);
    this.currentLookTarget.lerp(lookTarget, 1 - Math.exp(-delta * 9));

    // Desired camera position
    const desiredPos = lookTarget
      .clone()
      .addScaledVector(this.back, this.distance)
      .addScaledVector(playerNormal, targetHeight);

    this.camera.position.lerp(desiredPos, 1 - Math.exp(-delta * 7));
    this.camera.up.lerp(playerNormal, 1 - Math.exp(-delta * 7)).normalize();
    this.camera.lookAt(this.currentLookTarget);
  }
}
