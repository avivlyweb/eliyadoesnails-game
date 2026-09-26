import * as THREE from "three";
import gsap from "gsap";

export type GameViewMode = "overworld" | "station" | "photobooth";

export class PlanetCamera {
  public camera: THREE.PerspectiveCamera;
  public mode: GameViewMode = "overworld";

  public distance: number = 10.5;
  public back: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
  public lastNormal: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  private currentLookTarget: THREE.Vector3 = new THREE.Vector3();
  private initialized: boolean = false;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.camera.fov = 44;
    this.camera.near = 0.1;
    this.camera.far = 300;
    this.camera.updateProjectionMatrix();
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
      this.currentLookTarget.copy(playerPos).addScaledVector(playerNormal, 1.2);
      this.initialized = true;
    }

    // Parallel transport camera `back` vector across the sphere as player moves
    const qNorm = new THREE.Quaternion().setFromUnitVectors(this.lastNormal, playerNormal);
    this.back.applyQuaternion(qNorm).projectOnPlane(playerNormal).normalize();
    this.lastNormal.copy(playerNormal);

    // Camera follow distance & height
    const targetDist = isBike ? 13.0 : 10.0;
    const targetHeight = isBike ? 6.5 : 5.2;
    this.distance = THREE.MathUtils.lerp(this.distance, targetDist, delta * 4.0);

    // Smoothly orbit camera behind character when actively moving
    if (isMoving && playerFacing.lengthSq() > 0.1) {
      const desiredBack = playerFacing.clone().negate().projectOnPlane(playerNormal).normalize();
      this.back.lerp(desiredBack, delta * 2.8).projectOnPlane(playerNormal).normalize();
    }

    // Look target slightly above player
    const lookTarget = playerPos.clone().addScaledVector(playerNormal, 1.2);
    this.currentLookTarget.lerp(lookTarget, 1 - Math.exp(-delta * 8));

    // Desired camera position = lookTarget + back * distance + normal * height
    const desiredPos = lookTarget
      .clone()
      .addScaledVector(this.back, this.distance)
      .addScaledVector(playerNormal, targetHeight);

    this.camera.position.lerp(desiredPos, 1 - Math.exp(-delta * 6));
    this.camera.up.lerp(playerNormal, 1 - Math.exp(-delta * 6)).normalize();
    this.camera.lookAt(this.currentLookTarget);
  }
}
