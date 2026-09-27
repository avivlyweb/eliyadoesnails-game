# 03 — Gameplay Spec (for the game agent)

Single player. You are **Eliya**, the nail artist. This file defines every system and all the starting numbers. The numbers are a first balance pass: put them in the Convex content (§8) so they can be tuned without code changes.

---

## 1. Core loop

```
 Client request (order board / NPC)
        │ accept
        ▼
 Gather materials in the districts  ──►  Craft charm (inventory → Craft)
        │                                         │
        └───────────────►  Studio: paint the set (3 mini-games → 1–3 ★)
                                   │
                                   ▼
                    Deliver to the client before the deadline (walk / bike)
                                   │
                                   ▼
             Gloss + XP + Friendship → level up → unlocks → harder requests
```

One full loop takes **4–7 minutes** of real time.

## 2. Time

- **1 in-game hour = 1 real minute** (a full day = 24 min). The clock shows in the HUD.
- Light and sky change: dawn 06–08, day, golden hour 18–20, night 21–06 (lanterns on, fewer NPCs outside).
- Deadlines are given in game hours (6–12 h = 6–12 real minutes).
- The clock only runs while the game is open.

## 3. Districts (unlock by level)

| Key | Name | Level | Anchors (existing models) | Materials | NPCs |
|---|---|---|---|---|---|
| `canal` | Canal Street (start) | 1 | 3 canal houses, bridge, bollards, florist cart, petal trees | Freshwater Pearl, Sakura Petal | Mira, Nell |
| `market` | Market Square | 2 | photobooth, **new** café kiosk, **new** market stall | Silk Ribbon, Syrup Base | Pip, Joon, Sanne |
| `meadow` | Tulip Meadow | 3 | **new** greenhouse, flower patches, wind chime | Daisy Sprig, Sakura Petal | Oma Truus, Lotte |
| `windmill` | Windmill Hill | 5 | windmill, forest pine, bird tree | Chrome Drop, Aurora Crystal | (visits from Nell) |
| `harbour` | Harbour | 8 | salon boat, **new** harbour dock | Gold Leaf, Aurora Crystal | Bea |

Locked districts sit behind a `district-gate` model with a sign ("Opens at Atelier Lv 5"). Walking into the gate plays a soft "locked" bounce.

## 4. Systems

### 4.1 Gathering
- Pickups glow and bob. Press **E** within 2.5 m → a short gather animation (0.8 s, Eliya bends down) → a `+2 Sakura Petal` toast → the item flies into the basket icon.
- Each resource node respawns after the material's `respawnMinutes` (real minutes) and is shown faded until then.
- Around 6–10 nodes per district (placements are in `04-WORLD-LAYOUT.md`).

### 4.2 Crafting (charms)
- Open the **inventory (I)** → Charms tab → it shows each recipe, owned/needed materials, and a Craft button. Crafting is instant, with a small sparkle.

### 4.3 Studio (painting the set) — the heart of the game
Enter the Manicure Studio (which already exists) with an active quest. A client hand sits on the hand pillow; the camera is close up. There are **3 steps**, and each gives a score of 0–100:

| Step | Mini-game | How it works | Score |
|---|---|---|---|
| 1. Base | **Fill** | Drag to paint the syrup shade onto 5 nails within 10 s. | coverage % − 2 × spill % onto the skin |
| 2. Art | depends on the art style (below) | | accuracy |
| 3. Finish | **Cure** | UV lamp: a bar sweeps; press Space in the green zone, 3 times (5 LED rounds for chrome shades) | hits in the zone, weighted by closeness |

Art-step mini-games:

| Mini-game | Used by art styles | How it works |
|---|---|---|
| `trace` | Classic Micro French, French & Swirls, Floral Petals | A dotted guide path; trace it in one drag. Score = 100 − average distance from the path (px) × k. The micro-liner brush widens the tolerance. |
| `dots` | Polka Dots, Retro Mint & Polka, Constellation | Targets appear in a rhythm; click each within 0.6 s. Timing + position. |
| `magnet` | Diagonal Prism Beam (cat-eye) | Hold the wand; a light beam moves across the nail; release when it lines up with the target angle. 3 nails. |
| `drops` | 3D Molten Chrome | Hold to grow a chrome drop; release at the target size ring. 5 drops. |
| `none` | Clean Jelly | The art step is skipped; the base step counts double. |

After step 3, if the quest needs a charm, drag it from the tray onto the highlighted nail (no score, but required).
**Result screen:** the finished `sets/*` model turns on a pedestal, with stars, then "Pack it" → a `delivery-parcel` appears on Eliya's tray socket.

Stars: average ≥ 85 → ★★★, ≥ 60 → ★★, otherwise ★ (computed on the server, see `02`).

