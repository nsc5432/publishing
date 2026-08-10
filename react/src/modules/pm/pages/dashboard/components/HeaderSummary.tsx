import { type ReactNode } from 'react';
import t1Blue from '@/assets/svg/t1-blue.svg';
import t2Teal from '@/assets/svg/t2-teal-full.svg';
import { QuickCheckinIcon, QuickFlightIcon, QuickGateIcon, QuickPaxIcon } from '@/components/icons';
import type { DowAttrDto, DsbdCategory, DsbdHeaderDto, TmnlId } from '@/types/api.types';
import { formatCount, formatHhmm } from '../format';
import { HourlyPsgChart } from './HourlyPsgChart';
import { Icon } from './PmIcons';

/** 값을 아직 못 받았을 때 표기 */
const EMPTY = '-';

/** 요일 속성 — 주중 → 주말 전일 → 주말 순으로 두고 현재 값만 강조한다 */
const DOW_STEPS: { type: DowAttrDto['dowType']; label: string }[] = [
    { type: 'WEEKDAY', label: '주중' },
    { type: 'PRE_WEEKEND', label: '주말 전일' },
    { type: 'WEEKEND', label: '주말' },
];

/** 특이점 — 서버가 내려준 문구와 같은 것만 강조한다 */
const SPECIAL_NOTES = ['하계 전일', '하계', '추석 전일', '추석', '공휴'];

/** 퀵 타일 = 조회 대상 지표 */
const QUICK_TILES: { category: DsbdCategory; label: string; Icon: typeof QuickPaxIcon }[] = [
    { category: 'PSG', label: '터미널 여객수', Icon: QuickPaxIcon },
    { category: 'FLT', label: '운항편', Icon: QuickFlightIcon },
    { category: 'CHKN', label: '체크인카운터', Icon: QuickCheckinIcon },
    { category: 'DEP', label: '출국장', Icon: QuickGateIcon },
];

interface HeaderSummaryProps {
    planDate: string;
    header: DsbdHeaderDto | null;
    /** 퀵 타일 선택 — 터미널 패널의 시간대별 결과가 이 값을 따른다 */
    category: DsbdCategory;
    onCategoryChange: (category: DsbdCategory) => void;
    children: ReactNode;
}

/**
 * 상단 요약 카드 행 + 하단 슬롯으로 이루어진 본문.
 */
