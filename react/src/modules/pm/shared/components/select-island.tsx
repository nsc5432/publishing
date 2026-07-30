import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';

interface SelectChknProps {
    tmnlId: string;
    value: string;
    onChange: (island: string) => void;
}

export function SelectIsland({ tmnlId, value, onChange }: SelectChknProps) {
    const [islands, setIslands] = useState<string[]>([]);
    const onValueChange = onChange;

    useEffect(() => {
        if (tmnlId === "P01") {
            setIslands(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N']);
        } else if (tmnlId === "P03") {
            setIslands(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M']);
        }
    }, [tmnlId]);


    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className="w-25 bg-white text-gray-700 border-0 font-medium shadow-sm hover:bg-white/95">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {islands.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
            </SelectContent>
        </Select>
    )
}