### 4.4 Delivery
- A quest tracker (top right) shows the client, time left and a **direction arrow at the screen edge**; a `quest-marker` floats above the client.
- **B = bike** (already exists): 1.8× walk speed; the bell rings on paths.
- On time: full reward × star bonus. Late: half reward + a "late" line. The client **then wears the set**: attach a small copy of the set model to their hand socket for the rest of the day.

### 4.5 Progression
- **XP to next level = 60 + 40 × level** (so the tutorial delivery, 100 XP, reaches level 2 exactly).
- **Friendship** per client: level 0–5 at 0 / 30 / 80 / 150 / 250 / 400 points. Delivery gives +10 (★), +15 (★★), +25 (★★★). Friendship levels unlock that client's next story quests, a pet, and extra dialogue.
- **Collection Book** (the existing Atelier Book, rebuilt): tabs for Looks, Charms, Materials, Clients and Discoveries, filled in as you go. Completion % on the cover.

### 4.6 Shop (Sanne's market stall, from level 2)
Buy shades, tools and décor with Gloss; sell spare materials.

### 4.7 Pets (companions)
Follow Eliya, one active at a time. The `pets/*` models already exist.

| Pet | Unlocked by | Ability |
|---|---|---|
| Hoots | Mira friendship 2 | +1 Sakura Petal per harvest |
| Dewey | Bea friendship 2 | +1 Freshwater Pearl per harvest |
| Rocky | Nell friendship 2 | +1 Chrome Drop per harvest |
| Seedy | Truus friendship 2 | +1 Daisy Sprig per harvest |
| Fireball | Joon friendship 3 | Bike speed +15% |
| Codex | Pip friendship 3 | The minimap shows the nearest ready node |
| Null-Signal | Sanne friendship 3 | 10% shop discount |

### 4.8 Atelier décor
6 slots in the studio. Each piece gives a small bonus (see §8.7). Existing studio models become buyable/placeable.

## 5. Onboarding (first 5 minutes, scripted)

1. The game opens with Eliya outside the atelier. A title card, then Mira waves from the florist cart. The quest marker is on.
2. Mira: "Eliya! My hands feel so bare… could you make me Cherry Blossom French with a little ribbon bow?" → **Accept**.
3. The tracker: "Collect 1 Sakura Petal" → an arrow to the petal tree 6 s away. (The player starts with 2 Silk Ribbon.)
4. "Open your basket (I) and craft a Ribbon Bow."
5. "Go to the studio" → the mini-games, each with a single-sentence hint on its first run.
6. Deliver → reward → **Level 2** → "Market Square is open!" The gate opens (the lock node animates), and the camera pans briefly to the market.

## 6. HUD & controls

- **Top left:** Gloss · Level + XP bar · clock.
- **Top right:** quest tracker (max 3 visible).
- **Bottom:** hotbar hints `E interact · I inventory · B bike · J journal · M map`.
- **Map (M):** the planet shown flat, with districts, locked ones greyed out, client icons and ready nodes (with Codex).
- Keep the existing buttons (Manicure Studio, Life4Cuts, Music) but move them into a small menu.
- Mobile: joystick bottom left, interact button bottom right.

## 7. Save & sync behaviour

- Boot: `content.getAll` + `players.bootstrap` → then subscribe to `players.state`.
- Harvest, craft, buy, deliver: call the mutation and show the result from the **returned** state; roll back the optimistic UI if an error comes back.
- Position is saved every 10 s and on tab hide.
- Offline (Convex unreachable): the game still starts from `content-fallback.json`, shows "Offline — progress won't be saved" and disables rewards.

## 8. Content (seed data)

### 8.1 Materials
| key | name / 한국어 | district | respawn (min) | sell |
|---|---|---|---|---|
| `sakura_petal` | Sakura Petal / 벚꽃잎 | canal, meadow | 4 | 3 |
| `freshwater_pearl` | Freshwater Pearl / 담수진주 | canal | 6 | 5 |
| `silk_ribbon` | Silk Ribbon / 실크 리본 | market | 5 | 4 |
| `syrup_base` | Syrup Base / 시럽 베이스 | market | 5 | 4 |
| `daisy_sprig` | Daisy Sprig / 데이지 | meadow | 4 | 3 |
| `chrome_drop` | Chrome Drop / 크롬 방울 | windmill | 8 | 8 |
| `aurora_crystal` | Aurora Crystal / 오로라 크리스탈 | windmill, harbour | 12 | 12 |
| `gold_leaf` | Gold Leaf / 금박 | harbour | 12 | 12 |

