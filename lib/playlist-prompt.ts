// Count actual playback so seeking cannot shortcut the one-minute reminder.
export class PlaylistPromptSession {
  private trackKey = "";
  private previousTime: number | undefined;
  private listened = 0;
  private shown = new Set<string>();

  interrupt() { this.previousTime = undefined; }

  progress(trackKey: string, time: number, duration: number, playing: boolean) {
    if (trackKey !== this.trackKey) {
      this.trackKey = trackKey;
      this.listened = 0;
      this.interrupt();
    }
    if (!playing || !Number.isFinite(time) || !Number.isFinite(duration) || duration <= 0) {
      this.interrupt();
      return false;
    }
    const delta = this.previousTime === undefined ? 0 : time - this.previousTime;
    if (delta > 0 && delta <= 2) this.listened += delta;
    this.previousTime = time;
    const remaining = duration - time;
    if (remaining <= 0 || this.listened < 60 || this.shown.has(trackKey)) return false;
    this.shown.add(trackKey);
    return true;
  }
}
