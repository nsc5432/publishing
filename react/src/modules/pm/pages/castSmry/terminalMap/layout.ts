import type { MarkerPoint, TerminalKind } from './types';

type MarkerKind = 'dptgtGate' | 'island' | 'gate';
type MarkerPoints = Record<string, readonly [number, number]>;

const T2_DEP_GATE_POINTS: MarkerPoints = {
    '2': [38, 30],
    '1': [62, 30],
};

const T2_ISLAND_POINTS: MarkerPoints = {
    N: [17, 46],
    M: [22.5, 42.5],
    L: [28, 40.5],
    K: [33.5, 39.5],
    J: [39, 39],
    H: [44.5, 38.8],
    G: [50, 38.8],
    F: [55.5, 38.8],
    E: [61, 39],
    D: [66.5, 39.5],
    C: [72, 40.5],
    B: [77.5, 42.5],
    A: [83, 46],
};

const T2_GATE_POINTS: MarkerPoints = {
    '14': [19.5, 50.4],
    '13': [23.6, 48.83],
    '12': [28.4, 47.53],
    '11': [32.7, 46.42],
    '10': [37.8, 45.64],
    '9': [42.4, 45.12],
    '8': [47.3, 44.8],
    '7': [52.6, 44.8],
    '6': [57.5, 45.12],
    '5': [62.3, 45.73],
    '4': [67.4, 46.54],
    '3': [71.7, 47.61],
    '2': [76.5, 48.86],
    '1': [80.5, 50.4],
};

const T2_POINTS: Record<MarkerKind, MarkerPoints> = {
    dptgtGate: T2_DEP_GATE_POINTS,
    island: T2_ISLAND_POINTS,
    gate: T2_GATE_POINTS,
};

export function toPlanPoint(
    terminal: TerminalKind,
    kind: MarkerKind,
    label: string,
    fallback: MarkerPoint,
): MarkerPoint {
    const point = terminal === 'T2' ? T2_POINTS[kind][label] : undefined;

    return point ? { x: point[0], y: point[1] } : fallback;
}
