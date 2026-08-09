import { Fragment, useId, useState } from 'react';
import t1White from '@/assets/svg/t1-white.svg';
import t2White from '@/assets/svg/t2-white.svg';
import t1Blue from '@/assets/svg/t1-blue.svg';
import t2Teal from '@/assets/svg/t2-teal-full.svg';
import { Icon } from './PmIcons';
import { DEFAULT_TERMINAL_VIEW, TERMINALS, type GateData } from '../mock';
import type { TerminalKind } from '../types';

interface TerminalSummaryProps {
    terminal: TerminalKind;
}

type ViewKind = 'summary' | 'table';

/** 터미널별 큰 아이콘 / 워터마크 (에셋은 컴포넌트에서 매핑) */
const ASSETS: Record<TerminalKind, { big: string; watermark: string }> = {
    T1: { big: t1White, watermark: t1Blue },
    T2: { big: t2White, watermark: t2Teal },
};

/* 원본 buildDots: polyline points 각 좌표에 점(circle)을 찍는다. */
const LN_R_POINTS =
    '44,151 60,151 76,151 92,151 108,146 124,138 140,124 156,110 172,90 188,66 204,52 220,26 236,50 252,66 268,80 284,52 300,68 316,88 332,104 348,120 364,138 380,148 396,150 412,151';
const LN_B_POINTS =
    '44,153 60,153 76,153 92,153 108,148 124,140 140,127 156,113 172,94 188,71 204,58 220,32 236,56 252,71 268,85 284,58 300,73 316,93 332,108 348,124 364,141 380,150 396,152 412,153';

function Dots({ points, fill }: { points: string; fill: string }) {
    return (
        <g fill={fill}>
            {points
                .trim()
                .split(/\s+/)
                .map((p, i) => {
                    const [cx, cy] = p.split(',');
                    return <circle key={i} cx={cx} cy={cy} r="2.7" />;
                })}
        </g>
    );
}

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
    const v = data.variants[idx];
    const cycle = (d: number) => {
        setIdx((i) => (i + d + data.variants.length) % data.variants.length);
        setSelectedChip(null);
    };

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
                <div className="isl">{v.isl ?? ' '}</div>
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
                        key={i}
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

