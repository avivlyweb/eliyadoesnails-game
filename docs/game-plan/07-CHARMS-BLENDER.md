# 07 — Nail Charms: Blender batch (final models for the charm system)

**For:** the Blender agent (models) and the Game agent (one line per charm to switch it on).
**Follow:** `blender/MODELING-RULES.md` (from `06-WORLD-REBUILD.md` §3) for every charm.

## How charms work in the game now

- **Studio (Atelier → Create Your Nails):** the player picks a charm and taps a nail on a 3D nail set to stick it on. Tap a charm again to remove it.
- **Minigame step 3 (Place the Charm):** the client's requested charm plus three others are offered. Placing the requested one scores best.
- Code: `src/engine/charm-library.ts` (the list), `src/engine/nail-decorator.ts` (placement).
- Nine charms are **procedural placeholders built in code**: `charm-tulip`, `charm-daisy`, `charm-sakura`, `charm-puffy-heart`, `charm-kitty`, `charm-star`, `charm-pearl`, `charm-satin-bow`, `charm-matcha-whisk`. Your job is to replace them with proper models, then add new ones.

**Switching a charm to your model (Game agent):** export to `public/models/charms/<id>.glb` and add `src: "/models/charms/<id>.glb"` to that charm's entry in `CHARMS`. If the GLB fails to load, the code falls back to the placeholder.

## Charm contract (all charms)

| Rule | Value |
|---|---|
| Real size | 5–9 mm across (real nail charms). The game rescales, so keep real proportions. |
| Orientation | The flat back that glues onto the nail lies on Blender's XY plane at Z = 0, front facing **+Z** (up), so it exports facing glTF +Y. |
| Origin | Centre of the flat back. |
| Back | Slightly flat or concave, so it sits on a curved nail without floating. |
| Triangles | ≤ 3,000 (≤ 1,500 for simple ones) |
| File | ≤ 150 KB, no textures unless needed (vertex colours or palette materials preferred) |
| Materials | glTF-safe: base colour, roughness, metallic, emissive, alpha. Glossy "gel" look = roughness 0.15–0.3. Chrome = metallic 1, roughness 0.1. |
| Look | Puffy, glossy, rounded: like real 3D nail-art charms and jelly gel. Bevel everything, no sharp edges. |
| Check | Screenshot it on a nail in the studio (Atelier → Create Your Nails) and in minigame step 3. It must read at that size. |
| Originality | Original designs only. No existing characters, mascots or brand logos (no famous cats, bears, bunnies or bows from any brand). |

## Batch A: replace the placeholders (same ids)

| id | What | Recognisable features |
|---|---|---|
| `charm-tulip` | Dutch tulip | 3 cupped petals, glossy red/pink gradient, tiny green leaf |
| `charm-daisy` | Daisy | 10–12 white rounded petals, domed yellow centre with dot texture |
| `charm-sakura` | Cherry blossom | 5 petals with the notch at each tip, pale pink to deeper pink centre, gold stamens |
| `charm-puffy-heart` | Puffy jelly heart | inflated, glossy, slightly translucent pink, a white highlight line |
| `charm-kitty` | Ginger kitty face ("Stroopje", our own cat) | orange tabby, cream muzzle, 3 forehead stripes, `:3` mouth, round eyes with shine |
| `charm-star` | Glitter star | 5 points, rounded tips, gold with fine glitter (bake to a small texture or use metallic + noise baked) |
| `charm-pearl` | Freshwater pearl | slightly irregular sphere, soft pink-white sheen |
| `charm-satin-bow` | Satin ribbon bow | two puffy loops, knot, two tails with V-cut ends, satin pink |
| `charm-matcha-whisk` | Chasen tea whisk | bamboo handle, fanned tines, tiny bowl of green foam |

## Batch B: new charms (add new ids)

| id | What | Why |
|---|---|---|
| `charm-mini-windmill` | Tiny Dutch windmill | Amsterdam theme, ties to Windmill Hill |
| `charm-stroopwafel` | Stroopwafel | Dutch treat, cute and readable |
| `charm-omafiets` | Little bicycle | Eliya's bike, delivery theme |
| `charm-canal-house` | Mini canal house front | Atelier theme, stepped gable |
| `charm-clog` | Tiny wooden clog with a tulip | Dutch icon |
| `charm-mochi-bunny` | Our Peach Mochi Bunny face | the game's own mascot (match `bunny-reference-gomi.png` face, with bunny ears) |
| `charm-strawberry` | Glossy strawberry | classic kawaii charm |
| `charm-butterfly` | Butterfly | two-tone wings, slightly translucent |
| `charm-moon` | Crescent moon | pairs with Moonlight Cat-Eye set |
| `charm-cloud` | Puffy cloud with a smile | soft and cute |
| `charm-shell` | Scallop shell | pairs with pearl and Harbour |
| `charm-cherry` | Cherry pair | classic charm |

For each new charm, the Game agent adds an entry to `CHARMS` with `id`, `name`, `icon` (an emoji) and `src`.

## Batch C (optional): better nail tips in the sets

Some sets (for example `set-cherry-blossom`) have nail tips that look like short cylinders. Real press-ons are **almond, coffin or square shapes**, slightly curved, about 1 cm wide and 1.5–2 cm long. Remodel the tips (keep the node names `*_Tip_0` … `*_Tip_4`, which the charm placement uses), so charms sit on something that looks like a real nail.

## Later idea: 2D nail-art designs

Patterns painted *on* the nail (French tip, checkerboard, polka dots, aura blush, marble, chrome, cat-eye) are materials and textures, not charms. They can become a "Design" step in the studio: each is a small texture (512 px) applied to the tip meshes. Ask Avivly before starting it.
