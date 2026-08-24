interface PaginationProps {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
}

const WINDOW = 5;

function toPageNumbers(page: number, totalPages: number): number[] {
    const start = Math.max(1, Math.min(page - Math.floor(WINDOW / 2), totalPages - WINDOW + 1));
    const length = Math.min(WINDOW, totalPages);

    return Array.from({ length }, (_, index) => start + index);
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
    return (
        <div className="cast-config-pagination">
            <button
                type="button"
                className="cast-config-page-button"
                aria-label="이전 페이지"
                disabled={page <= 1}
                onClick={() => onChange(page - 1)}
            >
                ‹
            </button>

            {toPageNumbers(page, totalPages).map((number) => (
                <button
                    key={number}
                    type="button"
                    className={`cast-config-page-number${number === page ? ' is-current' : ''}`}
                    aria-current={number === page ? 'page' : undefined}
                    onClick={() => onChange(number)}
                >
                    {number}
                </button>
            ))}

            <button
                type="button"
                className="cast-config-page-button"
                aria-label="다음 페이지"
                disabled={page >= totalPages}
                onClick={() => onChange(page + 1)}
            >
                ›
            </button>
        </div>
    );
}
