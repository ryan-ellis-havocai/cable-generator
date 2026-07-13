// Binds the flat Harness Info fields — title, cable part number/description/length, and
// the wire spec fields (gauge, strip length, crimp terminal/tool) that apply to every
// wire in the harness — to the store. Plain vanilla, no list-editing here, so no Preact.
(function (global) {
  'use strict';

  var CG = global.CG;

  function setIfChanged(input, value) {
    if (document.activeElement === input) return; // don't clobber what the user is typing
    if (input.value !== value) input.value = value;
  }

  function init() {
    var titleInput = document.getElementById('harness-title');
    var cablePnInput = document.getElementById('harness-cablepn');
    var cableDescInput = document.getElementById('harness-cabledesc');
    var cableLengthInput = document.getElementById('harness-cablelength');
    var gaugeInput = document.getElementById('harness-gauge');
    var stripLengthInput = document.getElementById('harness-striplength');
    var crimpTerminalInput = document.getElementById('harness-crimpterminal');
    var crimpToolInput = document.getElementById('harness-crimptool');

    titleInput.addEventListener('input', function () {
      CG.store.update(function (h) { h.title = titleInput.value; });
    });
    cablePnInput.addEventListener('input', function () {
      CG.store.update(function (h) { h.cablePartNumber = cablePnInput.value; });
    });
    cableDescInput.addEventListener('input', function () {
      CG.store.update(function (h) { h.cableDescription = cableDescInput.value; });
    });
    cableLengthInput.addEventListener('input', function () {
      var n = parseFloat(cableLengthInput.value);
      if (isNaN(n) || n < 0) return;
      CG.store.update(function (h) { h.cableLengthMm = n; });
    });
    gaugeInput.addEventListener('input', function () {
      var n = parseInt(gaugeInput.value, 10);
      if (isNaN(n)) return;
      n = Math.min(Math.max(n, 8), 40);
      CG.store.update(function (h) { h.gaugeAwg = n; });
    });
    stripLengthInput.addEventListener('input', function () {
      CG.store.update(function (h) {
        h.stripLengthMm = stripLengthInput.value === '' ? null : Math.max(0, parseFloat(stripLengthInput.value) || 0);
      });
    });
    crimpTerminalInput.addEventListener('input', function () {
      CG.store.update(function (h) { h.crimpTerminalPartNumber = crimpTerminalInput.value; });
    });
    crimpToolInput.addEventListener('input', function () {
      CG.store.update(function (h) { h.crimpTool = crimpToolInput.value; });
    });

    CG.store.subscribe(function (h) {
      setIfChanged(titleInput, h.title);
      setIfChanged(cablePnInput, h.cablePartNumber);
      setIfChanged(cableDescInput, h.cableDescription);
      setIfChanged(cableLengthInput, String(h.cableLengthMm));
      setIfChanged(gaugeInput, String(h.gaugeAwg));
      setIfChanged(stripLengthInput, h.stripLengthMm === null || h.stripLengthMm === undefined ? '' : String(h.stripLengthMm));
      setIfChanged(crimpTerminalInput, h.crimpTerminalPartNumber);
      setIfChanged(crimpToolInput, h.crimpTool);
    });
  }

  global.CG = global.CG || {};
  global.CG.ui = global.CG.ui || {};
  global.CG.ui.formHarnessInfo = { init: init };
})(window);
