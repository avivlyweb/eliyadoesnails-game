import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { sound } from "./audio";

export interface LandmarkTarget {
  name: string;
  angle: number;
  action?: string;
}

export class PlayerController {
  public scene: THREE.Scene;
  public group: THREE.Group;
  public bicycleModel: THREE.Group | null = null;
  public avatarMesh: THREE.Group;
  
  // Circular Polar Coordinates
  public radius: number = 28; // Ring radius
  public angle: number = 0;   // Radian angle around diorama (0 to 2*PI)
  public lateralOffset: number = 0; // -1.5m to +1.5m sidewalk width
  
  // Movement State
  public speed: number = 0;
  public isRidingBike: boolean = false;
  public targetAngle: number = 0;
  public isNearLandmark: LandmarkTarget | null = null;

  // Key tracking
  private keys: Record<string, boolean> = {};

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Build stylized avatar (Eliya slow-living aesthetic)
    this.avatarMesh = this.buildStylizedAvatar();
    this.group.add(this.avatarMesh);

    this.loadBicycle();
    this.setupInput();
    this.updateTransform();
  }

  private buildStylizedAvatar(): THREE.Group {
    const group = new THREE.Group();

    // Body / Linen Apron Dress (#FAF7F5 cream with warm blush trim)
    const bodyGeo = new THREE.CylinderGeometry(0.28, 0.45, 0.9, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xFAF7F5,
      roughness: 0.8,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.85;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xffdfd0,
      roughness: 0.6,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.45;
    head.castShadow = true;
    group.add(head);

    // Hair bun (Soft espresso / dark brown)
    const hairGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x3d2b1f,
      roughness: 0.9,
    });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 1.62, -0.12);
    group.add(hair);

    return group;
  }

  private loadBicycle() {
    const loader = new GLTFLoader();
    loader.load("/models/street/vintage-bicycle-eliya.glb", (gltf) => {
      this.bicycleModel = gltf.scene;
      this.bicycleModel.scale.setScalar(0.9);
      this.bicycleModel.position.set(0, 0, 0);
      this.bicycleModel.visible = false;
      this.group.add(this.bicycleModel);
    });
  }

  private setupInput() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === "b") {
        this.toggleBicycle();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  public toggleBicycle() {
    this.isRidingBike = !this.isRidingBike;
    if (this.bicycleModel) {
      this.bicycleModel.visible = this.isRidingBike;
    }
    // Adjust avatar height when seated on bicycle
    this.avatarMesh.position.y = this.isRidingBike ? 0.35 : 0;
    this.avatarMesh.position.z = this.isRidingBike ? -0.2 : 0;

    // Play playful Dutch bicycle bell sound!
    sound.playBicycleBell();
  }

  public update(delta: number, landmarks: LandmarkTarget[]) {
    const walkSpeed = 0.45;  // radians per second
    const bikeSpeed = 0.95;  // radians per second
    const currentMaxSpeed = this.isRidingBike ? bikeSpeed : walkSpeed;

    let moveDir = 0;
    let lateralDir = 0;

    if (this.keys["w"] || this.keys["arrowup"]) moveDir += 1;
    if (this.keys["s"] || this.keys["arrowdown"]) moveDir -= 1;
    if (this.keys["a"] || this.keys["arrowleft"]) lateralDir -= 1;
    if (this.keys["d"] || this.keys["arrowright"]) lateralDir += 1;

    // Advance along circular ring
    if (moveDir !== 0) {
      this.speed = THREE.MathUtils.lerp(this.speed, moveDir * (currentMaxSpeed / this.radius), delta * 5);
    } else {
      this.speed = THREE.MathUtils.lerp(this.speed, 0, delta * 8);
    }

    this.angle = (this.angle + this.speed * delta + Math.PI * 2) % (Math.PI * 2);

    // Lateral street wandering
    this.lateralOffset = THREE.MathUtils.clamp(
      this.lateralOffset + lateralDir * delta * 2.5,
      -1.8,
      2.2
    );

    this.updateTransform();
    this.checkLandmarks(landmarks);
  }

  private updateTransform() {
    const r = this.radius + this.lateralOffset;
    const x = r * Math.sin(this.angle);
    const z = r * Math.cos(this.angle);

    this.group.position.set(x, 0, z);

    // Tangent angle along the circle
    const tangent = this.angle + (this.speed >= 0 ? Math.PI / 2 : -Math.PI / 2);
    this.group.rotation.y = tangent;
  }

  private checkLandmarks(landmarks: LandmarkTarget[]) {
    this.isNearLandmark = null;
    for (const lm of landmarks) {
      // Angular distance
      let diff = Math.abs(this.angle - lm.angle);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;

      // Within ~2.5 meters
      if (diff * this.radius < 3.2) {
        this.isNearLandmark = lm;
        break;
      }
    }
  }

  public getPosition(): THREE.Vector3 {
    return this.group.position;
  }
}
