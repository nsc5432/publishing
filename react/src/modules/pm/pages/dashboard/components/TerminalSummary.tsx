import { Fragment, useEffect, useState } from 'react';
import t1White from '@/assets/svg/t1-white.svg';
import t2White from '@/assets/svg/t2-white.svg';
import t1Blue from '@/assets/svg/t1-blue.svg';
import t2Teal from '@/assets/svg/t2-teal-full.svg';
import { Icon } from './PmIcons';
import { TerminalChart } from './TerminalChart';
import { EMPTY_TERMINAL_VIEW } from '../view';
import type { GateData, TerminalKind, TerminalView } from '../types';

interface TerminalSummaryProps {
    terminal: TerminalKind;
    /** 아직 못 받았으면 null — 골격만 그리고 값은 비운다 */
    data: TerminalView | null;
}

type ViewKind = 'summary' | 'table';

/** 터미널별 큰 아이콘 / 워터마크 / 패널 색 (서버 값이 아니라 화면 규칙) */
const ASSETS: Record<TerminalKind, { big: string; watermark: string; cls: string; gauge: string }> =
    {
        T1: { big: t1White, watermark: t1Blue, cls: 'panel-blue', gauge: '#2f7ff0' },
        T2: { big: t2White, watermark: t2Teal, cls: 'panel-green', gauge: '#2f7ff0' },
    };

/** 터미널별 최초 뷰 (T1=요약, T2=출국장 테이블) */
const DEFAULT_VIEW: Record<TerminalKind, ViewKind> = {
    T1: 'summary',
    T2: 'table',
};

/* 원본 buildDonut: 반지름 30, 84% 아크의 도넛 게이지. */
function Donut({
    value,
    main,
    sub,
    acc,
}: {
    value: number;
    main: string;
    sub: string;
    acc: string;
}) {
    const r = 30;
    const C = 2 * Math.PI * r;
    const len = C * 0.84;
    return (
        <div className="donut">
            <svg viewBox="0 0 74 74">
                <g transform="rotate(119 37 37)">
                    <circle
                        cx="37"
                        cy="37"
                        r={r}
                        fill="none"
                        stroke="#e7ebf2"
                        strokeWidth="3.4"
                        strokeDasharray={`${len.toFixed(1)} ${C.toFixed(1)}`}
                        strokeLinecap="round"
                    />
                    <circle
                        cx="37"
                        cy="37"
                        r={r}
                        fill="none"
                        stroke={acc}
                        strokeWidth="3.4"
                        strokeDasharray={`${(len * value).toFixed(1)} ${C.toFixed(1)}`}
                        strokeLinecap="round"
                    />
                </g>
                <text
                    x="37"
                    y="37.5"
                    textAnchor="middle"
                    fontSize="16"
                    fontWeight="700"
                    fill="#23272f"
                    fontFamily="Pretendard, sans-serif"
                >
                    {main}
                </text>
                <text
                    x="37"
                    y="50"
                    textAnchor="middle"
                    fontSize="10"
                    fill="#8a93a3"
                    fontFamily="Pretendard, sans-serif"
                >
                    {sub}
                </text>
            </svg>
        </div>
    );
}

/** '대기\n인원수' 처럼 \n 이 포함된 라벨을 <br/> 로 렌더. */
function Multiline({ text }: { text: string }) {
    return (
        <>
            {text.split('\n').map((line, i) => (
                <span key={i}>
                    {i > 0 && <br />}
                    {line}
                </span>
            ))}
        </>
    );
}

