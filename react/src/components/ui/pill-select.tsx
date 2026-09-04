import { useEffect, useRef, useState } from 'react';

const VISIBLE_OPTION_COUNT = 6;

interface PillSelectProps {
    value: string;
    options: string[];
    unit: string;
    onChange: (value: string) => void;
}

export function PillSelect({ value, options, unit, onChange }: PillSelectProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handleDocumentMouseDown = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleDocumentMouseDown);
        return () => document.removeEventListener('mousedown', handleDocumentMouseDown);
    }, [open]);

    return (
        <div ref={containerRef} className="pill">
            <button type="button" className={`pill-sm${open ? ' open' : ''}`} aria-expanded={open} onClick={() => setOpen((isOpen) => !isOpen)}>
                {value}
                <span className="caret">▾</span>
                <span className="unit">{unit}</span>
            </button>

            {open && (
                <div
                    className={`pill-menu${options.length > VISIBLE_OPTION_COUNT ? ' scroll' : ''}`}
                >
                    {options.map((option) => (
                        <button
                            key={option}
                            type="button"
                            className={option === value ? 'sel' : undefined}
                            onClick={() => {
                                onChange(option);
                                setOpen(false);
                            }}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
