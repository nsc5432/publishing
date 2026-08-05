/* =====================================================================
   사용자 시뮬레이션 리뉴얼 시안 — 공용 마크업 생성기
   시안 5장이 같은 셸(GNB/LNB/탭바)과 같은 블럭 차트를 쓰므로 여기서 만든다.
   화면 동작은 없다. 정지 상태를 그리기 위한 용도.
   ===================================================================== */

/* ── 아이콘 ────────────────────────────────────────────────────────── */
var ICON = {
    chart:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5.5-6 4 3.5L21 6"/><path d="M21 6h-4.5"/><path d="M21 6v4.5"/></svg>',
    user:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.2" r="3.6"/><path d="M4.8 20c.9-3.8 3.8-5.8 7.2-5.8s6.3 2 7.2 5.8"/></svg>',
    monitor:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2.8" y="4.2" width="18.4" height="12.4" rx="2.2"/><path d="M9 20h6"/><path d="M12 16.6V20"/></svg>',
    pin:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c4.2-4.6 6.3-8 6.3-10.6A6.3 6.3 0 0 0 5.7 10.4C5.7 13 7.8 16.4 12 21z"/><circle cx="12" cy="10.2" r="2.3"/></svg>',
    logout:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4.5H6.2A1.7 1.7 0 0 0 4.5 6.2v11.6A1.7 1.7 0 0 0 6.2 19.5h8.3"/><path d="M17.5 15.5 21 12l-3.5-3.5"/><path d="M21 12h-9.5"/></svg>',
    search:
        '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6"/><path d="M15.2 15.2 20 20"/></svg>',
    play: '<svg viewBox="0 0 11 13" fill="#fff"><path d="M0 0v13l11-6.5z"/></svg>',
    map:
        '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linejoin="round"><path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z"/><path d="M9 4v13.5"/><path d="M15 6.5V20"/></svg>',
    close:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    calendar:
        '<svg viewBox="0 0 24 24" fill="none" stroke="#5a5f6b" stroke-width="1.7" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.4"/><path d="M3.5 9.6h17M8 3.5v3M16 3.5v3"/></svg>',
    /* 터미널 뱃지 안 실루엣 */
    terminal:
        '<svg viewBox="0 0 100 60" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round">' +
        '<path fill="none" d="M8 46c0-22 18.8-34 42-34s42 12 42 34"/>' +
        '<path fill="none" d="M4 46h92"/>' +
        '<path fill="none" d="M31 46V27M69 46V27"/></svg>',
};

/* ── 상단 GNB + 좌측 LNB + 탭바 ──────────────────────────────────── */
var TABS = ['운항편/여객수', '체크인 카운터', '출국장'];

function gnbHTML() {
    return (
        '<header class="gnb">' +
        '<h1 class="gnb__title">PM 예측관리 / 사용자 시뮬레이션</h1>' +
        '<div class="gnb__center"><div class="date-picker">' +
        '<span class="date-picker__label">기준일자</span>' +
        '<span style="width:18px;height:18px;display:block">' + ICON.calendar + '</span>' +
        '<span class="date-picker__value">2024/10/23</span>' +
        '<span class="date-picker__search"><span style="width:16px;height:16px;display:block">' +
        ICON.search + '</span></span>' +
        '</div></div>' +
        '<div class="gnb__right">' +
        '<button class="btn btn--run"><span style="width:11px;height:13px;display:block">' +
        ICON.play + '</span>시뮬레이션 실행</button>' +
        '<a class="gnb__link" href="#">시뮬레이션 이력</a>' +
        '</div></header>'
    );
}

function sidebarHTML() {
    return (
        '<aside class="sidebar"><div class="sidebar-inner"><ul class="nav-list">' +
        '<li><span class="nav-item">' + ICON.chart + '</span></li>' +
        '<li><span class="nav-item active">' + ICON.user + '</span></li>' +
        '<li><span class="nav-item">' + ICON.monitor + '</span></li>' +
        '<li><span class="nav-item">' + ICON.pin + '</span></li>' +
        '</ul><span class="nav-item nav-toggle">' + ICON.logout + '</span></div></aside>'
    );
}

function tabsHTML(active) {
    var html = '<nav class="tabs">';
    TABS.forEach(function (label) {
        html +=
            '<button class="tabs__item' + (label === active ? ' is-active' : '') + '">' +
            label + '</button>';
    });
    return html + '</nav>';
}

