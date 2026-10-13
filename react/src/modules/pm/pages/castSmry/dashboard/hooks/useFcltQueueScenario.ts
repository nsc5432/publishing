import { useEffect, useMemo, useState } from 'react';
import { isNotNullOrUndefined } from '@/components/utils/commonUtils';
import { dashboardService } from '@/api/pm/services/dashboard.service';
import { unwrap } from '@/api/pm/result';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { toErrorMessage, useFetched } from '@/hooks/useFetched';
import type { ApiError, FcltQueueScenarioDto, FcltQueueScenarioMode, FcltQueueScenarioReq } from '@/types/api.types';
import type { FcltQueueContextView, FcltQueueResultView, FcltQueueTarget } from '../types';
import { toFcltQueueContextView, toFcltQueueResultView } from '../view';

export type FcltQueueResultState =
    { status: 'loading' } | { status: 'invalid' } | { status: 'error'; message: string } | { status: 'ready'; view: FcltQueueResultView };

interface ScenarioRequest {
    req: FcltQueueScenarioReq;
    key: string;
    /** 실패해도 화면이 붙잡고 있을 마지막 기준 응답 */
    context: FcltQueueScenarioDto | null;
}

interface ScenarioResult {
    request: ScenarioRequest;
    dto: FcltQueueScenarioDto | null;
    error: string;
    context: FcltQueueScenarioDto | null;
}

interface ScenarioDraft {
    version: string;
    countText: string;
    targetText: string;
}

const FAIL = '혼잡해소 시나리오를 계산하지 못했습니다.';
const DEBOUNCE_MS = 250;
const INTEGER_PATTERN = /^\d+$/;

function toInitialRequest(target: FcltQueueTarget): ScenarioRequest {
    return { req: { ...target, mode: 'COUNT' }, key: 'INIT', context: null };
}

// 응답이 어떤 입력의 결과인지 나타내는 키 — 지금 입력과 다르면 이전 결과를 보여주지 않는다
function toResultKey(dto: FcltQueueScenarioDto): string | null {
    if (dto.ctxChgYn === 'Y') return null;

    const value = dto.mode === 'COUNT' ? dto.scenario?.fcltCnt : dto.recommend?.targetMin;

    return `${dto.mode}|${dto.contextVersion}|${value ?? ''}`;
}

function parseInteger(text: string): number | null {
    return INTEGER_PATTERN.test(text) ? Number(text) : null;
}

function loadScenario(request: ScenarioRequest): Promise<ScenarioResult> {
    return dashboardService
        .getFcltQueueScenario(request.req)
        .then((dto) => unwrap(dto, FAIL))
        .then(
            (dto): ScenarioResult => ({ request, dto, error: '', context: dto }),
            (error: ApiError): ScenarioResult => ({
                request,
                dto: null,
                error: toErrorMessage(error, FAIL),
                context: request.context,
            }),
        );
}

export function useFcltQueueScenario(target: FcltQueueTarget) {
    const [mode, setMode] = useState<FcltQueueScenarioMode>('COUNT');
    const [draft, setDraft] = useState<ScenarioDraft | null>(null);
    const [request, setRequest] = useState<ScenarioRequest>(() => toInitialRequest(target));

    const fetched = useFetched(request, loadScenario, FAIL);
    const latest = fetched.data;
    const context = latest?.context ?? null;
    const version = context?.contextVersion ?? '';

    const contextView = useMemo<FcltQueueContextView | null>(() => (context ? toFcltQueueContextView(context) : null), [context]);

    const countLocked = !contextView || contextView.countLockReason !== '';
    const defaults: ScenarioDraft = {
        version,
        countText: String(context?.oprFcltCnt ?? ''),
        targetText: String(context?.dfltTargetMin ?? ''),
    };
    const inputs = draft && draft.version === version ? draft : defaults;

    const countValue = parseInteger(inputs.countText);
    const targetValue = parseInteger(inputs.targetText);

    let countError = '';
    if (!countLocked && contextView) {
        if (countValue === null) countError = '0 이상의 정수를 입력하세요.';
        else if (contextView.totCnt !== null && countValue > contextView.totCnt) {
            countError = `보유 ${contextView.totCnt}개 이하로 입력하세요.`;
        }
    }

    let targetError = '';
    if (contextView) {
        const { min, max } = contextView.targetMin;
        if (targetValue === null || targetValue < min || targetValue > max) {
            targetError = `${min}~${max}분 사이의 정수를 입력하세요.`;
        }
    }

    const nextReq = useMemo<FcltQueueScenarioReq | null>(() => {
        if (!context) return null;

        const base: FcltQueueScenarioReq = { ...target, mode, contextVersion: context.contextVersion };

        if (mode === 'TIME') return targetError ? null : { ...base, targetMinutes: targetValue ?? undefined };
        if (countLocked) return base;

        return countError ? null : { ...base, oprFcltCnt: countValue ?? undefined };
    }, [context, target, mode, countLocked, countError, countValue, targetError, targetValue]);

    const nextKey = nextReq ? `${mode}|${version}|${mode === 'COUNT' ? (countLocked ? (context?.oprFcltCnt ?? '') : countValue) : targetValue}` : null;
    const resultKey = latest?.dto ? toResultKey(latest.dto) : null;
    const errorKey = latest?.error ? latest.request.key : null;

    useEffect(() => {
        if (!nextReq || !nextKey || nextKey === resultKey || nextKey === request.key) return;

        const timer = window.setTimeout(() => setRequest({ req: nextReq, key: nextKey, context }), DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [nextReq, nextKey, resultKey, request.key, context]);

    useErrorAlert(latest?.error ?? '', fetched.token);

    let result: FcltQueueResultState = { status: 'loading' };
    if (!context && latest?.error) result = { status: 'error', message: latest.error };
    else if (context && !nextKey) result = { status: 'invalid' };
    else if (latest?.dto && nextKey === resultKey) result = { status: 'ready', view: toFcltQueueResultView(latest.dto) };
    else if (nextKey === errorKey && latest?.error) result = { status: 'error', message: latest.error };

    const updateDraft = (patch: Partial<ScenarioDraft>) => setDraft({ ...inputs, ...patch, version });

    const stepCount = (delta: number) => {
        const next = Math.max(0, (countValue ?? contextView?.currentCnt ?? 0) + delta);
        const capped = isNotNullOrUndefined(contextView?.totCnt) ? Math.min(next, contextView.totCnt) : next;
        updateDraft({ countText: String(capped) });
    };

    const stepTarget = (delta: number) => {
        if (!contextView) return;

        const { dflt, min, max } = contextView.targetMin;
        updateDraft({ targetText: String(Math.min(max, Math.max(min, (targetValue ?? dflt) + delta))) });
    };

    // 같은 입력이어도 새 요청 객체를 만들어 useFetched 가 다시 부르게 한다
    const retry = () => setRequest((current) => ({ ...current }));

    return {
        context: contextView,
        mode,
        setMode,
        countText: inputs.countText,
        countValue,
        countLocked,
        countError,
        setCountText: (countText: string) => updateDraft({ countText }),
        stepCount,
        targetText: inputs.targetText,
        targetValue,
        targetError,
        setTargetText: (targetText: string) => updateDraft({ targetText }),
        stepTarget,
        result,
        retry,
    };
}
