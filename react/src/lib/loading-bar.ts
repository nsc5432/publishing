type Listener = () => void;

export interface LoadingBarSnapshot {
    /** 바가 DOM에 존재하는지 여부 */
    visible: boolean;
    /** 완료 후 페이드아웃 중인지 여부 */
    fading: boolean;
    /** 진행률 0~100 */
    progress: number;
}

class LoadingBarManager {
    private requestCount = 0;
    private listeners = new Set<Listener>();
    private progressTimer: ReturnType<typeof setInterval> | null = null;
    private fadeTimer: ReturnType<typeof setTimeout> | null = null;
    private hideTimer: ReturnType<typeof setTimeout> | null = null;

    private snapshot: LoadingBarSnapshot = { visible: false, fading: false, progress: 0 };

    // useSyncExternalStore 용 인터페이스
    getSnapshot = (): LoadingBarSnapshot => this.snapshot;
    getServerSnapshot = (): LoadingBarSnapshot => ({ visible: false, fading: false, progress: 0 });
    subscribe = (listener: Listener): (() => void) => {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    };

    private emit(patch: Partial<LoadingBarSnapshot>) {
        const next = { ...this.snapshot, ...patch };
        if (
            next.visible !== this.snapshot.visible ||
            next.fading !== this.snapshot.fading ||
            Math.abs(next.progress - this.snapshot.progress) > 0.1
        ) {
            this.snapshot = next;
            this.listeners.forEach(l => l());
        }
    }

    private clearTimers() {
        if (this.progressTimer !== null) { clearInterval(this.progressTimer); this.progressTimer = null; }
        if (this.fadeTimer !== null) { clearTimeout(this.fadeTimer); this.fadeTimer = null; }
        if (this.hideTimer !== null) { clearTimeout(this.hideTimer); this.hideTimer = null; }
    }

    private beginProgress() {
        this.clearTimers();
        this.emit({ visible: true, fading: false, progress: 8 });

        // 최대 80%까지 점진적으로 증가 (완료 전까지 100%에 도달하지 않음)
        this.progressTimer = setInterval(() => {
            const current = this.snapshot.progress;
            if (current < 80) {
                const inc = Math.max((80 - current) * 0.12, 0.4);
                this.emit({ progress: Math.min(80, current + inc) });
            }
        }, 200);
    }

    private completeProgress() {
        this.clearTimers();

        // 1. 100%까지 채우기
        this.emit({ progress: 100 });

        // 2. fill 애니메이션 후 페이드아웃 시작
        this.fadeTimer = setTimeout(() => {
            this.emit({ fading: true });

            // 3. 페이드 완료 후 숨기기
            this.hideTimer = setTimeout(() => {
                this.emit({ visible: false, fading: false, progress: 0 });
            }, 400);
        }, 280);
    }

    /**
     * API 요청 시작 (요청 수 카운팅)
     * - axios 인터셉터에서 자동 호출됨
     */
    start() {
        this.requestCount++;
        if (this.requestCount === 1) {
            this.beginProgress();
        }
    }

    /**
     * API 요청 완료 (요청 수 카운팅)
     * - axios 인터셉터에서 자동 호출됨
     */
    done() {
        this.requestCount = Math.max(0, this.requestCount - 1);
        if (this.requestCount === 0) {
            this.completeProgress();
        }
    }

    /**
     * 수동으로 로딩 표시 시작
     * @example loadingBar.show()
     */
    show() {
        this.start();
    }

    /**
     * 수동으로 로딩 완료 처리
     * @example loadingBar.hide()
     */
    hide() {
        // 진행 중인 요청 수와 관계없이 즉시 완료 처리
        this.requestCount = 1;
        this.done();
    }

    /**
     * 강제 초기화 (에러 복구 등)
     * @example loadingBar.reset()
     */
    reset() {
        this.requestCount = 0;
        this.clearTimers();
        this.emit({ visible: false, fading: false, progress: 0 });
        // 강제 초기화는 같은 값이어도 알림
        this.snapshot = { visible: false, fading: false, progress: 0 };
        this.listeners.forEach(l => l());
    }
}

export const loadingBar = new LoadingBarManager();
