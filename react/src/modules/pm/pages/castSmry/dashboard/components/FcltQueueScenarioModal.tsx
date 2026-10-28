import { useId, type ReactNode } from 'react';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { formatCount } from '@/lib/format';
import { useFcltQueueScenario, type FcltQueueResultState } from '../hooks/useFcltQueueScenario';
import { FCLT_QUEUE_LABEL, type FcltQueueContextView, type FcltQueueTarget, type QueueClearView, type QueueErlangView } from '../types';

interface FcltQueueScenarioModalProps {
    target: FcltQueueTarget;
    onClose: () => void;
}

interface StepperProps {
    label: string;
    unit: string;
    text: string;
    value: number | null;
    min: number;
    max: number | null;
    step: number;
    disabled: boolean;
    error: string;
    note: string;
    boundText: string;
    onChange: (text: string) => void;
    onStep: (delta: number) => void;
}

interface CompareRow {
    label: string;
    clear: QueueClearView | null;
    accent?: boolean;
}

const TARGET_STEP_MIN = 10;

const CLEAR_EMPTY: QueueClearView = {
    kind: 'unavailable',
    minutes: null,
    mainText: '-',
    unitText: '',
    clockText: '-',
    note: '',
    nextWtngText: '',
    fcstWtngText: '',
    fcst: { sec: null, over: null, rangeText: '—', valueText: '—' },
};

function joinNotes(...notes: (string | undefined)[]): string {
    return notes.filter(Boolean).join(' / ');
}

function toCountNote(context: FcltQueueContextView | null, value: number | null, locked: boolean): string {
    if (!context) return '';
    if (locked) return context.countLockReason;
    if (value === null || context.currentCnt === null) return '';

    const diff = value - context.currentCnt;

    if (diff > 0) return `현재보다 ${formatCount(diff)}개 추가 배정`;
    if (diff < 0) return `현재보다 ${formatCount(-diff)}개 축소`;

    return '현재 운영 수량과 같음';
}

