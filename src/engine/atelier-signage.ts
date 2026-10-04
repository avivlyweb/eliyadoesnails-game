import * as THREE from "three";

/**
 * Shop signage for Eliya's atelier (canal-house-stepped-gable.glb).
 * The house's street front is local -Z (door, stoep and shop window are there).
 * Adds: a name board above the door/window, a classic Amsterdam hanging blade sign
 * with the logo, a round logo decal on the shop window, and a pink awning over that window.
 */
const BURGUNDY = "#A8505E";
const CREAM = "#FAF4EE";
const GOLD = "#D9B26A";
const SERIF = '"Cormorant Garamond", "Didot", Georgia, serif';

let logoImg: HTMLImageElement | null = null;
const logoReady: Promise<HTMLImageElement | null> = new Promise((resolve) => {
  const img = new Image();
  img.onload = () => {
    logoImg = img;
    resolve(img);
  };
  img.onerror = () => resolve(null);
  img.src = "/brand/icons/logo.svg";
});

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const redraw = () => {
    ctx.clearRect(0, 0, w, h);
    draw(ctx);
    tex.needsUpdate = true;
  };
  redraw();
  // Redraw once the web font and the logo have loaded
  Promise.all([document.fonts?.ready, logoReady]).then(redraw).catch(() => {});
  return tex;
}

function drawLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  if (!logoImg) return;
  // logo viewBox is 88x88 (arch + glyph)
  ctx.drawImage(logoImg, cx - size / 2, cy - size / 2, size, size);
}

function nameBoardTexture() {
  return canvasTexture(2048, 200, (ctx) => {
    const w = 2048, h = 200;
    ctx.fillStyle = BURGUNDY;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 6;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    // logo badge on the left
    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.arc(150, h / 2, 68, 0, Math.PI * 2);
    ctx.fill();
    drawLogo(ctx, 150, h / 2 + 4, 118);
    // name
    ctx.fillStyle = CREAM;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = `italic 600 128px ${SERIF}`;
    ctx.fillText("eliyadoesnails", w / 2 + 70, h / 2 + 4);
    ctx.font = `500 40px ${SERIF}`;
    ctx.fillStyle = GOLD;
    ctx.textAlign = "right";
    ctx.fillText("NAIL ATELIER", w - 60, h / 2 + 4);
  });
}

function bladeSignTexture() {
  return canvasTexture(512, 640, (ctx) => {
    const w = 512, h = 640;
    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.roundRect(8, 8, w - 16, h - 16, 60);
    ctx.fill();
    ctx.strokeStyle = BURGUNDY;
    ctx.lineWidth = 14;
    ctx.stroke();
    drawLogo(ctx, w / 2, 225, 290);
    ctx.fillStyle = BURGUNDY;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `italic 700 92px ${SERIF}`;
    ctx.fillText("eliya", w / 2, 445);
    ctx.font = `italic 700 74px ${SERIF}`;
    ctx.fillText("does nails", w / 2, 535);
  });
}

function windowDecalTexture() {
  return canvasTexture(512, 512, (ctx) => {
    const s = 512;
    ctx.fillStyle = "rgba(250, 244, 238, 0.92)";
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s / 2 - 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 8;
    ctx.stroke();
    drawLogo(ctx, s / 2, s / 2 - 40, 250);
    ctx.fillStyle = BURGUNDY;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `italic 600 54px ${SERIF}`;
    ctx.fillText("eliyadoesnails", s / 2, s / 2 + 140);
    ctx.font = `500 26px ${SERIF}`;
    ctx.fillText("BESPOKE NAILS · AMSTERDAM", s / 2, s / 2 + 190);
  });
}

