export const colors = {
    primary: '#6366f1', // Indigo
    secondary: '#ec4899', // Pink
    tertiary: '#14b8a6', // Teal
    quaternary: '#f59e0b', // Amber
    softred: '#ff6b6b', // SoftRed
    gradient1: '#8b5cf6', // Purple
    gradient2: '#06b6d4', // Cyan
};


// 커스텀 점 (Dot) 컴포넌트
interface CustomDotProps {
    cx?: number;
    cy?: number | undefined;
    fill?: string;
}

export const CustomDot = (props: CustomDotProps) => {
    const { cx, cy, fill } = props;

    return cy && (<circle
        cx={cx}
        cy={cy}
        r={5}
        fill={fill}
        stroke="#fff"
        strokeWidth={2}
        className="drop-shadow-md"
    />);
};