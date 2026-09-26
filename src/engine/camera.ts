import * as THREE from "three";
import gsap from "gsap";

export type CameraMode = "overworld" | "station" | "photobooth" | "free";

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  public mode: CameraMode = "overworld";
  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private targetLookAt: THREE.Vector3 = new THREE.Vector3();

  // Current smooth lookAt
  private currentLookAt: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.camera.fov = 42;
    this.camera.near = 0.1;
    this.camera.far = 250;
    this.camera.updateProjectionMatrix();

    // Default overworld start
    this.camera.position.set(0, 18, 38);
    this.currentLookAt.set(0, 2, 28);
    this.camera.lookAt(this.currentLookAt);
  }

  // Smoothly transition between game modes
  public setMode(mode: CameraMode, duration = 1.6) {
    this.mode = mode;

    let destPos = new THREE.Vector3();
    let destLook = new THREE.Vector3();

    if (mode === "station") {
      // Macro First-Person Manicure Table View (Tactile close-up)
      destPos.set(0, 1.45, 1.1);
      destLook.set(0, 0.95, 0.0);
    } else if (mode === "photobooth") {
      // Frontal framing for Hongdae 4-cuts kiosk
      destPos.set(0, 1.5, 2.2);
      destLook.set(0, 1.4, 0);
    } else if (mode === "overworld") {
      // Overworld isometric angle
      destPos.set(0, 18, 38);
      destLook.set(0, 2, 28);
    }

    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.currentLookAt);

    gsap.to(this.camera.position, {
      x: destPos.x,
      y: destPos.y,
      z: destPos.z,
      duration,
      ease: "power2.inOut",
    });

    gsap.to(this.currentLookAt, {
      x: destLook.x,
      y: destLook.y,
      z: destLook.z,
      duration,
      ease: "power2.inOut",
      onUpdate: () => {
        this.camera.lookAt(this.currentLookAt);
      },
    });
  }

  // Follow player along the circular canal street
  public update(playerPos: THREE.Vector3, playerAngle: number, isRidingBike: boolean, delta: number) {
    if (this.mode !== "overworld") return;

    // Little Ritual smooth polar camera tracking
    // Position camera elevated and slightly behind/above the tangent
    const camDistance = isRidingBike ? 14 : 11;
    const camHeight = isRidingBike ? 8.5 : 6.8;

    // Vector outward from diorama center
    const outward = new THREE.Vector3(Math.sin(playerAngle), 0, Math.cos(playerAngle)).normalize();

    this.targetPosition.set(
      playerPos.x + outward.x * camDistance,
      playerPos.y + camHeight,
      playerPos.z + outward.z * camDistance
    );

    this.targetLookAt.set(
      playerPos.x - outward.x * 1.5,
      playerPos.y + 1.2,
      playerPos.z - outward.z * 1.5
    );

    // Smooth lerp
    this.camera.position.lerp(this.targetPosition, 4.0 * delta);
    this.currentLookAt.lerp(this.targetLookAt, 5.0 * delta);
    this.camera.lookAt(this.currentLookAt);
  }
}
