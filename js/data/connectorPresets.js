// Connector series presets. These only seed sensible defaults/ranges for the position
// count field — position count always stays user-editable.
(function (global) {
  'use strict';

  var map = {
    'JST-GH': { name: 'JST GH (1.25mm pitch)', pitchMm: 1.25, minPositions: 2, maxPositions: 15, defaultPositions: 4 },
    'JST-PH': { name: 'JST PH (2.00mm pitch)', pitchMm: 2.0, minPositions: 2, maxPositions: 16, defaultPositions: 4 },
    'Custom': { name: 'Custom', pitchMm: null, minPositions: 1, maxPositions: 40, defaultPositions: 4 }
  };

  var order = ['JST-GH', 'JST-PH', 'Custom'];

  global.CG = global.CG || {};
  global.CG.data = global.CG.data || {};
  global.CG.data.connectorPresets = { map: map, order: order };
})(window);
