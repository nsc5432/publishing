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

/* groups : [[라벨, 값, accent?]]            — 구성 지표 (전체 카운터 / 운영 아일랜드 …)
   kpis   : [[라벨, 값, 단위]]                — 시뮬레이션 결과 지표 (평균대기 / P95대기 …)
   결과 지표는 구성 지표 오른쪽에 세로 구분선을 두고 붙는다. 헤더 높이는 그대로 62px. */
function panelHead(kind, groups, withMap, kpis) {
    var html =
        '<div class="panel__head"><div class="terminal-badge terminal-badge--' + kind + '">' +
        ICON.terminal + '</div><div class="summary">';
    groups.forEach(function (g) {
        html +=
            '<p class="summary__group"><span class="summary__label">' + g[0] + '</span>' +
            '<strong class="summary__value' + (g[2] ? ' summary__value--accent' : '') + '">' +
            g[1] + '</strong></p>';
    });
    if (kpis && kpis.length) {
        html += '<span class="summary__divider"></span><div class="summary__kpis">';
        kpis.forEach(function (k) {
            html +=
                '<p class="summary__kpi"><span>' + k[0] + '</span>' +
                '<b>' + k[1] + '<em>' + k[2] + '</em></b></p>';
        });
        html += '</div>';
    }
    if (withMap) {
        html +=
            '<span class="summary__map"><span style="width:17px;height:17px;display:block">' +
            ICON.map + '</span></span>';
    }
    return html + '</div></div>';
}

/* ── 대기인원수 꺾은선 오버레이 ──────────────────────────────────
   블럭 차트 위에 겹쳐 그린다. 선은 종횡비가 찌그러진 viewBox 를 쓰므로
   non-scaling-stroke 로 굵기를 고정하고, 점은 원이 타원이 되지 않도록
   SVG 가 아니라 HTML 로 얹는다.
   ------------------------------------------------------------------ */
function waitLine(line) {
    var max = line.max || Math.max.apply(null, line.data) || 1;
    var y = function (v) { return (100 - (v / max) * 100).toFixed(2); };

    var pts = line.data.map(function (v, h) { return (h + 0.5).toFixed(2) + ',' + y(v); });

    var html =
        '<div class="bchart__line"><svg viewBox="0 0 24 100" preserveAspectRatio="none">' +
        '<polyline points="' + pts.join(' ') + '"/></svg>';

    /* 점은 2시간 간격 + 피크에만 — 24개를 다 찍으면 블럭을 덮는다 */
    var peak = line.data.indexOf(Math.max.apply(null, line.data));
    line.data.forEach(function (v, h) {
        if (h % 2 !== 0 && h !== peak) return;
        html += '<i style="left:' + (((h + 0.5) / 24) * 100).toFixed(2) +
            '%;bottom:' + (100 - y(v)).toFixed(2) + '%"></i>';
    });

    html += '<span class="bchart__peak" style="left:' + (((peak + 0.5) / 24) * 100).toFixed(2) +
        '%;bottom:' + (100 - y(line.data[peak])).toFixed(2) + '%">최대 ' +
        line.data[peak] + (line.unit || '명') + '</span>';

    return html + '</div>';
}

/* ── 블럭 차트 ────────────────────────────────────────────────────
   items: [{ label, color, from, to, size }]   to 는 미포함, size = 그 시설의 실제 규모
   블럭은 시간대별로 아래에서부터 쌓인다. 블럭 개수 = ceil(size / unitSize) 라서
   오픈 시설이 많은 아일랜드는 같은 시간대에 여러 칸을 차지한다.
   opts : { levels, rowH, blkFs, unitSize, unitNote, unit, title, legend, compact,
            line:{data,max,unit,label}, actions:[[종류,문구]], foot:false,
            picking, sel:{label}, hover:{label,hour,tip} }
   ------------------------------------------------------------------ */
