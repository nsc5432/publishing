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
     수정 방식 라디오 : 전체 비율 ↔ 시간대별
     ========================================================= */
  document.querySelectorAll('.editor').forEach(function (editor) {
    var stepper = editor.querySelector('.stepper');
    var table   = editor.querySelector('.table-wrap');
    var hourly  = editor.querySelector('input[value="hourly"]');

    function sync() {
      table.classList.toggle('is-dim', !hourly.checked);
      stepper.classList.toggle('is-dim', hourly.checked);
    }

    editor.querySelectorAll('input[type="radio"]').forEach(function (radio) {
      radio.addEventListener('change', sync);
    });
    sync();
  });

  /* =========================================================
     비율 스테퍼 (± 5%)
     ========================================================= */
  document.querySelectorAll('.stepper').forEach(function (stepper) {
    var value = stepper.querySelector('.stepper__value');

    stepper.querySelectorAll('.stepper__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var current = parseInt(value.textContent, 10) || 0;
        var next = current + Number(btn.dataset.step);
        value.textContent = Math.max(-100, Math.min(100, next)) + '%';
      });
    });
  });
})();
