// blender/validate.mjs — glTF asset validation suite
import fs from "fs";
import path from "path";
import { NodeIO } from "@gltf-transform/core";
import validator from "gltf-validator";

const MODEL_SPECS = {
  // B1 Filler (max 400 tris, max 2 materials, 1 mesh node, no children)
  "grass-tuft-a": { category: "filler", size: 0.3, sizeType: "height", maxTris: 120 },
  "grass-tuft-b": { category: "filler", size: 0.3, sizeType: "height", maxTris: 120 },
  "grass-tuft-c": { category: "filler", size: 0.3, sizeType: "height", maxTris: 120 },
  "tulip-cluster-pink": { category: "filler", size: 0.45, sizeType: "height", maxTris: 350 },
  "tulip-cluster-red": { category: "filler", size: 0.45, sizeType: "height", maxTris: 350 },
  "tulip-cluster-yellow": { category: "filler", size: 0.45, sizeType: "height", maxTris: 350 },
  "tulip-cluster-white": { category: "filler", size: 0.45, sizeType: "height", maxTris: 350 },
  "pebble-set": { category: "filler", size: 0.3, sizeType: "width", maxTris: 120 },
  "round-bush-small": { category: "filler", size: 0.6, sizeType: "height", maxTris: 400 },
  "round-bush-large": { category: "filler", size: 1.1, sizeType: "height", maxTris: 400 },
  "clover-patch": { category: "filler", size: 0.4, sizeType: "width", maxTris: 150 },
  "reed-clump": { category: "filler", size: 0.8, sizeType: "height", maxTris: 250 },
  "lily-pad-set": { category: "filler", size: 0.6, sizeType: "width", maxTris: 200 },
  "fallen-petals": { category: "filler", size: 0.5, sizeType: "width", maxTris: 100 },
  "cobble-edge-stone": { category: "filler", size: 0.25, sizeType: "width", maxTris: 60 },
  "mushroom-pair": { category: "filler", size: 0.15, sizeType: "height", maxTris: 150 },

  // B3 Pickups (max 10 materials, required node <id>_Glow)
  "sakura-petal-bundle": { category: "pickup", size: 0.40, sizeType: "height", maxTris: 1500, requiredNodes: ["sakura_Glow"] },
  "daisy-sprig": { category: "pickup", size: 0.42, sizeType: "height", maxTris: 1500, requiredNodes: ["daisy_Glow"] },
  "freshwater-pearl-oyster": { category: "pickup", size: 0.35, sizeType: "height", maxTris: 1500, requiredNodes: ["pearl_Pearl", "pearl_Glow"] },
  "chrome-droplet": { category: "pickup", size: 0.40, sizeType: "height", maxTris: 1500, requiredNodes: ["chrome_Glow"] },
  "syrup-glass-vial": { category: "pickup", size: 0.42, sizeType: "height", maxTris: 1500, requiredNodes: ["vial_Liquid", "vial_Glow"] },
  "aurora-crystal-shard": { category: "pickup", size: 0.45, sizeType: "height", maxTris: 1500, requiredNodes: ["crystal_Glow"] },
  "silk-ribbon-spool": { category: "pickup", size: 0.38, sizeType: "height", maxTris: 1500, requiredNodes: ["spool_Glow"] },
  "gold-leaf-flake": { category: "pickup", size: 0.38, sizeType: "height", maxTris: 1500, requiredNodes: ["gold_Glow"] },

  // B5 UI Props (max 10 materials)
  "quest-marker": { category: "ui", size: 0.35, sizeType: "height", maxTris: 300, requiredNodes: ["marker_Gem"] },
  "delivery-parcel": { category: "ui", size: 0.28, sizeType: "width", maxTris: 500 },
  "material-basket": { category: "ui", size: 0.30, sizeType: "width", maxTris: 500 },

  // B4 Characters (NPCs) (max 8000 tris, max 10 materials)
  "mira-florist": { category: "npcs", size: 1.52, sizeType: "height", maxTris: 8000 },
  "nell-potter": { category: "npcs", size: 1.52, sizeType: "height", maxTris: 8000 },
  "bea-houseboat": { category: "npcs", size: 1.52, sizeType: "height", maxTris: 8000 },
  "pip-photo": { category: "npcs", size: 1.52, sizeType: "height", maxTris: 8000 },
  "joon-barista": { category: "npcs", size: 1.52, sizeType: "height", maxTris: 8000 },
  "sanne-stall": { category: "npcs", size: 1.52, sizeType: "height", maxTris: 8000 },
  "truus-tulips": { category: "npcs", size: 1.52, sizeType: "height", maxTris: 8000 },
  "lotte-junior": { category: "npcs", size: 1.14, sizeType: "height", maxTris: 8000 }
};