export function HeaderSummary({
    planDate,
    header,
    category,
    onCategoryChange,
    children,
}: HeaderSummaryProps) {
    const plan = header?.fltPlan;
    const weather = header?.weather;
    const dowAttr = header?.dowAttr;

    const hourlyOf = (tmnlId: TmnlId) =>
        header?.hourlyPsgList.find((item) => item.tmnlId === tmnlId) ?? null;
    const t1Hourly = hourlyOf('T1');
    const t2Hourly = hourlyOf('T2');

    // 도착 여객은 따로 내려오지 않는다. 총계에서 출발분을 뺀 값으로 본다.
    const arrPsgCnt = plan ? Math.max(0, plan.totPsgCnt - plan.depPsgCnt) : 0;
    const count = (value: number | undefined) => (value === undefined ? EMPTY : formatCount(value));

    return (
        <div className="body">
            <main className="main">
                <section className="row row--top">
                    {/* 일일 운항계획 */}
                    <div className="card c-plan">
                        <div className="card-head">
                            <span className="card-title">일일 운항계획</span>
                            <span className="card-date">{planDate}</span>
                        </div>
                        <div className="plan-body">
                            <div className="plan-icons">
                                <span className="ic">
                                    <Icon name="plane" className="i-blue i-plane-lg" />
                                </span>
                                <span className="ic">
                                    <Icon name="people" className="i-teal i-people-lg" />
                                </span>
                            </div>
                            {/* 운항편 / 총 여객 합계는 두 행을 아우르는 한 박스로 강조 */}
                            <div className="plan-total">
                                <div className="cell">
                                    <div className="k">운항편</div>
                                    <div>
                                        <span className="v blue">{count(plan?.totFltCnt)}</span>
                                        <span className="u">편</span>
                                    </div>
                                </div>
                                <div className="cell">
                                    <div className="k">총 여객</div>
                                    <div>
                                        <span className="v teal">{count(plan?.totPsgCnt)}</span>
                                        <span className="u">명</span>
                                    </div>
                                </div>
                            </div>
                            <div className="plan-cols">
                                <div className="stat-cells">
                                    <div>
                                        <div className="k">출발</div>
                                        <div className="v">{count(plan?.depFltCnt)}</div>
                                    </div>
                                    <div>
                                        <div className="k">도착</div>
                                        <div className="v">{count(plan?.arrFltCnt)}</div>
                                    </div>
                                </div>
                                <div className="stat-cells">
                                    <div>
                                        <div className="k">출발</div>
                                        <div className="v">{count(plan?.depPsgCnt)}</div>
                                    </div>
                                    <div>
                                        <div className="k">도착</div>
                                        <div className="v">{plan ? formatCount(arrPsgCnt) : EMPTY}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 시간대별 출발여객 */}
                    <div className="card c-hourly">
                        <div className="card-head">
                            <span className="card-title">시간대별 출발여객</span>
                            <span className="tval">
                                <span className="t1c">T1</span> {count(t1Hourly?.totPsgCnt)}{' '}
                                <span className="t2c">T2</span> {count(t2Hourly?.totPsgCnt)}
                            </span>
                        </div>
                        <div className="hourly-body">
                            <HourlyPsgChart
                                data={t1Hourly}
                                iconSrc={t1Blue}
                                iconAlt="T1"
                                lineColor="#6fd6c4"
                            />
                            <HourlyPsgChart
                                data={t2Hourly}
                                iconSrc={t2Teal}
                                iconAlt="T2"
                                lineColor="#7cb6f5"
                            />
                        </div>
                    </div>

                    {/* 요일 속성 */}
                    <div className="card c-dow">
                        <div className="card-head">
                            <span className="card-title">요일 속성</span>
                        </div>
                        {/* 전/현재/다음 요일 속성을 한 줄에 두고 현재 값만 강조 */}
                        <div className="dow-val">
                            <span className="dow-ic">
                                <Icon name="calendar" />
                            </span>
                            {DOW_STEPS.map((step) => {
                                const on = dowAttr?.dowType === step.type;
                                return (
                                    <span key={step.type} className={on ? 'on' : 'off'}>
                                        {/* 현재 값은 서버 문구를 쓴다 (요일까지 붙어 내려온다) */}
                                        {on ? dowAttr.dowNm : step.label}
                                    </span>
                                );
                            })}
                        </div>
                        <div className="card-foot">
                            <span className="tag-chip">특이점</span>
                            <span className="dow-tags">
                                {SPECIAL_NOTES.map((note) => (
                                    <span
                                        key={note}
                                        className={dowAttr?.spclNote === note ? 'on' : 'off'}
                                    >
                                        {note}
                                    </span>
                                ))}
                            </span>
                        </div>
                    </div>

                    {/* 기상정보 */}
                    <div className="card c-wx">
                        <div className="card-head">
                            <span className="card-title">기상정보</span>
                        </div>
                        <div className="wx-row">
                            {/* 아이콘 세트에 날씨 글리프가 하나뿐이라 wthrCd 별 구분은 아직 없다 */}
                            <span className="wx-ic">
                                <Icon name="weather" />
                            </span>
                            <div className="wx-temp">
                                {weather ? weather.tmpr : EMPTY}
                                <small>°C</small>
                            </div>
                        </div>
                        <div className="wx-sub">
                            <span>
                                강수량 <b>{weather ? weather.rainAmt : EMPTY}</b>mm
                            </span>
                            <span>
                                적설 <b>{weather ? weather.snowAmt : EMPTY}</b>mm
                            </span>
                        </div>
                        <div className="card-foot">
                            <span className="tag-chip">저시정</span>
                            <span className="wx-foot-r">
                                1단계 <b>{formatHhmm(weather?.lowVisStep1Time ?? '')}</b>
                                <br />
                                2단계 <b>{formatHhmm(weather?.lowVisStep2Time ?? '')}</b>
                            </span>
                        </div>
                    </div>
                    <div className="quick c-quick">
                        <div className="quick-title">PRIME TIME</div>
                        <div className="quick-grid">
                            {QUICK_TILES.map((tile) => (
                                <button
                                    key={tile.category}
                                    type="button"
                                    className={`qtile${category === tile.category ? ' active' : ''}`}
                                    aria-pressed={category === tile.category}
                                    onClick={() => onCategoryChange(tile.category)}
                                >
                                    <tile.Icon aria-hidden="true" />
                                    <span>{tile.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {children}
            </main>
        </div>
    );
}