export function TerminalSummary({ terminal }: TerminalSummaryProps) {
    const data = TERMINALS[terminal];
    const asset = ASSETS[terminal];
    const gid = useId();

    const [view, setView] = useState<ViewKind>(DEFAULT_TERMINAL_VIEW[terminal]);
    const [selectedRow, setSelectedRow] = useState(data.defaultSelectedRow);

    return (
        <section className={`panel ${data.cls}`}>
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
                                    <span className="v">{data.stats.boardingRate}</span>
                                    <span className="u">%</span>
                                </div>
                            </div>
                            <div className="p-stat-lines">
                                <div className="p-line">
                                    <span className="p-big">{data.stats.flights.value}</span>
                                    <span className="p-u">편</span>
                                    <span className="p-delta">{data.stats.flights.delta}</span>
                                </div>
                                <div className="p-line">
                                    <span className="p-big">{data.stats.pax.value}</span>
                                    <span className="p-u">명</span>
                                    <span className="p-delta">{data.stats.pax.delta}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-peak">
                        <div className="peak-title">피크시간</div>
                        <div className="peak-body">
                            <div className="peak-badge">
                                <div className="k">{data.peak.ampm}</div>
                                <div className="v">{data.peak.time}</div>
                            </div>
                            <div className="peak-cells">
                                <div className="cell">
                                    <div className="k">대기인원</div>
                                    <div>
                                        <b>{data.peak.totalWait}</b>
                                        <span className="u">명</span>
                                    </div>
                                </div>
                                <div className="cell">
                                    <div className="k">대기시간</div>
                                    <div>
                                        <b>{data.peak.maxWait}</b>
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
                                        <b>{data.peak.hourlyProcess}</b>
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
                    <svg viewBox="0 0 430 190" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0" stopColor="#ff8f8f" />
                                <stop offset=".45" stopColor="#ff1a1a" />
                                <stop offset="1" stopColor="#ffa3a3" />
                            </linearGradient>
                        </defs>
                        <g stroke="#eceff5" strokeWidth="1">
                            <line x1="36" y1="26" x2="424" y2="26" />
                            <line x1="36" y1="51" x2="424" y2="51" />
                            <line x1="36" y1="76" x2="424" y2="76" />
                            <line x1="36" y1="101" x2="424" y2="101" />
                            <line x1="36" y1="126" x2="424" y2="126" />
                            <line x1="36" y1="151" x2="424" y2="151" />
                        </g>
                        <g
                            fontSize="11"
                            fill="#9aa3b2"
                            textAnchor="end"
                            fontFamily="Pretendard, sans-serif"
                        >
                            <text x="28" y="30">
                                30
                            </text>
                            <text x="28" y="55">
                                25
                            </text>
                            <text x="28" y="80">
                                20
                            </text>
                            <text x="28" y="105">
                                15
                            </text>
                            <text x="28" y="130">
                                10
                            </text>
                            <text x="28" y="155">
                                5
                            </text>
                            <text x="28" y="180">
                                0
                            </text>
                        </g>
                        <rect
                            className="peakbar"
                            x="211"
                            y="26"
                            width="19"
                            height="125"
                            fill={`url(#${gid})`}
                        />
                        <polyline
                            className="ln-r"
                            points={LN_R_POINTS}
                            fill="none"
                            stroke="#f43f3f"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                        />
                        <polyline
                            className="ln-b"
                            points={LN_B_POINTS}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                            strokeLinejoin="round"
                        />
                        <Dots points={LN_B_POINTS} fill="#3b82f6" />
                        <Dots points={LN_R_POINTS} fill="#f43f3f" />
                        <g
                            fontSize="11"
                            fill="#9aa3b2"
                            textAnchor="middle"
                            fontFamily="Pretendard, sans-serif"
                        >
                            <text x="44" y="172">
                                0H
                            </text>
                            <text x="92" y="172">
                                3H
                            </text>
                            <text x="140" y="172">
                                6H
                            </text>
                            <text x="188" y="172">
                                9H
                            </text>
                            <text x="236" y="172">
                                12H
                            </text>
                            <text x="284" y="172">
                                15H
                            </text>
                            <text x="332" y="172">
                                18H
                            </text>
                            <text x="380" y="172">
                                21H
                            </text>
                            <text x="418" y="172">
                                23H
                            </text>
                        </g>
                    </svg>
                </div>
            </div>

            {/* 제목 박스와 기준시각 바를 한 줄로 두고, 뷰 전환 스위치는 바 안에 넣는다 */}
            <div className="p-title-row">
                <div className="p-title">
                    터미널에 여객수가 <em>가장 많을 때</em>
                </div>
                <div className="p-bar">
                    <span className="p-bar-txt">{data.barText}</span>
                    <button
                        type="button"
                        className={`p-switch${view === 'summary' ? ' on' : ''}`}
                        aria-pressed={view === 'summary'}
                        onClick={() => setView(view === 'summary' ? 'table' : 'summary')}
                    >
                        <i aria-hidden="true" />
                        요약
                    </button>
                </div>
            </div>

            {/* summary view */}
            <div className="view" hidden={view !== 'summary'}>
                <div className="sum-top">
                    <div className="sum-two">
                        {data.summaryStats.map((stat) => (
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
                            {data.summaryInfo.map((cell, i) => (
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
                    {data.gates.map((gate) => (
                        <Gate key={gate.title} data={gate} gauge={data.gauge} />
                    ))}
                </div>
            </div>

            {/* table view */}
            <div className="view" hidden={view !== 'table'}>
                <div className="table">
                    <div className="thead">
                        <div>시간대</div>
                        <div>승객수</div>
                        <div>대기시간</div>
                        <div>처리시간</div>
                        <div>비율(%)</div>
                    </div>
                    {data.tableRows.map((row, i) => (
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