function panelHead(kind, groups, withMap) {
    var html =
        '<div class="panel__head"><div class="terminal-badge terminal-badge--' + kind + '">' +
        ICON.terminal + '</div><div class="summary">';
    groups.forEach(function (g) {
        html +=
            '<p class="summary__group"><span class="summary__label">' + g[0] + '</span>' +
            '<strong class="summary__value' + (g[2] ? ' summary__value--accent' : '') + '">' +
            g[1] + '</strong></p>';
    });
    if (withMap) {
        html +=
            '<span class="summary__map"><span style="width:17px;height:17px;display:block">' +
            ICON.map + '</span></span>';
    }
    return html + '</div></div>';
}

/* ── 블럭 차트 ────────────────────────────────────────────────────
   items: [{ label, level, color, from, to }]  level 1 = 맨 아래 단, to 는 미포함
   opts : { levels, unit, title, legend, picking, sel:{label,hour}, hover:{hour,level,tip} }
   ------------------------------------------------------------------ */
function blockChart(items, opts) {
    opts = opts || {};
    var levels = opts.levels || 8;
    var rowH = opts.rowH || 30;

    var html = '<div class="bchart' + (opts.picking ? ' is-picking' : '') + '">';

    /* 헤드 + 범례 */
    html += '<div class="bchart__head"><p class="bchart__title">' + opts.title + '</p>';
    html += '<span class="bchart__unit">' + (opts.unit || '') + '</span>';
    if (opts.legend) {
        html += '<div class="legend">';
        opts.legend.forEach(function (l) {
            html +=
                '<span class="legend__chip"><i class="legend__dot" style="background:var(--' +
                l.color + ')"></i><b>' + l.label + '</b>' + (l.note ? ' ' + l.note : '') +
                '</span>';
        });
        html += '</div>';
    }
    html += '</div>';

    /* Y축 */
    html += '<div class="bchart__body"><div class="bchart__yaxis" style="height:' +
        levels * rowH + 'px">';
    for (var y = 0; y <= levels; y++) html += '<span>' + y + '</span>';
    html += '</div>';

    /* 플롯 — 가로 눈금선 간격도 행 높이에 맞춘다 */
    html += '<div class="bchart__plot" style="grid-template-rows:repeat(' + levels + ',' + rowH +
        'px);--blk-h:' + (rowH - 6) + 'px;--blk-fs:' + (opts.blkFs || 12) +
        'px;background:repeating-linear-gradient(to top,#e9ebf2 0 1px,transparent 1px ' +
        rowH + 'px)">';
    items.forEach(function (it) {
        for (var h = it.from; h < it.to; h++) {
            var isSel = opts.sel && opts.sel.label === it.label;
            var isHover = opts.hover && opts.hover.hour === h && opts.hover.level === it.level;
            html +=
                '<span class="blk blk--' + it.color +
                (isSel ? ' is-sel' : '') + (isHover ? ' blk--hover' : '') +
                '" style="grid-column:' + (h + 1) + ';grid-row:' + (levels - it.level + 1) + '">' +
                it.label +
                (isHover ? '<span class="blk__tip">' + opts.hover.tip + '</span>' : '') +
                '</span>';
        }
    });
    html += '</div></div>';

    /* X축 */
    html += '<div class="bchart__scale">';
    for (var t = 0; t <= 24; t += 2) {
        html += '<span>' + (t < 10 ? '0' + t : t) + '</span>';
    }
    html += '</div>';

    /* 하단 안내 */
    if (opts.foot !== false) {
        html +=
            '<div class="bchart__foot"><strong>' + (opts.footText || '') + '</strong>' +
            '<span class="bchart__adv">세부 운영시간 직접 설정 →</span></div>';
    }

    return html + '</div>';
}

/* ── 24슬롯 timebar ──────────────────────────────────────────────── */
function timebar(label, value, ranges) {
    var on = {};
    ranges.forEach(function (r) {
        for (var h = r[0]; h < r[1]; h++) on[h] = true;
    });
    var html =
        '<div class="timebar"><p class="timebar__head"><span class="timebar__label">' +
        label + '</span><strong class="timebar__value">' + value + '</strong></p>' +
        '<div class="timebar__track">';
    for (var i = 0; i < 24; i++) {
        html += '<span class="timebar__slot' + (on[i] ? ' is-on' : '') + '"></span>';
    }
    html += '</div><div class="timebar__scale">';
    ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'].forEach(function (t) {
        html += '<span>' + t + '</span>';
    });
    return html + '</div></div>';
}

/* ── 페이지 골격 조립 ────────────────────────────────────────────── */
function renderShell(activeTab, panelsHTML, drawerHTML) {
    document.body.innerHTML =
        '<div class="bg-deco"></div><div class="shell">' +
        gnbHTML() +
        '<div class="body">' +
        sidebarHTML() +
        '<div class="content">' +
        tabsHTML(activeTab) +
        '<div class="panels">' + panelsHTML + '</div>' +
        (drawerHTML || '') +
        '</div></div></div>';
}
