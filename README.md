# Eliya Does Nails — Atelier Gloss: Amsterdam Canal World

An interactive 3D spherical diorama game inspired by *Little Ritual*, built for **Eliya Does Nails**. Explore a miniature spherical Amsterdam canal world, craft bespoke press-on nails at the travertine manicure station, pack orders into couture boxes, ride your vintage Dutch Omafiets bicycle, and deliver custom sets to canal neighbors.

- **Live Production URL:** [https://eliyadoesnails-game.vercel.app](https://eliyadoesnails-game.vercel.app)
- **GitHub Repository:** [https://github.com/avivlyweb/eliyadoesnails-game](https://github.com/avivlyweb/eliyadoesnails-game)

---

## 💅 Core Gameplay Loop (The Slow Beauty Round)

Modeled directly on the quest mechanics of *Little Ritual*:

1. **Atelier Book & Ledger (`[J]` / HUD)**:
   - Check the morning round to view client tickets from canal residents:
     - **🌸 Mira the Florist** (*Flower Cart by Bridge*): Needs *Cherry Blossom Sakura Set* + *Sculpted Ribbon Bow*. Reward: *Baroque Nacre Pearl*.
     - **🏺 Nell the Potter** (*Bell Gable Ceramic House*): Needs *Cyberpunk Liquid Chrome* (unbreakable at the pottery wheel) + *Molten Chrome Drops*. Reward: *Molten Chrome Drops*.
     - **⛵ Bea the Houseboat Muse** (*Moored Wooden Salon Boat*): Needs *Moonlight Cat-Eye* + *Saturn Orbital Charm*. Reward: *Saturn Orbital Charm*.
     - **📸 Pip the Photo Collector** (*Hongdae Life4Cuts Photobooth*): Needs *Blush Glaze Coquette* + *Barbed Wire Cyber Heart*. Reward: *Barbed Wire Cyber Heart*.

2. **Crafting at Atelier Gloss (`[E]` / Manicure Station)**:
   - Click a client ticket to auto-load their requested recipe.
   - Use tactile ASMR tools: Czech frosted glass file, soft aura airbrush mist, magnetic cat-eye sweep wand, mirror chrome burnisher, and lavender cuticle serum.
   - Attach 3D Korean & Y2K charms.
   - Cure under "The Halo" desktop UV tunnel lamp (432Hz ambient chime).
   - Click **`🎁 Pack Couture Box for [Client]`** to pack the set into a slide-out couture drawer box.

3. **Courier Stacking & Omafiets Bicycle Traversal (`[B]`)**:
   - Packed boxes physically appear stacked in Eliya's arms (held forward) or in the front wicker basket of the Omafiets bicycle.
   - Camera-relative spherical physics: pressing `W` moves directly into the screen tangent to the sphere, and `S` moves toward the camera without gimbal lock or inverted controls.

4. **Canal Deliveries & Dialogue (`[E]`)**:
   - Approach neighbors to see dynamic context prompts (`🎁 Deliver Couture Box to [Client]`).
   - Deliver the order to unlock neighbor dialogues, sound effects, and unique charm rewards.

5. **Grand Celebration**:
   - Completing all 4 deliveries unlocks the Hongdae Life4Cuts arcade photobooth and prints a commemorative 4-cut celebration photo strip.

---

## 🕹️ Controls

| Key / Action | Function |
| :--- | :--- |
| **`W`, `A`, `S`, `D` / Arrow Keys** | Walk / ride camera-relative on the spherical planet |
| **`Space`** | Jump / hop curbs |
| **`B`** | Mount / dismount vintage Dutch Omafiets bicycle |
| **`E` / Click** | Context interaction (Craft at Atelier, talk to neighbors, deliver orders, photobooth) |
| **`J`** | Toggle Atelier Book / Courier Inventory Ledger |
| **Top HUD Buttons** | Toggle bicycle, open 3D studio, visit Life4Cuts, toggle Lo-Fi music |

---

## 🏗️ Architecture & Project Structure

```
eliyadoesnails-game/
├── public/
│   ├── models/
│   │   ├── eliyadoesnails/         # Artisan character model (eliya-artisan.glb)
│   │   ├── high-detail/            # 56 master atelier assets (sets, tools, charms, decor)
│   │   ├── architecture/           # Canal houses, bridges, salon boat, photobooth
│   │   ├── street/                 # Vintage bicycle, lanterns, bollards, flower cart
│   │   └── station/                # UV lamp, dappen dish, matcha mug, couture boxes
│   └── audio/                      # Lo-Fi ambient music, ASMR tool sound effects
├── src/
│   ├── engine/
│   │   ├── character.ts            # Spherical character controller, bicycle, box stacking
│   │   ├── spherical-planet.ts     # Planetoid geometry, canal ring, landmarks & NPCs
│   │   ├── planet-camera.ts        # Little Ritual parallel-transport smooth camera
│   │   ├── game-quest.ts           # AtelierQuestSystem, client tickets, delivery loop
│   │   └── audio.ts                # Web Audio synthesis & ASMR soundboard
│   ├── station/
│   │   └── manicure-table.ts       # 3D interactive macro manicure station
│   ├── photobooth/
│   │   └── life4cuts.ts            # Life4Cuts 4-cut photostrip generator
│   └── main.ts                     # Game loop, HUD controller, interaction bindings
├── index.html                      # Start screen, CRT terminal, modal UI & studio viewer
├── package.json
└── vite.config.ts
```

---

## 🛠️ Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```

---

## 🚀 Deployment

The project is hosted on Vercel:
```bash
npx vercel --prod --yes
```
*Note: Always deploy to `eliyadoesnails-game`. Never touch or deploy to the client's primary website project `site` (`eliyadoesnails.vercel.app`).*
