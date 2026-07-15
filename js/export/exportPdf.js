// PDF export: vector diagram via jsPDF + svg2pdf.js (doc.svg()), sized to a page that
// exactly fits the diagram plus a small margin.
//
// svg2pdf does NOT resolve the external stylesheet — it only sees inline presentation
// attributes and inline <style>. Rendering the live on-page <svg> therefore drops every
// .cg-* CSS rule, so class-styled elements fall back to SVG defaults (fill black), which
// painted the whole sheet black. Instead we render the same self-contained clone the SVG
// export uses (diagram styles baked into an inline <style>), attached off-screen so its
// styles resolve during rendering.
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

    // Paint the whole page white first — the margin around the diagram would otherwise
    // show as the viewer's default (dark) background.
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    var clone = CG.export.cloneSvgWithEmbeddedStyles(svg);
    var holder = document.createElement('div');
    holder.style.position = 'absolute';
    holder.style.left = '-99999px';
    holder.style.top = '0';
    holder.appendChild(clone);
    document.body.appendChild(holder);

    function cleanup() {
      if (holder.parentNode) holder.parentNode.removeChild(holder);
    }

    return doc.svg(clone, { x: MARGIN_MM, y: MARGIN_MM, width: mmWidth, height: mmHeight })
      .then(function () {
        cleanup();
        doc.save(CG.export.slug(harness.title) + '.pdf');
      })
      .catch(function (err) {
        cleanup();
        console.error('PDF export failed', err);
        alert('PDF export failed: ' + (err && err.message ? err.message : err));
      });
  }

  global.CG = global.CG || {};
  global.CG.export = global.CG.export || {};
  global.CG.export.exportPdf = exportPdf;
})(window);
