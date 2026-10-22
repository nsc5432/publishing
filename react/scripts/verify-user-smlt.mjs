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
    const { userSmltMock: api, mockExecutions, mockResources } = await server.ssrLoadModule('/src/api/pm/mock/userSmlt.mock.ts');
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
    check(first.smltId.length === 8 && first.smltFlfmtSttsCd === 'WAITING', 'new execution is waiting');
    check(ratio() === 30, 'changed area auto saves');
    const initialPax = api.getFltPsgInfo({ ymd }, 'T1').hourList.reduce((sum, hour) => sum + hour.psgCnt, 0);
    const expectedPax = (terminal, factor) => api.getFltPsgInfo({ ymd }, terminal).hourList.reduce((sum, hour) => sum + Math.round(hour.psgCnt * factor), 0);
    check(api.getFltPsgInfo({ ymd, smltId: first.smltId }, 'T1').psgCnt === expectedPax('T1', 1.3), 'resource contains edited first-terminal passengers');
    check(api.getFltPsgInfo({ ymd, smltId: first.smltId }, 'T2').psgCnt === expectedPax('T2', 1.2), 'resource uses saved second-terminal ratio');
    check(ratio('T1', ymd, first.smltId) === 0, 'resource passenger totals are not adjusted twice');
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
    const baseChkn = api.getChknCounterInfo({ ymd }, 'T1');
    const editedChkn = structuredClone(baseChkn.islandList);
    editedChkn[0].kioskCnt += 1;
    api.saveChknCounterInfo({ ymd, tmnlId: 'T1', islandList: editedChkn });
    check(api.getChknCounterInfo({ ymd }, 'T1').islandList[0].kioskCnt === editedChkn[0].kioskCnt, 'nonempty check-in conditions remain saved');
    api.saveChknCounterInfo({ ymd, tmnlId: 'T1', islandList: [] });
    check(JSON.stringify(api.getChknCounterInfo({ ymd }, 'T1')) === JSON.stringify(baseChkn), 'empty check-in save returns to operative defaults');
    const baseDep = api.getDepInfo({ ymd }, 'T1');
    const editedDep = structuredClone(baseDep.dptgtList);
    editedDep[0].scshCntom += 1;
    api.saveDepInfo({ ymd, tmnlId: 'T1', dptgtList: editedDep });
    check(api.getDepInfo({ ymd }, 'T1').dptgtList[0].scshCntom === editedDep[0].scshCntom, 'nonempty departure conditions remain saved');
    api.saveDepInfo({ ymd, tmnlId: 'T1', dptgtList: [] });
    check(JSON.stringify(api.getDepInfo({ ymd }, 'T1')) === JSON.stringify(baseDep), 'empty departure save returns to operative defaults');
    check(ratio() === 50 && api.getInfo(ymd, 'T1').saveDt !== '', 'clearing facilities retains flight conditions and their save time');
    const third = api.execute(request({
        chknList: [{ ymd, tmnlId: 'T2', islandList: [] }],
        depList: [{ ymd, tmnlId: 'T2', dptgtList: [] }],
    }));
    check(api.getFltPsgInfo({ ymd, smltId: first.smltId }, 'T1').psgCnt > initialPax, 'draft edits do not replace assigned resources');
    check(mockExecutions.get(first.smltId).resourceIds.T1 !== mockExecutions.get(third.smltId).resourceIds.T1, 'new execution gets a distinct resource');
    check(api.getChknCounterInfo({ ymd, smltId: third.smltId }, 'T1').islandList.length > 0, 'execution uses operative check-in defaults after empty save');
    check(api.getDepInfo({ ymd, smltId: third.smltId }, 'T1').dptgtList.length > 0, 'execution uses operative departure defaults after empty save');
    check(api.getChknCounterInfo({ ymd, smltId: third.smltId }, 'T2').islandList.length > 0 && api.getDepInfo({ ymd, smltId: third.smltId }, 'T2').dptgtList.length > 0, 'empty auto saves also resolve to operative defaults');
    check(api.getChknCounterInfo({ ymd, smltId: first.smltId }, 'T1').islandList.length > 0, 'new empty does not mutate older conditions');
    const inactiveChkn = api.getChknCounterInfo({ ymd: otherDay }, 'T2').islandList.map((island) => ({ ...island, oprTimeList: [] }));
    const inactiveDep = api.getDepInfo({ ymd: otherDay }, 'T2').dptgtList.map((gate) => ({ ...gate, oprYn: 'N', oprTimeList: [] }));
    api.saveChknCounterInfo({ ymd: otherDay, tmnlId: 'T2', islandList: inactiveChkn });
    api.saveDepInfo({ ymd: otherDay, tmnlId: 'T2', dptgtList: inactiveDep });
    check(api.getChknCounterInfo({ ymd: otherDay }, 'T2').islandList.every((island) => island.oprTimeList.length === 0) && api.getDepInfo({ ymd: otherDay }, 'T2').dptgtList.every((gate) => gate.oprYn === 'N'), 'nonempty inactive facilities do not fall back to operative data');
    check(api.getInfo(otherDay, 'T2').saveDt !== '', 'remaining facility rows supply save time');
    api.saveChknCounterInfo({ ymd: otherDay, tmnlId: 'T2', islandList: [] });
    api.saveDepInfo({ ymd: otherDay, tmnlId: 'T2', dptgtList: [] });
    check(api.getInfo(otherDay, 'T2').saveDt === '', 'empty saves without remaining rows leave no save time');
    const detached = api.getDepInfo({ ymd, smltId: first.smltId }, 'T1');
    detached.dptgtList.length = 0;
    check(api.getDepInfo({ ymd, smltId: first.smltId }, 'T1').dptgtList.length > 0, 'public DTO mutation cannot modify resource data');
    session.userId = 'verification-B';
    check(
        ratio() === -10 && api.getFltPsgInfo({ ymd, smltId: first.smltId }, 'T1').psgCnt > initialPax,
        'another user can read public resource but retains own draft',
    );
    const resource = mockResources.get(mockExecutions.get(first.smltId).resourceIds.T1);
    resource.dep.dptgtList.length = 0;
    check(api.getDepInfo({ ymd, smltId: first.smltId }, 'T1').dptgtList.length === 0, 'intentional source changes are reflected in execution condition views');

    const now = new Date();
    const day = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((v, i) => String(v).padStart(i === 0 ? 4 : 2, '0')).join('');
    const list = monitor.getExecList(day + '0000', day + '2359');
    const summary = monitor.getExecSmry(day + '0000', day + '2359');
    const all = [...list.stdList, ...list.userList];
    check(summary.totCnt === all.length, 'summary and list use the same period');
    check(summary.runningCnt === all.filter((row) => ['WAITING', 'RUNNING'].includes(row.smltFlfmtSttsCd)).length, 'waiting and running count matches rows');
    check(
        list.userList.some((row) => row.smltId === first.smltId),
        'new execution appears in public history',
    );
    const demo = list.userList.find((row) => row.smltId.startsWith('USR-'));
    check(Boolean(demo) && api.getDepInfo({ ymd: day, smltId: demo.smltId }, 'T1').dptgtList.length > 0, 'demo history also has resource references');
    const completed = list.userList.find((row) => row.smltId.startsWith('USR-') && row.smltFlfmtSttsCd === 'DONE');
    check(monitor.getExecDetail(completed.smltId).smltType === 'USER', 'completed request is visible before removal');
    const completedResources = mockExecutions.get(completed.smltId).resourceIds;
    mockExecutions.delete(completed.smltId);
    const remaining = monitor.getExecList(day + '0000', day + '2359');
    const remainingSummary = monitor.getExecSmry(day + '0000', day + '2359');
    check(![...remaining.stdList, ...remaining.userList].some((row) => row.smltId === completed.smltId), 'removed request is not recreated or classified as a daily execution');
    check(remainingSummary.totCnt === summary.totCnt - 1 && remainingSummary.doneCnt === summary.doneCnt - 1, 'removed request is excluded from monitoring counts');
    check(remainingSummary.runningCnt === summary.runningCnt, 'removing a completed request preserves the running count');
    assert.throws(() => monitor.getExecDetail(completed.smltId), /수행 이력을 찾을 수 없습니다/);
    assert.throws(() => monitor.getExecDetail('10009999'), /수행 이력을 찾을 수 없습니다/);
    check(Object.values(completedResources).every((id) => mockResources.has(id)), 'request removal preserves source resources');
    check(monitor.getExecDetail(list.stdList[0].smltId).smltType === 'DAILY', 'daily execution details remain available');
    const future = monitor.getExecList('209901010000', '209901012359');
    check(!future.userList.some((row) => row.smltId === first.smltId), 'period filter excludes new executions outside the period');

    const { toHistoryRows } = await server.ssrLoadModule('/src/modules/pm/pages/monitoring/view.ts');
    session.userId = mockExecutions.get(first.smltId).rgtrId;
    const ownWaiting = remaining.userList.find((row) => row.smltId === first.smltId);
    const otherWaiting = remaining.userList.find((row) => row.smltFlfmtSttsCd === 'WAITING' && row.rgtrId !== session.userId);
    const running = remaining.userList.find((row) => row.smltFlfmtSttsCd === 'RUNNING');
    const failed = remaining.userList.find((row) => row.smltFlfmtSttsCd === 'FAILED');
    const cancelled = remaining.userList.find((row) => row.smltFlfmtSttsCd === 'CANCELLED');
    const done = remaining.userList.find((row) => row.smltFlfmtSttsCd === 'DONE');
    check(toHistoryRows([ownWaiting, running, done, failed]).map((row) => row.status).join(',') === 'waiting,running,done,failed', 'waiting, executing, finished and failed map to separate labels');
    check(toHistoryRows([cancelled])[0].status === 'cancelled', 'CAST cancellation maps to a separate status');
    check(Boolean(cancelled.smltFlfmtEndDt), 'CAST cancellation has an end time');
    const { HistoryTable } = await server.ssrLoadModule('/src/modules/pm/pages/monitoring/components/HistoryTable.tsx');
    const { createElement } = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const renderHistory = (row, userId, cancelPending = false) => renderToStaticMarkup(createElement(HistoryTable, {
        kind: 'user', rows: toHistoryRows([row]), userId, cancelPending,
    }));
    const cancelButton = /<button[^>]*>취소<\/button>/g;
    check((renderHistory(ownWaiting, session.userId).match(cancelButton) ?? []).length === 1, 'own waiting request renders cancel button');
    check(!cancelButton.test(renderHistory(otherWaiting, session.userId)), 'other user waiting request hides cancel button');
    check(!cancelButton.test(renderHistory(ownWaiting, undefined)), 'unknown session hides cancel button');
    check(!cancelButton.test(renderHistory(running, running.rgtrId)), 'executing request hides cancel button');
    const cancelledMarkup = renderHistory(cancelled, cancelled.rgtrId);
    check(cancelledMarkup.includes('is-cancelled\">취소</div>'), 'CAST cancellation renders its label');
    check(!cancelButton.test(cancelledMarkup), 'CAST cancellation hides cancel button');
    check(/<button[^>]*disabled=""[^>]*>보기<\/button>/.test(cancelledMarkup), 'CAST cancellation disables result viewing');
    check(/<button[^>]*disabled=""[^>]*>취소<\/button>/.test(renderHistory(ownWaiting, session.userId, true)), 'pending cancellation disables cancel button');
    check(remaining.stdList.every((row) => row.smltFlfmtSttsCd === 'DONE'), 'daily history only contains received results');
    check(monitor.cancelUserSmlt(otherWaiting.smltId).error, 'cannot cancel another user waiting request');
    session.userId = running.rgtrId;
    check(monitor.cancelUserSmlt(running.smltId).error, 'cannot cancel own executing request');
    session.userId = done.rgtrId;
    check(monitor.cancelUserSmlt(done.smltId).error, 'cannot cancel own completed request');
    session.userId = failed.rgtrId;
    check(monitor.cancelUserSmlt(failed.smltId).error, 'cannot cancel own failed request');
    session.userId = cancelled.rgtrId;
    check(monitor.cancelUserSmlt(cancelled.smltId).error, 'cannot cancel own CAST-cancelled request');
    session.userId = ownWaiting.rgtrId;
    const cancelResources = mockExecutions.get(first.smltId).resourceIds;
    const savedRatio = ratio();
    check(!monitor.cancelUserSmlt(first.smltId).error, 'can cancel own waiting request');
    check(monitor.cancelUserSmlt(first.smltId).error, 'repeated cancellation fails');
    check(monitor.cancelUserSmlt('missing-request').error, 'missing request cannot be canceled');
    const stale = mockExecutions.get(otherWaiting.smltId);
    session.userId = otherWaiting.rgtrId;
    stale.detail.smltFlfmtSttsCd = 'RUNNING';
    check(monitor.cancelUserSmlt(otherWaiting.smltId).error, 'request that started after listing cannot be canceled');
    stale.detail.smltFlfmtSttsCd = 'WAITING';
    session.userId = ownWaiting.rgtrId;
    const afterCancel = monitor.getExecList(day + '0000', day + '2359');
    const afterCancelSummary = monitor.getExecSmry(day + '0000', day + '2359');
    check(!afterCancel.userList.some((row) => row.smltId === first.smltId), 'canceled request disappears from history');
    check(afterCancelSummary.totCnt === remainingSummary.totCnt - 1 && afterCancelSummary.runningCnt === remainingSummary.runningCnt - 1, 'cancellation refreshes total and waiting/running counts');
    check(ratio() === savedRatio, 'cancellation preserves saved current conditions');
    check(Object.values(cancelResources).every((id) => mockResources.has(id)), 'cancellation preserves published resources');
    session.userId = originalUser;
    console.log('User simulation scenarios passed: ' + assertions);
} finally {
    await server.close();
}
