import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const server = await createServer({
    root,
    configFile: false,
    optimizeDeps: { noDiscovery: true, include: [] },
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    server: { middlewareMode: true, fs: { allow: [root] } },
    logLevel: 'error',
});

try {
    const { toUserExecAverage, toHistoryRows } = await server.ssrLoadModule('/src/modules/pm/pages/monitoring/view.ts');
    const { HistoryTable } = await server.ssrLoadModule('/src/modules/pm/pages/monitoring/components/HistoryTable.tsx');
    const { MonitoringGnb } = await server.ssrLoadModule('/src/modules/pm/pages/monitoring/components/MonitoringGnb.tsx');
    const { defaultRange, REFRESH_SECONDS } = await server.ssrLoadModule('/src/modules/pm/pages/monitoring/options.ts');
    const done = {
        rowNum: 1, smltId: '1', smltType: 'USER', rgtrId: 'user', deptNm: '부서', userNm: '사용자',
        smltFlfmtBgngDt: '20261101120000', smltFlfmtEndDt: '20261101121030',
        execMin: 11, smltFlfmtSttsCd: 'DONE',
    };
    const running = { ...done, smltId: '2', smltFlfmtSttsCd: 'RUNNING', smltFlfmtEndDt: '' };
    const average = toUserExecAverage([
        done,
        { ...done, smltFlfmtEndDt: '20261101121930' },
        { ...done, smltType: 'DAILY', smltFlfmtEndDt: '20261101123000' },
        { ...done, smltFlfmtSttsCd: 'FAILED' },
        { ...done, smltFlfmtEndDt: '' },
        { ...done, smltFlfmtEndDt: '20261101115959' },
        { ...done, smltFlfmtEndDt: done.smltFlfmtBgngDt },
        { ...done, smltFlfmtEndDt: '20261131120000' },
        running,
    ]);
    assert.deepEqual(average, { seconds: 900, sampleCount: 2, label: '15분 00초' });
    assert.deepEqual(toUserExecAverage([]), { seconds: null, sampleCount: 0, label: '-' });
    assert.equal(toUserExecAverage([done]).seconds, 630);
    assert.equal(toUserExecAverage([{
        ...done, smltFlfmtBgngDt: '20261031235500', smltFlfmtEndDt: '20261101000500',
    }]).seconds, 600);

    const now = Date.parse('2026-11-01T12:07:30+09:00');
    const percent = (row = running, seconds = 900, timestamp = now) =>
        toHistoryRows([row], seconds, timestamp)[0].progressPercent;
    assert.equal(percent(), 50);
    assert.equal(percent(running, 900, Date.parse('2026-11-01T12:00:00+09:00')), 0);
    assert.equal(percent(running, 900, now + 60 * 60 * 1000), 99);
    assert.equal(percent(running, null), null);
    assert.equal(percent(running, 0), null);
    assert.equal(percent({ ...running, smltFlfmtBgngDt: '' }), null);
    assert.equal(percent({ ...running, smltFlfmtBgngDt: '20260230120000' }), null);
    assert.equal(percent({ ...running, smltFlfmtBgngDt: '20261101130000' }), null);
    assert.equal(percent({ ...running, smltFlfmtSttsCd: 'WAITING' }), null);
    assert.equal(percent(done), null);
    assert.equal(percent({ ...running, smltType: 'DAILY' }), null);

    const render = (component, props) => renderToStaticMarkup(createElement(component, props));
    const collapsed = render(HistoryTable, { kind: 'standard', rows: [], collapsed: true });
    assert.match(collapsed, /aria-expanded="false"/);
    assert.match(collapsed, /id="monitoring-standard-history" hidden=""/);
    assert.match(collapsed, /일일 시뮬레이션 펼치기/);
    const expanded = render(HistoryTable, { kind: 'standard', rows: [], collapsed: false });
    assert.match(expanded, /aria-expanded="true"/);
    assert.doesNotMatch(expanded, /hidden=""/);
    const userHtml = render(HistoryTable, {
        kind: 'user', rows: toHistoryRows([running], average.seconds, now), userAverage: average,
    });
    assert.match(userHtml, /사용자 평균 수행시간/);
    assert.match(userHtml, /15분 00초/);
    assert.match(userHtml, /약 50%/);
    assert.match(userHtml, /<progress max="100" value="50"/);
    assert.match(render(HistoryTable, { kind: 'user', rows: toHistoryRows([running]) }), /산정 불가/);
    const header = render(MonitoringGnb, { title: '모니터링', range: defaultRange(), refreshSeconds: 30 });
    assert.deepEqual(REFRESH_SECONDS, [10, 30, 60, 90, 120, 180, 300]);
    for (const seconds of REFRESH_SECONDS) assert.match(header, new RegExp(`>${seconds}초</option>`));
    assert.match(header, /<option value="30" selected=""/);
    console.log('Monitoring verification passed: user averages, KST timestamps, progress bounds, collapsed tables and refresh options.');
} finally {
    await server.close();
}
