import './HeaderInfoCards.css';
import t1Blue from '@/assets/svg/t1-blue.svg';
import t2Teal from '@/assets/svg/t2-teal-full.svg';
import type { DowAttrDto, DsbdHeaderDto, TmnlId } from '@/types/api.types';
import { formatCount } from '@/lib/format';
import { HourlyPsgChart } from './HourlyPsgChart';
import { Icon, type IconName } from '@/components/icons/InlineIcon';

interface HeaderInfoCardsProps {
    planDate: string;
    header: DsbdHeaderDto | null;
}

const EMPTY = '-';
const DOW_STEPS: { type: DowAttrDto['dowType']; label: string }[] = [
    { type: 'WEEKDAY', label: '주중' },
    { type: 'PRE_WEEKEND', label: '주말 전일' },
    { type: 'WEEKEND', label: '주말' },
];

const SPECIAL_NOTES = ['하계 전일', '하계', '추석 전일', '추석', '공휴'];

const weatherIconName = (wthrCn: string | undefined): IconName => {
    if (!wthrCn) return 'wxClear';
    if (wthrCn.includes('눈')) return 'wxSnow';
    if (wthrCn.includes('비')) return 'wxRain';
    if (wthrCn.includes('강풍') || wthrCn.includes('바람')) return 'wxWind';
    if (wthrCn.includes('흐') || wthrCn.includes('구름')) return 'wxCloudy';
    return 'wxClear';
};

/**
 * 대시보드/사용자 시뮬레이션 두 화면이 같이 사용
 */
export function HeaderInfoCards({ planDate, header }: HeaderInfoCardsProps) {
    const plan = header?.fltPlan;
    const weather = header?.weather;
    const dowAttr = header?.dowAttr;

    const findHourlyByTerminal = (tmnlId: TmnlId) => header?.hourlyPsgList.find((item) => item.tmnlId === tmnlId) ?? null;
    const t1Hourly = findHourlyByTerminal('T1');
    const t2Hourly = findHourlyByTerminal('T2');

    const arrPsgCnt = plan ? Math.max(0, plan.totPsgCnt - plan.depPsgCnt) : 0;
    const countText = (value: number | undefined) => (value === undefined ? EMPTY : formatCount(value));

    return (
        <div className="header-info-cards">
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
                                <span className="v">{countText(plan?.totFltCnt)}</span>
                                <span className="u">편</span>
                            </div>
                        </div>
                        <div className="cell">
                            <div className="k">총 여객</div>
                            <div>
                                <span className="v">{countText(plan?.totPsgCnt)}</span>
                                <span className="u">명</span>
                            </div>
                        </div>
                    </div>
                    {/* 여객 행은 6자리(천단위 구분 포함)까지 들어오므로 운항편 행과 글자 크기를 나눈다 */}
                    <div className="plan-cols">
                        <div className="stat-cells stat-flt">
                            <div>
                                <div className="k">출발</div>
                                <div className="v">{countText(plan?.depFltCnt)}</div>
                            </div>
                            <div>
                                <div className="k">도착</div>
                                <div className="v">{countText(plan?.arrFltCnt)}</div>
                            </div>
                        </div>
                        <div className="stat-cells stat-psg">
                            <div>
                                <div className="k">출발</div>
                                <div className="v">{countText(plan?.depPsgCnt)}</div>
                            </div>
                            <div>
                                <div className="k">도착</div>
                                <div className="v">{plan ? formatCount(arrPsgCnt) : EMPTY}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 승객예고/실적 비교 */}
            <div className="card c-hourly">
                <div className="card-head">
                    <span className="card-title">승객예고/실적 비교</span>
                    {/* 범례 — 막대가 예고, 꺾은선이 실적 */}
                    <span className="hourly-legend">
                        <span className="lg lg-fcst">예고</span>
                        <span className="lg lg-rslt">실적</span>
                    </span>
                </div>
                <div className="hourly-body">
                    <HourlyPsgChart data={t1Hourly} iconSrc={t1Blue} iconAlt="T1" lineColor="#1c6ff0" />
                    <HourlyPsgChart data={t2Hourly} iconSrc={t2Teal} iconAlt="T2" lineColor="#00b3ab" />
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
                        const isCurrentDow = dowAttr?.dowType === step.type;
                        return (
                            <span key={step.type} className={isCurrentDow ? 'on' : 'off'}>
                                {/* 현재 값은 서버 문구를 쓴다 (요일까지 붙어 내려온다) */}
                                {isCurrentDow ? dowAttr.dowNm : step.label}
                            </span>
                        );
                    })}
                </div>
                <div className="card-foot">
                    <span className="tag-chip">특이점</span>
                    <span className="dow-tags">
                        {SPECIAL_NOTES.map((note) => (
                            <span key={note} className={dowAttr?.spclNote === note ? 'on' : 'off'}>
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
                    <span className="wx-ic">
                        <Icon name={weatherIconName(weather?.wthrCn)} />
                    </span>
                    <div className="wx-temp">
                        {weather ? weather.maxTp : EMPTY}
                        <small>°C</small>
                    </div>
                </div>
                <div className="wx-sub">
                    <span>
                        최저 <b>{weather ? weather.minTp : EMPTY}</b>°C
                    </span>
                    <span>
                        습도 <b>{weather ? weather.hmdtVl : EMPTY}</b>%
                    </span>
                </div>
                <div className="card-foot">
                    <span className="tag-chip">{weather ? weather.wthrCn : EMPTY}</span>
                    <span className="wx-foot-r">
                        풍속 <b>{weather ? weather.wsVl : EMPTY}</b>m/s
                        <br />
                        기압 <b>{weather ? weather.rwyAtm.toFixed(1) : EMPTY}</b>hPa
                    </span>
                </div>
            </div>
        </div>
    );
}