/** 체크인카운터 / 출국장 게이트 카드. 좌우 화살표로 아일랜드/게이트를 순환한다. */
function Gate({ data, gauge }: { data: GateData; gauge: string }) {
    const [idx, setIdx] = useState(0);
    // 하단 칩(카운터/게이트) 선택 상태 — 버튼으로 동작하도록 (요구사항 2)
    const [selectedChip, setSelectedChip] = useState<number | null>(null);

    // 조회를 다시 하면 카드 수가 달라질 수 있어 현재 위치를 범위 안으로 눌러 둔다.
    const v = data.variants[Math.min(idx, data.variants.length - 1)];

    const cycle = (d: number) => {
        setIdx((i) => (i + d + data.variants.length) % data.variants.length);
        setSelectedChip(null);
    };

    if (!v) return null;

    return (
        <div className="gate">
            <div className="gate-head">
                <b>{data.title}</b>
                <div className="warn">
                    <span>{data.warn}</span>
                    <button type="button" className="plus" aria-label={`${data.title} 상세`}>
                        <Icon name="plus" />
                    </button>
                </div>
            </div>
            <div className="gate-mid">
                <div className="isl">{v.isl ?? ' '}</div>
                <div className="num">
                    {v.num}
                    {v.numSmall && <small>{v.numSmall}</small>}
                </div>
                <div className="meta">
                    {v.meta.map((m) => (
                        <span key={m.k}>
                            {m.k} <b className={m.acc ? 'acc' : undefined}>{m.v}</b>
                        </span>
                    ))}
                </div>
            </div>
            <div className="gauge-row">
                <div className="gauge">
                    <div className="k">시간당 처리율</div>
                    <Donut
                        value={v.processRate.value}
                        main={v.processRate.main}
                        sub={v.processRate.sub}
                        acc={gauge}
                    />
                </div>
                <div className="rec">
                    <div className="tag">{v.rec.tag}</div>
                    <div className="name">{v.rec.name}</div>
                    <div className="cnt">
                        {v.rec.cnt}
                        <small>개</small>
                    </div>
                    <div className={`cap${v.rec.capAccent ? ' u' : ''}`}>{v.rec.cap}</div>
                </div>
                <div className="gauge">
                    <div className="k">혼잡해소 예상</div>
                    <Donut
                        value={v.clearTime.value}
                        main={v.clearTime.main}
                        sub={v.clearTime.sub}
                        acc={gauge}
                    />
                </div>
            </div>
            <div className="chips">
                {v.chips.map((c, i) => (
                    <button
                        type="button"
                        key={c.label}
                        className={`chip ${c.kind}${i === selectedChip ? ' sel' : ''}`}
                        aria-pressed={i === selectedChip}
                        onClick={() => setSelectedChip((s) => (s === i ? null : i))}
                    >
                        {c.label}
                    </button>
                ))}
            </div>
            <button type="button" className="gate-arrow prev" onClick={() => cycle(-1)}>
                <Icon name="chevL" />
            </button>
            <button type="button" className="gate-arrow next" onClick={() => cycle(1)}>
                <Icon name="chevR" />
            </button>
        </div>
    );
}

