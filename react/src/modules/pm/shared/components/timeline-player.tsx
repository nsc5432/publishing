import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useState, useEffect } from 'react';
import { minToTime } from '@/lib/date-utils';

interface TimelinePlayerProps {
    time: number;
    onTimeChange: (time: number) => void;
}

export function TimelinePlayer({ time, onTimeChange }: TimelinePlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);

    // 자동 재생 기능
    useEffect(() => {
        if (isPlaying) {
            const interval = setInterval(() => {
                onTimeChange(Math.min(1440, time + 30));
                // 24:00에 도달하면 자동 정지
                if (time >= 1440) {
                    setIsPlaying(false);
                }
            }, 1000); // 1초마다 30분씩 증가

            return () => clearInterval(interval);
        }
    }, [isPlaying, time, onTimeChange]);

    return (
        <div className="bg-card border-t px-6 py-4">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onTimeChange(Math.max(0, time - 30))}
                >
                    <SkipBack className="h-4 w-4" />
                </Button>

                <Button variant="ghost" size="icon" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onTimeChange(Math.min(1440, time + 30))}
                >
                    <SkipForward className="h-4 w-4" />
                </Button>

                <div className="flex-1 flex items-center gap-4">
                    <span className="text-sm font-medium w-16">00:00</span>
                    <Slider
                        value={[time]}
                        onValueChange={(value) => onTimeChange(value[0])}
                        min={0}
                        max={1410}
                        step={30}
                        className="flex-1"
                    />
                    <span className="text-sm font-medium w-16">23:30</span>
                </div>

                <div className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium min-w-20 text-center">
                    {minToTime(time, ':')}
                </div>
            </div>
        </div>
    );
}