export function FcltQueueScenarioModal({ target, onClose }: FcltQueueScenarioModalProps) {
    const scenario = useFcltQueueScenario(target);

    const label = FCLT_QUEUE_LABEL[target.fcltType];
    const context = scenario.context;
    const isCount = scenario.mode === 'COUNT';
    const { result } = scenario;
    const readyView = result.status === 'ready' ? result.view : null;
    const scenarioErlang = readyView?.scenarioErlang ?? null;
    const availableCnt = context?.totCnt != null && context.currentCnt != null ? Math.max(0, context.totCnt - context.currentCnt) : null;

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="fqs" aria-describedby={undefined}>
                <header className="fqs-head">
                    <div className="fqs-target">
                        <span className="fqs-tmnl">{target.tmnlId}</span>
                        <DialogTitle asChild>
                            <strong>{label.title}</strong>
                        </DialogTitle>
                        <span className="fqs-muted">{context?.fcltNm ?? target.unitCd}</span>
                    </div>
                    <DialogClose className="fqs-x" aria-label="팝업 닫기">
                        ×
                    </DialogClose>
                </header>

                <div className="fqs-body">
                    <div className="fqs-context">
                        <p className="fqs-guide">{label.resource} 수를 조정해 혼잡 해소시간의 변화를 확인하세요.</p>
                        <div className="fqs-clock">
                            <span>
                                계산 기준 <b>{context?.baseText ?? '-'}</b>
                            </span>
                        </div>
                    </div>

                    <div className="fqs-baseline">
                        <div>
                            <span className="fqs-k">{label.current}</span>
                            <div className="fqs-v">
                                <strong>{context?.currentCnt ?? '-'}</strong>
                                <span>개</span>
                            </div>
                            <BulletList
                                items={[
                                    context?.queueText === '—' ? '대기인원 —' : `대기인원 ${context?.queueText ?? '-'}명`,
                                    context?.wtngAvgShort,
                                    context?.current.nextWtngText,
                                ]}
                            />
                        </div>
                        <div>
                            <span className="fqs-k">
                                {context?.current.kind === 'none' ? `${context.current.fcst.rangeText} 예상 평균대기` : '현재 조건의 혼잡해소 예상'}
                            </span>
                            <ClearInline clear={context?.current ?? CLEAR_EMPTY} />
                            <span className="fqs-sub">{context?.current.note}</span>
                        </div>
                        <div>
                            <span className="fqs-k">추가 운영 가능</span>
                            <div className="fqs-v">
                                <strong>{availableCnt === null ? '-' : formatCount(availableCnt)}</strong>
                                <span>개</span>
                            </div>
                            <span className="fqs-sub">
                                {context?.totCnt != null && context.currentCnt != null
                                    ? `보유 ${formatCount(context.totCnt)}개 중 현재 ${formatCount(context.currentCnt)}개 운영`
                                    : '보유/운영 수량 미확인'}
                            </span>
                        </div>
                    </div>

                    <div className="fqs-modes" role="group" aria-label="계산 방식">
                        <button type="button" aria-pressed={isCount} onClick={() => scenario.setMode('COUNT')}>
                            {label.countTab}
                        </button>
                        <button type="button" aria-pressed={!isCount} onClick={() => scenario.setMode('TIME')}>
                            목표 해소시간 설정
                        </button>
                    </div>

                    <div className="fqs-workspace">
                        <section className="fqs-editor">
                            {isCount ? (
                                <Stepper
                                    label={label.input}
                                    unit="개"
                                    text={scenario.countText}
                                    value={scenario.countValue}
                                    min={0}
                                    max={context?.totCnt ?? null}
                                    step={1}
                                    disabled={scenario.countLocked}
                                    error={scenario.countError}
                                    note={toCountNote(context, scenario.countValue, scenario.countLocked)}
                                    boundText={context?.totCnt != null ? `보유 ${context.totCnt}개` : '보유 미확인'}
                                    onChange={scenario.setCountText}
                                    onStep={scenario.stepCount}
                                />
                            ) : (
                                <Stepper
                                    label="목표 혼잡해소 시간"
                                    unit="분"
                                    text={scenario.targetText}
                                    value={scenario.targetValue}
                                    min={context?.targetMin.min ?? 1}
                                    max={context?.targetMin.max ?? null}
                                    step={TARGET_STEP_MIN}
                                    disabled={!context}
                                    error={scenario.targetError}
                                    note={context ? `기본 ${context.targetMin.dflt}분` : ''}
                                    boundText={context ? `${context.targetMin.max}분` : ''}
                                    onChange={scenario.setTargetText}
                                    onStep={scenario.stepTarget}
                                />
                            )}
                        </section>

                        <section className="fqs-result" aria-live="polite" aria-busy={result.status === 'loading'}>
                            <div className="fqs-section-label">
                                <span className="fqs-step">2</span>
                                <span>
                                    {!isCount ? label.recommend : readyView?.scenario?.kind === 'none' ? '조정 후 예상 평균대기시간' : '조정 후 혼잡해소 예상'}
                                </span>
                            </div>
                            <ResultBody result={result} isCount={isCount} onRetry={scenario.retry} />
                        </section>
                    </div>

                    <Comparison
                        rows={[
                            { label: '현재', clear: context?.current ?? null },
                            isCount
                                ? { label: '조정 후', clear: readyView?.scenario ?? null, accent: true }
                                : {
                                      label: readyView?.recommend?.clearLabel || '조정 후',
                                      clear: readyView?.recommend?.clear ?? null,
                                      accent: true,
                                  },
                        ]}
                    />

                    <details className="fqs-basis">
                        <summary>계산 기준</summary>
                        <dl>
                            <BasisItem term="해소 기준">{context?.targetText ?? '-'}</BasisItem>
                            <BasisItem term="관측구간">{context ? `${context.obsText} / ${context.dataSrcText}` : '-'}</BasisItem>
                            <BasisItem term="현재 평균대기">{context?.wtngAvgText ?? '-'}</BasisItem>
                            <BasisItem term="유입률 λ">{context?.arvlText ?? '-'}</BasisItem>
                            <BasisItem term="처리율 μ">{context?.srvcText ?? '-'}</BasisItem>
                            <BasisItem term={`정상상태 / 현재 ${context?.currentCnt ?? '-'}개`}>
                                {context ? <ErlangText erlang={context.currentErlang} /> : '-'}
                            </BasisItem>
                            <BasisItem term={`정상상태 / ${isCount ? '조정 후' : '추천 수량'}`}>
                                {scenarioErlang ? <ErlangText erlang={scenarioErlang} /> : '-'}
                            </BasisItem>
                        </dl>
                    </details>
                </div>

                <footer className="fqs-foot">
                    <DialogClose className="fqs-close">닫기</DialogClose>
                </footer>
            </DialogContent>
        </Dialog>
    );
}

