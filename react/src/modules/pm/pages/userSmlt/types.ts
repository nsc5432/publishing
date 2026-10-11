import type { UserSmltExecReq, UserSmltQuery } from '@/types/api.types';
import type { TimeRange } from '@/components/ui/time-range-selector';

export type TerminalKind = 'T1' | 'T2';

export const TERMINALS: readonly TerminalKind[] = ['T1', 'T2'];

export type TerminalEnabled = Record<TerminalKind, boolean>;

export const NO_TERMINAL: TerminalEnabled = { T1: false, T2: false };

export function enabledTerminals(enabled: TerminalEnabled): TerminalKind[] {
    return TERMINALS.filter((terminal) => enabled[terminal]);
}

export function otherTerminal(terminal: TerminalKind): TerminalKind {
    return terminal === 'T1' ? 'T2' : 'T1';
}

export interface SmltTabProps {
    query: UserSmltQuery;
    busy: boolean;
    beginRequest: () => boolean;
    endRequest: (saved?: boolean) => void;
    onDraftChange: (tab: SmltTabKey, collect: () => Partial<UserSmltExecReq>) => void;

    reloadKey: number;
    enabled: TerminalEnabled;

    onToggleTerminal: (terminal: TerminalKind) => void;
    focusTerminal: TerminalKind;
    onFocusChange: (terminal: TerminalKind) => void;

    readOnly?: boolean;
}

export type SmltTabKey = 'flightPax' | 'checkinCounter' | 'departure';

export const SMLT_TABS: readonly SmltTabKey[] = ['flightPax', 'checkinCounter', 'departure'];

export const SMLT_TAB_LABEL: Record<SmltTabKey, string> = {
    flightPax: '운항편/여객수',
    checkinCounter: '체크인 카운터',
    departure: '출국장',
};

export type BlockColor = 'i1' | 'i2' | 'i3' | 'i4' | 'i5' | 'i6';

export const BLOCK_COLORS: readonly BlockColor[] = ['i1', 'i2', 'i3', 'i4', 'i5', 'i6'];

export interface BlockItem {
    label: string;
    color: BlockColor;

    ranges: TimeRange[];

    size: number;

    sides?: readonly ('L' | 'R')[];
}

export interface BlockLegend {
    label: string;
    color: BlockColor;

    note?: string;
}

export interface WaitLineData {
    data: number[];

    max: number;
    label?: string;
    unit?: string;
}

export interface PanelKpi {
    label: string;
    value: string;
    unit: string;
}
