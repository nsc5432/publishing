// 커스텀 툴팁
export interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        name?: string;
        value?: number | string;
        color?: string;
    }>;
    label?: string;
    unit?: string;
}