export function TerminalSummary({ terminal, data }: TerminalSummaryProps) {
    const view = data ?? EMPTY_TERMINAL_VIEW;
    const asset = ASSETS[terminal];

    const [viewKind, setViewKind] = useState<ViewKind>(DEFAULT_VIEW[terminal]);
    const [selectedRow, setSelectedRow] = useState(view.defaultSelectedRow);

    // 조회 시각이 바뀌면 그 시각의 행으로 선택을 옮긴다.
    useEffect(() => {
        setSelectedRow(view.defaultSelectedRow);
    }, [view.defaultSelectedRow]);

    return (
        <section className={`panel ${asset.cls}`}>
            <div className="p-top">
                <div className="p-iconbox">
                    <img className="tbig" alt="terminal" src={asset.big} />
                </div>
                <div className="p-mid">
                    <div className="p-stats">
                        <div className="p-note">* 지난주 同요일 대비</div>
                        <div className="p-stat-main">
                            <div className="p-stat-icons">
                                <Icon name="plane" className="i-blue i-26" />
                                <Icon name="people" className="i-teal i-26" />
                            </div>
                            <div className="board">
                                <div className="k">탑승률</div>
                                <div>
                                    <span className="v">{view.stats.boardingRate}</span>
                                    <span className="u">%</span>
                                </div>
                            </div>
                            <div className="p-stat-lines">
                                <div className="p-line">
                                    <span className="p-big">{view.stats.flights.value}</span>
                                    <span className="p-u">편</span>
                                    <span className="p-delta">{view.stats.flights.delta}</span>
                                </div>
                                <div className="p-line">
                                    <span className="p-big">{view.stats.pax.value}</span>
                                    <span className="p-u">명</span>
                                    <span className="p-delta">{view.stats.pax.delta}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-peak">
                        <div className="peak-title">피크시간</div>
                        <div className="peak-body">
                            <div className="peak-badge">
                                <div className="k">{view.peak.ampm}</div>
                                <div className="v">{view.peak.time}</div>
                            </div>
                            <div className="peak-cells">
                                <div className="cell">
                                    <div className="k">대기인원</div>
                                    <div>
                                        <b>{view.peak.totalWait}</b>
                                        <span className="u">명</span>
                                    </div>
                                </div>
                                <div className="cell">
                                    <div className="k">대기시간</div>
                                    <div>
                                        <b>{view.peak.maxWait}</b>
                                        <span className="u">분</span>
                                    </div>
                                </div>
                                <div className="cell">
                                    <div className="k">
                                        시간당
                                        <br />
                                        처리인원
                                    </div>
                                    <div>
                                        <b>{view.peak.hourlyProcess}</b>
                                        <span className="u">명</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="chartbox">
                    <div
                        className="chart-bg"
                        style={{ backgroundImage: `url("${asset.watermark}")` }}
                    />
                    <div className="legend">
                        <span>
                            <i style={{ background: '#f43f3f' }} />
                            예측
                        </span>
                        <span>
                            <i style={{ background: '#3b82f6' }} />
                            실적
                        </span>
                    </div>
                    <TerminalChart
                        rsltList={view.chart.rsltList}
                        peakIndex={view.chart.peakIndex}
                    />
                </div>
            </div>

            {/* 제목 박스와 기준시각 바를 한 줄로 두고, 뷰 전환 스위치는 바 안에 넣는다 */}
            <div className="p-title-row">
                <div className="p-title">
                    터미널에 여객수가 <em>가장 많을 때</em>
                </div>
                <div className="p-bar">
                    <span className="p-bar-txt">{view.barText}</span>
                    <button
                        type="button"
                        className={`p-switch${viewKind === 'summary' ? ' on' : ''}`}
                        aria-pressed={viewKind === 'summary'}
                        onClick={() => setViewKind(viewKind === 'summary' ? 'table' : 'summary')}
                    >
                        <i aria-hidden="true" />
                        요약
                    </button>
                </div>
            </div>

            {/* summary view */}
            <div className="view" hidden={viewKind !== 'summary'}>
                <div className="sum-top">
                    <div className="sum-two">
                        {view.summaryStats.map((stat) => (
                            <div className="sum-cell" key={stat.unit}>
                                <Icon name={stat.icon} className={stat.iconClass} />
                                <div className="val">
                                    <span className="big">{stat.value}</span>
                                    <span className="u">{stat.unit}</span>
                                </div>
                                <div className="sub">
                                    {stat.deltaLabel} <span className="danger">{stat.delta}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="sum-info">
                        <div className="lbl">
                            요약
                            <br />
                            정보
                        </div>
                        <div className="cells">
                            {view.summaryInfo.map((cell, i) => (
                                <Fragment key={cell.k}>
                                    {i > 0 && <span className="sep">/</span>}
                                    <div className="cell">
                                        <div className="k">
                                            <Multiline text={cell.k} />
                                        </div>
                                        <div className="val">
                                            <b>{cell.v}</b>
                                            <span className="u">{cell.u}</span>
                                        </div>
                                    </div>
                                </Fragment>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="gates">
                    {view.gates.map((gate) => (
                        <Gate key={gate.title} data={gate} gauge={asset.gauge} />
                    ))}
                </div>
            </div>

            {/* table view */}
            <div className="view" hidden={viewKind !== 'table'}>
                <div className="table">
                    <div className="thead">
                        <div>시간대</div>
                        <div>승객수</div>
                        <div>대기시간</div>
                        <div>처리시간</div>
                        <div>비율(%)</div>
                    </div>
                    {view.tableRows.map((row, i) => (
                        <div
                            key={row.time}
                            className={`trow${i === selectedRow ? ' sel' : ''}`}
                            onClick={() => setSelectedRow(i)}
                        >
                            <div>{row.time}</div>
                            <div>{row.pax}</div>
                            <div className="w">{row.wait}</div>
                            <div className="w">{row.process}</div>
                            <div>{row.ratio}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
