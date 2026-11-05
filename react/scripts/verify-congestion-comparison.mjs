import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const server = await createServer({
    root,
    optimizeDeps: { noDiscovery: true, include: [] },
    configFile: false,
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    server: { middlewareMode: true, fs: { allow: [root] } },
    logLevel: 'error',
});
let assertions = 0;

function check(actual, expected, message) {
    assert.deepEqual(actual, expected, message);
    assertions += 1;
}

try {
    const { depHallMock } = await server.ssrLoadModule('/src/api/pm/mock/depHall.mock.ts');
    const { mapMock } = await server.ssrLoadModule('/src/api/pm/mock/map.mock.ts');
    const { mockCgnCmpr } = await server.ssrLoadModule('/src/api/pm/mock/cgnCmpr.mock.ts');
    const { toDepDay } = await server.ssrLoadModule('/src/modules/pm/pages/castSmry/departureHall/view.ts');
    const { toMapDay } = await server.ssrLoadModule('/src/modules/pm/pages/castSmry/terminalMap/view.ts');
    const { toCongestionStats } = await server.ssrLoadModule('/src/modules/pm/congestion/view.ts');

    for (const terminal of ['T1', 'T2']) {
        const depDto = depHallMock.getDepHall(terminal);
        const depDay = toDepDay(depDto);
        const mapDto = mapMock.getSmltMap(terminal);
        const mapDay = toMapDay({
            ...mapDto,
            slotList: depDto.slotList.map((slot) => ({
                ...mapDto.slotList.find((item) => item.hhmm === slot.hhmm),
                ...slot,
            })),
        });

        for (const slot of depDto.slotList) {
            for (const card of depDay.slots[slot.hhmm].map.cards) {
                const popup = mapDay.slots[slot.hhmm].dptgtGateDetails[card.dptgtNo];
                check(
                    card.stats.map(({ icon, isHighlighted, ...stat }) => ({
                        ico: icon,
                        ...(isHighlighted ? { point: true } : {}),
                        ...stat,
                    })),
                    popup.stats,
                    `${terminal} ${slot.hhmm} gate ${card.dptgtNo} shares popup metrics and comparisons`,
                );
            }
        }
    }

    const stat = { wtngPsgCnt: 25, wtngHr: 130, prcsPsgCnt: 60, prcsHr: 20 };
    const cmpr = { unitCnt: 4, totWtngPsgCnt: 100, avgPrcsPsgCnt: 40, avgWtngHr: 100, avgPrcsHr: 20 };
    const chipOf = ({ text, arrow, tone }) => [text, arrow, tone];
    const stats = toCongestionStats('출국장', stat, cmpr);
    check(
        stats.map(({ cmpr: item }) => chipOf(item)),
        [
            ['전체의 25%', null, 'even'],
            ['평균보다 30초', 'up', 'worse'],
            ['평균보다 20명', 'up', 'better'],
            ['평균 수준', null, 'even'],
        ],
        'share, deltas and equality; more processed passengers is better',
    );
    check(
        stats.map(({ point }) => point === true),
        [false, true, false, false],
        'only worse-than-average values are highlighted',
    );
    check(stats[1].cmpr.title, '출국장 평균 100초 · 30초 높음', 'chip title carries the average');
    check(
        chipOf(toCongestionStats('출국장', { ...stat, wtngHr: 70 }, cmpr)[1].cmpr),
        ['평균보다 30초', 'down', 'better'],
        'below-average waiting is better',
    );
    check(
        chipOf(toCongestionStats('출국장', { ...stat, wtngHr: 105 }, cmpr)[1].cmpr),
        ['평균 수준', null, 'even'],
        'differences within 10% are treated as average',
    );
    check(
        chipOf(toCongestionStats('출국장', { ...stat, wtngPsgCnt: 60 }, cmpr)[0].cmpr),
        ['전체의 60%', null, 'worse'],
        'queue share above the active-facility average is worse',
    );
    check(
        chipOf(toCongestionStats('출국장', { ...stat, wtngHr: 100 }, { ...cmpr, avgWtngHr: 100.4 })[1].cmpr),
        ['평균 수준', null, 'even'],
        'comparison uses the displayed rounded average',
    );

    const empty = { unitCnt: 0, totWtngPsgCnt: 0, avgPrcsPsgCnt: null, avgWtngHr: null, avgPrcsHr: null };
    check(mockCgnCmpr([]), empty, 'no facilities yield unavailable averages');
    check(
        toCongestionStats('출국장', stat, empty).map(({ cmpr: item }) => chipOf(item)),
        [
            ['전체 0명', null, 'even'],
            ['평균 -', null, 'even'],
            ['평균 -', null, 'even'],
            ['평균 -', null, 'even'],
        ],
        'unavailable comparisons remain unavailable',
    );
    check(
        chipOf(toCongestionStats('출국장', stat, { ...cmpr, avgWtngHr: 0 })[1].cmpr),
        ['평균보다 130초', 'up', 'worse'],
        'zero average still yields a direction',
    );

    const row = (unitCd, oprBoothCnt, values) => ({ unitCd, oprBoothCnt, stat: values });
    const weighted = mockCgnCmpr([
        row('1', 1, { wtngPsgCnt: 10, wtngHr: 20, prcsPsgCnt: 10, prcsHr: 30 }),
        row('2', 0, { wtngPsgCnt: 20, wtngHr: 100, prcsPsgCnt: 30, prcsHr: 10 }),
        row('3', 0, { wtngPsgCnt: 30, wtngHr: 0, prcsPsgCnt: 0, prcsHr: 0 }),
        row('4', 1, { wtngPsgCnt: 0, wtngHr: 0, prcsPsgCnt: 0, prcsHr: 0 }),
    ]);
    check(
        weighted,
        {
            unitCnt: 3,
            totWtngPsgCnt: 60,
            avgPrcsPsgCnt: 40 / 3,
            avgWtngHr: 80,
            avgPrcsHr: 15,
        },
        'queue total includes all facilities; averages exclude inactive facilities and weight times by passengers',
    );
    console.log(`Congestion comparison: ${assertions} assertions passed.`);
} finally {
    await server.close();
}
