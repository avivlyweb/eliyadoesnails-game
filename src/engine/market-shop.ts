import { gameConvex } from "../net/convex";
import { sound } from "./audio";

export interface ShopItem {
  key: string;
  name: string;
  nameKo?: string;
  price: number;
  level: number;
  type: "shade" | "tool" | "decor";
  description: string;
  hex?: string;
  icon?: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  // Shades
  {
    key: "cherry_blossom",
    name: "Cherry Blossom",
    nameKo: "벚꽃 시럽",
    price: 40,
    level: 1,
    type: "shade",
    hex: "#F9CBD6",
    description: "Translucent petal pink syrup glaze.",
  },
  {
    key: "rose_quartz",
    name: "Rose Quartz",
    nameKo: "로즈 쿼츠",
    price: 45,
    level: 1,
    type: "shade",
    hex: "#F4C2C2",
    description: "Milky sheer blush mineral finish.",
  },
  {
    key: "apricot_peach",
    name: "Apricot Peach",
    nameKo: "살구 피치",
    price: 50,
    level: 2,
    type: "shade",
    hex: "#F7C59F",
    description: "Warm sunset syrup glaze.",
  },
  {
    key: "syrup_jade",
    name: "Syrup Jade",
    nameKo: "옥빛 시럽",
    price: 60,
    level: 2,
    type: "shade",
    hex: "#A3C9A8",
    description: "Translucent ceremonial matcha green.",
  },
  {
    key: "lilac_haze",
    name: "Lilac Haze",
    nameKo: "라일락 헤이즈",
    price: 70,
    level: 3,
    type: "shade",
    hex: "#D8BFD8",
    description: "Soft smoky lavender pastel.",
  },
  {
    key: "liquid_chrome",
    name: "Liquid Chrome",
    nameKo: "리퀴드 크롬",
    price: 90,
    level: 5,
    type: "shade",
    hex: "#C0C0C0",
    description: "Mirror molten chrome finish.",
  },
  {
    key: "moonlight_cat_eye",
    name: "Moonlight Cat-Eye",
    nameKo: "문라이트 캣아이",
    price: 110,
    level: 6,
    type: "shade",
    hex: "#4B0082",
    description: "Deep indigo magnetic velvet cat-eye.",
  },
  {
    key: "aurora_glass",
    name: "Aurora Glass",
    nameKo: "오로라 글래스",
    price: 130,
    level: 7,
    type: "shade",
    hex: "#E0FFFF",
    description: "Prismatic holographic glass shimmer.",
  },

  // Tools
  {
    key: "czech_glass_file",
    name: "Czech Glass Nail File",
    nameKo: "체코 글래스 네일 파일",
    price: 40,
    level: 1,
    type: "tool",
    icon: "💎",
    description: "Precision edge shaping. Base fill speed +15%.",
  },
  {
    key: "micro_liner_brush",
    name: "Micro-Liner Detail Brush",
    nameKo: "마이크로 라이너 브러시",
    price: 60,
    level: 2,
    type: "tool",
    icon: "🖌️",
    description: "Ultra-fine bristle. Line trace tolerance +25%.",
  },
  {
    key: "magnetic_wand",
    name: "Magnetic Cat-Eye Wand",
    nameKo: "마그네틱 캣아이 완드",
    price: 80,
    level: 4,
    type: "tool",
    icon: "🪄",
    description: "Neodymium magnet. Cat-eye sweet spot +30%.",
  },
  {
    key: "chrome_sponge_pen",
    name: "Chrome Burnishing Pen",
    nameKo: "크롬 버니싱 스폰지 펜",
    price: 100,
    level: 5,
    type: "tool",
    icon: "🖊️",
    description: "High-density silicone tip. Chrome drop score +20%.",
  },
  {
    key: "aura_airbrush",
    name: "Aura Micro-Airbrush",
    nameKo: "아우라 마이크로 에어브러시",
    price: 140,
    level: 6,
    type: "tool",
    icon: "💨",
    description: "Smooth mist diffusion. Gradient bonus +25%.",
  },

