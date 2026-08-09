import { useCallback, useEffect, useRef, useState } from 'react';
import { TIMELINE_INTERVAL, TIMELINE_MAX_STEP, TIMELINE_STEP_MIN } from '../mock';

function formatStep(step: number) {
    const minutes = step * TIMELINE_STEP_MIN;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

export function useTimeline(initialStep = 0) {
    const [step, setStep] = useState(initialStep);
    const [playing, setPlaying] = useState(false);
    const timer = useRef<number | null>(null);

    const clear = useCallback(() => {
        if (timer.current !== null) {
            window.clearInterval(timer.current);
            timer.current = null;
        }
    }, []);

    const stop = useCallback(() => {
        clear();
        setPlaying(false);
    }, [clear]);

    const play = useCallback(() => {
        // 마지막(24:00)에서 재생 시 처음부터
        setStep((v) => (v >= TIMELINE_MAX_STEP ? 0 : v));
        setPlaying(true);
    }, []);

    const toggle = useCallback(() => {
        if (playing) stop();
        else play();
    }, [playing, play, stop]);

    const prev = useCallback(() => {
        stop();
        setStep((v) => Math.max(0, v - 1));
    }, [stop]);

    const next = useCallback(() => {
        stop();
        setStep((v) => Math.min(TIMELINE_MAX_STEP, v + 1));
    }, [stop]);

    useEffect(() => {
        if (!playing) return;

        timer.current = window.setInterval(() => {
            setStep((v) => {
                const nextStep = Math.min(TIMELINE_MAX_STEP, v + 1); // 30분씩 이동
                if (nextStep >= TIMELINE_MAX_STEP) setPlaying(false);
                return nextStep;
            });
        }, TIMELINE_INTERVAL);

        return clear;
    }, [playing, clear]);

    return {
        step,
        setStep,
        playing,
        toggle,
        prev,
        next,
        /** 현재 시각 라벨 (예: 10:30) */
        label: formatStep(step),
        /** 트랙 진행률 (예: 50%) */
        progress: `${(step / TIMELINE_MAX_STEP) * 100}%`,
        max: TIMELINE_MAX_STEP,
    };
}
