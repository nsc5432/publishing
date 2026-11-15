import { useEffect, useMemo, useState } from 'react';
import { dashboardService } from '@/api/pm/services/dashboard.service';
import { unwrap } from '@/api/pm/result';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { toErrorMessage, useFetched } from '@/hooks/useFetched';
import type { ApiError, FcltQueueScenarioDto, FcltQueueScenarioReq } from '@/types/api.types';
import type { FcltQueueScenarioView, FcltQueueTarget } from '../types';
import { toFcltQueueScenarioView } from '../view';

interface ScenarioRequest {
    req: FcltQueueScenarioReq;
    /** 실패해도 화면이 붙잡고 있을 마지막 응답 */
    last: FcltQueueScenarioDto | null;
}

interface ScenarioResult {
    request: ScenarioRequest;
    dto: FcltQueueScenarioDto | null;
    error: string;
}

const FAIL = '혼잡해소 시나리오를 계산하지 못했습니다.';
const DEBOUNCE_MS = 250;
const TARGET_STEP_MIN = 5;

function loadScenario(request: ScenarioRequest): Promise<ScenarioResult> {
    return dashboardService
        .getFcltQueueScenario(request.req)
        .then((dto) => unwrap(dto, FAIL))
        .then(
            (dto): ScenarioResult => ({ request, dto, error: '' }),
            (error: ApiError): ScenarioResult => ({ request, dto: null, error: toErrorMessage(error, FAIL) }),
        );
}

// 5분 눈금에 맞춰 움직인다 (예: 32 → 35 / 30)
function stepTargetMin(value: number, delta: number, range: { min: number; max: number }): number {
    const snapped = delta > 0 ? Math.floor(value / TARGET_STEP_MIN) * TARGET_STEP_MIN + delta : Math.ceil(value / TARGET_STEP_MIN) * TARGET_STEP_MIN + delta;

    return Math.min(range.max, Math.max(range.min, snapped));
}

export function useFcltQueueScenario(target: FcltQueueTarget) {
    // 카드의 추천 수량 · 해소 시각과 같은 조건(목표 30분)으로 연다
    const [targetMin, setTargetMin] = useState<number | null>(null);
    const [selectedCnt, setSelectedCnt] = useState<number | null>(null);
    const [request, setRequest] = useState<ScenarioRequest>(() => ({ req: { ...target, mode: 'TIME' }, last: null }));

    const fetched = useFetched(request, loadScenario, FAIL);
    const latest = fetched.data;
    const dto = latest?.dto ?? latest?.request.last ?? null;

    const view = useMemo<FcltQueueScenarioView | null>(() => (dto ? toFcltQueueScenarioView(dto) : null), [dto]);

    const answered = latest?.request === request;
    const debouncing = targetMin !== null && targetMin !== request.req.targetMinutes;
    const pending = !answered || debouncing;
    const error = answered && !debouncing ? (latest?.error ?? '') : '';

    useEffect(() => {
        if (!debouncing || targetMin === null) return;

        const timer = window.setTimeout(() => setRequest({ req: { ...target, mode: 'TIME', targetMinutes: targetMin }, last: dto }), DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [debouncing, targetMin, target, dto]);

    useErrorAlert(latest?.error ?? '', fetched.responseSeq);

    const stepTarget = (delta: number) => {
        if (!view) return;

        setTargetMin(stepTargetMin(targetMin ?? view.targetMin, delta * TARGET_STEP_MIN, view.targetRange));
        setSelectedCnt(null);
    };

    // 같은 조건이어도 새 요청 객체를 만들어 useFetched 가 다시 부르게 한다
    const retry = () => setRequest((current) => ({ ...current }));

    return {
        view,
        targetMin: targetMin ?? view?.targetMin ?? null,
        pending,
        error,
        selectedCnt,
        selectCnt: setSelectedCnt,
        stepTarget,
        retry,
    };
}