  // Décor
  {
    key: "steaming_matcha_mug",
    name: "Steaming Matcha Mug",
    nameKo: "따뜻한 말차 머그",
    price: 60,
    level: 2,
    type: "decor",
    icon: "🍵",
    description: "Ceramic desk mug. +2 friendship per delivery.",
  },
  {
    key: "celadon_tea_set",
    name: "Celadon Tea Ceremony Set",
    nameKo: "청자 다도 세트",
    price: 120,
    level: 3,
    type: "decor",
    icon: "🫖",
    description: "Atelier tea post. +5% bonus Gloss from deliveries.",
  },
  {
    key: "potted_fiddle_fig",
    name: "Potted Fiddle Leaf Fig",
    nameKo: "떡갈고무나무 화분",
    price: 100,
    level: 3,
    type: "decor",
    icon: "🌿",
    description: "Lush atelier greenery. Material respawn -10%.",
  },
  {
    key: "hinoki_incense",
    name: "Hinoki Incense Burner",
    nameKo: "히노키 인센스 버너",
    price: 140,
    level: 4,
    type: "decor",
    icon: "🪵",
    description: "Calming cedar aroma. Deadlines +1 game hour.",
  },
  {
    key: "brass_arc_lamp",
    name: "Brass Arc Floor Lamp",
    nameKo: "황동 아치 플로어 램프",
    price: 150,
    level: 5,
    type: "decor",
    icon: "💡",
    description: "Warm studio lighting. UV Cure green zone +15%.",
  },
  {
    key: "washi_folding_screen",
    name: "Washi Paper Folding Screen",
    nameKo: "한지 파티션 스크린",
    price: 180,
    level: 6,
    type: "decor",
    icon: "📜",
    description: "Artisan privacy screen. +5% delivery XP bonus.",
  },
  {
    key: "floating_lacquer_display",
    name: "Floating Lacquer Display",
    nameKo: "플로팅 래커 전시대",
    price: 250,
    level: 8,
    type: "decor",
    icon: "✨",
    description: "Showcases your top 3 couture manicures. +10% Gloss.",
  },
];

export const MATERIAL_SELL_PRICES: Record<string, { name: string; nameKo: string; price: number; icon: string }> = {
  sakura_petal: { name: "Sakura Petal", nameKo: "벚꽃잎", price: 3, icon: "🌸" },
  freshwater_pearl: { name: "Freshwater Pearl", nameKo: "담수진주", price: 5, icon: "🦪" },
  silk_ribbon: { name: "Silk Ribbon", nameKo: "실크 리본", price: 4, icon: "🎀" },
  syrup_base: { name: "Syrup Base", nameKo: "시럽 베이스", price: 4, icon: "🧪" },
  daisy_sprig: { name: "Daisy Sprig", nameKo: "데이지", price: 3, icon: "🌼" },
  chrome_drop: { name: "Chrome Drop", nameKo: "크롬 방울", price: 8, icon: "💧" },
  aurora_crystal: { name: "Aurora Crystal", nameKo: "오로라 크리스탈", price: 12, icon: "💎" },
  gold_leaf: { name: "Gold Leaf", nameKo: "금박", price: 12, icon: "✨" },
};

export class MarketShopController {
  private modal: HTMLElement | null = null;
  private currentTab: "shades" | "tools" | "decor" | "sell" = "shades";

  constructor() {
    this.modal = document.getElementById("market-shop-modal-overlay");
    this.setupListeners();
  }

