import { useState, type ReactNode } from 'react';
import t1Blue from '@/assets/svg/t1-blue.svg';
import t2Teal from '@/assets/svg/t2-teal-full.svg';
import { QuickCheckinIcon, QuickFlightIcon, QuickGateIcon, QuickPaxIcon } from '@/components/icons';
import { Icon } from './PmIcons';
import { HOUR_AXIS } from '../mock';

interface HeaderSummaryProps {
    planDate: string;
    children: ReactNode;
}

/**
 * 상단 요약 카드 행 + 하단 슬롯으로 이루어진 본문.
 */
export function HeaderSummary({ planDate, children }: HeaderSummaryProps) {
    const [activeTile, setActiveTile] = useState('pax');

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
                            <div className="stat-row">
                                <span className="ic">
                                    <Icon name="plane" className="i-blue i-plane-lg" />
                                </span>
                                <div className="stat-cells">
                                    <div>
                                        <div className="k">출발</div>
                                        <div className="v">1,000</div>
                                    </div>
                                    <div>
                                        <div className="k">도착</div>
                                        <div className="v">354</div>
                                    </div>
                                    <div>
                                        <div className="k">운항편</div>
                                        <div>
                                            <span className="v blue">1,354</span>
                                            <span className="u">편</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="stat-row">
                                <span className="ic">
                                    <Icon name="people" className="i-teal i-people-lg" />
                                </span>
                                <div className="stat-cells">
                                    <div>
                                        <div className="k">출발</div>
                                        <div className="v">1,000</div>
                                    </div>
                                    <div />
                                    <div>
                                        <div className="k">총 여객</div>
                                        <div>
                                            <span className="v teal">1,354</span>
                                            <span className="u">명</span>
                                        </div>
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
                                <span className="t1c">T1</span> 219 <span className="t2c">T2</span>{' '}
                                260
                            </span>
                        </div>
                        <div className="hourly-body">
                            <div className="hourly-row">
                                <span className="ic">
                                    <img className="tico" src={t1Blue} alt="T1" />
                                </span>
                                <svg viewBox="0 0 300 50" preserveAspectRatio="none">
                                    <g stroke="#e4e8f0" strokeWidth=".9">
                                        <line x1="0" y1="6" x2="256" y2="6" />
                                        <line x1="0" y1="22" x2="256" y2="22" />
                                        <line x1="0" y1="38" x2="256" y2="38" />
                                    </g>
                                    <g fill="#3f8ee6">
                                        <rect x="82" y="31" width="14" height="7" />
                                        <rect x="97" y="25" width="14" height="13" />
                                        <rect x="112" y="18" width="14" height="20" />
                                        <rect x="127" y="12" width="14" height="26" />
                                        <rect x="142" y="8" width="14" height="30" />
                                        <rect x="157" y="11" width="14" height="27" />
                                        <rect x="172" y="18" width="14" height="20" />
                                        <rect x="187" y="27" width="14" height="11" />
                                    </g>
                                    <path
                                        d="M0 32 C22 32 40 31 58 30 C76 29 92 28 108 25 C124 22 136 18 148 17 C160 16 168 20 178 24 C188 28 194 30 200 24 C206 17 210 6 218 5 C226 4 230 14 236 20 C242 26 248 28 256 28"
                                        fill="none"
                                        stroke="#6fd6c4"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="ylab">
                                    <span>4,000</span>
                                    <span>2,000</span>
                                    <span>0</span>
                                </div>
                            </div>
                            <div className="axis-row">
                                <span className="ic" />
                                <div className="axis">
                                    {HOUR_AXIS.map((h) => (
                                        <span key={h}>{h}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="hourly-row">
                                <span className="ic">
                                    <img className="tico" src={t2Teal} alt="T2" />
                                </span>
                                <svg viewBox="0 0 300 50" preserveAspectRatio="none">
                                    <g stroke="#e4e8f0" strokeWidth=".9">
                                        <line x1="0" y1="6" x2="256" y2="6" />
                                        <line x1="0" y1="22" x2="256" y2="22" />
                                        <line x1="0" y1="38" x2="256" y2="38" />
                                    </g>
                                    <g fill="#3f8ee6">
                                        <rect x="16" y="33" width="14" height="5" />
                                        <rect x="31" y="35" width="14" height="3" />
                                        <rect x="97" y="26" width="14" height="12" />
                                        <rect x="112" y="21" width="14" height="17" />
                                        <rect x="127" y="16" width="14" height="22" />
                                        <rect x="142" y="8" width="14" height="30" />
                                        <rect x="157" y="17" width="14" height="21" />
                                        <rect x="172" y="17" width="14" height="21" />
                                    </g>
                                    <path
                                        d="M0 20 C12 20 20 27 32 30 C46 33 58 33 72 31 C86 29 96 24 110 23 C126 22 138 27 150 28 C162 29 170 24 180 18 C190 12 198 8 208 9 C220 10 228 18 236 26 C242 32 248 34 256 35"
                                        fill="none"
                                        stroke="#7cb6f5"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="ylab">
                                    <span>6,000</span>
                                    <span>3,000</span>
                                    <span>0</span>
                                </div>
                            </div>
                            <div className="axis-row">
                                <span className="ic" />
                                <div className="axis">
                                    {HOUR_AXIS.map((h) => (
                                        <span key={h}>{h}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 요일 속성 */}
                    <div className="card c-dow">
                        <div className="card-head">
                            <span className="card-title">요일 속성</span>
                        </div>
                        <div className="dow-val">
                            <span>주말 전일(금)</span>
                        </div>
                        <div className="card-foot">
                            <span className="tag-chip">특이점</span>
                            <span className="dow-hl">공휴일 전일</span>
                        </div>
                    </div>

                    {/* 기상정보 */}
                    <div className="card c-wx">
                        <div className="card-head">
                            <span className="card-title">기상정보</span>
                        </div>
                        <div className="wx-row">
                            <span className="wx-ic">
                                <Icon name="weather" />
                            </span>
                            <div className="wx-temp">
                                24<small>°C</small>
                            </div>
                            <div className="wx-side">
                                강수량 <b>00</b>mm
                                <br />
                                적설 <b>00</b>mm
                            </div>
                        </div>
                        <div className="card-foot">
                            <span className="tag-chip">저시정</span>
                            <span className="wx-foot-r">
                                1단계 <b>15:00</b>
                                <br />
                                2단계 <b>16:00</b>
                            </span>
                        </div>
                    </div>
                    <div className="quick c-quick">
                        <button
                            type="button"
                            className={`qtile${activeTile === 'pax' ? ' active' : ''}`}
                            onClick={() => setActiveTile('pax')}
                        >
                            <QuickPaxIcon aria-hidden="true" />
                            <span>터미널 여객수</span>
                        </button>

                        <button
                            type="button"
                            className={`qtile${activeTile === 'flight' ? ' active' : ''}`}
                            onClick={() => setActiveTile('flight')}
                        >
                            <QuickFlightIcon aria-hidden="true" />
                            <span>운항편</span>
                        </button>

                        <button
                            type="button"
                            className={`qtile${activeTile === 'checkin' ? ' active' : ''}`}
                            onClick={() => setActiveTile('checkin')}
                        >
                            <QuickCheckinIcon aria-hidden="true" />
                            <span>체크인카운터</span>
                        </button>

                        <button
                            type="button"
                            className={`qtile${activeTile === 'gate' ? ' active' : ''}`}
                            onClick={() => setActiveTile('gate')}
                        >
                            <QuickGateIcon aria-hidden="true" />
                            <span>출국장</span>
                        </button>
                    </div>
                </section>

                {children}
            </main>
        </div>
    );
}
