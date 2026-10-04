// blender/update_manifest.mjs — scans public/models/ and generates clean manifest.json
import fs from "fs";
import path from "path";
import { NodeIO } from "@gltf-transform/core";

async function main() {
  const modelsDir = "public/models";
  const io = new NodeIO();
  const manifest = [];

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".glb")) {
        const relPath = "/" + path.relative("public", fullPath).replace(/\\/g, "/");
        const id = path.basename(entry.name, ".glb");
        const parts = relPath.split("/").filter(Boolean);
        const category = parts.length > 2 ? parts[1] : "props";

        const buffer = fs.readFileSync(fullPath);
        let tris = 0;
        let nodes = [];

        try {
          const doc = io.readBinary(new Uint8Array(buffer));
          const root = doc.getRoot();
          nodes = root.listNodes().map((n) => n.getName()).filter(Boolean);
          for (const mesh of root.listMeshes()) {
            for (const prim of mesh.listPrimitives()) {
              const indices = prim.getIndices();
              if (indices) {
                tris += indices.getCount() / 3;
              } else {
                const pos = prim.getAttribute("POSITION");
                if (pos) tris += pos.getCount() / 3;
              }
            }
          }
        } catch (e) {
          console.warn(`Could not parse ${relPath}: ${e.message}`);
        }

        manifest.push({
          id,
          path: relPath,
          category,
          tris: Math.round(tris),
          bytes: buffer.length,
          instanced: category === "filler" || id.includes("tuft") || id.includes("pebble"),
          nodes: Array.from(new Set(nodes)),
        });
      }
    }
  }

  scanDir(modelsDir);
  manifest.sort((a, b) => a.id.localeCompare(b.id));

  fs.writeFileSync("public/models/manifest.json", JSON.stringify(manifest, null, 2) + "\n");
  console.log(`✅ Updated public/models/manifest.json with ${manifest.length} models.`);
}

main().catch(console.error);
