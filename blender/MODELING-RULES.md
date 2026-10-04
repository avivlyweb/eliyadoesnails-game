# Modeling Rules for Eliya Does Nails — Canal World

Every 3D asset in the game must follow these strict pipeline and artistic guidelines.
Target aesthetic: Every object must be recognizable at a glance, styled like a handcrafted miniature toy (the warm, tactile, tactile-rich feel of Little Ritual), not photorealistic. A player should immediately identify "market stall", "bike rack", or "tulip bed" without reading UI labels.

---

## 1. Reference First
- Collect 2–3 reference photos of the real object (Amsterdam street photos, canal objects, or client references) before starting.
- In the build script header comment (`blender/scripts/<category>/<id>.py`), list the **3–5 signature features** that make the object instantly recognizable.
- Example (Dutch Canal House):
  1. Tall, narrow front facade.
  2. Distinctive historical gable (stepped, neck, spout, or bell).
  3. Large white-framed sash windows with transoms.
  4. Top hoist beam (hijsbalk) extending from the attic gable.
  5. Stoep entrance steps leading up to the front door.

## 2. Silhouette & Proportions First
- Block out the main mass and silhouette first.
- Compare silhouette against reference images from front, side, and top views before adding detail.
- Fix proportions early; surface detail cannot rescue an inaccurate silhouette.

## 3. Real Shapes, Not Single Primitives
- **Bevel every edge:** 0.5–2.0 cm on props, 2.0–5.0 cm on buildings. In the real world, no edge is razor-sharp.
- **Soft organic forms:** Creatures, cushions, plushies, and foliage must start from squircle/sphere blockouts, subdivided surfaces, or beveled geometry with smoothed normals.
- **Model giveaways as actual geometry:** Window frames, sills, door panels, brass handles, wooden planks, roof tiles on edges, striped awnings, flower planter boxes, and bicycle spokes as slender cylinders. Never use a flat flat cube with a flat texture.
- **Charming imperfections:** Include subtle personality—slight tilts, organic plank variations, and gently rounded corners.

## 4. Real World Scale (1 unit = 1 meter)
- Door opening: ~2.0 m tall.
- Bench seat height: ~0.45 m.
- Canal lamp post: ~3.0–3.5 m.
- Canal house facade: ~9.0–12.0 m tall.
- Dutch Omafiets bicycle: ~1.7 m long.
- Character height: ~1.0–1.5 m.
- Origin point placed at bottom center (ground contact), facing −Y.

## 5. glTF-Safe Materials Only
- glTF 2.0 and Three.js only support standard PBR properties reliably:
  - Base Color
  - Roughness
  - Metallic
  - Emissive
  - Alpha / Transmission (when specified)
- **Forbidden in GLB:** Procedural noise textures, Cycles subsurface scattering (SSS), Blender velvet shaders, coat shaders, and volumetrics. They do not export to Three.js and render as flat orange/gray plastic.
- Use color tokens from `blender/scripts/_lib.py`.
- If patterns are required (e.g., brickwork, wood grain, fabric weave), bake them to texture atlases (512 px for props, 1024 px for large structures).

## 6. Correct Export Pipeline
- **Apply all modifiers** before exporting meshes (e.g. Bevel, Subsurf) or export with `export_apply=True`.
- **Export model collection only:** Group the model's meshes and functional sockets (`eliya_*` empties) into a dedicated Blender Collection. Select the collection and export with `use_selection=True`.
- **Zero scene junk:** Never export cameras, studio backdrop planes, test lights, or helper rigs into the final `.glb`.
- **Post-export validation:** Re-import the `.glb` or run validation scripts. Any mesh that is meant to be curved must have sufficient vertices (e.g. >= 200 vertices for rounded character bodies) rather than 8 vertices.

## 7. Judge in the Game, Not in Blender
- A model is only approved once viewed inside Three.js at the actual **in-game camera distance and lighting**.
- Capture screenshots from front, 3/4 perspective, and rear angles.
- Save validation screenshots in `blender/previews/<id>/`.

## 8. Geometry Budgets
- Small props / dressing: <= 3,000 triangles.
- Characters / NPCs: <= 20,000 triangles.
- Buildings / landmarks: <= 15,000 triangles.
- File size budget: Props <= 1 MB; Buildings <= 2 MB.

## 9. Deliverables per Asset
Every model shipped to `public/models/` must include:
1. Python build script: `blender/scripts/<category>/<id>.py`.
2. Validated `.glb` binary in `public/models/<category>/<id>.glb`.
3. Entry in `public/models/manifest.json` (`id`, `path`, `category`, `tris`, `bytes`, `nodes`).
4. In-game preview screenshots in `blender/previews/<id>/`.
5. Passing status in `node blender/validate.mjs`.
