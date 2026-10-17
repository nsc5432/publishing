import { useState } from 'react';
import { Icon } from '@/components/icons/InlineIcon';
import { GaugeDonut } from './GaugeDonut';
import type { FcltCardData } from '../types';

interface FcltCardProps {
    data: FcltCardData;
    gauge: string;
    onDetail: (unitCd: string) => void;
}

export function FcltCard({ data, gauge, onDetail }: FcltCardProps) {
    const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
    const variantIndex = Math.max(
        0,
        data.variants.findIndex((item) => item.unitCd === selectedUnit),
    );
    const variant = data.variants[variantIndex];

    const cycleVariant = (direction: number) => {
        const nextIndex = (variantIndex + direction + data.variants.length) % data.variants.length;
        setSelectedUnit(data.variants[nextIndex].unitCd);
    };

    if (!variant) return null;

    return (
        <div className="fclt-card">
            <div className="fclt-card-head">
                <b>{data.title}</b>
                <div className="warn">
                    <span>{data.warn}</span>
                    <button
                        type="button"
                        className="plus"
                        aria-label={`${data.title} ${variant.unitCd} 혼잡해소 시뮬레이션`}
                        aria-haspopup="dialog"
                        onClick={() => onDetail(variant.unitCd)}
                    >
                        <Icon name="plus" />
                    </button>
                </div>
            </div>
            <div className="fclt-card-mid">
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
                    <div className={`cap${variant.recommend.countNoteAccent ? ' u' : ''}`}>
                        {variant.recommend.countNote}
                    </div>
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
                        disabled={!data.variants.some((item) => item.unitCd === chip.label)}
                        onClick={() => setSelectedUnit(chip.label)}
                    >
                        {chip.label}
                    </button>
                ))}
            </div>
            <button type="button" className="fclt-card-arrow prev" onClick={() => cycleVariant(-1)}>
                <Icon name="chevL" />
            </button>
            <button type="button" className="fclt-card-arrow next" onClick={() => cycleVariant(1)}>
                <Icon name="chevR" />
            </button>
        </div>
    );
}
