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

try {
    const { dashboardMock: api } = await server.ssrLoadModule('/src/api/pm/mock/dashboard.mock.ts');
    const { toTerminalView, toPrimeTime } = await server.ssrLoadModule('/src/modules/pm/pages/castSmry/dashboard/view.ts');
    const smryAt = (time, terminal = 'T1') => api.getTmnlSmry(terminal, time, 60);
    const viewAt = (time, smry = smryAt(time), category = 'PSG') => toTerminalView({
        ymd: '20260710', hhmm: time, smry,
        rsltList: api.getTmnlRsltByTime(smry.tmnlId, category),
        chknCards: [], dptgtCards: [],
    });
    const metrics = (smry) => [smry.intrvlMaxWtngPsgCnt, smry.intrvlAvgWtngSec, smry.intrvlPrcsPsgCnt];
    const values = (view) => view.summaryInfo.map((cell) => cell.value);

    check(metrics(smryAt('0800')), [322, 2400, 2412], '08:00 uses its own one-hour results');
    check(metrics(smryAt('0900')), [301, 2280, 2259], '09:00 updates all three interval metrics');
    check(smryAt('0800').peak, smryAt('0900').peak, 'daily peak remains independent of search time');
    check(values(viewAt('0900')), ['301', '65', '2,259'], 'summary uses interval counts and representative facility wait');
    check(viewAt('0900').summaryInfo.map((cell) => cell.label),
        ['최대\n대기인원', '평균\n대기시간', '시간당\n처리인원'], 'summary labels describe the metrics');

    const shifted = smryAt('0910');
    check(shifted.intrvlMaxWtngPsgCnt, 301, 'maximum queue is not accumulated across time');
    check(shifted.intrvlPrcsPsgCnt, 2195, '09:10 to 10:10 includes overlapping parts of both hours');
    check(shifted.intrvlAvgWtngSec, (2280 * 2259 * 5 + 1860 * 1872) / (2259 * 5 + 1872),
        'average wait is weighted by processed passengers');
    check(metrics(smryAt('2350')), [22, 180, 27], 'late-night range stops at midnight');
    check(viewAt('2350').barText.endsWith('PM'), true, 'search-time marker uses its own AM/PM');
    check(values(viewAt('0300')), ['0', '65', '0'], 'zero interval counts preserve representative facility wait');
    check(values(viewAt('0900', { ...smryAt('0900'),
        intrvlMaxWtngPsgCnt: null, intrvlAvgWtngSec: null, intrvlPrcsPsgCnt: null, cgnWtngSec: null,
    })), ['-', '-', '-'], 'unknown interval results never fall back to daily peak');

    for (const [category, expectedTime] of [['PSG', '0800'], ['FLT', '0900'], ['CHKN', '1000'], ['DEP', '1100']]) {
        const time = toPrimeTime(['T1', 'T2'].map((terminal) => api.getTmnlRsltByTime(terminal, category)), category);
        check(time, expectedTime, `${category} Prime Time selects its peak hour`);
        check(values(viewAt(time, smryAt(time), category)), values(viewAt(time)),
            `${category} Prime Time summary uses the newly selected search time`);
        check(smryAt(time).peak, smryAt('0900').peak, `${category} Prime Time preserves daily peak information`);
    }
    check(metrics(smryAt('0900', 'T2')), [262, 1980, 1962], 'second terminal has independent interval results');

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
    console.log(`Dashboard interval mock/view: ${assertions} checks passed.`);
} finally {
    await server.close();
}
