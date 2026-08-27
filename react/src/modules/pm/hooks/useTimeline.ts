import { useEffect, useRef, useState } from 'react';
import { pad2 } from '@/lib/format';

export const TIMELINE_STEP_MIN = 30;
export const TIMELINE_INTERVAL = 600;

export interface TimelineRange {
    startMin: number;
    maxStep: number;
}

export function formatStep(range: TimelineRange, step: number): string {
    const minutes = range.startMin + step * TIMELINE_STEP_MIN;

    return `${pad2(Math.floor(minutes / 60))}:${pad2(minutes % 60)}`;
}

export function useTimeline(range: TimelineRange, initialStep = 0) {
    const { maxStep } = range;

    const [step, setStep] = useState(initialStep);
    const [playing, setPlaying] = useState(false);
    const intervalId = useRef<number | null>(null);

    const clearTimer = () => {
        if (intervalId.current !== null) {
            window.clearInterval(intervalId.current);
            intervalId.current = null;
        }
    };

    const play = () => {
        setStep((previousStep) => (previousStep >= maxStep ? 0 : previousStep));
        setPlaying(true);
    };

    const stop = () => {
        clearTimer();
        setPlaying(false);
    };

    const toggle = () => {
        if (playing) stop();
        else play();
    };

    const prev = () => {
        stop();
        setStep((previousStep) => Math.max(0, previousStep - 1));
    };

    const next = () => {
        stop();
        setStep((previousStep) => Math.min(maxStep, previousStep + 1));
    };

    useEffect(() => {
        if (!playing) return;

        intervalId.current = window.setInterval(() => {
            setStep((previousStep) => {
                const nextStep = Math.min(maxStep, previousStep + 1);
                if (nextStep >= maxStep) setPlaying(false);
                return nextStep;
            });
        }, TIMELINE_INTERVAL);

        return () => clearTimer();
    }, [playing, maxStep]);

    const label = formatStep(range, step);

    return {
        step,
        setStep,
        playing,
        toggle,
        prev,
        next,
        label,
        hhmm: label.replace(':', ''),
        progress: `${(step / maxStep) * 100}%`,
        max: maxStep,
    };
}
