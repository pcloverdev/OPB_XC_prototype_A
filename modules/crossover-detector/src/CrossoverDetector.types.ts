/** Payload for the `onRepComplete` event — the lightweight pulse from native. */
export type RepCompleteEvent = {
  /** Running total of detected crossovers this session. */
  totalReps: number;
  /** Duration in seconds of the rep that just completed. */
  duration: number;
};

/** Emitted when native finishes decoding a local video. */
export type VideoCompleteEvent = {
  totalReps: number;
};

/** Emitted on a native error (bad model, unreadable video, …). */
export type ErrorEvent = {
  message: string;
};

export type CrossoverDetectorEvents = {
  onRepComplete: (event: RepCompleteEvent) => void;
  onVideoComplete: (event: VideoCompleteEvent) => void;
  onError: (event: ErrorEvent) => void;
};
