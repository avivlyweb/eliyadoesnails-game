// blender/validate.mjs — glTF asset validation suite and CI Guard (§7)
import fs from "fs";
import path from "path";
import { NodeIO } from "@gltf-transform/core";
import validator from "gltf-validator";

const APPENDIX_A_COPIED_FILES = [
  "architecture/artist-house.glb",
  "architecture/canopy-archive.glb",
  "architecture/clock-house.glb",
  "architecture/cloudrest.glb",
  "architecture/juniper-house.glb",
  "architecture/kiln-steps.glb",
  "architecture/lantern-bridge.glb",
  "architecture/lantern-lofts.glb",
  "architecture/reading-house.glb",
  "architecture/tidemark-baths.glb",
  "architecture/tortoise-garden.glb",
  "delights/mushroom-choir.glb",
  "delights/rain-can.glb",
  "delights/snail-race.glb",
  "delights/sockling.glb",
  "discoveries/apple-basket.glb",
  "discoveries/bird-tree.glb",
  "discoveries/cloudlet.glb",
  "discoveries/fern-clump.glb",
  "discoveries/field-note.glb",
  "discoveries/firefly-lantern.glb",
  "discoveries/flower-patch.glb",
  "discoveries/forest-pine.glb",
  "discoveries/giant-mushroom.glb",
  "discoveries/glade-stone.glb",
  "discoveries/hollow-log.glb",
  "discoveries/mossbun.glb",
  "discoveries/mushling.glb",
  "discoveries/music-box.glb",
  "discoveries/paint-easel.glb",
  "discoveries/park-swing.glb",
  "discoveries/pebblit.glb",
  "discoveries/petal-tree.glb",
  "discoveries/pipbird.glb",
  "discoveries/rain-grump.glb",
  "discoveries/shell-shrine.glb",
  "discoveries/star-scope.glb",
  "discoveries/teasnail.glb",
  "discoveries/tree-stump.glb",
  "discoveries/wind-chime.glb",
  "discoveries/wishing-bell.glb",
  "discoveries/woodland-snail.glb",
  "pets/bsod.glb",
  "pets/codex.glb",
  "pets/null-signal.glb",
  "pets/stacky.glb",
  "world/fountain.glb",
  "world/froge-statue.glb",
  "world/windmill.glb"
];

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