export function addAtelierSignage(house: THREE.Object3D) {
  // Local front face of the facade: the brick body ends at z = -1.30 (door/window frames at -1.35)
  const FRONT_Z = -1.36;
  const group = new THREE.Group();
  group.name = "atelier_Signage";

  // 1. Name board across the facade, between the ground-floor openings and the first-floor windows
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(2.16, 0.24, 0.05),
    [
      new THREE.MeshStandardMaterial({ color: 0x8e3f4c, roughness: 0.6 }), // sides
      new THREE.MeshStandardMaterial({ color: 0x8e3f4c, roughness: 0.6 }),
      new THREE.MeshStandardMaterial({ color: 0x8e3f4c, roughness: 0.6 }),
      new THREE.MeshStandardMaterial({ color: 0x8e3f4c, roughness: 0.6 }),
      new THREE.MeshStandardMaterial({ color: 0x8e3f4c, roughness: 0.6 }), // back (+z, against wall)
      new THREE.MeshStandardMaterial({ map: nameBoardTexture(), roughness: 0.45, emissive: 0x2a0c12, emissiveIntensity: 0.15 }), // front (-z)
    ]
  );
  // BoxGeometry material order: +x, -x, +y, -y, +z, -z
  board.position.set(0, 1.74, FRONT_Z - 0.03);
  board.castShadow = true;
  group.add(board);

  // 2. Hanging blade sign: wrought-iron bracket sticking out from the facade at first-floor height
  const iron = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.6 });
  const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.78, 10), iron);
  bracket.rotation.x = Math.PI / 2;
  bracket.position.set(1.0, 2.62, FRONT_Z - 0.39);
  group.add(bracket);
  const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 8), iron);
  brace.position.set(1.0, 2.42, FRONT_Z - 0.2);
  brace.rotation.x = 0.75;
  group.add(brace);
  const blade = new THREE.Group();
  const bladeTex = bladeSignTexture();
  const bladeMat = new THREE.MeshStandardMaterial({ map: bladeTex, roughness: 0.5 });
  // Painted board: a thin burgundy frame with the printed face on both outer sides
  const rim = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.67, 0.56), new THREE.MeshStandardMaterial({ color: 0xa8505e, roughness: 0.5 }));
  rim.position.y = -0.36;
  blade.add(rim);
  for (const side of [1, -1]) {
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.65), bladeMat);
    face.rotation.y = side * Math.PI / 2; // +x face and -x face, perpendicular to the facade
    face.position.set(side * 0.0095, -0.36, 0);
    blade.add(face);
  }
  for (const dz of [-0.2, 0.2]) {
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 6), iron);
    chain.position.set(0, -0.02, dz);
    blade.add(chain);
  }
  blade.position.set(1.0, 2.6, FRONT_Z - 0.48);
  blade.name = "atelier_BladeSign";
  group.add(blade);

  // 3. Round logo decal on the ground-floor shop window (window frame x 0.23..0.88, y 0.47..1.42)
  const decal = new THREE.Mesh(
    new THREE.CircleGeometry(0.26, 48),
    new THREE.MeshStandardMaterial({ map: windowDecalTexture(), transparent: true, roughness: 0.3 })
  );
  decal.position.set(0.555, 0.98, FRONT_Z - 0.005);
  decal.rotation.y = Math.PI; // face the street (-z)
  group.add(decal);

  // 4. Pink scalloped awning over the shop window
  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, 0.04, 0.42),
    new THREE.MeshStandardMaterial({ color: 0xa8505e, roughness: 0.55 })
  );
  awning.position.set(0.555, 1.5, FRONT_Z - 0.2);
  awning.rotation.x = -0.32;
  awning.castShadow = true;
  group.add(awning);
  for (let i = 0; i < 6; i++) {
    const scallop = new THREE.Mesh(
      new THREE.CircleGeometry(0.07, 16, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: i % 2 ? 0xfaf4ee : 0xa8505e, roughness: 0.55, side: THREE.DoubleSide })
    );
    scallop.rotation.set(0, Math.PI, Math.PI);
    scallop.position.set(0.555 - 0.35 + i * 0.14, 1.42, FRONT_Z - 0.405);
    group.add(scallop);
  }

  house.add(group);
  return group;
}

/** Gentle sway for the blade sign; call every frame. */
export function swayAtelierSign(house: THREE.Object3D | null, time: number) {
  const blade = house?.getObjectByName("atelier_BladeSign");
  if (blade) blade.rotation.z = Math.sin(time * 1.3) * 0.04;
}
