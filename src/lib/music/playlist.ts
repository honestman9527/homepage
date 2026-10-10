export type PlaybackMode = "sequential" | "shuffle";

/** Queue and history survive page navigation with the audio controller. */
export class Playlist {
  private remaining: string[] = [];
  private history: string[] = [];
  private future: string[] = [];

  constructor(
    private readonly ids: readonly string[],
    public current: string,
    public mode: PlaybackMode,
    private readonly random: () => number = Math.random,
  ) {
    if (!ids.length || !ids.includes(current)) throw new Error("Playlist needs a valid current track");
    this.resetQueue();
  }

  private shuffle(ids: readonly string[]): string[] {
    const result = [...ids];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private resetQueue(): void {
    this.remaining = this.shuffle(this.ids.filter((id) => id !== this.current));
  }

  setMode(mode: PlaybackMode): void {
    this.mode = mode;
    this.future = [];
    this.resetQueue();
  }

  select(id: string): string {
    if (!this.ids.includes(id)) return this.current;
    this.future = [];
    this.remaining = this.remaining.filter((item) => item !== id);
    return this.move(id);
  }

  private move(id: string): string {
    if (id !== this.current) this.history.push(this.current);
    // Keep listening history bounded during long visits.
    if (this.history.length > 100) this.history.shift();
    this.current = id;
    return id;
  }

  next(excluded: ReadonlySet<string> = new Set()): string | undefined {
    if (this.ids.every((id) => excluded.has(id))) return undefined;
    let id: string | undefined;
    while (this.future.length && !id) {
      const candidate = this.future.pop()!;
      if (!excluded.has(candidate)) id = candidate;
    }
    if (!id && this.mode === "sequential") {
      const start = this.ids.indexOf(this.current);
      for (let offset = 1; offset <= this.ids.length; offset++) {
        const candidate = this.ids[(start + offset) % this.ids.length];
        if (!excluded.has(candidate)) { id = candidate; break; }
      }
    }
    if (!id && this.mode === "shuffle") {
      this.remaining = this.remaining.filter((item) => !excluded.has(item));
      if (!this.remaining.length) {
        this.remaining = this.shuffle(this.ids.filter((item) => !excluded.has(item)));
        if (this.remaining.length > 1 && this.remaining[0] === this.current)
          [this.remaining[0], this.remaining[1]] = [this.remaining[1], this.remaining[0]];
      }
      id = this.remaining.shift();
    }
    return id ? this.move(id) : undefined;
  }

  previous(): string {
    const id = this.history.pop();
    if (!id) return this.current;
    this.future.push(this.current);
    this.current = id;
    return id;
  }
}
