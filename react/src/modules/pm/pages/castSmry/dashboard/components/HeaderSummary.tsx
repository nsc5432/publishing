import { type ReactNode } from 'react';
import { QuickCheckinIcon, QuickFlightIcon, QuickGateIcon, QuickPaxIcon } from '@/components/icons';
import { Icon } from '@/components/icons/InlineIcon';
import type { DsbdCategory, DsbdHeaderDto } from '@/types/api.types';
import { HeaderInfoCards } from '@/modules/pm/components/HeaderInfoCards';

interface HeaderSummaryProps {
    planDate: string;
    dayOverview: DsbdHeaderDto | null;
    activePrimeCategory: DsbdCategory | null;
    onCategoryChange: (category: DsbdCategory) => void;
    onPrimeReset: () => void;
    children: ReactNode;
}

const QUICK_TILES: { category: DsbdCategory; label: string; Icon: typeof QuickPaxIcon }[] = [
    { category: 'PSG', label: '터미널 여객수', Icon: QuickPaxIcon },
    { category: 'FLT', label: '운항편', Icon: QuickFlightIcon },
    { category: 'CHKN', label: '체크인카운터', Icon: QuickCheckinIcon },
    { category: 'DEP', label: '출국장', Icon: QuickGateIcon },
];

export function HeaderSummary({
    planDate,
    dayOverview,
    activePrimeCategory,
    onCategoryChange,
    onPrimeReset,
    children,
}: HeaderSummaryProps) {
    return (
        <div className="body">
            <main className="main">
                <section className="row row--top">
                    <HeaderInfoCards planDate={planDate} header={dayOverview} />

                    <div className="quick c-quick">
                        <div className="quick-head">
                            <div className="quick-title">PRIME TIME</div>
                            <button
                                type="button"
                                className="quick-reset"
                                aria-label="현재 시각으로 초기화"
                                title="현재 시각으로 초기화"
                                onClick={onPrimeReset}
                            >
                                <Icon name="reset" />
                            </button>
                        </div>
                        <div className="quick-grid">
                            {QUICK_TILES.map((tile) => (
                                <button
                                    key={tile.category}
                                    type="button"
                                    className={`qtile${
                                        activePrimeCategory === tile.category ? ' active' : ''
                                    }`}
                                    aria-pressed={activePrimeCategory === tile.category}
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
