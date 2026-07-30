import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface SelectTmnlProps {
    tmnlId: string,
    onChange: (tmnlId: string) => void
}

export function SelectTmnl({ tmnlId, onChange }: SelectTmnlProps) {
    const onValueChange = onChange;

    return (
        <Select defaultValue={tmnlId} onValueChange={onValueChange}>
            <SelectTrigger className="w-32.5 bg-white text-gray-700 border-0 font-medium shadow-sm hover:bg-white/95">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="P01">T1 터미널</SelectItem>
                <SelectItem value="P03">T2 터미널</SelectItem>
            </SelectContent>
        </Select>
    )
}