# blender/scripts/studio/build_studio_assets.py
# Specification and generator source registry for Eliya Does Nails atelier, salon station,
# manicure furniture, nail charm props, press-on sets, and studio tools.
# All assets follow glTF 2.0 PBR standards with pal_* palette tokens.

import os
import sys

STUDIO_ASSETS = [
    # Manicure & Salon Furniture
    "furniture/manicure-station-deluxe",
    "furniture/client-boucle-chair",
    "furniture/client-boucle-tub-chair",
    "furniture/stylist-swivel-stool",
    "furniture/rolling-treatment-cart",
    "furniture/floating-lacquer-display",
    "furniture/washi-folding-screen",
    "furniture/potted-fiddle-leaf-fig",
    "furniture/brass-arc-floor-lamp",
    "furniture/ar-hand-mannequin-pedestal",
    "manicure-station",

    # Precision Nail Tools
    "tools/micro-liner-brush",
    "tools/precision-angled-tweezers",
    "tools/czech-glass-nail-file",
    "tools/magnetic-cat-eye-wand",
    "tools/aura-micro-diffusion-airbrush",
    "tools/chrome-burnishing-sponge-pen",
    "tools/glass-syrup-swatch-discs",
    "tools/cuticle-serum-dropper",
    "tools/nail-sizing-kit-wheel",

    # Atelier Station Dressing
    "station/desktop-uv-tunnel-lamp",
    "station/scalloped-ceramic-charm-palette",
    "station/cloud-ergonomic-hand-rest",
    "station/heavy-glass-dappen-dish",
    "station/steaming-ceramic-matcha-mug",
    "station/client-wish-journal",
    "station/celadon-tea-ceremony-set",
    "station/hinoki-incense-burner",
    "station/couture-press-on-drawer-box",
    "station/linen-velvet-hand-pillow",
    "station/artist-lookbook-catalog",
    "station/life4cuts-photo-strip",

    # 3D Nail Charms
    "charms/baroque-nacre-pearl",
    "charms/faceted-aurora-teardrop-gem",
    "charms/molten-chrome-drops",
    "charms/sculpted-ribbon-bow",
    "charms/charm-molten-chrome-drops",
    "charms/charm-sculpted-ribbon-bow",
    "charms/saturn-orbital-charm",
    "charms/barbed-wire-cyber-heart",
    "charms/charm-y2k-cyber-stars",
    "charms/charm-chrome-monkey",

    # Signature Press-On Nail Sets
    "sets/set-cherry-blossom",
    "sets/set-matcha-glaze",
    "sets/set-apricot-pearl",
    "sets/set-rose-quartz-french",
    "sets/blush-glaze-coquette-set",
    "sets/cyberpunk-liquid-chrome-set",
    "sets/set-moonlight-cateye",

    # Architectural Props & Street Context
    "street/cast-iron-mooring-bollard",
    "street/florist-flower-cart",
    "street/amsterdam-lantern-post",
    "street/cobblestone-quay-tree-grate",
    "street/vintage-bicycle-eliya",
    "architecture/arched-brick-canal-bridge",
    "architecture/canal-house-stepped-gable",
    "architecture/canal-house-neck-gable",
    "architecture/canal-house-bell-gable",
    "architecture/moored-wooden-salon-boat",
    "architecture/photobooth-kiosk",
    "eliyadoesnails/amsterdam-canal-bridge",
    "eliyadoesnails/atelier-building",
    "eliyadoesnails/eliya-artisan",
    "eliyadoesnails/manicure-station",
    "eliyadoesnails/press-on-giftbox",
]

def verify_assets_exist(base_dir="public/models"):
    missing = []
    for asset in STUDIO_ASSETS:
        target = os.path.join(base_dir, f"{asset}.glb")
        if not os.path.exists(target):
            missing.append(target)
    if missing:
        print(f"Warning: {len(missing)} studio assets not found in {base_dir}: {missing}")
    else:
        print(f"Verified all {len(STUDIO_ASSETS)} studio assets exist.")

if __name__ == "__main__":
    verify_assets_exist()
