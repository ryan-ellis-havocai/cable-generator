// SVG export: the raw diagram file needs to be self-contained (styleable outside this
// page), so the exported copy gets an embedded <style> block mirroring the diagram-only
// rules from css/styles.css. Also hosts small shared helpers (download/slug) reused by
// the other exporters.
(function (global) {
  'use strict';

  var DIAGRAM_STYLE = '.cg-frame{fill:none;stroke:#1a1a1a;stroke-width:1.25;}' +
    '.cg-connector-title{font:700 13px "Consolas","Courier New",monospace;fill:#14161a;}' +
    '.cg-connector-subtitle{font:9px "Consolas","Courier New",monospace;fill:#55606e;letter-spacing:0.03em;}' +
    '.cg-connector-body{fill:#fff;stroke:#1a1a1a;stroke-width:1.25;}' +
    '.cg-connector-inner{fill:none;stroke:#1a1a1a;stroke-width:0.6;}' +
    '.cg-connector-latch{fill:#fff;stroke:#1a1a1a;stroke-width:1;}' +
    '.cg-cavity{fill:#fff;stroke:#1a1a1a;stroke-width:0.8;}' +
    '.cg-cavity-contact{fill:#e3e7ed;stroke:#1a1a1a;stroke-width:0.6;}' +
    '.cg-cavity-beam{stroke:#1a1a1a;stroke-width:0.6;}' +
    '.cg-key-mark{fill:none;stroke:#1a1a1a;stroke-width:1;}' +
    '.cg-pin-slot{fill:#fff;stroke:#1a1a1a;stroke-width:1;}' +
    '.cg-art-line{fill:none;stroke:#1a1a1a;stroke-width:0.9;}' +
    '.cg-pin-number{font:9px "Consolas","Courier New",monospace;fill:#14161a;}' +
    '.cg-pin-label{font:10px "Consolas","Courier New",monospace;fill:#222;}' +
    '.cg-open-end-tick{stroke:#1a1a1a;stroke-width:1.5;}' +
    '.cg-wire-outlined{stroke:#999999;stroke-width:0.5;}' +
    '.cg-titleblock-box{fill:#fff;stroke:#1a1a1a;stroke-width:1.25;}' +
    '.cg-titleblock-rule{stroke:#1a1a1a;stroke-width:0.75;}' +
    '.cg-titleblock-label{font:7px "Consolas","Courier New",monospace;fill:#6b7280;letter-spacing:0.06em;}' +
    '.cg-titleblock-value{font:700 11px "Consolas","Courier New",monospace;fill:#14161a;}';

  function slug(text) {
    return (text || 'harness').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'harness';
  }

  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function cloneSvgWithEmbeddedStyles(svg) {
    var clone = svg.cloneNode(true);
    var style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = DIAGRAM_STYLE;
    clone.insertBefore(style, clone.firstChild);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    return clone;
  }

  function exportSvg(svg, harnessTitle) {
    var clone = cloneSvgWithEmbeddedStyles(svg);
    var xml = new XMLSerializer().serializeToString(clone);
    var blob = new Blob([xml], { type: 'image/svg+xml' });
    download(blob, slug(harnessTitle) + '.svg');
  }

  global.CG = global.CG || {};
  global.CG.export = global.CG.export || {};
  global.CG.export.exportSvg = exportSvg;
  global.CG.export.slug = slug;
  global.CG.export.download = download;
  global.CG.export.cloneSvgWithEmbeddedStyles = cloneSvgWithEmbeddedStyles;
})(window);
