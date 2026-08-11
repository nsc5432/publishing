import type { CSSProperties } from 'react';
import {
    PlayerNextIcon,
    PlayerPauseIcon,
    PlayerPlayIcon,
    PlayerPrevIcon,
} from '@/components/icons';
import { formatStep } from '../timeline';
import type { useTimeline } from '@/modules/pm/hooks/useTimeline';

interface TimelineProps {
    timeline: ReturnType<typeof useTimeline>;
}

/** 하단 타임라인 — 30분 단위 이동 / 재생 (04:00 ~ 24:00) */
export function Timeline({ timeline }: TimelineProps) {
    const { step, setStep, playing, toggle, prev, next, label, progress, max } = timeline;

    return (
        <div className="timeline">
            <div className="timeline__ctrl">
                <button type="button" className="btn-play" onClick={prev}>
                    <PlayerPrevIcon aria-hidden="true" focusable="false" />
                    <span className="blind">이전</span>
                </button>
                <button type="button" className="btn-play" aria-pressed={playing} onClick={toggle}>
                    {playing ? (
                        <PlayerPauseIcon aria-hidden="true" focusable="false" />
                    ) : (
                        <PlayerPlayIcon aria-hidden="true" focusable="false" />
                    )}
                    <span className="blind">{playing ? '일시정지' : '재생'}</span>
                </button>
                <button type="button" className="btn-play" onClick={next}>
                    <PlayerNextIcon aria-hidden="true" focusable="false" />
                    <span className="blind">다음</span>
                </button>
            </div>

            <div className="timeline__slider">
                <span className="timeline__now">{label}</span>
                <div className="range">
                    <input
                        type="range"
                        id="timeRange"
                        className="range__input"
                        min={0}
                        max={max}
                        step={1}
                        value={step}
                        style={{ '--val': progress } as CSSProperties}
                        onChange={(event) => setStep(Number(event.target.value))}
                        aria-label="시간 선택"
                        aria-valuetext={label}
                    />
                </div>
            </div>

            <div className="timeline__scale">
                <span>{formatStep(0)}</span>
                <span>{formatStep(max)}</span>
            </div>
        </div>
    );
}
