import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Spherical Canal Loop Diorama (Little Ritual Style)
 * Positions key landmarks along a circular canal ring of radius R = 28m.
 */
export class CanalWorld {
  public scene: THREE.Scene;
  public worldGroup: THREE.Group;
  public loader: GLTFLoader;
  public readonly radius: number = 28; // Circular street loop radius

  // Landmark locations (Angle in radians along the loop)
  public landmarks = [
    { name: "Eliya's Atelier", angle: 0, model: "architecture/canal-house-stepped-gable.glb", scale: 1.2 },
    { name: "Arched Brick Bridge", angle: Math.PI * 0.35, model: "architecture/arched-brick-canal-bridge.glb", scale: 1.0 },
    { name: "Florist Flower Cart", angle: Math.PI * 0.65, model: "street/florist-flower-cart.glb", scale: 1.1 },
    { name: "Moored Salon Boat", angle: Math.PI * 1.0, model: "architecture/moored-wooden-salon-boat.glb", scale: 0.9 },
    { name: "Hongdae Photo Booth", angle: Math.PI * 1.35, model: "architecture/photobooth-kiosk.glb", scale: 1.0 },
    { name: "Antique Canal House", angle: Math.PI * 1.70, model: "architecture/canal-house-bell-gable.glb", scale: 1.1 },
  ];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);
    this.loader = new GLTFLoader();
    this.buildTerrainRing();
    this.spawnLandmarks();
    this.spawnStreetLanterns();
  }

  // 1. Build circular cobblestone quay and water ring
  private buildTerrainRing() {
    // Water Canal Ring
    const waterGeo = new THREE.RingGeometry(this.radius - 8, this.radius - 1, 64);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x2b4e54,
      roughness: 0.15,
      metalness: 0.85,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.4;
    this.worldGroup.add(water);

    // Cobblestone Street Ring (Radius 27m to 32m)
    const streetGeo = new THREE.RingGeometry(this.radius - 1, this.radius + 6, 64);
    const streetMat = new THREE.MeshStandardMaterial({
      color: 0xdcd8d0,
      roughness: 0.85,
    });
    const street = new THREE.Mesh(streetGeo, streetMat);
    street.rotation.x = -Math.PI / 2;
    street.position.y = 0;
    street.receiveShadow = true;
    this.worldGroup.add(street);

    // Grassy Island Center
    const islandGeo = new THREE.CircleGeometry(this.radius - 8, 48);
    const islandMat = new THREE.MeshStandardMaterial({
      color: 0x769b74,
      roughness: 0.9,
    });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.rotation.x = -Math.PI / 2;
    island.position.y = -0.2;
    this.worldGroup.add(island);
  }

  // 2. Load and place landmark GLB models along circular perimeter
  private spawnLandmarks() {
    this.landmarks.forEach((item) => {
      const x = (this.radius + 3.5) * Math.sin(item.angle);
      const z = (this.radius + 3.5) * Math.cos(item.angle);

      this.loader.load(
        `/models/${item.model}`,
        (gltf) => {
          const model = gltf.scene;
          model.position.set(x, 0, z);
          model.scale.setScalar(item.scale);
          // Face inward toward the canal
          model.rotation.y = item.angle + Math.PI;

          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          this.worldGroup.add(model);
        },
        undefined,
        (err) => console.warn(`Could not load ${item.model}:`, err)
      );
    });
  }

  // 3. Place warm glowing Amsterdam street lanterns every 45 degrees
  private spawnStreetLanterns() {
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 + 0.2;
      const x = (this.radius - 0.5) * Math.sin(angle);
      const z = (this.radius - 0.5) * Math.cos(angle);

      this.loader.load("/models/street/amsterdam-lantern-post.glb", (gltf) => {
        const post = gltf.scene;
        post.position.set(x, 0, z);
        post.scale.setScalar(0.75);
        post.rotation.y = angle;
        this.worldGroup.add(post);

        // Add warm point light at lantern top
        const light = new THREE.PointLight(0xffbe6b, 1.2, 8);
        light.position.set(x, 2.5, z);
        this.worldGroup.add(light);
      });
    }
  }

  // Calculate circular street coordinates
  public getPointOnStreet(angle: number): THREE.Vector3 {
    return new THREE.Vector3(
      this.radius * Math.sin(angle),
      0,
      this.radius * Math.cos(angle)
    );
  }
}
