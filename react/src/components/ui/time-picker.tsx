'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface TimePickerProps {
    value?: Date;
    onChange?: (date: Date | undefined) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

function TimePicker({ value, onChange, disabled, placeholder = '시간 선택', className }: TimePickerProps) {
    const [open, setOpen] = React.useState(false);
    const [selectedTime, setSelectedTime] = React.useState<Date | undefined>(value);

    const hours = selectedTime?.getHours() ?? 0;
    const minutes = selectedTime?.getMinutes() ?? 0;

    const handleHourChange = (hour: number) => {
        const newTime = new Date(selectedTime || new Date());
        newTime.setHours(hour);
        setSelectedTime(newTime);
        onChange?.(newTime);
    };

    const handleMinuteChange = (minute: number) => {
        const newTime = new Date(selectedTime || new Date());
        newTime.setMinutes(minute);
        setSelectedTime(newTime);
        onChange?.(newTime);
    };

    const formatTime = (date: Date | undefined) => {
        if (!date) return '';
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    };

    React.useEffect(() => {
        setSelectedTime(value);
    }, [value]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        'w-[140px] justify-start text-left font-normal',
                        !selectedTime && 'text-muted-foreground',
                        className,
                    )}
                    disabled={disabled}
                >
                    <Clock className="mr-2 h-4 w-4" />
                    {selectedTime ? formatTime(selectedTime) : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-30" align="start">
                <div className="flex divide-x">
                    {/* Hour Picker */}
                    <div className="flex flex-col">
                        <div className="px-2 py-1.5 text-xs font-medium border-b text-center">시</div>
                        <div className="h-[180px] overflow-y-auto scrollbar-thin">
                            {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                <button
                                    key={hour}
                                    onClick={() => handleHourChange(hour)}
                                    className={cn(
                                        'w-full px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground text-center',
                                        hours === hour && 'bg-primary text-primary-foreground hover:bg-primary',
                                    )}
                                >
                                    {String(hour).padStart(2, '0')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Minute Picker */}
                    <div className="flex flex-col">
                        <div className="px-2 py-1.5 text-xs font-medium border-b text-center">분</div>
                        <div className="h-[180px] overflow-y-auto scrollbar-thin">
                            {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                                <button
                                    key={minute}
                                    onClick={() => handleMinuteChange(minute)}
                                    className={cn(
                                        'w-full px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground text-center',
                                        minutes === minute &&
                                        'bg-primary text-primary-foreground hover:bg-primary',
                                    )}
                                >
                                    {String(minute).padStart(2, '0')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export { TimePicker };
