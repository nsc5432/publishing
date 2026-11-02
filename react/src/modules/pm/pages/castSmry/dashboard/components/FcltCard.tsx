import { useState } from 'react';
import { Icon } from '@/components/icons/InlineIcon';
import type { IconName } from '@/components/icons/InlineIcon';
import type { FcltCardData, FcltCardSnapshot } from '../types';

interface FcltCardProps {
    data: FcltCardData;
    onDetail: (unitCd: string, hhmm: string) => void;
    onMove: () => void;
}

interface MetricLabelProps {
    label: string;
    icon: IconName;
}

interface ComparisonRowProps extends MetricLabelProps {
    current?: string;
    next?: string;
    unit?: string;
}

interface RecommendCellProps {
    snapshot: FcltCardSnapshot | null;
    label: string;
    onClick: () => void;
}

export function FcltCard({ data, onDetail, onMove }: FcltCardProps) {
    const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
    const variantIndex = Math.max(
        0,
        data.variants.findIndex((item) => item.unitCd === selectedUnit),
    );
    const variant = data.variants[variantIndex];
    const selectedChip = data.chips.find((chip) => chip.label === variant?.unitCd);

    const cycleVariant = (direction: number) => {
        const nextIndex = (variantIndex + direction + data.variants.length) % data.variants.length;
        setSelectedUnit(data.variants[nextIndex].unitCd);
    };

    if (!variant) return null;

    const { current, next } = variant;

    return (
        <div className="fclt-card">
            <div className="fclt-card-head">
                <b>{data.title}</b>
                <div className="warn">
                    <span>{data.warn}</span>
                    <button type="button" className="plus" aria-label={`${data.title} 상세 화면으로 이동`} onClick={onMove}>
                        <Icon name="plus" />
                    </button>
                </div>
            </div>
            <div className="fclt-card-mid">
                <button
                    type="button"
                    className="fclt-card-arrow prev"
                    aria-label={`이전 ${data.title} 시설`}
                    disabled={data.variants.length < 2}
                    onClick={() => cycleVariant(-1)}
                >
                    <Icon name="chevL" />
                </button>
                <div className="isl">{variant.island}</div>
                <div className="num" data-congestion={selectedChip?.kind}>
                    {variant.num}
                </div>
                <div className="meta">
                    {variant.meta.map((metaCell) => (
                        <span key={metaCell.label}>
                            {metaCell.label} <b className={metaCell.accent ? 'acc' : undefined}>{metaCell.value}</b>개
                        </span>
                    ))}
                </div>
                <button
                    type="button"
                    className="fclt-card-arrow next"
                    aria-label={`다음 ${data.title} 시설`}
                    disabled={data.variants.length < 2}
                    onClick={() => cycleVariant(1)}
                >
                    <Icon name="chevR" />
                </button>
            </div>
            <table className="gauge-row fclt-compare" aria-label={`${data.title} ${variant.num} 시점 비교`}>
                <colgroup>
                    <col />
                    <col />
                    <col />
                </colgroup>
                <thead>
                    <tr>
                        <td />
                        <th scope="col">
                            <span>현재</span>
                            <time>{data.currentTime}</time>
                        </th>
                        <th scope="col">
                            <span>+1시간</span>
                            <time>{data.nextTime}</time>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th scope="row">
                            <MetricLabel label="혼잡도" icon="chart" />
                        </th>
                        <td>
                            <span className="fclt-compare-status" data-congestion={current?.congestionKind}>
                                {current?.congestion ?? '-'}
                            </span>
                        </td>
                        <td>
                            <span className="fclt-compare-status" data-congestion={next?.congestionKind}>
                                {next?.congestion ?? '-'}
                            </span>
                        </td>
                    </tr>
                    <ComparisonRow
                        label="대기인원"
                        icon="people"
                        current={current?.waitingCount}
                        next={next?.waitingCount}
                        unit="명"
                    />
                    <ComparisonRow
                        label={data.fcltType === 'CHKN' ? '운영 부스' : '운영 검색대'}
                        icon="monitor"
                        current={current?.operatingCount}
                        next={next?.operatingCount}
                        unit="개"
                    />
                </tbody>
                <tbody>
                    <tr>
                        <th scope="row">
                            <MetricLabel label="추천 운영 수" icon="checkCircle" />
                        </th>
                        <RecommendCell
                            snapshot={current}
                            label={`${data.title} ${variant.unitCd} ${data.currentTime}`}
                            onClick={() => current && onDetail(variant.unitCd, current.hhmm)}
                        />
                        <RecommendCell
                            snapshot={next}
                            label={`${data.title} ${variant.unitCd} ${data.nextTime}`}
                            onClick={() => next && onDetail(variant.unitCd, next.hhmm)}
                        />
                    </tr>
                    <ComparisonRow
                        label="혼잡해소 예상"
                        icon="clock"
                        current={current?.clearTime.centerText}
                        next={next?.clearTime.centerText}
                    />
                </tbody>
            </table>
            <div className="chips" aria-label={`${data.title} 시설 선택 · 조회 시점 혼잡도`}>
                {data.chips.map((chip) => (
                    <button
                        type="button"
                        key={chip.label}
                        className={`chip ${chip.kind}${chip.label === variant.unitCd ? ' sel' : ''}`}
                        aria-label={`${data.title} ${chip.label}`}
                        aria-pressed={chip.label === variant.unitCd}
                        disabled={!data.variants.some((item) => item.unitCd === chip.label)}
                        onClick={() => setSelectedUnit(chip.label)}
                    >
                        {chip.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function MetricLabel({ label, icon }: MetricLabelProps) {
    return (
        <span className="fclt-metric-label">
            <Icon name={icon} />
            <span>{label}</span>
        </span>
    );
}

function ComparisonRow({ label, icon, current, next, unit }: ComparisonRowProps) {
    return (
        <tr>
            <th scope="row">
                <MetricLabel label={label} icon={icon} />
            </th>
            {[current, next].map((value, index) => (
                <td key={index}>
                    {value ?? '-'}
                    {unit && value !== undefined && value !== '-' && <small>{unit}</small>}
                </td>
            ))}
        </tr>
    );
}

function RecommendCell({ snapshot, label, onClick }: RecommendCellProps) {
    return (
        <td>
            <button
                type="button"
                className="rec"
                aria-label={`${label} 혼잡해소 시뮬레이션`}
                aria-haspopup="dialog"
                title={snapshot ? `${snapshot.recommend.name} 총 소요 수량 · ${snapshot.recommend.countNote}` : '조회 결과 없음'}
                disabled={!snapshot}
                onClick={onClick}
            >
                {snapshot?.recommend.count ?? '-'}
                {snapshot && snapshot.recommend.count !== '-' && <small>개</small>}
            </button>
        </td>
    );
}
