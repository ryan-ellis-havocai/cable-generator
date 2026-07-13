// Bootstrap: seed the default harness (now that all data/* modules are loaded), wire up
// every UI module, subscribe the diagram renderer, and hook up the export toolbar.
(function () {
  'use strict';

  var CG = window.CG;

  document.addEventListener('DOMContentLoaded', function () {
    // Register every UI module's subscription first, then seed the real default
    // harness so its single store.replace() emit populates all of them in one shot
    // (formHarnessInfo/formConnectors only sync on emit, they don't self-render on init).
    CG.ui.formHarnessInfo.init();
    CG.ui.formConnectors.init({ key: 'connectorA', side: 'A', prefix: 'connA', allowOpenEnd: false });
    CG.ui.formConnectors.init({ key: 'connectorB', side: 'B', prefix: 'connB', allowOpenEnd: true });
    CG.ui.pinLabelList.init({ mountId: 'connA-pinlabels', key: 'connectorA' });
    CG.ui.pinLabelList.init({ mountId: 'connB-pinlabels', key: 'connectorB' });
    CG.ui.formWireTable.init({ mountId: 'wire-table-mount' });

    var svg = document.getElementById('diagram');
    function renderDiagram(harness) { CG.diagram.render(svg, harness); }
    CG.store.subscribe(renderDiagram);

    CG.store.replace(CG.model.createDefaultHarness());

    document.getElementById('export-svg-btn').addEventListener('click', function () {
      CG.export.exportSvg(svg, CG.store.get().title);
    });

    document.getElementById('export-pdf-btn').addEventListener('click', function () {
      CG.export.exportPdf(svg, CG.store.get());
    });

    document.getElementById('save-json-btn').addEventListener('click', function () {
      CG.export.exportJson(CG.store.get());
    });

    var loadInput = document.getElementById('load-json-input');
    document.getElementById('load-json-btn').addEventListener('click', function () {
      loadInput.click();
    });
    loadInput.addEventListener('change', function () {
      var file = loadInput.files[0];
      if (!file) return;
      CG.export.loadJsonFile(file, function (data) {
        CG.store.replace(data);
      }, function (err) {
        alert('Could not load design: ' + err.message);
      });
      loadInput.value = '';
    });

    document.getElementById('new-harness-btn').addEventListener('click', function () {
      if (confirm('Start a new blank harness? Unsaved changes will be lost.')) {
        CG.store.replace(CG.model.createDefaultHarness());
      }
    });
  });
})();
