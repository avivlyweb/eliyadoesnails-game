import * as THREE from "three";

/**
 * Quest waypoint for the planetoid.
 * - A soft pink light beam rises from the current target, so it can be seen over the horizon.
 * - A flat arrow circles the player's feet and always points the shortest way along the sphere.
 */
export class QuestWaypoint {
  private beam: THREE.Group;
  private arrow: THREE.Group;
  private time = 0;
  private readonly up = new THREE.Vector3(0, 1, 0);

  constructor(private scene: THREE.Scene, private planetRadius: number) {
    // Beam
    this.beam = new THREE.Group();
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xf2a7b8,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.32, 9, 16, 1, true), beamMat);
    shaft.position.y = 4.5;
    this.beam.add(shaft);

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa8505e,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.95, 40), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;
    ring.name = "ring";
    this.beam.add(ring);

    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28),
      new THREE.MeshStandardMaterial({ color: 0xf6c1cc, emissive: 0xa8505e, emissiveIntensity: 0.6, roughness: 0.2 })
    );
    gem.position.y = 3.4;
    gem.name = "gem";
    this.beam.add(gem);
    this.beam.visible = false;
    scene.add(this.beam);

    // Arrow (flat chevron, tip points +Z in local space)
    this.arrow = new THREE.Group();
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.42);
    shape.lineTo(0.3, -0.12);
    shape.lineTo(0, 0.02);
    shape.lineTo(-0.3, -0.12);
    shape.closePath();
    const arrowMesh = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({ color: 0xa8505e, transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false })
    );
    arrowMesh.rotation.x = Math.PI / 2; // lay flat: shape +Y becomes +Z
    arrowMesh.renderOrder = 5;
    this.arrow.add(arrowMesh);
    this.arrow.visible = false;
    scene.add(this.arrow);
  }

  /** Returns the walking distance in metres (or null when there is no target). */
  public update(
    delta: number,
    playerNormal: THREE.Vector3,
    target: { normal: THREE.Vector3 } | null
  ): number | null {
    this.time += delta;
    if (!target) {
      this.beam.visible = false;
      this.arrow.visible = false;
      return null;
    }

    const tNorm = target.normal.clone().normalize();
    const pNorm = playerNormal.clone().normalize();

    // Beam at the target
    this.beam.visible = true;
    this.beam.position.copy(tNorm).multiplyScalar(this.planetRadius);
    this.beam.quaternion.setFromUnitVectors(this.up, tNorm);
    const gem = this.beam.getObjectByName("gem");
    if (gem) {
      gem.rotation.y += delta * 1.6;
      gem.position.y = 3.4 + Math.sin(this.time * 2.2) * 0.18;
    }
    const ring = this.beam.getObjectByName("ring");
    if (ring) {
      const s = 1 + Math.sin(this.time * 3) * 0.12;
      ring.scale.set(s, s, s);
    }

    // Great-circle distance
    const angle = Math.acos(THREE.MathUtils.clamp(pNorm.dot(tNorm), -1, 1));
    const distance = angle * this.planetRadius;

    // Arrow around the player's feet
    if (distance < 2.6) {
      this.arrow.visible = false;
      return distance;
    }
    const dir = tNorm.clone().addScaledVector(pNorm, -pNorm.dot(tNorm));
    if (dir.lengthSq() < 1e-6) {
      this.arrow.visible = false;
      return distance;
    }
    dir.normalize();
    const right = new THREE.Vector3().crossVectors(pNorm, dir).normalize();
    const basis = new THREE.Matrix4().makeBasis(right, pNorm, dir);
    this.arrow.quaternion.setFromRotationMatrix(basis);

    const bob = 1.05 + Math.sin(this.time * 4) * 0.08;
    this.arrow.position
      .copy(pNorm)
      .multiplyScalar(this.planetRadius + 0.12)
      .addScaledVector(dir, bob);
    this.arrow.visible = true;
    return distance;
  }
}
