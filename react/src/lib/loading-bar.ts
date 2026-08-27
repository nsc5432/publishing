type Listener = () => void;

export interface LoadingBarSnapshot {
    visible: boolean;
    fading: boolean;
    progress: number;
}

class LoadingBarManager {
    private requestCount = 0;
    private listeners = new Set<Listener>();
    private progressTimer: ReturnType<typeof setInterval> | null = null;
    private fadeTimer: ReturnType<typeof setTimeout> | null = null;
    private hideTimer: ReturnType<typeof setTimeout> | null = null;

    private snapshot: LoadingBarSnapshot = { visible: false, fading: false, progress: 0 };

    getSnapshot = (): LoadingBarSnapshot => this.snapshot;
    getServerSnapshot = (): LoadingBarSnapshot => ({ visible: false, fading: false, progress: 0 });
    subscribe = (listener: Listener): (() => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };

    private emit(patch: Partial<LoadingBarSnapshot>) {
        const nextSnapshot = { ...this.snapshot, ...patch };
        if (
            nextSnapshot.visible !== this.snapshot.visible ||
            nextSnapshot.fading !== this.snapshot.fading ||
            Math.abs(nextSnapshot.progress - this.snapshot.progress) > 0.1
        ) {
            this.snapshot = nextSnapshot;
            this.listeners.forEach((listener) => listener());
        }
    }

    private clearTimers() {
        if (this.progressTimer !== null) {
            clearInterval(this.progressTimer);
            this.progressTimer = null;
        }
        if (this.fadeTimer !== null) {
            clearTimeout(this.fadeTimer);
            this.fadeTimer = null;
        }
        if (this.hideTimer !== null) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
    }

    private beginProgress() {
        this.clearTimers();
        this.emit({ visible: true, fading: false, progress: 8 });

        this.progressTimer = setInterval(() => {
            const current = this.snapshot.progress;
            if (current < 80) {
                const increment = Math.max((80 - current) * 0.12, 0.4);
                this.emit({ progress: Math.min(80, current + increment) });
            }
        }, 200);
    }

    private completeProgress() {
        this.clearTimers();

        this.emit({ progress: 100 });

        this.fadeTimer = setTimeout(() => {
            this.emit({ fading: true });

            this.hideTimer = setTimeout(() => {
                this.emit({ visible: false, fading: false, progress: 0 });
            }, 400);
        }, 280);
    }

    start() {
        this.requestCount++;
        if (this.requestCount === 1) {
            this.beginProgress();
        }
    }

    done() {
        this.requestCount = Math.max(0, this.requestCount - 1);
        if (this.requestCount === 0) {
            this.completeProgress();
        }
    }

    show() {
        this.start();
    }

    hide() {
        this.requestCount = 1;
        this.done();
    }

    reset() {
        this.requestCount = 0;
        this.clearTimers();
        this.emit({ visible: false, fading: false, progress: 0 });
        this.snapshot = { visible: false, fading: false, progress: 0 };
        this.listeners.forEach((listener) => listener());
    }
}

export const loadingBar = new LoadingBarManager();
