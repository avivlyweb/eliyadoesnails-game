import * as THREE from "three";

export interface DistrictConfig {
  key: string;
  name: string;
  nameKo: string;
  centerTheta: number;
  centerPhi: number;
  radius: number; // in radians
  unlockLevel: number;
  tallLandmark: string;
}

export const DISTRICTS: DistrictConfig[] = [
  {
    key: "canal",
    name: "Canal Street",
    nameKo: "운하 거리",
    centerTheta: 0.8,
    centerPhi: 0.8,
    radius: 0.35,
    unlockLevel: 1,
    tallLandmark: "Stepped Gable Atelier",
  },
  {
    key: "market",
    name: "Market Square",
    nameKo: "마켓 광장",
    centerTheta: 2.1,
    centerPhi: 0.8,
    radius: 0.3,
    unlockLevel: 2,
    tallLandmark: "Market Photobooth & Kiosk",
  },
  {
    key: "meadow",
    name: "Tulip Meadow",
    nameKo: "튤립 초원",
    centerTheta: 3.4,
    centerPhi: 0.8,
    radius: 0.35,
    unlockLevel: 3,
    tallLandmark: "Glass Greenhouse",
  },
  {
    key: "windmill",
    name: "Windmill Hill",
    nameKo: "풍차 언덕",
    centerTheta: 4.7,
    centerPhi: 0.8,
    radius: 0.3,
    unlockLevel: 5,
    tallLandmark: "Historic Windmill",
  },
  {
    key: "harbour",
    name: "Harbour",
    nameKo: "하버",
    centerTheta: 5.9,
    centerPhi: 1.05,
    radius: 0.3,
    unlockLevel: 8,
    tallLandmark: "Salon Boat Mast",
  },
];

// Seeded PRNG (mulberry32) for deterministic, stable world layout
export function createMulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) + 1;
}

// Convert spherical (theta, phi) to unit normal
export function sphericalToNormal(theta: number, phi: number): THREE.Vector3 {
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);
  return new THREE.Vector3(sinPhi * sinTheta, cosPhi, sinPhi * cosTheta).normalize();
}

// Great-circle spherical slerp between two unit vectors
export function slerpNormals(a: THREE.Vector3, b: THREE.Vector3, t: number): THREE.Vector3 {
  const dot = THREE.MathUtils.clamp(a.dot(b), -1, 1);
  const omega = Math.acos(dot);
  if (omega < 0.0001) return a.clone();
  const sinOmega = Math.sin(omega);
  const scaleA = Math.sin((1 - t) * omega) / sinOmega;
  const scaleB = Math.sin(t * omega) / sinOmega;
  return new THREE.Vector3(
    a.x * scaleA + b.x * scaleB,
    a.y * scaleA + b.y * scaleB,
    a.z * scaleA + b.z * scaleB
  ).normalize();
}