function blockChart(items, opts) {
    opts = opts || {};
    var levels = opts.levels || 8;
    var rowH = opts.rowH || 30;
    var unitSize = opts.unitSize || 1;
    var compact = !!opts.compact;

    var html = '<div class="bchart' + (compact ? ' bchart--compact' : '') +
        (opts.picking ? ' is-picking' : '') + '">';

    /* 헤드 + 범례 */
    html += '<div class="bchart__head"><p class="bchart__title">' + opts.title + '</p>';
    html += '<span class="bchart__unit">' + (opts.unit || '') + '</span>';
    if (opts.unitNote) {
        html += '<span class="bchart__unitnote">' + opts.unitNote + '</span>';
    }
    if (opts.legend || opts.line) {
        html += '<div class="legend">';
        (opts.legend || []).forEach(function (l) {
            html +=
                '<span class="legend__chip"><i class="legend__dot" style="background:var(--' +
                l.color + ')"></i><b>' + l.label + '</b>' + (l.note ? ' ' + l.note : '') +
                '</span>';
        });
        if (opts.line) {
            html += '<span class="legend__chip legend__chip--line"><i class="legend__line"></i>' +
                '<b>' + (opts.line.label || '대기인원수') + '</b> ' +
                (opts.line.unit || '명') + '</span>';
        }
        html += '</div>';
    }
    if (opts.headExtra) html += opts.headExtra;
    /* 범례가 없는 보조 차트는 액션을 헤드에 둔다 (푸터 한 줄을 아낀다) */
    if (opts.headActions) {
        html += '<div class="bchart__acts">';
        opts.headActions.forEach(function (a) {
            html += '<span class="bchart__act bchart__act--' + a[0] + '">' + a[1] + '</span>';
        });
        html += '</div>';
    }
    html += '</div>';

    /* 좌측 Y축 = 시설수 */
    html += '<div class="bchart__body"><div class="bchart__yaxis" style="height:' +
        levels * rowH + 'px">';
    for (var y = 0; y <= levels; y++) html += '<span>' + y + '</span>';
    html += '</div>';

    /* 플롯 — 가로 눈금선 간격도 행 높이에 맞춘다 */
    html += '<div class="bchart__plot" style="grid-template-rows:repeat(' + levels + ',' + rowH +
        'px);--blk-h:' + (rowH - (compact ? 4 : 6)) + 'px;--blk-fs:' + (opts.blkFs || 12) +
        'px;background:repeating-linear-gradient(to top,#e9ebf2 0 1px,transparent 1px ' +
        rowH + 'px)">';

    var stack = [];
    items.forEach(function (it) {
        var n = Math.max(1, Math.ceil((it.size || 1) / unitSize));
        var isSel = opts.sel && opts.sel.label === it.label;
        for (var h = it.from; h < it.to; h++) {
            var base = stack[h] || 0;
            for (var k = 0; k < n; k++) {
                var row = levels - (base + k);
                if (row < 1) continue; /* 축을 넘치면 그리지 않는다 */
                /* 툴팁은 그 시설이 그 시간에 차지한 맨 윗칸에만 */
                var isTip = opts.hover && opts.hover.label === it.label &&
                    opts.hover.hour === h && k === n - 1;
                html +=
                    '<span class="blk blk--' + it.color +
                    (isSel ? ' is-sel' : '') + (isTip ? ' blk--hover' : '') +
                    '" style="grid-column:' + (h + 1) + ';grid-row:' + row + '">' +
                    (compact ? '' : it.label) +
                    (isTip ? '<span class="blk__tip">' + opts.hover.tip + '</span>' : '') +
                    '</span>';
            }
            stack[h] = base + n;
        }
    });

    if (opts.line) html += waitLine(opts.line);
    html += '</div>';

    /* 우측 Y축 = 대기인원수 */
    if (opts.line) {
        var max = opts.line.max || Math.max.apply(null, opts.line.data);
        html += '<div class="bchart__yaxis bchart__yaxis--right" style="height:' +
            levels * rowH + 'px">';
        for (var r = 0; r <= 4; r++) html += '<span>' + Math.round((max * r) / 4) + '</span>';
        html += '</div>';
    }
    html += '</div>';

    /* X축 — 바로 위 차트와 시간축이 같으면 scale:false 로 생략한다 */
    if (opts.scale !== false) {
        html += '<div class="bchart__scale"' + (opts.line ? ' style="margin-right:40px"' : '') + '>';
        for (var t = 0; t <= 24; t += 2) {
            html += '<span>' + (t < 10 ? '0' + t : t) + '</span>';
        }
        html += '</div>';
    }

    /* 하단 안내 + 액션 */
    if (opts.foot !== false) {
        html += '<div class="bchart__foot"><strong>' + (opts.footText || '') + '</strong>' +
            '<div class="bchart__acts">';
        (opts.actions || [['adv', '세부 운영시간 직접 설정 →']]).forEach(function (a) {
            html += '<span class="bchart__act bchart__act--' + a[0] + '">' + a[1] + '</span>';
        });
        html += '</div></div>';
    }

    return html + '</div>';
}

/* ── 24슬롯 timebar ──────────────────────────────────────────────────
   opts.values = { 시각: 값 } 을 주면 운영 슬롯 안에 숫자를 찍는다.
   (출국장 상세의 '시간대별 보안검색대 대수' 표현) */
function timebar(label, value, ranges, opts) {
    opts = opts || {};
    var vals = opts.values;
    var on = {};
    ranges.forEach(function (r) {
        for (var h = r[0]; h < r[1]; h++) on[h] = true;
    });
    var html =
        '<div class="timebar' + (vals ? ' timebar--valued' : '') +
        '"><p class="timebar__head"><span class="timebar__label">' +
        label + '</span><strong class="timebar__value">' + value + '</strong></p>' +
        '<div class="timebar__track">';
    for (var i = 0; i < 24; i++) {
        html += '<span class="timebar__slot' + (on[i] ? ' is-on' : '') + '">' +
            (vals && on[i] && vals[i] != null ? '<b>' + vals[i] + '</b>' : '') + '</span>';
    }
    html += '</div><div class="timebar__scale">';
    ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'].forEach(function (t) {
        html += '<span>' + t + '</span>';
    });
    return html + '</div></div>';
}

/* ── 부스 ↔ 항공사 배정 그리드 ───────────────────────────────────────
   참고자료는 부스를 가로 18열로 늘어놓지만 드로어 폭이 380px 이라
   3열 컴팩트 그리드로 접는다. air 가 없으면 미배정(빈 셀). */
function boothGrid(cells) {
    var html = '<div class="boothgrid">';
    cells.forEach(function (c) {
        html += '<span class="bcell' + (c.air ? '' : ' bcell--empty') + '">' +
            '<i class="bcell__no">' + c.no + '</i>' +
            (c.air || '미배정') + '</span>';
    });
    return html + '</div>';
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