function ClearInline({ clear }: { clear: QueueClearView }) {
    const tone = clear.kind === 'unreachable' ? ' warn' : clear.kind === 'none' && clear.fcst.over ? ' over' : '';

    return (
        <div className={`fqs-v${tone}`}>
            <strong>{clear.mainText}</strong>
            {clear.unitText && <span>{clear.unitText}</span>}
            {clear.kind === 'value' && <span className="fqs-clock-at">{clear.clockText}</span>}
        </div>
    );
}

function Stepper({ label, unit, text, value, min, max, step, disabled, error, note, boundText, onChange, onStep }: StepperProps) {
    const id = useId();
    const noteId = `${id}-note`;

    return (
        <>
            <div className="fqs-section-label">
                <span className="fqs-step">1</span>
                <label htmlFor={id}>{label}</label>
            </div>
            <div className="fqs-stepper">
                <button
                    type="button"
                    aria-label={`${label} ${step}${unit} 줄이기`}
                    disabled={disabled || (value !== null && value <= min)}
                    onClick={() => onStep(-step)}
                >
                    −
                </button>
                <div>
                    <input
                        id={id}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={text}
                        disabled={disabled}
                        aria-invalid={error !== ''}
                        aria-describedby={noteId}
                        onChange={(event) => onChange(event.target.value.trim())}
                    />
                    <span>{unit}</span>
                </div>
                <button
                    type="button"
                    aria-label={`${label} ${step}${unit} 늘리기`}
                    disabled={disabled || (max !== null && value !== null && value >= max)}
                    onClick={() => onStep(step)}
                >
                    +
                </button>
            </div>
            {max !== null && (
                <input
                    className="fqs-range"
                    type="range"
                    min={min}
                    max={max}
                    step={1}
                    value={Math.min(max, Math.max(min, value ?? min))}
                    disabled={disabled}
                    aria-label={`${label} 슬라이더`}
                    onChange={(event) => onChange(event.target.value)}
                />
            )}
            <div className="fqs-range-labels">
                <span>
                    {min}
                    {unit}
                </span>
                <span>{boundText}</span>
            </div>
            <p id={noteId} className={`fqs-note${error ? ' err' : ''}`}>
                {error || note}
            </p>
        </>
    );
}

function ResultBody({ result, isCount, onRetry }: { result: FcltQueueResultState; isCount: boolean; onRetry: () => void }) {
    let main: ReactNode = null;
    let mainTone = '';
    let detail: ReactNode = null;
    let sub: ReactNode = null;
    let subWarn = false;
    let bullets: (string | undefined)[] = [];
    let diff: ReactNode = null;

    if (result.status === 'loading') detail = '계산 중…';
    else if (result.status === 'invalid') detail = '입력값을 확인하세요.';
    else if (result.status === 'error') {
        detail = <span className="fqs-state-err">{result.message}</span>;
        diff = (
            <button type="button" className="fqs-retry" onClick={onRetry}>
                다시 계산
            </button>
        );
    } else {
        const { scenario, diffNote, recommend } = result.view;

        if (isCount) {
            if (scenario?.kind === 'none') {
                mainTone = scenario.fcst.over ? ' over' : '';
                main = <strong className="fqs-result-value">{scenario.mainText}</strong>;
                detail = `${scenario.fcst.rangeText} 예상 평균대기`;
                bullets = [scenario.nextWtngText];
                diff = diffNote;
            } else if (scenario) {
                mainTone = scenario.kind === 'unreachable' ? ' warn' : '';
                main = (
                    <>
                        <strong className="fqs-result-value">{scenario.mainText}</strong>
                        {scenario.unitText && <span className="fqs-result-unit">{scenario.unitText}</span>}
                    </>
                );
                detail = (
                    <>
                        해소 예상 시각 <b>{scenario.clockText}</b>
                    </>
                );
                sub = scenario.note;
                bullets = [scenario.fcstWtngText, scenario.nextWtngText];
                diff = diffNote;
            }
        } else if (recommend && recommend.reqCnt !== null) {
            main = (
                <>
                    <span className="fqs-result-unit">총</span>
                    <strong className="fqs-result-value">{formatCount(recommend.reqCnt)}</strong>
                    <span className="fqs-result-unit">개</span>
                </>
            );
            detail = recommend.countNote;
            sub = recommend.capaNote;
            subWarn = recommend.capaShort;
            if (recommend.clear) {
                diff = joinNotes(
                    `${recommend.clearLabel} ${
                        recommend.clear.kind === 'value'
                            ? `해소 ${recommend.clear.mainText}${recommend.clear.unitText} (${recommend.clear.clockText})`
                            : recommend.clear.kind === 'none'
                              ? '해소 - 이미 목표 미만'
                              : recommend.clear.kind === 'unreachable'
                                ? recommend.clear.mainText
                                : `해소 ${recommend.clear.mainText}`
                    }`,
                    recommend.clear.fcstWtngText,
                    recommend.clear.nextWtngText,
                );
            }
        } else {
            sub = recommend?.countNote;
        }
    }

    return (
        <>
            <div className={`fqs-result-main${mainTone}`}>{main}</div>
            <p className="fqs-result-detail">{detail}</p>
            {sub && <p className={`fqs-result-sub${subWarn ? ' warn' : ''}`}>{sub}</p>}
            <BulletList items={bullets} />
            <div className="fqs-result-diff">{diff}</div>
        </>
    );
}

