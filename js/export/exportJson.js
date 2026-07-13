// JSON save/load: the whole Harness document, round-tripped verbatim so a design can be
// reopened and tweaked later (or used as a starting point for the next similar harness).
(function (global) {
  'use strict';

  var CG = global.CG;

  function exportJson(harness) {
    var json = JSON.stringify(harness, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    CG.export.download(blob, CG.export.slug(harness.title) + '.json');
  }

  function loadJsonFile(file, onLoaded, onError) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (!data || !data.connectorA || !data.connectorB || !Array.isArray(data.wires)) {
          throw new Error('That file does not look like a saved harness design.');
        }
        onLoaded(data);
      } catch (e) {
        onError(e);
      }
    };
    reader.onerror = function () { onError(reader.error || new Error('Failed to read file.')); };
    reader.readAsText(file);
  }

  global.CG = global.CG || {};
  global.CG.export = global.CG.export || {};
  global.CG.export.exportJson = exportJson;
  global.CG.export.loadJsonFile = loadJsonFile;
})(window);