const NPC_REQUIRED_NODES = [
  "Root", "Body", "Hips", "Neck", "Head",
  "LeftArm", "RightArm", "LeftLeg", "RightLeg",
  "LeftHandSocket", "RightHandSocket", "TraySocket",
  "Eye_L", "Eye_R"
];

async function validateFile(filePath, id, spec) {
  const errors = [];
  const warnings = [];

  const buffer = fs.readFileSync(filePath);

  // 1. gltf-validator: check 0 errors
  const valReport = await validator.validateBytes(new Uint8Array(buffer), {
    validateAccessorData: true
  });
  if (valReport.issues.numErrors > 0) {
    for (const msg of valReport.issues.messages) {
      if (msg.severity === 0) {
        errors.push(`gltf-validator error: ${msg.message} (${msg.pointer})`);
      }
    }
  }

  // 2. Load with gltf-transform
  const io = new NodeIO();
  let doc;
  try {
    doc = await io.readBinary(new Uint8Array(buffer));
  } catch (e) {
    errors.push(`Failed to parse with gltf-transform: ${e.message}`);
    return { id, errors, warnings, tris: 0, materials: [], nodes: [], minY: 0, height: 0, width: 0 };
  }

  const root = doc.getRoot();

  // 4. No textures
  const textures = root.listTextures();
  if (textures.length > 0) {
    errors.push(`Found ${textures.length} textures (expected 0)`);
  }

  // 3. Materials
  const materials = root.listMaterials();
  const matCount = materials.length;
  const isFiller = spec && spec.category === "filler";
  const maxMaterials = isFiller ? 2 : 10;
  if (matCount > maxMaterials) {
    errors.push(`Material count ${matCount} exceeds limit of ${maxMaterials}`);
  }
  for (const m of materials) {
    const name = m.getName() || "";
    if (!name.startsWith("pal_")) {
      errors.push(`Material "${name}" does not start with "pal_"`);
    }
  }

  // Count triangles
  let totalTris = 0;
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const indices = prim.getIndices();
      if (indices) {
        totalTris += indices.getCount() / 3;
      } else {
        const pos = prim.getAttribute("POSITION");
        if (pos) totalTris += pos.getCount() / 3;
      }
    }
  }

  if (spec && spec.maxTris && totalTris > spec.maxTris) {
    errors.push(`Triangle count ${totalTris} exceeds limit ${spec.maxTris}`);
  }

  // World-space bounding box
  let minY = Infinity, maxY = -Infinity;
  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  const allNodes = root.listNodes();
  const nodeNames = allNodes.map(n => n.getName());

  for (const scene of root.listScenes()) {
    scene.traverse((node) => {
      const mesh = node.getMesh();
      if (!mesh) return;
      const m = node.getWorldMatrix(); // 16-element Float32Array column-major
      for (const prim of mesh.listPrimitives()) {
        const pos = prim.getAttribute("POSITION");
        if (!pos) continue;
        for (let i = 0; i < pos.getCount(); i++) {
          const [x, y, z] = pos.getElement(i, []);
          const wx = m[0] * x + m[4] * y + m[8] * z + m[12];
          const wy = m[1] * x + m[5] * y + m[9] * z + m[13];
          const wz = m[2] * x + m[6] * y + m[10] * z + m[14];
          if (wx < minX) minX = wx; if (wx > maxX) maxX = wx;
          if (wy < minY) minY = wy; if (wy > maxY) maxY = wy;
          if (wz < minZ) minZ = wz; if (wz > maxZ) maxZ = wz;
        }
      }
    });
  }

  const height = maxY - minY;
  const widthX = maxX - minX;
  const widthZ = maxZ - minZ;
  const maxHorizontal = Math.max(widthX, widthZ);

  // 5. World-space min Y between -0.02 and 0.02
  if (minY < -0.02 || minY > 0.02) {
    errors.push(`Min Y is ${minY.toFixed(4)} (must be between -0.02 and 0.02)`);
  }

  // 6. Height / dimension within ±25% of spec
  if (spec && spec.size) {
    const targetSize = spec.size;
    const measured = spec.sizeType === "width" ? maxHorizontal : height;
    const minAllowed = targetSize * 0.75;
    const maxAllowed = targetSize * 1.25;
    if (measured < minAllowed || measured > maxAllowed) {
      errors.push(
        `${spec.sizeType || "dimension"} ${measured.toFixed(3)}m is outside ±25% of target ${targetSize}m [${minAllowed.toFixed(3)}m - ${maxAllowed.toFixed(3)}m]`
      );
    }
  }

  // 8. Filler files contain exactly one mesh node
  if (isFiller) {
    const meshNodes = allNodes.filter(n => n.getMesh() !== null);
    if (meshNodes.length !== 1 || allNodes.length !== 1) {
      errors.push(`Filler must contain exactly one mesh node (found ${meshNodes.length} mesh nodes, ${allNodes.length} total nodes)`);
    }
  }

  // Required nodes check
  if (spec && spec.requiredNodes) {
    for (const req of spec.requiredNodes) {
      if (!nodeNames.includes(req)) {
        errors.push(`Missing required node "${req}"`);
      }
    }
  }

  // 7. NPCs contain every required node name from B4
  if (spec && (spec.category === "npc" || spec.category === "npcs")) {
    for (const req of NPC_REQUIRED_NODES) {
      const fullReq = `${id}_${req}`;
      if (!nodeNames.includes(fullReq)) {
        errors.push(`NPC missing required node "${fullReq}"`);
      }
    }
  }

  return {
    id,
    path: filePath,
    errors,
    warnings,
    tris: totalTris,
    bytes: buffer.length,
    materials: materials.map(m => m.getName()),
    nodes: nodeNames,
    minY,
    height,
    width: maxHorizontal
  };
}

