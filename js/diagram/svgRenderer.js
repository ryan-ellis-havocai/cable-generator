// Rebuilds the live <svg> diagram from the current Harness on every state change.
// Full rebuild is fine at this element count (a handful of pins/wires). Styled like an
// engineering drawing: a border frame and a title block for harness/cable metadata
// instead of free-floating text.
(function (global) {
  'use strict';

  var CG = global.CG;
  var geometry = CG.diagram.geometry;
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, text) {
    var node = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
      });
    }
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function colorInfo(key) {
    return (CG.data.colors.map[key]) || { name: key || 'Unknown', hex: '#666666' };
  }

  // Compact drawing-stamp text, e.g. "JST-GH · 4POS · PN123".
  function connectorSpecLine(connector) {
    var parts = [connector.seriesPreset.toUpperCase(), connector.positionCount + 'POS'];
    if (connector.partNumber) parts.push(connector.partNumber);
    return parts.join(' · ');
  }

  // Datasheet-style JST-GH housing, drawn as the mating-face view rotated so the pin
  // row runs vertically. Mirrors the official JST drawing conventions: double-line
  // housing walls, a latch-face band on the mating edge, one contact cavity per
  // position, a ▽ marker at the pin-1 end and a □ polarity marker at the far end —
  // so which way the connector is oriented (and the flip toggle) is unmistakable.
  function drawDetailedHousing(g, opts) {
    var bodyLeft = opts.bodyLeft, bodyTop = opts.bodyTop;
    var width = opts.width, height = opts.height;
    var side = opts.side, pinCount = opts.pinCount, pinY = opts.pinY;
    var bodyRight = bodyLeft + width;
    var bodyBottom = bodyTop + height;
    var wall = 3;

    // Outer body + inner wall line (double-line datasheet look).
    g.appendChild(el('rect', { x: bodyLeft, y: bodyTop, width: width, height: height, 'class': 'cg-connector-body' }));
    g.appendChild(el('rect', {
      x: bodyLeft + wall, y: bodyTop + wall, width: width - wall * 2, height: height - wall * 2,
      'class': 'cg-connector-inner'
    }));

    // Latch-face band along the mating (outer) edge, separated by a rule.
    var bandW = Math.min(20, width * 0.28);
    var bandX = side === 'A' ? bodyLeft + wall + bandW : bodyRight - wall - bandW;
    g.appendChild(el('line', { x1: bandX, y1: bodyTop + wall, x2: bandX, y2: bodyBottom - wall, 'class': 'cg-connector-inner' }));

    // Latch bump proud of the mating edge, centered along the body.
    var latchH = Math.min(30, height * 0.3);
    var latchY = bodyTop + (height - latchH) / 2;
    var latchX = side === 'A' ? bodyLeft - 4.5 : bodyRight;
    g.appendChild(el('rect', { x: latchX, y: latchY, width: 4.5, height: latchH, rx: 1, 'class': 'cg-connector-latch' }));

    // One contact cavity per position, with the contact toward the mating face and a
    // beam line running to the wire-entry side. A column is kept clear at the wire
    // edge for the pin numbers.
    var cavH = Math.min(20, opts.pinPitch * 0.62);
    var numberColW = 16;
    var cavX1, cavX2, contactAtLeft;
    if (side === 'A') {
      cavX1 = bandX + 2;
      cavX2 = bodyRight - wall - numberColW;
      contactAtLeft = true;
    } else {
      cavX1 = bodyLeft + wall + numberColW;
      cavX2 = bandX - 2;
      contactAtLeft = false;
    }
    var cavW = cavX2 - cavX1;
    var contactW = Math.max(6, cavW * 0.35);

    for (var i = 1; i <= pinCount; i++) {
      var y = pinY(i);
      g.appendChild(el('rect', { x: cavX1, y: y - cavH / 2, width: cavW, height: cavH, 'class': 'cg-cavity' }));
      var contactX = contactAtLeft ? cavX1 + 1.5 : cavX2 - 1.5 - contactW;
      g.appendChild(el('rect', {
        x: contactX, y: y - (cavH - 6) / 2, width: contactW, height: cavH - 6, 'class': 'cg-cavity-contact'
      }));
      var beamX1 = contactAtLeft ? contactX + contactW : cavX1 + 1.5;
      var beamX2 = contactAtLeft ? cavX2 - 1.5 : contactX;
      g.appendChild(el('line', { x1: beamX1, y1: y, x2: beamX2, y2: y, 'class': 'cg-cavity-beam' }));
    }

    // Orientation key marks in the latch band: ▽ at pin 1, □ at pin N. These follow
    // pinY, so the flip toggle visibly relocates them.
    var markCx = side === 'A' ? bodyLeft + wall + bandW / 2 : bodyRight - wall - bandW / 2;
    var y1 = pinY(1);
    g.appendChild(el('polygon', {
      points: (markCx - 4) + ',' + (y1 - 3.5) + ' ' + (markCx + 4) + ',' + (y1 - 3.5) + ' ' + markCx + ',' + (y1 + 4.5),
      'class': 'cg-key-mark'
    }));
    if (pinCount > 1) {
      var yN = pinY(pinCount);
      g.appendChild(el('rect', { x: markCx - 3.5, y: yN - 3.5, width: 7, height: 7, 'class': 'cg-key-mark' }));
    }
  }

  function drawFrame(root, layout) {
    root.appendChild(el('rect', {
      x: layout.frame.x, y: layout.frame.y, width: layout.frame.width, height: layout.frame.height,
      'class': 'cg-frame'
    }));
  }

  function drawTitleBlock(root, harness, layout) {
    var tb = layout.titleBlock;
    var g = el('g', { 'class': 'cg-titleblock' });
    var rowH = tb.height / 3;
    var splitX = tb.x + tb.width * 0.62;

    g.appendChild(el('rect', { x: tb.x, y: tb.y, width: tb.width, height: tb.height, 'class': 'cg-titleblock-box' }));
    g.appendChild(el('line', { x1: tb.x, y1: tb.y + rowH, x2: tb.x + tb.width, y2: tb.y + rowH, 'class': 'cg-titleblock-rule' }));
    g.appendChild(el('line', { x1: tb.x, y1: tb.y + rowH * 2, x2: tb.x + tb.width, y2: tb.y + rowH * 2, 'class': 'cg-titleblock-rule' }));
    g.appendChild(el('line', { x1: splitX, y1: tb.y + rowH, x2: splitX, y2: tb.y + rowH * 2, 'class': 'cg-titleblock-rule' }));

    function cell(x, rowTop, label, value) {
      g.appendChild(el('text', { x: x, y: rowTop + 10, 'class': 'cg-titleblock-label' }, label));
      g.appendChild(el('text', { x: x, y: rowTop + rowH - 3, 'class': 'cg-titleblock-value' }, value || '—'));
    }

    cell(tb.x + 8, tb.y, 'TITLE', harness.title);
    cell(tb.x + 8, tb.y + rowH, 'CABLE P/N', harness.cablePartNumber);
    cell(splitX + 8, tb.y + rowH, 'LENGTH', harness.cableLengthMm ? harness.cableLengthMm + ' MM' : '');
    cell(tb.x + 8, tb.y + rowH * 2, 'DESCRIPTION', harness.cableDescription);

    root.appendChild(g);
  }

  function drawConnectorBody(root, layout, connector, side) {
    var bodyTop = side === 'A' ? layout.bodyTopA : layout.bodyTopB;
    var bodyHeight = side === 'A' ? layout.bodyHeightA : layout.bodyHeightB;
    var bodyLeft = side === 'A' ? layout.xALeft : layout.xBLeft;
    var bodyRight = side === 'A' ? layout.xARight : layout.xBRight;
    var pinCount = side === 'A' ? layout.posA : layout.posB;
    var pinY = side === 'A' ? layout.pinYA : layout.pinYB;
    var pinEdgeX = side === 'A' ? bodyRight : bodyLeft;
    var openEnd = connector.openEnd;

    var titleX = (bodyLeft + bodyRight) / 2;
    var g = el('g', { 'class': 'cg-connector' });

    var designator = connector.label || (side === 'A' ? 'J1' : 'J2');
    var specLine = openEnd ? pinCount + ' LEADS' : connectorSpecLine(connector);
    g.appendChild(el('text', { x: titleX, y: bodyTop - 20, 'text-anchor': 'middle', 'class': 'cg-connector-title' }, designator));
    g.appendChild(el('text', { x: titleX, y: bodyTop - 8, 'text-anchor': 'middle', 'class': 'cg-connector-subtitle' }, specLine));

    var isGh = !openEnd && connector.seriesPreset === 'JST-GH';
    if (isGh) {
      CG.diagram.connectorArt.draw(g, el, {
        bodyLeft: bodyLeft, bodyTop: bodyTop, width: bodyRight - bodyLeft, height: bodyHeight,
        side: side, pinCount: pinCount, pinY: pinY, flipped: !!connector.flipped
      });
    } else if (!openEnd) {
      drawDetailedHousing(g, {
        bodyLeft: bodyLeft, bodyTop: bodyTop, width: bodyRight - bodyLeft, height: bodyHeight,
        side: side, pinCount: pinCount, pinY: pinY, pinPitch: layout.pinPitch
      });
    }

    for (var i = 1; i <= pinCount; i++) {
      var y = pinY(i);
      var label = connector.pinLabels && connector.pinLabels[i - 1];
      var labelX = side === 'A' ? bodyLeft - 10 : bodyRight + 10;
      var anchor = side === 'A' ? 'end' : 'start';

      if (openEnd) {
        // Small cut-end tick instead of a housing.
        g.appendChild(el('line', { x1: pinEdgeX - 6, y1: y - 6, x2: pinEdgeX + 6, y2: y + 6, 'class': 'cg-open-end-tick' }));
        if (label) {
          g.appendChild(el('text', { x: labelX, y: y + 4, 'text-anchor': anchor, 'class': 'cg-pin-label' }, label));
        }
      } else if (isGh) {
        // The traced housing fills the body, so the pin number rides outside the
        // mating edge together with the signal label, datasheet-style.
        var combined = String(i) + (label ? '  ' + label : '');
        g.appendChild(el('text', { x: labelX, y: y + 4, 'text-anchor': anchor, 'class': 'cg-pin-label' }, combined));
      } else {
        g.appendChild(el('rect', { x: pinEdgeX - 2.5, y: y - 4.5, width: 5, height: 9, rx: 1, 'class': 'cg-pin-slot' }));
        var numX = side === 'A' ? bodyRight - 10 : bodyLeft + 10;
        g.appendChild(el('text', {
          x: numX, y: y + 4, 'text-anchor': anchor, 'class': 'cg-pin-number'
        }, String(i)));
        if (label) {
          g.appendChild(el('text', { x: labelX, y: y + 4, 'text-anchor': anchor, 'class': 'cg-pin-label' }, label));
        }
      }
    }

    root.appendChild(g);
  }

  function drawWires(root, harness, layout) {
    var paths = geometry.buildWirePaths(harness, layout);
    var g = el('g', { 'class': 'cg-wires' });
    paths.forEach(function (p) {
      var info = colorInfo(p.color);
      g.appendChild(el('path', {
        d: p.d, fill: 'none', stroke: info.hex, 'stroke-width': 3.5, 'stroke-linecap': 'round',
        'class': 'cg-wire' + (info.stroke ? ' cg-wire-outlined' : '')
      }));
      if (info.hex2) {
        g.appendChild(el('path', {
          d: p.d, fill: 'none', stroke: info.hex2, 'stroke-width': 3.5, 'stroke-linecap': 'butt',
          'stroke-dasharray': '7,7'
        }));
      }
    });
    root.appendChild(g);
  }

  function render(svg, harness) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var layout = geometry.computeLayout(harness);
    svg.setAttribute('viewBox', '0 0 ' + layout.width + ' ' + layout.height);
    svg.setAttribute('width', layout.width);
    svg.setAttribute('height', layout.height);

    drawFrame(svg, layout);
    drawWires(svg, harness, layout);
    drawConnectorBody(svg, layout, harness.connectorA, 'A');
    drawConnectorBody(svg, layout, harness.connectorB, 'B');
    drawTitleBlock(svg, harness, layout);
  }

  global.CG.diagram.render = render;
})(window);