  private setupListeners() {
    const closeBtn = document.getElementById("btn-shop-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.close());
    }

    const tabs = document.querySelectorAll(".shop-tab-btn");
    tabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        btn.classList.add("active");
        this.currentTab = btn.getAttribute("data-shop-tab") as any;
        this.render();
      });
    });
  }

  public open() {
    if (!this.modal) this.modal = document.getElementById("market-shop-modal-overlay");
    if (!this.modal) return;
    this.modal.style.display = "flex";
    sound.playTeaPour();
    this.render();
  }

  public close() {
    if (this.modal) this.modal.style.display = "none";
  }

  public render() {
    const container = document.getElementById("shop-items-container");
    const glossEl = document.getElementById("shop-player-gloss");
    if (!container) return;
    container.innerHTML = "";

    const playerGloss = gameConvex.currentState?.player.gloss ?? 50;
    const playerLevel = gameConvex.currentState?.player.level ?? 1;
    if (glossEl) glossEl.textContent = `${playerGloss} Gloss`;

    if (this.currentTab === "sell") {
      this.renderSellTab(container, playerGloss);
      return;
    }

    // Tabs are plural ("shades", "tools", "decor") but item types are singular ("shade", "tool", "decor").
    const TAB_TO_TYPE: Record<string, string> = { shades: "shade", tools: "tool", decor: "decor" };
    const items = SHOP_ITEMS.filter((i) => i.type === TAB_TO_TYPE[this.currentTab]);
    for (const item of items) {
      const isOwned = this.isItemOwned(item.type, item.key);
      const isLevelUnlocked = playerLevel >= item.level;
      const canAfford = playerGloss >= item.price;

      const card = document.createElement("div");
      card.className = "shop-card";
      card.innerHTML = `
        <div class="shop-card-top">
          ${
            item.hex
              ? `<div style="width:24px; height:24px; border-radius:50%; background:${item.hex}; border:2px solid var(--surface); box-shadow:0 0 0 1px var(--hairline);"></div>`
              : `<span style="font-size:20px;">${item.icon || "✦"}</span>`
          }
          <span class="shop-card-price">${item.price} Gloss</span>
        </div>
        <div class="shop-card-name">${item.name}</div>
        <div class="shop-card-name-ko">${item.nameKo || ""}</div>
        <div class="shop-card-desc">${item.description}</div>
        <div class="shop-card-foot">
          <span class="shop-card-req" style="color:${isLevelUnlocked ? "var(--text-muted)" : "#b78103"}">
            ${isLevelUnlocked ? `Atelier Lv.${item.level}` : `🔒 Unlocks at Lv.${item.level}`}
          </span>
          <button class="shop-buy-btn ${isOwned ? "owned" : ""}" ${
            isOwned || !isLevelUnlocked || !canAfford ? "disabled" : ""
          }>
            ${isOwned ? "Owned ✓" : canAfford ? "Buy Item" : "Need Gloss"}
          </button>
        </div>
      `;

      const buyBtn = card.querySelector(".shop-buy-btn");
      if (buyBtn && !isOwned && isLevelUnlocked && canAfford) {
        buyBtn.addEventListener("click", async () => {
          try {
            await gameConvex.buyShopItem(item.type, item.key);
            sound.playUVLampCure();
            this.showToast(`✨ Purchased ${item.name}! Added to Atelier inventory.`);
            this.render();
          } catch (err: any) {
            console.warn("Buy item err:", err);
            this.showToast(`Could not purchase item: ${err?.message || "Error"}`);
          }
        });
      }

      container.appendChild(card);
    }
  }

  private renderSellTab(container: HTMLElement, playerGloss: number) {
    const inv = gameConvex.currentState?.inventory || [];
    const materials = inv.filter((item) => item.itemType === "material" && item.qty > 0);

    if (materials.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 48px 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
          Your Atelier Basket has no excess foraged botanicals or minerals.<br/>
          Wander the paths and canal banks to gather Sakura Petals, Pearls, and Crystals!
        </div>
      `;
      return;
    }

    for (const item of materials) {
      const def = MATERIAL_SELL_PRICES[item.itemKey] || {
        name: item.itemKey.replace(/_/g, " "),
        nameKo: "",
        price: 4,
        icon: "🌿",
      };

      const card = document.createElement("div");
      card.className = "shop-card";
      card.innerHTML = `
        <div class="shop-card-top">
          <span style="font-size: 22px;">${def.icon}</span>
          <span class="shop-card-price" style="color: #2e7d32;">+${def.price} Gloss / ea</span>
        </div>
        <div class="shop-card-name">${def.name}</div>
        <div class="shop-card-name-ko">${def.nameKo}</div>
        <div class="shop-card-desc">Owned in Basket: <strong>${item.qty}</strong> units</div>
        <div class="shop-card-foot" style="gap: 8px;">
          <button class="shop-sell-btn sell-one">Sell 1 (+${def.price})</button>
          <button class="shop-sell-btn sell-all">Sell All (+${def.price * item.qty})</button>
        </div>
      `;

      const sellOne = card.querySelector(".sell-one");
      if (sellOne) {
        sellOne.addEventListener("click", async () => {
          await gameConvex.sellMaterial(item.itemKey, 1);
          sound.playBicycleBell();
          this.showToast(`Sold 1 × ${def.name} for +${def.price} Gloss!`);
          this.render();
        });
      }

      const sellAll = card.querySelector(".sell-all");
      if (sellAll) {
        sellAll.addEventListener("click", async () => {
          const totalPayout = def.price * item.qty;
          await gameConvex.sellMaterial(item.itemKey, item.qty);
          sound.playBicycleBell();
          this.showToast(`Sold ${item.qty} × ${def.name} for +${totalPayout} Gloss!`);
          this.render();
        });
      }

      container.appendChild(card);
    }
  }

  private isItemOwned(itemType: string, itemKey: string): boolean {
    const inv = gameConvex.currentState?.inventory || [];
    return inv.some((i) => i.itemType === itemType && i.itemKey === itemKey && i.qty > 0);
  }

  private showToast(msg: string) {
    const toast = document.createElement("div");
    toast.style.cssText =
      "position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#1c1917;color:#faf7f5;padding:12px 24px;border-radius:4px;border:1px solid #e7e1dc;font-size:12px;font-family:var(--font-sans);z-index:9999;box-shadow:0 10px 24px -14px rgba(28,25,23,0.35);";
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }
}

export const marketShop = new MarketShopController();
