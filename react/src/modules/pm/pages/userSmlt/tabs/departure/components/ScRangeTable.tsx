import { formatHour } from '../../../format';
import type { ScRange } from '../types';

interface ScRangeTableProps {
    rows: ScRange[];
    /** 행 삭제 */
    onDelete: (id: string) => void;
    disabled?: boolean;
}

/**
 * 보안검색대 운영계획 표
 */
export function ScRangeTable({ rows, onDelete, disabled = false }: ScRangeTableProps) {
    return (
        <div className="plan">
            <table>
                <thead>
                    <tr>
                        <th>시작</th>
                        <th>종료</th>
                        <th className="col-cnt">검색대</th>
                        <th className="col-del" aria-label="삭제" />
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr className="is-empty">
                            <td colSpan={4}>구간을 추가하세요</td>
                        </tr>
                    ) : (
                        rows.map((row) => (
                            <tr key={row.id}>
                                <td>
                                    <b>{formatHour(row.startHour)}</b>
                                </td>
                                <td>
                                    <b>{formatHour(row.endHour)}</b>
                                </td>
                                <td className="col-cnt">
                                    <b>{row.count}</b> 개
                                </td>
                                <td className="col-del">
                                    <button
                                        type="button"
                                        className="plan__del"
                                        disabled={disabled}
                                        onClick={() => onDelete(row.id)}
                                    >
                                        ✕<span className="blind">구간 삭제</span>
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
