// Binds one connector's meta fields (series preset, position count, part number,
// gender, label, and — for connector B only — the open-end/pigtail toggle) to the
// store. Used twice (connector A and B) with a different DOM id prefix and state key.
(function (global) {
  'use strict';

  var CG = global.CG;

  function setIfChanged(input, value) {
    if (document.activeElement === input) return;
    if (input.value !== value) input.value = value;
  }

  function populateSelect(select, order, map) {
    order.forEach(function (key) {
      var opt = document.createElement('option');
      opt.value = key;
      opt.textContent = map[key].name;
      select.appendChild(opt);
    });
  }

  // Keeps every wire's pin reference on this side within [1, positionCount].
  function clampWirePins(harness, side, positionCount) {
    var field = side === 'A' ? 'pinA' : 'pinB';
    harness.wires.forEach(function (w) {
      if (w[field] > positionCount) w[field] = positionCount;
    });
  }

  function init(config) {
    var key = config.key; // 'connectorA' | 'connectorB'
    var side = config.side; // 'A' | 'B'
    var prefix = config.prefix;
    var allowOpenEnd = !!config.allowOpenEnd;

    var seriesSelect = document.getElementById(prefix + '-series');
    var positionsInput = document.getElementById(prefix + '-positions');
    var partNumberInput = document.getElementById(prefix + '-partnumber');
    var genderSelect = document.getElementById(prefix + '-gender');
    var labelInput = document.getElementById(prefix + '-label');
    var flippedCheckbox = document.getElementById(prefix + '-flipped');
    var openEndCheckbox = allowOpenEnd ? document.getElementById(prefix + '-openend') : null;
    var connectorFieldsWrap = document.getElementById(prefix + '-connector-fields');

    populateSelect(seriesSelect, CG.data.connectorPresets.order, CG.data.connectorPresets.map);
    genderSelect.innerHTML = '';
    ['plug', 'receptacle'].forEach(function (g) {
      var opt = document.createElement('option');
      opt.value = g;
      opt.textContent = g === 'plug' ? 'Plug (male)' : 'Receptacle (female)';
      genderSelect.appendChild(opt);
    });

    seriesSelect.addEventListener('change', function () {
      CG.store.update(function (h) {
        var connector = h[key];
        connector.seriesPreset = seriesSelect.value;
        var preset = CG.data.connectorPresets.map[connector.seriesPreset];
        if (preset) {
          connector.positionCount = Math.min(Math.max(connector.positionCount, preset.minPositions), preset.maxPositions);
          CG.model.resizePinLabels(connector);
          clampWirePins(h, side, connector.positionCount);
        }
      });
    });

    positionsInput.addEventListener('input', function () {
      var n = parseInt(positionsInput.value, 10);
      if (!n || n < 1) return;
      CG.store.update(function (h) {
        var connector = h[key];
        var preset = CG.data.connectorPresets.map[connector.seriesPreset];
        if (preset) n = Math.min(Math.max(n, preset.minPositions), preset.maxPositions);
        connector.positionCount = n;
        CG.model.resizePinLabels(connector);
        clampWirePins(h, side, n);
      });
    });

    partNumberInput.addEventListener('input', function () {
      CG.store.update(function (h) { h[key].partNumber = partNumberInput.value; });
    });

    labelInput.addEventListener('input', function () {
      CG.store.update(function (h) { h[key].label = labelInput.value; });
    });

    genderSelect.addEventListener('change', function () {
      CG.store.update(function (h) { h[key].gender = genderSelect.value; });
    });

    flippedCheckbox.addEventListener('change', function () {
      CG.store.update(function (h) { h[key].flipped = flippedCheckbox.checked; });
    });

    if (openEndCheckbox) {
      openEndCheckbox.addEventListener('change', function () {
        CG.store.update(function (h) { h[key].openEnd = openEndCheckbox.checked; });
      });
    }

    CG.store.subscribe(function (h) {
      var connector = h[key];
      setIfChanged(seriesSelect, connector.seriesPreset);
      setIfChanged(positionsInput, String(connector.positionCount));
      setIfChanged(partNumberInput, connector.partNumber);
      setIfChanged(labelInput, connector.label);
      setIfChanged(genderSelect, connector.gender);
      flippedCheckbox.checked = connector.flipped;
      if (openEndCheckbox) {
        openEndCheckbox.checked = connector.openEnd;
        connectorFieldsWrap.style.display = connector.openEnd ? 'none' : '';
      }
    });
  }

  global.CG = global.CG || {};
  global.CG.ui = global.CG.ui || {};
  global.CG.ui.formConnectors = { init: init };
})(window);
