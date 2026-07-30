import { useEffect, useState } from 'react'
import { CONGESTION_LEVEL } from '../../enums/congestion-level'

interface CongestionDispaly {
    congestionLevel: CONGESTION_LEVEL,
    info: string
}

export function CongestionDisplay({ congestionLevel, info }: CongestionDispaly) {
    const [title, setTitle] = useState<string>();

    useEffect(() => {
        if (congestionLevel == 'VERY_SMOOTH') {
            setTitle('✅ 매우원활');
        } else if (congestionLevel == 'SMOOTH') {
            setTitle('⚠️ 원활');
        } else if (congestionLevel == 'CONGESTED') {
            setTitle('🚫 혼잡');
        } else if (congestionLevel == 'VERY_CONGESTED') {
            setTitle('❌ 매우혼잡');
        }
    }, [congestionLevel]);

    return <div className="bg-orange-100 border-l-4 border-orange-500 px-4 py-2 rounded">
        <div className="flex items-center">
            <span className="text-orange-800 font-semibold">{title}</span>
            <span className="ml-4 text-orange-700">{info}</span>
        </div>
    </div>
}