const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function formatDateWithDay(date: Date) {
    const yyyymmdd = parseDateStr(date);
    const day = days[date.getDay()];

    return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)} ${day}`;
}

// Date -> hh:mm
export function formatTimeFromDate(date: Date) {
    return formatTime(`${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`);
}

// Date -> hh:mm:ss
export function formatTimeSecondsFromDate(date: Date) {
    return formatTime(`${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`);
}

// Date -> yyyymmdd
export function parseDateStr(date: Date, delimeter: string = '') {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    return `${yyyy}${delimeter}${mm}${delimeter}${dd}`
}

// Date -> yyyy-mm-dd hh:mm:ss
export function parseDateTimeStr(date: Date) {
    return `${parseDateStr(date, '-')} ${formatTimeSecondsFromDate(date)}`
}

// yyyymmdd -> Date
export function parseDate(yyyymmdd: string) {
    const yyyy = yyyymmdd.slice(0, 4);
    const mm = yyyymmdd.slice(4, 6);
    const dd = yyyymmdd.slice(6, 8);

    return new Date(`${yyyy}-${mm}-${dd}`);
}

export function formatTime(hhmmss: string) {
    if (hhmmss.length === 4) {
        return `${hhmmss.slice(0, 2)}:${hhmmss.slice(2, 4)}`;
    }

    return `${hhmmss.slice(0, 2)}:${hhmmss.slice(2, 4)}:${hhmmss.slice(4, 6)}`;
}

export function minToTime(min: number, delimeter: string = '') { // 250 분 => 0410 (4시간10분)
    const hours = Math.floor(min / 60);
    const mins = min % 60;
    return `${hours.toString().padStart(2, '0')}${delimeter}${mins.toString().padStart(2, '0')}`;
}

export function timeToMin(time: string) { // 0410 => 250
    const h = time.slice(0, 2);
    const m = time.slice(2, 4);

    return Number(h) * 60 + Number(m);
}

export function times(intervalMinute: number = 30, delimeter: string = '') {
    if (intervalMinute <= 0) {
        new Error(`intervalMinute 를 잘못입력하였습니다. ${intervalMinute}`);
    }

    const times = [];
    let min = 0;

    while (min < 1440) {
        times.push(minToTime(min, delimeter));
        min += intervalMinute;
    }

    return times;
}
