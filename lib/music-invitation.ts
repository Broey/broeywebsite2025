// A browser-local UI dismissal, independent of music consent and listening history.
export const MUSIC_INVITATION_KEY = "broey-discovery-invitation-dismissed";
export const INVITATION_DISMISSAL_MS = 30 * 24 * 60 * 60 * 1000;
export const WELCOME_DELAY_MS = 6000;
export const welcomeEligible = (path: string | null, elapsed: boolean, enabled: boolean, dismissed: boolean, playlistVisible: boolean) =>
  path === "/" && elapsed && !enabled && !dismissed && !playlistVisible;

type DismissalStorage = () => Pick<Storage, "getItem" | "setItem" | "removeItem">;

export class MusicInvitationStore {
  private dismissed = true; // Hide until browser storage has been checked.
  private until = 0;
  private memoryOnly = false;
  private listeners = new Set<() => void>();
  private storage: DismissalStorage;
  private clock: () => number;
  constructor(storage: DismissalStorage, clock = Date.now) {
    this.storage = storage;
    this.clock = clock;
  }
  getSnapshot = () => this.dismissed;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private publish() {
    const dismissed = this.until > this.clock();
    if (dismissed === this.dismissed) return;
    this.dismissed = dismissed;
    this.listeners.forEach((listener) => listener());
  }
  refresh = () => {
    try {
      const storage = this.storage();
      const raw = storage.getItem(MUSIC_INVITATION_KEY);
      const until = Number(raw);
      const now = this.clock();
      if (raw && Number.isSafeInteger(until) && until > now && until <= now + INVITATION_DISMISSAL_MS) {
        this.until = until;
        this.memoryOnly = false;
      } else {
        if (raw) storage.removeItem(MUSIC_INVITATION_KEY);
        // Retain an in-memory dismissal if a previous storage write failed.
        if (!this.memoryOnly || this.until <= now || this.until > now + INVITATION_DISMISSAL_MS) this.until = 0;
      }
    } catch { /* Dismissal still works in memory when storage is unavailable. */ }
    this.publish();
  };
  dismiss = () => {
    this.until = this.clock() + INVITATION_DISMISSAL_MS;
    this.memoryOnly = false;
    try { this.storage().setItem(MUSIC_INVITATION_KEY, String(this.until)); } catch { this.memoryOnly = true; }
    this.publish();
  };
  clear = () => {
    this.until = 0;
    this.memoryOnly = false;
    try { this.storage().removeItem(MUSIC_INVITATION_KEY); } catch { /* No preference data in this key. */ }
    this.publish();
  };
}