async function main() {
  const targetDir = process.argv[2] || "public/models";
  console.log(`\nValidating GLB models in ${targetDir} against specification...\n`);

  let checked = 0;
  let failed = 0;
  const results = [];

  for (const [id, spec] of Object.entries(MODEL_SPECS)) {
    const subDir = spec.category === "filler" ? "filler" : spec.category === "pickup" ? "pickups" : spec.category;
    const filePath = path.join(targetDir, subDir, `${id}.glb`);
    if (!fs.existsSync(filePath)) {
      continue; // only validate models that have been created
    }

    checked++;
    const res = await validateFile(filePath, id, spec);
    results.push(res);
    if (res.errors.length > 0) failed++;
  }

  // Print results table
  console.log("---------------------------------------------------------------------------------------------------------");
  console.log(
    `| ${"ID".padEnd(26)} | ${"Category".padEnd(8)} | ${"Tris".padStart(5)} | ${"Bytes".padStart(7)} | ${"Min Y".padStart(7)} | ${"Dim(m)".padStart(7)} | ${"Status".padEnd(6)} |`
  );
  console.log("---------------------------------------------------------------------------------------------------------");

  for (const r of results) {
    const spec = MODEL_SPECS[r.id];
    const dim = (spec.sizeType === "width" ? r.width : r.height).toFixed(3);
    const status = r.errors.length === 0 ? "PASS" : "FAIL";
    console.log(
      `| ${r.id.padEnd(26)} | ${spec.category.padEnd(8)} | ${String(r.tris).padStart(5)} | ${String(r.bytes).padStart(7)} | ${r.minY.toFixed(3).padStart(7)} | ${dim.padStart(7)} | ${status.padEnd(6)} |`
    );
    if (r.errors.length > 0) {
      for (const err of r.errors) {
        console.log(`   ✕ ERROR: ${err}`);
      }
    }
  }
  console.log("---------------------------------------------------------------------------------------------------------");
  console.log(`Total checked: ${checked} | Passed: ${checked - failed} | Failed: ${failed}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Validation runner error:", err);
  process.exit(1);
});
