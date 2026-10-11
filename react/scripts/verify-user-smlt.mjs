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
function check(value, message) {
    assert.ok(value, message);
    assertions += 1;
}
try {
    const { userSmltMock: api, mockExecutions } = await server.ssrLoadModule('/src/api/pm/mock/userSmlt.mock.ts');
    const { monitoringMock: monitor } = await server.ssrLoadModule('/src/api/pm/mock/monitoring.mock.ts');
    const { commonMock } = await server.ssrLoadModule('/src/api/pm/mock/common.mock.ts');
    const session = commonMock.getUserInfoBySession();
    const originalUser = session.userId;
    const ymd = '20261011';
    const otherDay = '20261012';
    const request = (edits = {}) => ({ ymd, fltPsgList: [], chknList: [], depList: [], ...edits });
    const ratio = (terminal = 'T1', date = ymd, smltId) => api.getFltPsgInfo({ ymd: date, smltId }, terminal).ajmtRt;
    session.userId = 'verification-A';
    check(ratio() === 0, 'unsaved ratio defaults to zero');
    api.saveFltPsgInfo({ ymd, tmnlId: 'T1', ajmtRt: 10 });
    api.saveFltPsgInfo({ ymd, tmnlId: 'T2', ajmtRt: 20 });
    check(ratio('T1', otherDay) === 0, 'other date remains independent');
    session.userId = 'verification-B';
    check(ratio() === 0, 'other owner cannot read current draft');
    api.saveFltPsgInfo({ ymd, tmnlId: 'T1', ajmtRt: -10 });
    session.userId = 'verification-A';
    check(ratio() === 10 && ratio('T2') === 20, 'owner and terminal drafts stay separate');

    const first = api.execute(request({ fltPsgList: [{ ymd, tmnlId: 'T1', ajmtRt: 30 }] }));
    check(first.smltId.length === 8 && first.smltFlfmtSttsCd === 'RUNNING', 'execution has a new eight-digit ID');
    check(ratio() === 30, 'changed area auto saves');
    check(ratio('T1', ymd, first.smltId) === 30 && ratio('T2', ymd, first.smltId) === 20, 'snapshot combines edits and saved second terminal');
    check(api.getChknCounterInfo({ ymd, smltId: first.smltId }, 'T2').islandList.length > 0, 'unvisited area uses operative defaults');
    const second = api.execute(request());
    check(second.smltId !== first.smltId && mockExecutions.size === 2, 'additional active execution is allowed');

    assert.throws(() => api.execute({ ...request(), ymd: '20260230' }));
    check(mockExecutions.size === 2, 'invalid date creates no execution');
    assert.throws(() =>
        api.execute(
            request({
                fltPsgList: [
                    { ymd, tmnlId: 'T1', ajmtRt: 1 },
                    { ymd, tmnlId: 'T1', ajmtRt: 2 },
                ],
            }),
        ),
    );
    check(ratio() === 30, 'duplicate terminal request does not change the draft');
    const before = mockExecutions.size;
    assert.throws(() =>
        api.execute(
            request({
                fltPsgList: [
                    { ymd, tmnlId: 'T1', ajmtRt: 40 },
                    { ymd, tmnlId: 'T2', ajmtRt: 999 },
                ],
            }),
        ),
    );
    check(mockExecutions.size === before && ratio() === 30, 'failed auto save leaves no partial execution or draft');

    api.saveFltPsgInfo({ ymd, tmnlId: 'T1', ajmtRt: 50 });
    api.saveChknCounterInfo({ ymd, tmnlId: 'T1', islandList: [] });
    const third = api.execute(request());
    check(ratio('T1', ymd, first.smltId) === 30, 'editing and rerunning preserve past ratio');
    check(api.getChknCounterInfo({ ymd, smltId: third.smltId }, 'T1').islandList.length === 0, 'explicit saved empty is preserved');
    check(api.getChknCounterInfo({ ymd, smltId: first.smltId }, 'T1').islandList.length > 0, 'new empty does not mutate older conditions');
    const detached = api.getDepInfo({ ymd, smltId: first.smltId }, 'T1');
    detached.dptgtList.length = 0;
    check(api.getDepInfo({ ymd, smltId: first.smltId }, 'T1').dptgtList.length > 0, 'public DTO mutation cannot modify archived conditions');
    session.userId = 'verification-B';
    check(ratio() === -10 && ratio('T1', ymd, first.smltId) === 30, 'another user can read public execution but retains own draft');

    const now = new Date();
    const day = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((v, i) => String(v).padStart(i === 0 ? 4 : 2, '0')).join('');
    const list = monitor.getExecList(day + '0000', day + '2359');
    const summary = monitor.getExecSmry(day + '0000', day + '2359');
    const all = [...list.stdList, ...list.userList];
    check(summary.totCnt === all.length, 'summary and list use the same period');
    check(summary.runningCnt === all.filter((row) => row.smltFlfmtSttsCd === 'RUNNING').length, 'running count matches rows');
    check(
        list.userList.some((row) => row.smltId === first.smltId),
        'new execution appears in public history',
    );
    const demo = list.userList.find((row) => row.smltId.startsWith('USR-'));
    check(Boolean(demo) && api.getDepInfo({ ymd: day, smltId: demo.smltId }, 'T1').dptgtList.length > 0, 'demo history also has immutable conditions');
    const future = monitor.getExecList('209901010000', '209901012359');
    check(!future.userList.some((row) => row.smltId === first.smltId), 'period filter excludes new executions outside the period');
    session.userId = originalUser;
    console.log('User simulation scenarios passed: ' + assertions);
} finally {
    await server.close();
}
