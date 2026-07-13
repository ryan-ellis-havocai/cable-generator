// Central app state: a single Harness document + a tiny pub/sub store.
// See the data model comments below for the exact shape kept in state.
(function (global) {
  'use strict';

  var CG = global.CG = global.CG || {};
  var emitter = CG.createEmitter();
  var idCounter = 0;

  function nextId(prefix) {
    idCounter += 1;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return prefix + '-' + crypto.randomUUID();
    }
    return prefix + '-' + idCounter + '-' + Date.now().toString(36);
  }

  // Connector {
  //   openEnd: boolean            // true = flying leads / pigtail, no housing drawn
  //   seriesPreset: string        // key into CG.data.connectorPresets (ignored when openEnd)
  //   positionCount: number
  //   partNumber: string          // connector housing part number (ignored when openEnd)
  //   gender: "plug" | "receptacle"
  //   label: string               // free-text label, e.g. "ESC1" or "Pigtail"
  //   pinLabels: string[]         // length === positionCount, signal name per pin
  //   flipped: boolean            // false (default) = latch up, pin 1 at top; true =
  //                                // latch down, pin order drawn mirrored. Does not
  //                                // change the logical pin numbers/wiring
  // }
  function createConnector(seriesPreset, positionCount, label) {
    var pinLabels = [];
    for (var i = 0; i < positionCount; i++) pinLabels.push('');
    return {
      openEnd: false,
      seriesPreset: seriesPreset || 'JST-GH',
      positionCount: positionCount || 4,
      partNumber: '',
      gender: 'plug',
      label: label || '',
      pinLabels: pinLabels,
      flipped: false
    };
  }

  // Keeps pinLabels in sync with positionCount (pad with '' or truncate), in place.
  function resizePinLabels(connector) {
    var labels = connector.pinLabels || [];
    while (labels.length < connector.positionCount) labels.push('');
    if (labels.length > connector.positionCount) labels.length = connector.positionCount;
    connector.pinLabels = labels;
  }

  // Wire {
  //   id: string
  //   pinA: number, pinB: number       // 1-based position indices into connectorA/connectorB
  //   color: string                    // key into CG.data.colors
  //   pairGroup: string|null           // wires sharing a group render as a twisted pair
  // }
  // Everything else that used to live on the wire (length, gauge, strip length, crimp
  // terminal/tool) is a single Harness-level setting instead — a harness is built from
  // one spool of wire with one crimp terminal/tool, so only color and pin mapping
  // actually vary per wire in practice.
  function createWire(pinA, pinB, color) {
    return {
      id: nextId('wire'),
      pinA: pinA,
      pinB: pinB,
      color: color || 'BK',
      pairGroup: null
    };
  }

  // Reads CG.data.colors, so must only be called once js/data/colors.js has loaded
  // (app.js calls this during bootstrap, after all data/* scripts have run).
  function createDefaultHarness() {
    var connectorA = createConnector('JST-GH', 4, 'J1');
    var connectorB = createConnector('JST-GH', 4, 'J2');
    var palette = CG.data.colors.order;
    var wires = [];
    var count = Math.min(connectorA.positionCount, connectorB.positionCount);
    for (var i = 1; i <= count; i++) {
      wires.push(createWire(i, i, palette[(i - 1) % palette.length]));
    }
    return {
      title: 'Untitled Harness',
      cablePartNumber: '',
      cableDescription: '',
      cableLengthMm: 100,
      gaugeAwg: 26,
      stripLengthMm: null,
      crimpTerminalPartNumber: '',
      crimpTool: '',
      connectorA: connectorA,
      connectorB: connectorB,
      wires: wires
    };
  }

  // Placeholder until app.js replaces it with createDefaultHarness() once data/* is loaded.
  var state = {
    title: '',
    cablePartNumber: '',
    cableDescription: '',
    cableLengthMm: 100,
    gaugeAwg: 26,
    stripLengthMm: null,
    crimpTerminalPartNumber: '',
    crimpTool: '',
    connectorA: createConnector('JST-GH', 4, 'J1'),
    connectorB: createConnector('JST-GH', 4, 'J2'),
    wires: []
  };

  var store = {
    get: function () {
      return state;
    },
    // mutatorFn(draft) mutates the harness in place; store re-renders subscribers after.
    update: function (mutatorFn) {
      mutatorFn(state);
      emitter.emit(state);
    },
    // Replaces the whole harness (e.g. loading a saved JSON design or resetting).
    replace: function (newHarness) {
      state = newHarness;
      emitter.emit(state);
    },
    subscribe: function (fn) {
      return emitter.subscribe(fn);
    },
    nextId: nextId
  };

  CG.model = {
    createConnector: createConnector,
    resizePinLabels: resizePinLabels,
    createWire: createWire,
    createDefaultHarness: createDefaultHarness
  };
  CG.store = store;
})(window);
