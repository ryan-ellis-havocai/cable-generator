// PDF export: vector diagram via jsPDF + svg2pdf.js (doc.svg()), sized to a page that
// exactly fits the diagram plus a small margin. Renders the live, on-page <svg> directly
// (not a detached clone) so svg2pdf resolves computed styles correctly.
(function (global) {
  'use strict';

  var CG = global.CG;
  var MARGIN_MM = 10;
  var PX_TO_MM = 25.4 / 96;

  function exportPdf(svg, harness) {
    var pxWidth = parseFloat(svg.getAttribute('width'));
    var pxHeight = parseFloat(svg.getAttribute('height'));
    var mmWidth = pxWidth * PX_TO_MM;
    var mmHeight = pxHeight * PX_TO_MM;
    var pageWidth = mmWidth + MARGIN_MM * 2;
    var pageHeight = mmHeight + MARGIN_MM * 2;
    var orientation = pageWidth >= pageHeight ? 'landscape' : 'portrait';

    var doc = new window.jspdf.jsPDF({ orientation: orientation, unit: 'mm', format: [pageWidth, pageHeight] });

    // Paint the whole page white first — otherwise the margin around the diagram (and
    // any area svg2pdf leaves untouched) shows as the viewer's default dark background.
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    return doc.svg(svg, { x: MARGIN_MM, y: MARGIN_MM, width: mmWidth, height: mmHeight })
      .then(function () {
        doc.save(CG.export.slug(harness.title) + '.pdf');
      })
      .catch(function (err) {
        console.error('PDF export failed', err);
        alert('PDF export failed: ' + (err && err.message ? err.message : err));
      });
  }

  global.CG = global.CG || {};
  global.CG.export = global.CG.export || {};
  global.CG.export.exportPdf = exportPdf;
})(window);