### 8.2 Charms (existing models)
| key | model | recipe | level |
|---|---|---|---|
| `ribbon_bow` | sculpted-ribbon-bow | 2 silk_ribbon + 1 sakura_petal | 1 |
| `baroque_pearl` | baroque-nacre-pearl | 3 freshwater_pearl | 1 |
| `molten_chrome_drops` | molten-chrome-drops | 3 chrome_drop + 1 syrup_base | 5 |
| `cyber_heart` | barbed-wire-cyber-heart | 2 chrome_drop + 1 silk_ribbon | 6 |
| `aurora_teardrop` | faceted-aurora-teardrop-gem | 2 aurora_crystal + 1 freshwater_pearl | 6 |
| `y2k_stars` | charm-y2k-cyber-stars | 1 gold_leaf + 2 daisy_sprig + 1 syrup_base | 8 |
| `saturn_orbital` | saturn-orbital-charm | 1 aurora_crystal + 1 gold_leaf + 1 chrome_drop | 8 |
| `chrome_monkey` | charm-chrome-monkey | 2 chrome_drop + 2 gold_leaf | 10 |

### 8.3 Shades (the same 8 as the website's Nail Lab)
| key | name | 한국어 | finish | level | price |
|---|---|---|---|---|---|
| `rose_quartz` | Rose Quartz Syrup | 로즈 쿼츠 시럽 | syrup | 1 (owned) | — |
| `cherry_blossom` | Cherry Blossom Syrup | 체리 블라썸 시럽 | syrup | 1 (owned) | — |
| `apricot_peach` | Apricot Peach Dew | 살구 복숭아 이슬 | syrup | 1 (owned) | — |
| `matcha_latte` | Matcha Latte Glaze | 말차 라떼 글레이즈 | syrup | 2 | 80 |
| `molten_sterling` | Molten Sterling Chrome | 몰튼 실버 리퀴드 | chrome | 5 | 200 |
| `lilac_prism` | Lilac Prism Cat-Eye | 라일락 오로라 캣아이 | cateye | 4 | 150 |
| `moonlight_silver` | Moonlight Silver Cat-Eye | 문라이트 실버 캣아이 | cateye | 6 | 220 |
| `emerald_nebula` | Emerald Nebula Cat-Eye | 에메랄드 네뷸라 캣아이 | cateye | 9 | 320 |

