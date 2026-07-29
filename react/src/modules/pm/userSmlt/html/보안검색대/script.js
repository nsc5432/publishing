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
     출국장 선택 : 요약 바 · 표 제목을 선택한 출국장 기준으로 갱신
     ========================================================= */
  document.querySelectorAll('.gate-tabs').forEach(function (group) {
    var panel = group.closest('.panel');

    group.addEventListener('click', function (e) {
      var tab = e.target.closest('.gate-tab');
      if (!tab) return;

      group.querySelectorAll('.gate-tab').forEach(function (btn) {
        btn.classList.toggle('is-active', btn === tab);
      });

      // 미선택 상태의 안내 문구를 실제 제목으로 교체
      panel.querySelector('.sec-title').innerHTML =
        '<strong data-gate></strong>번 출국장 <strong data-count></strong>개 보안검색대 운영예정';

      panel.querySelectorAll('[data-gate]').forEach(function (el) {
        el.textContent = tab.dataset.num;
      });
      panel.querySelectorAll('[data-count]').forEach(function (el) {
        el.textContent = tab.dataset.seats;
      });
    });
  });

  /* =========================================================
     시 / 분 입력 : 숫자만, 두 자리로 보정
     ========================================================= */
  document.querySelectorAll('.time-input input').forEach(function (input) {
    input.addEventListener('input', function () {
      input.value = input.value.replace(/\D/g, '').slice(0, 2);
    });

    input.addEventListener('blur', function () {
      if (!input.value) return;
      input.value = String(Math.min(59, Number(input.value))).padStart(2, '0');
    });
  });

  document.querySelectorAll('.count-input input').forEach(function (input) {
    input.addEventListener('input', function () {
      input.value = input.value.replace(/\D/g, '').slice(0, 2);
    });
  });
})();
