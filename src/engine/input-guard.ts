/**
 * Shared keyboard guard: gameplay keys (movement, hotkeys) should only act while
 * the player is actually in the world — not on the start screen, not while a
 * full-screen modal/minigame is open, and not while typing in a form field.
 */
const BLOCKING_OVERLAYS = [
  "inventory-modal-overlay",
  "eliya-modal-overlay",
  "nail-minigame-overlay",
  "market-shop-modal-overlay",
];

function isShown(el: HTMLElement | null): boolean {
  if (!el) return false;
  const style = getComputedStyle(el);
  return style.display !== "none" && style.visibility !== "hidden";
}

export function isTypingInField(e?: KeyboardEvent): boolean {
  const t = (e?.target ?? document.activeElement) as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
}

export function isOnStartScreen(): boolean {
  const start = document.getElementById("eliya-start-screen");
  return !!start && !start.classList.contains("hidden");
}

export function isModalOpen(): boolean {
  return BLOCKING_OVERLAYS.some((id) => isShown(document.getElementById(id)));
}

/** True when world gameplay keys should be ignored. */
export function isGameplayInputBlocked(e?: KeyboardEvent): boolean {
  return isTypingInField(e) || isOnStartScreen() || isModalOpen();
}
