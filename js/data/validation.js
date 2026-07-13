// Pure, DOM-free harness validity checks. Soft warnings only — never block the user.
(function (global) {
  'use strict';

  // A real connector pin can only take one crimped wire — flag any pin (on either
  // connector) that more than one wire is mapped to.
  function findDuplicatePinUsage(harness) {
    function dupesFor(field) {
      var byPin = {};
      harness.wires.forEach(function (w) {
        (byPin[w[field]] = byPin[w[field]] || []).push(w.id);
      });
      var dupes = [];
      Object.keys(byPin).forEach(function (pin) {
        if (byPin[pin].length > 1) dupes.push({ pin: Number(pin), wireIds: byPin[pin] });
      });
      return dupes;
    }
    return { A: dupesFor('pinA'), B: dupesFor('pinB') };
  }

  // A twisted pair is exactly 2 wires — flag any pairGroup with a different count.
  function findInvalidPairGroups(harness) {
    var groups = {};
    harness.wires.forEach(function (w) {
      if (!w.pairGroup) return;
      (groups[w.pairGroup] = groups[w.pairGroup] || []).push(w.id);
    });
    var invalid = [];
    Object.keys(groups).forEach(function (g) {
      if (groups[g].length !== 2) invalid.push({ pairGroup: g, wireIds: groups[g], count: groups[g].length });
    });
    return invalid;
  }

  function validateHarness(harness) {
    return {
      duplicatePins: findDuplicatePinUsage(harness),
      invalidPairGroups: findInvalidPairGroups(harness)
    };
  }

  global.CG = global.CG || {};
  global.CG.data = global.CG.data || {};
  global.CG.data.validation = {
    findDuplicatePinUsage: findDuplicatePinUsage,
    findInvalidPairGroups: findInvalidPairGroups,
    validateHarness: validateHarness
  };
})(window);