function Comparison({ rows }: { rows: CompareRow[] }) {
    if (rows.length === 0) return null;

    if (rows.every((row) => row.clear?.kind === 'none')) return <FcstComparison rows={rows} />;

    const maxMinutes = Math.max(1, ...rows.map((row) => row.clear?.minutes ?? 0));

    return (
        <div className="fqs-compare">
            <div className="fqs-compare-head">
                <span>혼잡해소 소요시간 비교</span>
                <span>분</span>
            </div>
            {rows.map((row) => {
                const clear = row.clear ?? CLEAR_EMPTY;
                const unreachable = clear.kind === 'unreachable';
                const width = unreachable ? 100 : ((clear.minutes ?? 0) / maxMinutes) * 100;

                return (
                    <div className="fqs-bar-row" key={row.label}>
                        <span>{row.label}</span>
                        <div className="fqs-track">
                            <div className={`fqs-bar${row.accent ? ' accent' : ''}${unreachable ? ' over' : ''}`} style={{ width: `${width}%` }} />
                        </div>
                        <b>{clear.minutes === null ? clear.mainText : `${formatCount(clear.minutes)}분`}</b>
                    </div>
                );
            })}
        </div>
    );
}

function FcstComparison({ rows }: { rows: CompareRow[] }) {
    const fcstList = rows.map((row) => (row.clear ?? CLEAR_EMPTY).fcst);
    const maxSec = Math.max(1, ...fcstList.map((fcst) => fcst.sec ?? 0));

    return (
        <div className="fqs-compare">
            <div className="fqs-compare-head">
                <span>예상 평균대기</span>
                <span>{fcstList[0].rangeText} 기준</span>
            </div>
            {rows.map((row, index) => {
                const fcst = fcstList[index];

                return (
                    <div className="fqs-bar-row" key={row.label}>
                        <span>{row.label}</span>
                        <div className="fqs-track">
                            <div
                                className={`fqs-bar${row.accent ? ' accent' : ''}${fcst.over ? ' over' : ''}`}
                                style={{ width: `${((fcst.sec ?? 0) / maxSec) * 100}%` }}
                            />
                        </div>
                        <b>{fcst.valueText}</b>
                    </div>
                );
            })}
        </div>
    );
}

function BulletList({ items }: { items: (string | undefined)[] }) {
    const list = items.filter((item): item is string => Boolean(item));

    if (list.length === 0) return null;

    return (
        <ul className="fqs-bullets">
            {list.map((item) => (
                <li key={item}>{item}</li>
            ))}
        </ul>
    );
}

function BasisItem({ term, children }: { term: string; children: ReactNode }) {
    return (
        <div className="fqs-basis-row">
            <dt>{term}</dt>
            <dd>{children}</dd>
        </div>
    );
}

function ErlangText({ erlang }: { erlang: QueueErlangView }) {
    if (erlang.note) return <>- ({erlang.note})</>;

    return (
        <>
            대기확률 {erlang.wtngProb} / 이론 평균 대기 {erlang.thryWtng} / 부하율 ρ {erlang.load}
        </>
    );
}
