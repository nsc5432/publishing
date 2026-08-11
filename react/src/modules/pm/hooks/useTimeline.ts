import { useCallback, useEffect, useRef, useState } from 'react';
import { pad2 } from '@/lib/format';

/**
 * 하단 타임라인 — 30분 단위 이동 / 재생.
 *
 * 맵형태보기(00:00~24:00)와 출국장(04:00~24:00)이 그리는 구간만 다르고 동작은 같다.
 * 조회 시각(hhmm)을 만드는 규칙이라 조회 데이터와 함께 움직인다.
 */

/** 재생 단위(분) */
export const TIMELINE_STEP_MIN = 30;
/** 재생 간격(ms) */
export const TIMELINE_INTERVAL = 600;

export interface TimelineRange {
    /** 시작 시각(분) — 0 이면 00:00 부터 */
    startMin: number;
    /** 마지막 눈금 번호 (구간 길이 / 30분) */
    maxStep: number;
}

/** 타임라인 스텝 → HH:mm */
export function formatStep(range: TimelineRange, step: number): string {
    const minutes = range.startMin + step * TIMELINE_STEP_MIN;

    return `${pad2(Math.floor(minutes / 60))}:${pad2(minutes % 60)}`;
}

export function useTimeline(range: TimelineRange, initialStep = 0) {
    const { maxStep } = range;

    const [step, setStep] = useState(initialStep);
    const [playing, setPlaying] = useState(false);
    const intervalId = useRef<number | null>(null);

    const clearTimer = useCallback(() => {
        if (intervalId.current !== null) {
            window.clearInterval(intervalId.current);
            intervalId.current = null;
        }
    }, []);

    const play = useCallback(() => {
        // 마지막(24:00)에서 재생하면 처음부터 다시 돈다
        setStep((prevStep) => (prevStep >= maxStep ? 0 : prevStep));
        setPlaying(true);
    }, [maxStep]);

    const stop = useCallback(() => {
        clearTimer();
        setPlaying(false);
    }, [clearTimer]);

    const toggle = useCallback(() => {
        if (playing) stop();
        else play();
    }, [playing, play, stop]);

    const prev = useCallback(() => {
        stop();
        setStep((prevStep) => Math.max(0, prevStep - 1));
    }, [stop]);

    const next = useCallback(() => {
        stop();
        setStep((prevStep) => Math.min(maxStep, prevStep + 1));
    }, [stop, maxStep]);

    useEffect(() => {
        if (!playing) return;

        intervalId.current = window.setInterval(() => {
            setStep((prevStep) => {
                const nextStep = Math.min(maxStep, prevStep + 1); // 30분씩 이동
                if (nextStep >= maxStep) setPlaying(false);
                return nextStep;
            });
        }, TIMELINE_INTERVAL);

        return clearTimer;
    }, [playing, clearTimer, maxStep]);

    const label = formatStep(range, step);

    return {
        step,
        setStep,
        playing,
        toggle,
        prev,
        next,
        /** 현재 시각 라벨 (예: 10:30) */
        label,
        /** 조회 조건으로 넘길 시각 (예: 1030) */
        hhmm: label.replace(':', ''),
        /** 트랙 진행률 (예: 50%) */
        progress: `${(step / maxStep) * 100}%`,
        max: maxStep,
    };
}
