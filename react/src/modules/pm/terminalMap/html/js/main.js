/**
 * 일일 시뮬레이션 결과 조회 (맵 형태) - 퍼블리싱 스크립트
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
   * 팝업
   * ---------------------------------------------------------------- */
  var lastFocused = null;

  function openModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;

    lastFocused = document.activeElement;
    modal.hidden = false;

    var closeBtn = modal.querySelector('.modal__close');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal(modal) {
    modal.hidden = true;
    if (lastFocused) lastFocused.focus();
  }

  function closeAllModal() {
    var opened = document.querySelectorAll('.modal:not([hidden])');
    for (var i = 0; i < opened.length; i++) closeModal(opened[i]);
  }

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-popup]');
    if (opener) {
      openModal(opener.getAttribute('data-popup'));
      return;
    }

    if (e.target.closest('[data-close]')) {
      var modal = e.target.closest('.modal');
      if (modal) closeModal(modal);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAllModal();
  });

  /* ------------------------------------------------------------------
   * 타임라인 슬라이더
   * ---------------------------------------------------------------- */
  var range = document.getElementById('timeRange');
  var nowLabel = document.querySelector('.timeline__now');

  var STEP_MIN = 30;  // 재생 단위: 30분
  var MAX_STEP = 48;  // 00:00 ~ 24:00 (24시간 / 30분)

  function pad(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function updateRange() {
    var step = Number(range.value);

    range.style.setProperty('--val', (step / MAX_STEP * 100) + '%');

    var minutes = step * STEP_MIN;
    if (nowLabel) {
      nowLabel.textContent = pad(Math.floor(minutes / 60)) + ':' + pad(minutes % 60);
    }
  }

  if (range) {
    range.addEventListener('input', updateRange);
    updateRange();
  }

  /* ------------------------------------------------------------------
   * 재생 컨트롤
   * ---------------------------------------------------------------- */
  var playBtn = document.querySelector('.btn-play--play');
  var prevBtn = document.querySelector('.btn-play--prev');
  var nextBtn = document.querySelector('.btn-play--next');
  var timer = null;

  function setPlaying(on) {
    if (!playBtn) return;

    playBtn.setAttribute('aria-pressed', String(on));
    var ico = playBtn.querySelector('.ico');
    ico.className = 'ico ' + (on ? 'ico-pause' : 'ico-play');
    playBtn.querySelector('.blind').textContent = on ? '일시정지' : '재생';
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    setPlaying(false);
  }

  if (playBtn && range) {
    playBtn.addEventListener('click', function () {
      if (timer) {
        stop();
        return;
      }

      // 마지막(24:00)에서 재생 시 처음부터
      if (Number(range.value) >= MAX_STEP) {
        range.value = 0;
        updateRange();
      }

      setPlaying(true);
      timer = setInterval(function () {
        range.value = Number(range.value) + 1;  // 30분씩 이동
        updateRange();

        if (Number(range.value) >= MAX_STEP) stop();
      }, 600);
    });

    // 30분 단위 이동
    prevBtn.addEventListener('click', function () {
      stop();
      range.value = Math.max(0, Number(range.value) - 1);
      updateRange();
    });

    nextBtn.addEventListener('click', function () {
      stop();
      range.value = Math.min(MAX_STEP, Number(range.value) + 1);
      updateRange();
    });
  }
})();
