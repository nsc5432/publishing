import type { CSSProperties } from 'react';
import { Terminal1SolidPlan, Terminal2SolidPlan } from '@/components/icons';
import { toStagePosition } from '@/lib/chart';
import type { FcltMarker, TerminalKind } from '../types';

interface FcltMapStageProps {
    terminal: TerminalKind;
    stageAspect: string;
    markers: FcltMarker[];
    /** 선택된 마커 ('' = 전체 보기) */
    activeMarkerId: string;
    onMarkerClick: (markerId: string) => void;
}

/**
 * 터미널 도면 + 구역 마커.
 *
 * 좌표 원본이 아일랜드·출국장 단위뿐이라 마커 하나에 시설 여러 건이 걸린다(N:1).
 * 그래서 마커는 개별 시설을 가리키지 않고 **그 구역의 건수**로만 말한다.
 * 미매핑이 있는 구역은 뱃지를 달아 도면만 봐도 문제 자리가 보이게 한다.
 */
export function FcltMapStage({
    terminal,
    stageAspect,
    markers,
    activeMarkerId,
    onMarkerClick,
}: FcltMapStageProps) {
    // 맵형태보기가 쓰는 도면은 흐림 필터가 박혀 있어 거의 흰색으로 그려진다.
    // 이 화면은 도면 자체를 봐야 하므로 필터 없는 판(디자이너 원본)을 쓴다.
    const Plan = terminal === 'T1' ? Terminal1SolidPlan : Terminal2SolidPlan;
    const stageStyle = { '--stage-ar': stageAspect } as CSSProperties;

    return (
        <section className="stage">
            <div className="stage__head">
                <h2 className="stage__title">시설 배치</h2>
                {activeMarkerId && (
                    <button
                        type="button"
                        className="stage__clear"
                        onClick={() => onMarkerClick(activeMarkerId)}
                    >
                        구역 선택 해제
                    </button>
                )}
            </div>

            <div className="map" style={stageStyle}>
                <Plan
                    className="map__bg"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    focusable="false"
                />

                {/* 구역 마커 : 좌표는 도면 무대 기준 비율 */}
                <div className="markers">
                    {markers.map((marker) => (
                        <button
                            type="button"
                            key={marker.id}
                            className={`marker marker--${marker.kind}${
                                marker.id === activeMarkerId ? ' is-active' : ''
                            }${marker.unmapped > 0 ? ' has-issue' : ''}`}
                            style={toStagePosition(marker.x, marker.y)}
                            aria-label={`${marker.label} · 시설 ${marker.total}건${
                                marker.unmapped > 0 ? ` · 미매핑 ${marker.unmapped}건` : ''
                            }`}
                            onClick={() => onMarkerClick(marker.id)}
                        >
                            {marker.label}
                            {marker.unmapped > 0 && (
                                <span className="marker__badge" aria-hidden="true">
                                    {marker.unmapped}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* 마커가 구역 단위라 범례도 구역을 설명한다 (시설유형 색은 표 쪽 범례가 맡는다) */}
            <ul className="legend">
                <li className="legend__item legend__item--island">아일랜드</li>
                <li className="legend__item legend__item--dep-gate">출국장</li>
                <li className="legend__item legend__item--issue">미매핑 포함</li>
            </ul>
        </section>
    );
}
