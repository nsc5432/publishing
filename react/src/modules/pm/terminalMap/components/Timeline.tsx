import type { CSSProperties } from 'react';
import type { useTimeline } from '../hooks/useTimeline';

interface TimelineProps {
    timeline: ReturnType<typeof useTimeline>;
}

/** 하단 타임라인 — 30분 단위 이동 / 재생 컨트롤 */
export function Timeline({ timeline }: TimelineProps) {
    const { step, setStep, playing, toggle, prev, next, label, progress, max } = timeline;

    return (
        <div className="timeline">
            <div className="timeline__ctrl">
                <button type="button" className="btn-play btn-play--prev" onClick={prev}>
                    <i className="ico ico-prev" aria-hidden="true" />
                    <span className="blind">이전</span>
                </button>
                <button
                    type="button"
                    className="btn-play btn-play--play"
                    aria-pressed={playing}
                    onClick={toggle}
                >
                    <i className={`ico ${playing ? 'ico-pause' : 'ico-play'}`} aria-hidden="true" />
                    <span className="blind">{playing ? '일시정지' : '재생'}</span>
                </button>
                <button type="button" className="btn-play btn-play--next" onClick={next}>
                    <i className="ico ico-next" aria-hidden="true" />
                    <span className="blind">다음</span>
                </button>
            </div>

            <div className="timeline__slider">
                <span className="timeline__now">{label}</span>
                <div className="range">
                    {/* 00:00 ~ 24:00 을 30분(48스텝) 단위로 분할 */}
                    <input
                        type="range"
                        id="timeRange"
                        className="range__input"
                        min={0}
                        max={max}
                        step={1}
                        value={step}
                        style={{ '--val': progress } as CSSProperties}
                        onChange={(e) => setStep(Number(e.target.value))}
                        aria-label="시간 선택"
                    />
                </div>
            </div>

            <div className="timeline__scale">
                <span>00:00</span>
                <span>24:00</span>
            </div>
        </div>
    );
}