(Take the hex colours from the website's Nail Lab code so they match exactly.)

### 8.4 Art styles (the same 9 as the website)
| key | mini-game | difficulty | tool needed | level |
|---|---|---|---|---|
| `clean_jelly` | none | 1 | — | 1 |
| `micro_french` | trace | 2 | micro_liner_brush | 1 (brush is a starter item) |
| `polka_dots` | dots | 2 | — | 2 |
| `floral_petals` | trace | 2 | micro_liner_brush | 1 (needed for the tutorial) |
| `retro_mint_polka` | dots | 3 | — | 3 |
| `french_swirls` | trace | 4 | micro_liner_brush | 4 |
| `aura_constellation` | dots | 4 | aura_airbrush | 5 |
| `cateye_prism` | magnet | 3 | magnetic_cat_eye_wand | 4 |
| `molten_chrome_3d` | drops | 5 | precision_tweezers | 5 |

Difficulty scales the tolerances: tolerance = base × (1.3 − 0.1 × difficulty).

### 8.5 Looks (existing `sets/*` models)
| key | model | shade | art | charm | signature → website look |
|---|---|---|---|---|---|
| `cherry_blossom_french` | set-cherry-blossom | cherry_blossom | floral_petals | ribbon_bow | ✅ Petal Blossom & Floral Blooms |
| `rose_quartz_french` | set-rose-quartz-french | rose_quartz | micro_french | — | ✅ Classic French & Freehand Swirls |
| `matcha_glaze` | set-matcha-glaze | matcha_latte | retro_mint_polka | — | ✅ Retro Mint & Micro Polka Dots |
| `blush_coquette` | blush-glaze-coquette-set | rose_quartz | aura_constellation | cyber_heart | ✅ Blushing Aura & Constellation Dots |
| `apricot_pearl` | set-apricot-pearl | apricot_peach | polka_dots | baroque_pearl | — |
| `moonlight_cateye` | set-moonlight-cateye | moonlight_silver | cateye_prism | saturn_orbital | — |
| `cyber_chrome` | cyberpunk-liquid-chrome-set | molten_sterling | molten_chrome_3d | molten_chrome_drops | — |

### 8.6 Tools (existing `tools/*` models)
| key | effect | price | level |
|---|---|---|---|
| `czech_glass_file` | Base step +10 | starter | 1 |
| `micro_liner_brush` | Required for `trace`; tolerance +30% | starter | 1 |
| `cuticle_serum_dropper` | Spill penalty −50% | 90 | 2 |
| `magnetic_cat_eye_wand` | Required for `magnet` | 150 | 4 |
| `precision_tweezers` | Required for `drops` | 180 | 5 |
| `aura_airbrush` | Required for `aura_constellation` | 200 | 5 |
| `chrome_burnishing_pen` | Cure step: green zone +25% | 160 | 6 |
| `nail_sizing_wheel` | +15% Gloss on all deliveries | 300 | 7 |

### 8.7 Décor (existing studio models)
| key | bonus | price | level |
|---|---|---|---|
| `steaming_matcha_mug` | +2 friendship per delivery | 60 | 2 |
| `celadon_tea_set` | +5% Gloss | 120 | 3 |
| `potted_fiddle_fig` | Material respawn −10% | 100 | 3 |
| `hinoki_incense` | Deadlines +1 game hour | 140 | 4 |
| `brass_arc_lamp` | Cure step green zone +10% | 150 | 5 |
| `washi_folding_screen` | +5% XP | 180 | 6 |
| `floating_lacquer_display` | Shows your 3 best designs; +5% Gloss | 250 | 8 |

### 8.8 Levels (1–12 for launch)
| Lv | XP to next | Unlocks |
|---|---|---|
| 1 | 100 | district:canal, npc:mira, npc:nell |
| 2 | 140 | district:market, npc:pip, npc:joon, npc:sanne, shop |
| 3 | 180 | district:meadow, npc:truus, npc:lotte, art:retro_mint_polka |
| 4 | 220 | art:french_swirls, art:cateye_prism, shade:lilac_prism |
| 5 | 260 | district:windmill, charm:molten_chrome_drops, art:molten_chrome_3d, art:aura_constellation |
| 6 | 300 | charm:cyber_heart, charm:aurora_teardrop, shade:moonlight_silver |
| 7 | 340 | dailies: 4 per day |
| 8 | 380 | district:harbour, npc:bea, charm:y2k_stars, charm:saturn_orbital |
| 9 | 420 | shade:emerald_nebula |
| 10 | 460 | charm:chrome_monkey, dailies: 5 per day |
| 11 | 500 | décor slot 7 |
| 12 | — | "Master Artisan" title; all Signature Recipes can be repeated as dailies |

### 8.9 Clients & story quests (3 per client at launch = 24)

| NPC | Role / district | Personality (for dialogue) | Story quests (look → reward gloss/xp) |
|---|---|---|---|
| Mira | Florist, canal | warm, early riser, talks about flowers | 1. cherry_blossom_french (tutorial) 40/100 · 2. apricot_pearl 60/80 · 3. cherry_blossom_french ★★★ required 120/140 |
| Nell | Potter, canal (bell-gable house) | dry humour, loves texture | 1. rose_quartz_french 50/80 · 2. matcha_glaze (F1) 70/100 · 3. cyber_chrome (Lv5, F2) 150/180 |
| Pip | Photo collector, market photobooth | energetic, says "cute!!" a lot | 1. apricot_pearl 50/80 · 2. blush_coquette (F2) 120/150 · 3. Life4Cuts photo with the set (unlocks photo mode) 80/100 |
| Joon | Barista, market café | calm, poetic, Korean phrases | 1. matcha_glaze 60/90 · 2. rose_quartz_french deliver during morning rush (deadline 4 h) 70/100 · 3. moonlight_cateye (F3) 160/200 |
| Sanne | Stall owner, market | practical, bargain-lover | 1. apricot_pearl (+ 5 silk ribbon returned) 40/80 · 2. blush_coquette 100/140 · 3. any ★★★ set 120/150 |
| Oma Truus | Tulip grower, meadow | grandmotherly, slow | 1. cherry_blossom_french 60/90 · 2. rose_quartz_french (gentle, no charm) 60/90 · 3. matcha_glaze ★★★ 140/160 |
| Lotte | Child (junior atelier), meadow | curious, excited, short sentences | 1. apricot_pearl "sparkly dots!" 40/80 · 2. polka dots in any shade 50/80 · 3. cherry_blossom_french 80/110 (on finishing, show a friendly "Junior Atelier" card, see `05`) |
| Bea | Houseboat muse, harbour | dreamy, night owl | 1. moonlight_cateye 150/180 · 2. cyber_chrome 180/200 · 3. aurora_teardrop set (moonlight + aurora_teardrop) 220/250 |

**Gating rule:** a quest is only offered when the player meets the template's `minLevel`/`minFriendship` **and** everything its look needs (shade owned, art style unlocked, required tool owned, charm recipe unlocked). The server computes this; never offer a quest the player can't finish.

Daily templates: every client has 2–3 simple dailies (any unlocked look, deadline 8–12 h, 30–60 gloss).

Write all of §8 as JSON under `convex/seedData/` (one file per table), then run `seed:run`.
