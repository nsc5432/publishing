(function () {
  'use strict';

  /* =========================================================
     공통 : 터미널 패널 활성 / 비활성 전환
     ========================================================= */
  function setPanelState(panel, active) {
    panel.classList.toggle('panel--active', active);
    panel.classList.toggle('panel--disabled', !active);

    if (active) panel.removeAttribute('aria-disabled');
    else panel.setAttribute('aria-disabled', 'true');

    var foot = panel.querySelector('.panel__foot');
    if (foot) {
      foot.innerHTML = active
        ? '<button type="button" class="btn btn--save">현재상태 저장</button>'
        : '';
    }

    panel.querySelectorAll('button, input, select, textarea').forEach(function (el) {
      el.disabled = !active;
    });

    if (active) refreshCount(panel);
  }

  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));

  panels.forEach(function (panel) {
    panel.addEventListener('click', function () {
      if (!panel.classList.contains('panel--disabled')) return;
      panels.forEach(function (other) { setPanelState(other, other === panel); });
    });
  });

  /* =========================================================
     운영 중인 출국장 개수를 요약 바에 반영
     ========================================================= */
  function refreshCount(panel) {
    var rows = panel.querySelectorAll('.gate-row');
    var on = panel.querySelectorAll('.gate-row:not(.is-off)').length;
    var value = panel.querySelector('.summary__value--accent');
    if (value) value.textContent = rows.length ? on : 0;
  }

  /* =========================================================
     사용 / 미사용 전환
     ========================================================= */
  document.querySelectorAll('.gate-row').forEach(function (row) {
    var select = row.querySelector('select');

    select.addEventListener('change', function () {
      row.classList.toggle('is-off', select.value === 'off');
      refreshCount(row.closest('.panel'));
    });
  });

  /* =========================================================
     운영시간 슬롯 토글
     ========================================================= */
  document.querySelectorAll('.timebar').forEach(function (bar) {
    bar.addEventListener('click', function (e) {
      var slot = e.target.closest('.timebar__slot');
      if (!slot) return;
      if (bar.closest('.gate-row').classList.contains('is-off')) return;
      slot.classList.toggle('is-on');
    });
  });
})();
