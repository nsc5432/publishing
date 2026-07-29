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
  }

  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));

  panels.forEach(function (panel) {
    panel.addEventListener('click', function () {
      if (!panel.classList.contains('panel--disabled')) return;
      panels.forEach(function (other) { setPanelState(other, other === panel); });
    });
  });

  /* =========================================================
     미운영 체크박스 : 해당 기기의 운영시간 막대를 비활성 표시
     ========================================================= */
  document.querySelectorAll('.device').forEach(function (device) {
    var box = device.querySelector('.checkbox input');

    box.addEventListener('change', function () {
      device.classList.toggle('is-off', box.checked);
    });
  });

  /* =========================================================
     운영시간 슬롯 토글
     ========================================================= */
  document.querySelectorAll('.timebar').forEach(function (bar) {
    bar.addEventListener('click', function (e) {
      var slot = e.target.closest('.timebar__slot');
      if (!slot) return;
      if (bar.closest('.device').classList.contains('is-off')) return;
      slot.classList.toggle('is-on');
    });
  });

  /* =========================================================
     아일랜드 선택 (단일 선택 + 요약 값 갱신)
     ========================================================= */
  document.querySelectorAll('.islands').forEach(function (group) {
    var label = group.closest('.panel').querySelector('.summary__value--island');

    group.addEventListener('click', function (e) {
      var island = e.target.closest('.island');
      if (!island) return;

      group.querySelectorAll('.island').forEach(function (btn) {
        btn.classList.toggle('is-active', btn === island);
      });
      if (label) label.textContent = island.textContent;
    });
  });
})();
