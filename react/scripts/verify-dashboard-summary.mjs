import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const server = await createServer({
    root,
    optimizeDeps: { noDiscovery: true, include: [] },
    configFile: false,
    resolve: { preserveSymlinks: true, alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    server: { middlewareMode: true, fs: { allow: [root] } },
    logLevel: 'error',
});
let assertions = 0;
function check(actual, expected, message) {
    assert.deepEqual(actual, expected, message);
    assertions += 1;
}
function checkNear(actual, expected, message) {
    if (actual === null || expected === null) {
        check(actual, expected, message);
        return;
    }
    assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: ${actual} != ${expected}`);
    assertions += 1;
}

try {
    const { dashboardMock: api } = await server.ssrLoadModule('/src/api/pm/mock/dashboard.mock.ts');
    const { toTerminalView, toPrimeTime } = await server.ssrLoadModule('/src/modules/pm/pages/castSmry/dashboard/view.ts');
    const { mapMock } = await server.ssrLoadModule('/src/api/pm/mock/map.mock.ts');
    const { toMapDay, EMPTY_MAP_SLOT } = await server.ssrLoadModule('/src/modules/pm/pages/castSmry/terminalMap/view.ts');
    const smryAt = (time, terminal = 'T1', category = 'PSG') => api.getTmnlSmry(terminal, time, 60, category);
    const viewAt = (time, smry = smryAt(time), category = 'PSG') => toTerminalView({
        ymd: '20260710', hhmm: time, category, smry,
        rsltList: api.getTmnlRsltByTime(smry.tmnlId, category),
        chknCards: [], dptgtCards: [],
    });
    const smryInfo = (smry) => [smry.smryWtngPsgCnt, smry.smryAvgWtngSec, smry.smryArvlPsgCnt, smry.smryPrcsPsgCnt];
    const values = (view) => view.summaryInfo.map((cell) => cell.value);
    const snapshotHour = (time) => Math.floor((Number(time.slice(0, 2)) * 60 + Number(time.slice(2)) - 10) / 60);
    const expectedValues = (smry) => [
        smry.smryWtngPsgCnt === null ? '-' : smry.smryWtngPsgCnt.toLocaleString(),
        smry.smryAvgWtngSec === null ? '-' : String(Math.round(smry.smryAvgWtngSec / 60)),
        smry.smryArvlPsgCnt === null ? '-' : smry.smryArvlPsgCnt.toLocaleString(),
        smry.smryPrcsPsgCnt === null ? '-' : smry.smryPrcsPsgCnt.toLocaleString(),
    ];

    for (const terminal of ['T1', 'T2']) {
        const dto = mapMock.getSmltMap(terminal);
        const day = toMapDay(dto);
        for (const slot of dto.slotList) {
            const smry = smryAt(slot.hhmm, terminal);
            check(smryInfo(slot.landsideSmry), smryInfo(smry),
                `${terminal} ${slot.hhmm} map summary agrees with the dashboard's 60-minute landside result`);
            check(day.slots[slot.hhmm].summaryInfo, viewAt(slot.hhmm, smry).summaryInfo,
                `${terminal} ${slot.hhmm} map and dashboard format the same summary`);
        }
        const last = dto.slotList.find((slot) => slot.hhmm === '2400').landsideSmry;
        check([last.smryArvlPsgCnt, last.smryPrcsPsgCnt], [null, null],
            `${terminal} 24:00 has no forward interval`);
        check(last.smryAvgWtngSec !== null, true, `${terminal} 24:00 wait reads the result ending at midnight`);
        const unknown = toMapDay({ ...dto, slotList: [{ ...dto.slotList[0], landsideSmry: {
            smryWtngPsgCnt: null, smryAvgWtngSec: null, smryArvlPsgCnt: null, smryPrcsPsgCnt: null,
        } }] });
        check(unknown.slots['0000'].summaryInfo.map((cell) => cell.value), ['-', '-', '-', '-'],
            `${terminal} unknown map metrics stay unknown`);
        const zero = toMapDay({ ...dto, slotList: [{ ...dto.slotList[0], landsideSmry: {
            smryWtngPsgCnt: 0, smryAvgWtngSec: 0, smryArvlPsgCnt: 0, smryPrcsPsgCnt: 0,
        } }] });
        check(zero.slots['0000'].summaryInfo.map((cell) => cell.value), ['0', '0', '0', '0'],
            `${terminal} observed zero map metrics stay zero`);
    }
    check(EMPTY_MAP_SLOT.summaryInfo.map((cell) => cell.value), ['-', '-', '-', '-'],
        'map loading state has four unknown metrics');

    check(JSON.stringify(smryInfo(smryAt('0800'))) !== JSON.stringify(smryInfo(smryAt('0900'))), true,
        '09:00 updates the summary from 08:00');
    check(smryAt('0800').peak, smryAt('0900').peak, 'daily peak remains independent of search time');
    check(values(viewAt('0900')), expectedValues(smryAt('0900')), 'summary reads the category summary fields');
    check(viewAt('0900').summaryInfo.map((cell) => cell.label),
        ['전체\n대기인원', '평균\n대기시간', '시간당\n유입인원', '시간당\n처리인원'], 'summary labels describe the metrics');

    for (const [category, target] of [['PSG', '랜드\n사이드'], ['FLT', '랜드\n사이드'], ['CHKN', '아일랜드'], ['DEP', '출국장']]) {
        check(viewAt('0900', smryAt('0900', 'T1', category), category).summaryTarget, target,
            `${category} summary names its target`);
    }

    for (const time of ['0300', '0900', '0910', '2350']) {
        const [chkn, dep, land] = ['CHKN', 'DEP', 'PSG'].map((category) => smryAt(time, 'T1', category));
        check(smryInfo(smryAt(time, 'T1', 'FLT')), smryInfo(land), `${time} flights use the landside summary`);
        check(land.smryWtngPsgCnt, chkn.smryWtngPsgCnt + dep.smryWtngPsgCnt, `${time} landside queue adds both areas`);
        check(land.smryArvlPsgCnt, chkn.smryArvlPsgCnt, `${time} landside inflow is the island inflow`);
        check(land.smryPrcsPsgCnt, dep.smryPrcsPsgCnt, `${time} landside processing is the departure processing`);
        const [chknRslt, depRslt] = ['CHKN', 'DEP'].map((category) => api.getTmnlRsltByTime('T1', category)[snapshotHour(time)]);
        const snapshotPrcs = chknRslt.prcsPsgCnt + depRslt.prcsPsgCnt;
        checkNear(land.smryAvgWtngSec,
            snapshotPrcs === 0 ? null
                : (chknRslt.wtngHr * chknRslt.prcsPsgCnt + depRslt.wtngHr * depRslt.prcsPsgCnt) * 60 / snapshotPrcs,
            `${time} landside wait is weighted over both areas' processed passengers`);
    }

    const depHours = api.getTmnlRsltByTime('T1', 'DEP');
    const shifted = smryAt('0910', 'T1', 'DEP');
    const [prcs9, prcs10] = [(depHours[9].prcsPsgCnt * 50) / 60, (depHours[10].prcsPsgCnt * 10) / 60];
    check(shifted.smryWtngPsgCnt, depHours[9].fcstWtngPsgCnt, 'queue is the snapshot at the search time');
    check(shifted.smryPrcsPsgCnt, Math.round(prcs9 + prcs10), '09:10 to 10:10 includes overlapping parts of both hours');
    checkNear(shifted.smryAvgWtngSec, depHours[9].wtngHr * 60, 'average wait reads the result ending at the search time');
    checkNear(smryAt('1000', 'T1', 'DEP').smryAvgWtngSec, depHours[9].wtngHr * 60,
        '10:00 wait reads 09:50 to 10:00, not the next hour');
    check(smryAt('0000', 'T1', 'DEP').smryAvgWtngSec, null, 'midnight has no earlier result');
    check(smryAt('2350', 'T1', 'DEP').smryPrcsPsgCnt, Math.round((depHours[23].prcsPsgCnt * 10) / 60),
        'late-night range stops at midnight');
    check(viewAt('2350').barText.endsWith('PM'), true, 'search-time marker uses its own AM/PM');
    check(values(viewAt('0300')), expectedValues(smryAt('0300')), 'observed zero counts stay zero');
    check(values(viewAt('0900', { ...smryAt('0900'),
        smryWtngPsgCnt: null, smryAvgWtngSec: null, smryArvlPsgCnt: null, smryPrcsPsgCnt: null,
    })), ['-', '-', '-', '-'], 'unknown summary results never fall back to daily peak');

    for (const [category, expectedTime] of [['PSG', '0800'], ['FLT', '0800'], ['CHKN', '1000'], ['DEP', '1100']]) {
        const time = toPrimeTime(['T1', 'T2'].map((terminal) => api.getTmnlRsltByTime(terminal, category)), category);
        check(time, expectedTime, `${category} Prime Time selects its peak hour`);
        check(values(viewAt(time, smryAt(time, 'T1', category), category)), expectedValues(smryAt(time, 'T1', category)),
            `${category} Prime Time summary uses its own target at the selected search time`);
        check(smryAt(time).peak, smryAt('0900').peak, `${category} Prime Time preserves daily peak information`);
    }
    check(JSON.stringify(smryInfo(smryAt('0900', 'T2'))) !== JSON.stringify(smryInfo(smryAt('0900'))), true,
        'second terminal has independent summary results');

    for (const terminal of ['T1', 'T2']) {
        for (const category of ['PSG', 'FLT', 'CHKN', 'DEP']) {
            const mismatched = api.getTmnlRsltByTime(terminal, category).filter((rslt) => {
                const smry = smryAt(rslt.time, terminal, category);
                const psgCnt = category === 'FLT' ? smry.intrvlFltCnt : smry.intrvlPsgCnt;
                return rslt.fltCnt !== smry.intrvlFltCnt || rslt.psgCnt !== psgCnt;
            });
            check(mismatched.map((rslt) => rslt.time), [],
                `${terminal} ${category} hourly chart counts equal the on-the-hour summary interval`);
        }
    }

    for (const terminal of ['T1', 'T2']) {
        const smry = smryAt('0910', terminal);
        check(smry.intrvlList.map((slot) => [slot.bgnHhmm, slot.endHhmm]),
            [['0910', '1010'], ['1010', '1110'], ['1110', '1210']],
            `${terminal} preserves minutes in all three hourly windows`);
        for (const slot of smry.intrvlList) {
            const standalone = smryAt(slot.bgnHhmm, terminal);
            check([slot.fltCnt, slot.psgCnt, slot.yesterdayFltDiffCnt, slot.yesterdayPsgDiffCnt],
                [standalone.intrvlFltCnt, standalone.intrvlPsgCnt,
                    standalone.intrvlYesterdayFltDiffCnt, standalone.intrvlYesterdayPsgDiffCnt],
                `${terminal} ${slot.bgnHhmm} agrees with querying that time directly`);
        }
        const slots = viewAt('0910', smry).summaryStats;
        check(slots.map((slot) => [slot.label, slot.time]),
            [['현재', '09:10'], ['+1시간', '10:10'], ['+2시간', '11:10']],
            `${terminal} labels use confirmed search time`);
        check(slots[1].stats.map((stat) => stat.value),
            [smry.intrvlList[1].fltCnt.toLocaleString(), smry.intrvlList[1].psgCnt.toLocaleString()],
            `${terminal} displays both counts from the future interval`);
    }

    check(smryAt('2210').intrvlList.map((slot) => [slot.bgnHhmm, slot.endHhmm]),
        [['2210', '2310'], ['2310', '2400']], 'last same-day interval stops at midnight');
    const midnight = viewAt('2350').summaryStats;
    check(midnight.map((slot) => slot.time), ['23:50', '다음 날 00:50', '다음 날 01:50'],
        'future-day labels never wrap back to the search date');
    check(midnight.slice(1).flatMap((slot) => slot.stats.map((stat) => [stat.value, stat.delta])),
        [['-', '-'], ['-', '-'], ['-', '-'], ['-', '-']],
        'out-of-date windows show unknown counts and differences');
    check(viewAt('0300').summaryStats[0].stats.map((stat) => stat.value), ['0', '0'],
        'observed zero flights and passengers remain zero');

    const legacy = { ...smryAt('0910') };
    delete legacy.intrvlList;
    check(viewAt('0910', legacy).summaryStats[0].stats.map((stat) => stat.value),
        [legacy.intrvlFltCnt.toLocaleString(), legacy.intrvlPsgCnt.toLocaleString()],
        'existing server responses retain current counts during rollout');
    check(viewAt('0910', legacy).summaryStats[1].stats.map((stat) => stat.value), ['-', '-'],
        'missing future data never reuses the current interval');
    for (const terminal of ['T1', 'T2']) {
        for (const fcltType of ['CHKN', 'DEP']) {
            const unitOf = (card) => fcltType === 'CHKN' ? card.island : card.dptgtNo;
            const currentCards = api.getFcltCardList(terminal, '0910', fcltType);
            const nextCards = currentCards.map((card, index) => ({
                ...card, wtngPsgCnt: 1000 + index, oprCnt: 20 + index,
                hrlyPrcsPsgCnt: 2000 + index, cgnStatus: 'NORMAL',
                cgnWtngSec: 120 + index * 60,
                cgnClearTime: '1030', cgnClearRate: 50,
                recommend: { ...card.recommend, reqCnt: 30 + index },
            })).reverse();
            const cardViewAt = (time, current, next) => toTerminalView({
                ymd: '20260710', hhmm: time, category: 'PSG', smry: smryAt(time, terminal),
                rsltList: [], chknCards: fcltType === 'CHKN' ? current : [],
                dptgtCards: fcltType === 'DEP' ? current : [],
                nextChknCards: fcltType === 'CHKN' ? next : [],
                nextDptgtCards: fcltType === 'DEP' ? next : [],
            }).fcltCards.find((card) => card.fcltType === fcltType);
            const comparison = cardViewAt('0910', currentCards, nextCards);
            check([comparison.currentTime, comparison.nextTime], ['09:10', '10:10'],
                `${terminal} ${fcltType} compares the exact selected time and one hour later`);
            for (const variant of comparison.variants) {
                const current = currentCards.find((card) => unitOf(card) === variant.unitCd);
                const next = nextCards.find((card) => unitOf(card) === variant.unitCd);
                check(variant.current.waitingCount, current.wtngPsgCnt.toLocaleString(),
                    `${terminal} ${fcltType} ${variant.unitCd} retains current values`);
                check([variant.next.waitingCount, variant.next.waitingTime, variant.next.operatingCount,
                    variant.next.processRate.centerText, variant.next.recommend.count,
                    variant.next.clearTime.centerText, variant.next.congestion, variant.next.hhmm],
                    [next.wtngPsgCnt.toLocaleString(), String(next.cgnWtngSec / 60), next.oprCnt.toLocaleString(),
                        next.hrlyPrcsPsgCnt.toLocaleString(), String(next.recommend.reqCnt),
                        '10:30 이후', '보통', '1010'],
                    `${terminal} ${fcltType} ${variant.unitCd} matches future values by facility despite reordered results`);
            }
            check(cardViewAt('0910', currentCards, []).variants.every((variant) => variant.next === null), true,
                `${terminal} ${fcltType} missing future results never reuse current values`);
            const futureOnly = cardViewAt('0910', [], nextCards);
            check(futureOnly.variants.every((variant) => variant.current === null && variant.next !== null), true,
                `${terminal} ${fcltType} future-only facilities retain an unknown current state`);
            check(futureOnly.chips.every((chip) => chip.kind === 'gray'), true,
                `${terminal} ${fcltType} unknown current grades never use future chip colors`);
            const midnightCards = cardViewAt('2350', currentCards, nextCards);
            check(midnightCards.nextTime, '다음 날 00:50',
                `${terminal} ${fcltType} midnight comparison labels the next day`);
            check(midnightCards.variants.every((variant) => variant.next === null), true,
                `${terminal} ${fcltType} next-day data never wraps to the selected date`);
            const unknown = cardViewAt('0910', [{ ...currentCards[0], wtngPsgCnt: 0,
                oprCnt: 0, hrlyPrcsPsgCnt: 0, cgnStatus: null, cgnWtngSec: null, cgnClearTime: '', cgnClearRate: 0,
                recommend: { ...currentCards[0].recommend, reqCnt: null } }], []).variants[0].current;
            check([unknown.waitingCount, unknown.waitingTime, unknown.operatingCount, unknown.processRate.centerText,
                unknown.congestion, unknown.recommend.count, unknown.clearTime.centerText],
                ['0', '-', '0', '0', '-', '-', '-'],
                `${terminal} ${fcltType} distinguishes observed zero from unavailable metrics`);
            check(cardViewAt('0910', [{ ...currentCards[0], cgnWtngSec: 0 }], [])
                .variants[0].current.waitingTime, '0',
                `${terminal} ${fcltType} observed zero wait remains zero minutes`);
            check(cardViewAt('0910', [{ ...currentCards[0], cgnWtngSec: 125 }], [])
                .variants[0].current.waitingTime, '2',
                `${terminal} ${fcltType} waiting time converts seconds to whole minutes`);
        }
    }
    console.log(`Dashboard interval and facility comparison: ${assertions} checks passed.`);
} finally {
    await server.close();
}
