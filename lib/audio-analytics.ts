export type AudioAnalyticsEventName =
  | "audio_play"
  | "audio_25_percent"
  | "audio_50_percent"
  | "audio_75_percent"
  | "audio_complete";

const milestones = [
  { progress: 0.25, event: "audio_25_percent" },
  { progress: 0.5, event: "audio_50_percent" },
  { progress: 0.75, event: "audio_75_percent" },
] as const;

export class AudioAnalyticsSession {
  private trackKey = "";
  private started = false;
  private completed = false;
  private firedMilestones = new Set<AudioAnalyticsEventName>();

  start(trackKey: string): AudioAnalyticsEventName[] {
    this.prepare(trackKey);

    if (this.started) {
      return [];
    }

    this.started = true;
    return ["audio_play"];
  }

  progress(trackKey: string, currentTime: number, duration: number): AudioAnalyticsEventName[] {
    if (
      trackKey !== this.trackKey ||
      !this.started ||
      this.completed ||
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      return [];
    }

    const progress = currentTime / duration;
    const events: AudioAnalyticsEventName[] = [];

    milestones.forEach((milestone) => {
      if (progress >= milestone.progress && !this.firedMilestones.has(milestone.event)) {
        this.firedMilestones.add(milestone.event);
        events.push(milestone.event);
      }
    });

    return events;
  }

  complete(trackKey: string): AudioAnalyticsEventName[] {
    if (trackKey !== this.trackKey || !this.started || this.completed) {
      return [];
    }

    this.completed = true;
    return ["audio_complete"];
  }

  private prepare(trackKey: string) {
    if (this.trackKey === trackKey && !this.completed) {
      return;
    }

    this.trackKey = trackKey;
    this.started = false;
    this.completed = false;
    this.firedMilestones.clear();
  }
}
