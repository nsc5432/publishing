import { Fragment, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import t1White from '@/assets/svg/t1-white.svg';
import t2White from '@/assets/svg/t2-white.svg';
import t1Blue from '@/assets/svg/t1-blue.svg';
import t2Teal from '@/assets/svg/t2-teal-full.svg';
import { Icon } from '@/components/icons/InlineIcon';
import { GaugeDonut } from './GaugeDonut';
import { TerminalChart } from './TerminalChart';
import { EMPTY_TERMINAL_VIEW } from '../view';
import type { CongestionStatus, DsbdCategory } from '@/types/api.types';
import type { GateData, GateFcltType, TerminalKind, TerminalView } from '../types';

type ViewKind = 'summary' | 'table';

interface TerminalSummaryProps {
    terminal: TerminalKind;
    /** 아직 못 받았으면 null — 골격만 그리고 값은 비운다 */
    data: TerminalView | null;
    /** Prime Time 타일로 고른 지표 — Top Bar 검색으로 조회했으면 null (제목 공란) */
    titleCategory: DsbdCategory | null;
}

/** 터미널별 큰 아이콘 / 워터마크 (터미널 고정, 혼잡도와 무관) */
interface TerminalImages {
    big: string;
    watermark: string;
}

/** 혼잡도 → 패널 색 / 게이지 색 (dashboard.css 의 .panel-blue/-green/-orange/-red) */
interface CongestionTheme {
    panelClass: string;
    gauge: string;
}

/** 제목 앞부분 — 퀵 타일에서 고른 지표를 그대로 문장에 넣는다 ('… 가장 많을 때') */
const TITLE_LEAD: Record<DsbdCategory, string> = {
    PSG: '터미널 여객수가',
    FLT: '운항편이',
    CHKN: '체크인카운터에 대기인원이',
    DEP: '출국장에 대기인원이',
};

/** 게이트 카드 상세(+) 버튼이 여는 화면 */
const GATE_DETAIL_PATH: Record<GateFcltType, string> = {
    CHKN: '/rui/pm/daily-smlt/checkinCounter',
    DEP: '/rui/pm/daily-smlt/departureHall',
};

const TERMINAL_IMAGES: Record<TerminalKind, TerminalImages> = {
    T1: { big: t1White, watermark: t1Blue },
    T2: { big: t2White, watermark: t2Teal },
};

/** FREE=원활(blue) · NORMAL=보통(yellow) · BUSY=혼잡(orange) · VERY_BUSY=매우혼잡(red) */
const CONGESTION_THEMES: Record<CongestionStatus, CongestionTheme> = {
    FREE: { panelClass: 'panel-blue', gauge: '#2f7ff0' },
    NORMAL: { panelClass: 'panel-green', gauge: '#2f7ff0' },
    BUSY: { panelClass: 'panel-orange', gauge: '#e0691c' },
    VERY_BUSY: { panelClass: 'panel-red', gauge: '#d92626' },
};

export function TerminalSummary({ terminal, data, titleCategory }: TerminalSummaryProps) {
    const view = data ?? EMPTY_TERMINAL_VIEW;
    const images = TERMINAL_IMAGES[terminal];
    const theme = CONGESTION_THEMES[view.cgnStatus];
    const navigate = useNavigate();

    const [viewKind, setViewKind] = useState<ViewKind>('summary');
    const [selectedRow, setSelectedRow] = useState(view.defaultSelectedRow);
    const selectedRowRef = useRef<HTMLDivElement>(null);

    // 조회 시각이 바뀌면 그 시각의 행으로 선택을 옮긴다.
    useEffect(() => {
        setSelectedRow(view.defaultSelectedRow);
    }, [view.defaultSelectedRow]);

    // 표 보기는 행이 넘치면 스크롤된다 — 숨어 있는 동안은 no-op 이라 전환 시점에 다시 맞춘다.
    useEffect(() => {
        if (viewKind === 'table') selectedRowRef.current?.scrollIntoView({ block: 'nearest' });
    }, [viewKind, selectedRow]);

    return (
        <section className={`panel ${theme.panelClass}`}>
            <div className="p-top">
                <div className="p-iconbox">
                    <img className="tbig" alt="terminal" src={images.big} />
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
                    <div className="chart-bg" style={{ backgroundImage: `url("${images.watermark}")` }} />
                    <div className="legend">
                        <span>
                            <i style={{ background: '#f43f3f' }} />
                            Cast 대기인원(예측)
                        </span>
                        <span>
                            <i style={{ background: '#3b82f6' }} />
                            Xovis 대기인원(실적)
                        </span>
                    </div>
                    <TerminalChart rsltList={view.chart.rsltList} />
                </div>
            </div>

            <div className="p-title-row">
                {titleCategory && (
                    <div className="p-title">
                        <span className="p-title-in">
                            <span className="p-title-txt">{TITLE_LEAD[titleCategory]} 가장 많을 때</span>
                        </span>
                    </div>
                )}
                <div className="p-bar">
                    <span className="p-bar-txt">{view.barText}</span>
                    <button
                        type="button"
                        className={`p-switch${viewKind === 'summary' ? ' on' : ''}`}
                        aria-pressed={viewKind === 'summary'}
                        onClick={() => setViewKind(viewKind === 'summary' ? 'table' : 'summary')}
                    >
                        <i aria-hidden="true" />
                        <span>{viewKind === 'summary' ? '요약' : '상세'}</span>
                    </button>
                </div>
            </div>

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
                            {view.summaryInfo.map((cell, cellIndex) => (
                                <Fragment key={cell.label}>
                                    {cellIndex > 0 && <span className="sep">/</span>}
                                    <div className="cell">
                                        <div className="k">
                                            <Multiline text={cell.label} />
                                        </div>
                                        <div className="val">
                                            <b>{cell.value}</b>
                                            <span className="u">{cell.unit}</span>
                                        </div>
                                    </div>
                                </Fragment>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="gates">
                    {view.gates.map((gate) => (
                        <Gate key={gate.fcltType} data={gate} gauge={theme.gauge} onDetail={() => navigate(GATE_DETAIL_PATH[gate.fcltType])} />
                    ))}
                </div>
            </div>

            <div className="view" hidden={viewKind !== 'table'}>
                <div className="table scroll-area">
                    <div className="thead">
                        <div>시간대</div>
                        <div>승객수</div>
                        <div>대기시간</div>
                        <div>처리시간</div>
                        <div>비율(%)</div>
                    </div>
                    {view.tableRows.map((row, rowIndex) => (
                        <div
                            key={row.time}
                            ref={rowIndex === selectedRow ? selectedRowRef : undefined}
                            className={`trow${rowIndex === selectedRow ? ' sel' : ''}`}
                            onClick={() => setSelectedRow(rowIndex)}
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

function Multiline({ text }: { text: string }) {
    return (
        <>
            {text.split('\n').map((line, lineIndex) => (
                <span key={lineIndex}>
                    {lineIndex > 0 && <br />}
                    {line}
                </span>
            ))}
        </>
    );
}

function Gate({ data, gauge, onDetail }: { data: GateData; gauge: string; onDetail: () => void }) {
    const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
    const variantIndex = Math.max(
        0,
        data.variants.findIndex((gateVariant) => gateVariant.unitCd === selectedUnit),
    );
    const variant = data.variants[variantIndex];

    const cycleVariant = (direction: number) => {
        const nextIndex = (variantIndex + direction + data.variants.length) % data.variants.length;
        setSelectedUnit(data.variants[nextIndex].unitCd);
    };

    if (!variant) return null;

    return (
        <div className="gate">
            <div className="gate-head">
                <b>{data.title}</b>
                <div className="warn">
                    <span>{data.warn}</span>
                    <button type="button" className="plus" aria-label={`${data.title} 상세`} onClick={onDetail}>
                        <Icon name="plus" />
                    </button>
                </div>
            </div>
            <div className="gate-mid">
                <div className="isl">{variant.island ?? ' '}</div>
                <div className="num">{variant.num}</div>
                <div className="meta">
                    {variant.meta.map((metaCell) => (
                        <span key={metaCell.label}>
                            {metaCell.label} <b className={metaCell.accent ? 'acc' : undefined}>{metaCell.value}</b>
                        </span>
                    ))}
                </div>
            </div>
            <div className="gauge-row">
                <div className="gauge">
                    <div className="k">시간당 처리율</div>
                    <GaugeDonut
                        value={variant.processRate.value}
                        centerText={variant.processRate.centerText}
                        captionText={variant.processRate.captionText}
                        accentColor={gauge}
                    />
                </div>
                <div className="rec">
                    <div className="tag">{variant.recommend.tag}</div>
                    <div className="name">{variant.recommend.name}</div>
                    <div className="cnt">
                        {variant.recommend.count}
                        <small>개</small>
                    </div>
                    <div className={`cap${variant.recommend.countNoteAccent ? ' u' : ''}`}>{variant.recommend.countNote}</div>
                </div>
                <div className="gauge">
                    <div className="k">혼잡해소 예상</div>
                    <GaugeDonut
                        value={variant.clearTime.value}
                        centerText={variant.clearTime.centerText}
                        captionText={variant.clearTime.captionText}
                        accentColor={gauge}
                    />
                </div>
            </div>
            <div className="chips">
                {data.chips.map((chip) => (
                    <button
                        type="button"
                        key={chip.label}
                        className={`chip ${chip.kind}${chip.label === variant.unitCd ? ' sel' : ''}`}
                        aria-pressed={chip.label === variant.unitCd}
                        disabled={!data.variants.some((gateVariant) => gateVariant.unitCd === chip.label)}
                        onClick={() => setSelectedUnit(chip.label)}
                    >
                        {chip.label}
                    </button>
                ))}
            </div>
            <button type="button" className="gate-arrow prev" onClick={() => cycleVariant(-1)}>
                <Icon name="chevL" />
            </button>
            <button type="button" className="gate-arrow next" onClick={() => cycleVariant(1)}>
                <Icon name="chevR" />
            </button>
        </div>
    );
}