function getAllFiles(dir, ext = ".glb") {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(getAllFiles(full, ext));
    } else if (item.isFile() && item.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

// Check for build script or .blend file in blender/
function findBlenderSource(glbRelPath, blenderFiles) {
  const baseName = path.basename(glbRelPath, ".glb");
  // 1. Direct match with a script or blend
  if (blenderFiles.some(f => path.basename(f).startsWith(baseName) || f.includes(`/${baseName}.`))) {
    return true;
  }
  // 2. Pets generator
  if (glbRelPath.startsWith("pets/") && blenderFiles.some(f => f.endsWith("build_pets.py"))) {
    return true;
  }
  // 3. Studio/salon assets generator
  if (blenderFiles.some(f => f.endsWith("build_studio_assets.py"))) {
    const studioScript = fs.readFileSync("blender/scripts/studio/build_studio_assets.py", "utf8");
    if (studioScript.includes(`"${baseName}"`) || studioScript.includes(`/${baseName}"`)) {
      return true;
    }
  }
  // 4. Mascot / bunny directories
  if (baseName === "peach-mochi-bunny" && blenderFiles.some(f => f.includes("peach-mochi-bunny"))) return true;
  if (baseName === "eliya-cloud-mascot" && blenderFiles.some(f => f.includes("eliya-cloud-mascot"))) return true;

  return false;
}

async function validateFile(filePath, id, spec, io) {
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
  let doc;
  try {
    doc = await io.readBinary(new Uint8Array(buffer));
  } catch (e) {
    errors.push(`Failed to parse with gltf-transform: ${e.message}`);
    return { id, errors, warnings, tris: 0, materials: [], nodes: [], minY: 0, height: 0, width: 0 };
  }

  const root = doc.getRoot();

  // 3. Check for forbidden Backdrop mesh or node
  for (const node of root.listNodes()) {
    const nodeName = (node.getName() || "").toLowerCase();
    if (nodeName.includes("backdrop")) {
      errors.push(`CI Guard Error: Found forbidden backdrop node "${node.getName()}"`);
    }
  }
  for (const mesh of root.listMeshes()) {
    const meshName = (mesh.getName() || "").toLowerCase();
    if (meshName.includes("backdrop")) {
      errors.push(`CI Guard Error: Found forbidden backdrop mesh "${mesh.getName()}"`);
    }
  }

  // 4. Materials
  const materials = root.listMaterials();
  const matCount = materials.length;
  const isFiller = spec && spec.category === "filler";
  const maxMaterials = isFiller ? 2 : 10;
  if (spec && matCount > maxMaterials) {
    errors.push(`Material count ${matCount} exceeds limit of ${maxMaterials}`);
  }
  for (const m of materials) {
    const name = m.getName() || "";
    if (name && !name.startsWith("pal_")) {
      // Non-fatal warning if from studio catalog, error if from spec
      if (spec) errors.push(`Material "${name}" does not start with "pal_"`);
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

  // CI Guard: Check for plane > 4m in character/pet/prop/pickup/filler
  const isLargeBuilding = filePath.includes("architecture/") || filePath.includes("world/");
  if (!isLargeBuilding && (widthX > 4.0 || widthZ > 4.0 || height > 4.0)) {
    // If it's a flat plane (> 4m across and < 0.1m thick)
    const isPlane = (widthX > 4.0 && widthZ > 4.0 && height < 0.2) || (widthX > 4.0 && height > 4.0 && widthZ < 0.2);
    if (isPlane) {
      errors.push(`CI Guard Error: Found oversized plane mesh (${widthX.toFixed(2)}x${height.toFixed(2)}x${widthZ.toFixed(2)}m > 4m limit)`);
    }
  }

  // Spec checks for B1 Filler
  if (spec && spec.category === "filler") {
    if (minY < -0.02 || minY > 0.02) {
      errors.push(`Min Y is ${minY.toFixed(4)} (must be between -0.02 and 0.02)`);
    }
    const meshNodes = allNodes.filter(n => n.getMesh() !== null);
    if (meshNodes.length !== 1 || allNodes.length !== 1) {
      errors.push(`Filler must contain exactly one mesh node (found ${meshNodes.length} mesh nodes, ${allNodes.length} total nodes)`);
    }
  }

  // Spec dimension checks
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

  // Required nodes check
  if (spec && spec.requiredNodes) {
    for (const req of spec.requiredNodes) {
      if (!nodeNames.includes(req)) {
        errors.push(`Missing required node "${req}"`);
      }
    }
  }

  // NPC required nodes
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
  const modelsDir = "public/models";
  const manifestPath = path.join(modelsDir, "manifest.json");
  console.log("===============================================================================");
  console.log("  BLENDER ASSET VALIDATION & CI GUARD SUITE (§7)");
  console.log("===============================================================================\n");

  let ciErrors = [];

  // --- CI GUARD CHECK 1: Appendix A Copied Models Guard ---
  console.log("▶ [1/4] Checking for Appendix A forbidden copied files...");
  for (const forbidden of APPENDIX_A_COPIED_FILES) {
    const checkPath = path.join(modelsDir, forbidden);
    if (fs.existsSync(checkPath)) {
      ciErrors.push(`[Appendix A Guard] Forbidden copied model detected: ${forbidden}`);
    }
  }
  if (ciErrors.length === 0) {
    console.log("   ✅ PASSED: Zero Appendix A copied files detected in public/models/.\n");
  } else {
    for (const err of ciErrors) console.error(`   ✕ ${err}`);
  }

  // --- CI GUARD CHECK 2: Manifest Entry Guard ---
  console.log("▶ [2/4] Checking manifest.json completeness...");
  if (!fs.existsSync(manifestPath)) {
    ciErrors.push("manifest.json does not exist in public/models/");
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const manifestPaths = new Set(manifest.map(m => m.path));

  const allGlbs = getAllFiles(modelsDir, ".glb");
  const missingManifest = [];
  for (const glb of allGlbs) {
    const relPublic = "/" + path.relative("public", glb).replace(/\\/g, "/");
    if (!manifestPaths.has(relPublic)) {
      missingManifest.push(relPublic);
    }
  }
  if (missingManifest.length > 0) {
    ciErrors.push(`[Manifest Guard] ${missingManifest.length} GLB files missing from manifest: ${missingManifest.slice(0, 5).join(", ")}...`);
  } else {
    console.log(`   ✅ PASSED: All ${allGlbs.length} GLB files are registered in manifest.json.\n`);
  }

  // --- CI GUARD CHECK 3: Source Script / .blend Guard ---
  console.log("▶ [3/4] Checking Blender build scripts / .blend source existence...");
  const blenderFiles = getAllFiles("blender", ".py").concat(
    getAllFiles("blender", ".blend"),
    getAllFiles("blender", ".blend1")
  );
  const missingSources = [];
  for (const glb of allGlbs) {
    const relModels = path.relative(modelsDir, glb).replace(/\\/g, "/");
    if (!findBlenderSource(relModels, blenderFiles)) {
      missingSources.push(relModels);
    }
  }
  if (missingSources.length > 0) {
    ciErrors.push(`[Source Guard] ${missingSources.length} models have no corresponding build script or .blend: ${missingSources.slice(0, 5).join(", ")}`);
  } else {
    console.log(`   ✅ PASSED: All ${allGlbs.length} models have valid source scripts or .blend in blender/.\n`);
  }

  // --- CI GUARD CHECK 4: Geometry Specs & Backdrop Guard ---
  console.log("▶ [4/4] Validating GLB geometry, nodes, and backdrop guard...");
  const io = new NodeIO();
  let specChecked = 0;
  let specFailed = 0;
  const specResults = [];

  for (const [id, spec] of Object.entries(MODEL_SPECS)) {
    const subDir = spec.category === "filler" ? "filler" : spec.category === "pickup" ? "pickups" : spec.category;
    const filePath = path.join(modelsDir, subDir, `${id}.glb`);
    if (!fs.existsSync(filePath)) continue;

    specChecked++;
    const res = await validateFile(filePath, id, spec, io);
    specResults.push(res);
    if (res.errors.length > 0) specFailed++;
  }

  // Also check character models for backdrop meshes
  const characterGlbs = getAllFiles(path.join(modelsDir, "characters"), ".glb").concat(
    getAllFiles(path.join(modelsDir, "pets"), ".glb")
  );
  for (const cGlb of characterGlbs) {
    const res = await validateFile(cGlb, path.basename(cGlb, ".glb"), null, io);
    if (res.errors.length > 0) {
      for (const err of res.errors) ciErrors.push(`${cGlb}: ${err}`);
    }
  }

  // Print results table
  console.log("---------------------------------------------------------------------------------------------------------");
  console.log(
    `| ${"ID".padEnd(26)} | ${"Category".padEnd(8)} | ${"Tris".padStart(5)} | ${"Bytes".padStart(7)} | ${"Min Y".padStart(7)} | ${"Dim(m)".padStart(7)} | ${"Status".padEnd(6)} |`
  );
  console.log("---------------------------------------------------------------------------------------------------------");

  for (const r of specResults) {
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
  console.log(`Spec models checked: ${specChecked} | Passed: ${specChecked - specFailed} | Failed: ${specFailed}\n`);

  if (ciErrors.length > 0 || specFailed > 0) {
    console.error("❌ CI GUARD FAILED WITH ERRORS:");
    for (const err of ciErrors) console.error(`  - ${err}`);
    process.exit(1);
  }

  console.log("✨ ALL CI GUARD CHECKS AND MODEL SPECS PASSED SUCCESSFULLY! ✨\n");
}

main().catch(err => {
  console.error("Validation runner error:", err);
  process.exit(1);
});
