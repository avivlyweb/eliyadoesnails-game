import { sound } from "../engine/audio";

export interface PhotoStripOptions {
  clientName: string;
  setDesignName: string;
  frameColor: string; // '#FAF7F5' | '#F2C4C4' | '#1A1715' | '#A8BBA2'
  snapshots: string[]; // 4 data URLs or image captures
}

export class Life4CutsPhotobooth {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 440; // 2:3 vertical strip standard for Life4Cuts
    this.canvas.height = 1320;
    this.ctx = this.canvas.getContext("2d")!;
  }

  // Render 4-cut strip onto 2D canvas
  public async generateStrip(opts: PhotoStripOptions): Promise<string> {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;

    // 1. Frame Background
    ctx.fillStyle = opts.frameColor || "#FAF7F5";
    ctx.fillRect(0, 0, w, h);

    // Frame Border Trim
    ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, w - 12, h - 12);

    // 2. Header Monogram
    ctx.fillStyle = opts.frameColor === "#1A1715" ? "#F2C4C4" : "#2D2623";
    ctx.font = "bold 13px 'Helvetica Neue', sans-serif";
    ctx.textAlign = "center";
    ctx.letterSpacing = "3px";
    ctx.fillText("LIFE4CUTS × ELIYA DOES NAILS", w / 2, 42);

    ctx.font = "italic 10px 'Georgia', serif";
    ctx.fillText("Atelier Gloss • Amsterdam Canal Diorama", w / 2, 58);

    // 3. Render 4 Photo Cells
    const cellMarginX = 26;
    const cellW = w - cellMarginX * 2;
    const cellH = 240;
    const startY = 75;
    const gap = 16;

    for (let i = 0; i < 4; i++) {
      const cy = startY + i * (cellH + gap);

      // Photo cell border
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(cellMarginX, cy, cellW, cellH);

      if (opts.snapshots[i]) {
        await this.drawFrameImage(opts.snapshots[i], cellMarginX, cy, cellW, cellH);
      } else {
        // Placeholder artistic gradient
        const grad = ctx.createLinearGradient(cellMarginX, cy, cellMarginX + cellW, cy + cellH);
        grad.addColorStop(0, "#F2C4C4");
        grad.addColorStop(1, "#FAF7F5");
        ctx.fillStyle = grad;
        ctx.fillRect(cellMarginX, cy, cellW, cellH);

        ctx.fillStyle = "#6B5854";
        ctx.font = "12px sans-serif";
        ctx.fillText(`Frame ${i + 1} • ${opts.setDesignName}`, w / 2, cy + cellH / 2);
      }

      // Thin inner border
      ctx.strokeStyle = "rgba(0, 0, 0, 0.06)";
      ctx.lineWidth = 1;
      ctx.strokeRect(cellMarginX, cy, cellW, cellH);
    }

    // 4. Footer & Date Stamp
    const footerY = h - 140;
    ctx.fillStyle = opts.frameColor === "#1A1715" ? "#FAF7F5" : "#2D2623";
    ctx.font = "bold 15px 'Georgia', serif";
    ctx.fillText(opts.clientName || "Amsterdam Muse", w / 2, footerY);

    ctx.font = "10px monospace";
    ctx.fillStyle = opts.frameColor === "#1A1715" ? "#C2B4AE" : "#7A6863";
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).toUpperCase();
    ctx.fillText(`RECIPE: ${opts.setDesignName.toUpperCase()} • ${dateStr}`, w / 2, footerY + 20);

    // Cute decorative barcode
    this.drawBarcode(w / 2 - 80, footerY + 36, 160, 24);

    ctx.font = "9px sans-serif";
    ctx.fillText("SLOW NAILS, MADE WITH INTENTION", w / 2, footerY + 80);

    sound.playCameraShutter();

    return canvas.toDataURL("image/png");
  }

  private drawFrameImage(src: string, x: number, y: number, w: number, h: number): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.ctx.drawImage(img, x, y, w, h);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = src;
    });
  }

  private drawBarcode(x: number, y: number, w: number, h: number) {
    const ctx = this.ctx;
    ctx.fillStyle = ctx.fillStyle = "#4A3F3B";
    let curX = x;
    while (curX < x + w) {
      const barW = Math.random() > 0.5 ? 2 : 4;
      const space = Math.random() > 0.5 ? 2 : 3;
      ctx.fillRect(curX, y, barW, h);
      curX += barW + space;
    }
  }

  // Trigger browser PNG download
  public downloadStrip(dataUrl: string, filename = "eliya-life4cuts-strip.png") {
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }
}

export const photobooth = new Life4CutsPhotobooth();
