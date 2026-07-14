// Pure, DOM-free layout math for the wiring diagram: pin coordinates, connector body
// sizing, and the twisted-pair path generator. Kept separate from svgRenderer.js so it
// can be sanity-checked independent of the DOM.
(function (global) {
  'use strict';

  var PIN_PITCH = 32;
  var CONNECTOR_WIDTH = 100; // housing depth, proportioned to the traced JST-GH artwork
  var CONNECTOR_PAD = 26; // body padding above/below the first/last pin
  var MARGIN_TOP = 48; // room above bodies for the connector designator + spec line
  var MARGIN_SIDE = 130; // room outside each connector for pin number + signal labels
  var RUN_LENGTH = 260; // horizontal distance between the two connectors' facing edges
  var FAN_LENGTH = 34; // straight lead length at each end of a twisted-pair run
  var TWIST_AMPLITUDE = 5;
  var TWIST_WAVELENGTH = 40;

  var FRAME_MARGIN = 8; // drawing border inset from the SVG edge
  var TITLE_BLOCK_WIDTH = 280;
  var TITLE_BLOCK_HEIGHT = 90;
  var TITLE_BLOCK_GAP = 24; // gap between the wiring area and the title block
  var BOTTOM_PAD = 12; // gap between the title block and the frame's bottom edge

  function computeLayout(harness) {
    var posA = Math.max(1, harness.connectorA.positionCount);
    var posB = Math.max(1, harness.connectorB.positionCount);
    var bodyHeightA = (posA - 1) * PIN_PITCH + CONNECTOR_PAD * 2;
    var bodyHeightB = (posB - 1) * PIN_PITCH + CONNECTOR_PAD * 2;
    var bodyHeightMax = Math.max(bodyHeightA, bodyHeightB);

    var width = MARGIN_SIDE * 2 + CONNECTOR_WIDTH * 2 + RUN_LENGTH;
    var height = MARGIN_TOP + bodyHeightMax + TITLE_BLOCK_GAP + TITLE_BLOCK_HEIGHT + BOTTOM_PAD + FRAME_MARGIN;

    var xALeft = MARGIN_SIDE;
    var xARight = xALeft + CONNECTOR_WIDTH;
    var xBRight = width - MARGIN_SIDE;
    var xBLeft = xBRight - CONNECTOR_WIDTH;

    // Where pin 1 is drawn (top vs bottom) depends on which way the connector points
    // and which face is up. Both connectors latch-up on a flat harness point away from
    // each other, so their pin rows run in opposite directions: connector A (wires
    // exiting right) has pin 1 at the bottom, connector B (wires exiting left) has
    // pin 1 at the top. Flipping a connector (latch down) mirrors it again. The logical
    // pin numbering (and therefore the wire mapping) is unaffected, only where each
    // number is drawn.
    function pinY(index, positionCount, flipped, side) {
      var bodyHeight = (positionCount - 1) * PIN_PITCH + CONNECTOR_PAD * 2;
      var offset = (bodyHeightMax - bodyHeight) / 2;
      var latchUpMirrored = side === 'A';
      var mirrored = flipped ? !latchUpMirrored : latchUpMirrored;
      var slot = mirrored ? (positionCount - index) : (index - 1);
      return MARGIN_TOP + offset + CONNECTOR_PAD + slot * PIN_PITCH;
    }

    var titleBlockTop = MARGIN_TOP + bodyHeightMax + TITLE_BLOCK_GAP;

    return {
      pinPitch: PIN_PITCH,
      connectorWidth: CONNECTOR_WIDTH,
      connectorPad: CONNECTOR_PAD,
      marginTop: MARGIN_TOP,
      width: width,
      height: height,
      posA: posA,
      posB: posB,
      bodyTop: MARGIN_TOP,
      bodyHeightA: bodyHeightA,
      bodyHeightB: bodyHeightB,
      bodyHeightMax: bodyHeightMax,
      bodyTopA: MARGIN_TOP + (bodyHeightMax - bodyHeightA) / 2,
      bodyTopB: MARGIN_TOP + (bodyHeightMax - bodyHeightB) / 2,
      xALeft: xALeft,
      xARight: xARight,
      xBLeft: xBLeft,
      xBRight: xBRight,
      pinYA: function (index) { return pinY(index, posA, harness.connectorA.flipped, 'A'); },
      pinYB: function (index) { return pinY(index, posB, harness.connectorB.flipped, 'B'); },
      frame: { x: FRAME_MARGIN, y: FRAME_MARGIN, width: width - FRAME_MARGIN * 2, height: height - FRAME_MARGIN * 2 },
      titleBlock: {
        x: width - FRAME_MARGIN - 10 - TITLE_BLOCK_WIDTH,
        y: titleBlockTop,
        width: TITLE_BLOCK_WIDTH,
        height: TITLE_BLOCK_HEIGHT
      }
    };
  }

  // Smooth Catmull-Rom-derived cubic segments through an ordered list of [x, y]
  // points, WITHOUT a leading M — so the result can continue an existing path from
  // the first point. Used for the sine-wave run of a twisted pair.
  function smoothSegmentsThroughPoints(points) {
    var path = '';
    for (var j = 0; j < points.length - 1; j++) {
      var p0 = points[j - 1] || points[j];
      var p1 = points[j];
      var p2 = points[j + 1];
      var p3 = points[j + 2] || p2;
      var cp1x = p1[0] + (p2[0] - p0[0]) / 6;
      var cp1y = p1[1] + (p2[1] - p0[1]) / 6;
      var cp2x = p2[0] - (p3[0] - p1[0]) / 6;
      var cp2y = p2[1] - (p3[1] - p1[1]) / 6;
      path += ' C ' + cp1x.toFixed(2) + ' ' + cp1y.toFixed(2) + ', ' +
        cp2x.toFixed(2) + ' ' + cp2y.toFixed(2) + ', ' +
        p2[0].toFixed(2) + ' ' + p2[1].toFixed(2);
    }
    return path;
  }

  function smoothPathFromPoints(points) {
    var start = 'M ' + points[0][0].toFixed(2) + ' ' + points[0][1].toFixed(2);
    if (points.length < 3) {
      for (var i = 1; i < points.length; i++) {
        start += ' L ' + points[i][0].toFixed(2) + ' ' + points[i][1].toFixed(2);
      }
      return start;
    }
    return start + smoothSegmentsThroughPoints(points);
  }

  // Smooth S-curve between two points (used for ungrouped wire leads).
  function sCurvePath(x1, y1, x2, y2) {
    var cx1 = x1 + (x2 - x1) * 0.5;
    var cx2 = x2 - (x2 - x1) * 0.5;
    return 'M ' + x1.toFixed(2) + ' ' + y1.toFixed(2) +
      ' C ' + cx1.toFixed(2) + ' ' + y1.toFixed(2) + ', ' +
      cx2.toFixed(2) + ' ' + y2.toFixed(2) + ', ' +
      x2.toFixed(2) + ' ' + y2.toFixed(2);
  }

  // One strand of a twisted pair: a straight perpendicular stub out of the pin, an
  // S-curve (horizontal tangents at both ends) to the pair's shared centerline, the
  // sine-wave run along that centerline, then the mirror of the same on the other
  // side — so wires meet both connectors square-on rather than at an angle.
  // phaseOffset (radians) staggers strands within the same pair so they visibly cross.
  function twistedStrandPath(x1, y1, x2, y2, sharedY, phaseOffset) {
    var stub = 12; // straight horizontal run at each pin
    var fanInEndX = x1 + stub + FAN_LENGTH;
    var fanOutStartX = x2 - stub - FAN_LENGTH;
    if (fanOutStartX < fanInEndX) {
      // Connectors are too close for a fan+twist run — fall back to a plain S-curve.
      return sCurvePath(x1, y1, x2, y2);
    }

    var sinePts = [[fanInEndX, sharedY]];
    var span = fanOutStartX - fanInEndX;
    var segments = Math.max(6, Math.round(span / (TWIST_WAVELENGTH / 4)));
    for (var i = 1; i < segments; i++) {
      var t = i / segments;
      var x = fanInEndX + span * t;
      var y = sharedY + TWIST_AMPLITUDE * Math.sin((x - fanInEndX) / TWIST_WAVELENGTH * 2 * Math.PI + phaseOffset);
      sinePts.push([x, y]);
    }
    sinePts.push([fanOutStartX, sharedY]);

    var fanInMidX = (x1 + stub + fanInEndX) / 2;
    var fanOutMidX = (fanOutStartX + x2 - stub) / 2;
    return 'M ' + x1.toFixed(2) + ' ' + y1.toFixed(2) +
      ' L ' + (x1 + stub).toFixed(2) + ' ' + y1.toFixed(2) +
      ' C ' + fanInMidX.toFixed(2) + ' ' + y1.toFixed(2) + ', ' +
      fanInMidX.toFixed(2) + ' ' + sharedY.toFixed(2) + ', ' +
      fanInEndX.toFixed(2) + ' ' + sharedY.toFixed(2) +
      smoothSegmentsThroughPoints(sinePts) +
      ' C ' + fanOutMidX.toFixed(2) + ' ' + sharedY.toFixed(2) + ', ' +
      fanOutMidX.toFixed(2) + ' ' + y2.toFixed(2) + ', ' +
      (x2 - stub).toFixed(2) + ' ' + y2.toFixed(2) +
      ' L ' + x2.toFixed(2) + ' ' + y2.toFixed(2);
  }

  // Minimum vertical separation between two twisted-pair centerlines so their runs
  // (2×amplitude plus stroke width) can never touch.
  var PAIR_RUN_SEPARATION = TWIST_AMPLITUDE * 2 + 12;

  // Pair centerlines default to the mean of the group's endpoint pin Ys, but two
  // groups can average to the same line (e.g. symmetric pairs with both connectors
  // latch-up, where the pin rows run in opposite directions). Spread any groups closer
  // than PAIR_RUN_SEPARATION apart, keeping each overlapping cluster centered on its
  // collective mean.
  function spreadCenterlines(desired) {
    var entries = Object.keys(desired).map(function (g) { return { group: g, y: desired[g] }; });
    entries.sort(function (a, b) { return a.y - b.y; });

    var clusters = [];
    entries.forEach(function (e) {
      clusters.push({ sum: e.y, items: [e] });
      // Merge backwards while the newest cluster would collide with the previous one.
      while (clusters.length > 1) {
        var last = clusters[clusters.length - 1];
        var prev = clusters[clusters.length - 2];
        var lastCenter = last.sum / last.items.length;
        var prevCenter = prev.sum / prev.items.length;
        var lastTop = lastCenter - ((last.items.length - 1) / 2) * PAIR_RUN_SEPARATION;
        var prevBottom = prevCenter + ((prev.items.length - 1) / 2) * PAIR_RUN_SEPARATION;
        if (lastTop - prevBottom >= PAIR_RUN_SEPARATION) break;
        prev.sum += last.sum;
        prev.items = prev.items.concat(last.items);
        clusters.pop();
      }
    });

    var resolved = {};
    clusters.forEach(function (c) {
      var center = c.sum / c.items.length;
      var top = center - ((c.items.length - 1) / 2) * PAIR_RUN_SEPARATION;
      c.items.forEach(function (e, i) {
        resolved[e.group] = top + i * PAIR_RUN_SEPARATION;
      });
    });
    return resolved;
  }

  // Builds the final SVG path 'd' string for every wire in the harness. Ungrouped wires
  // get a plain S-curve; wires sharing a pairGroup get the twisted-strand treatment,
  // riding a shared centerline computed from all their endpoint pin positions.
  function buildWirePaths(harness, layout) {
    var byGroup = {};
    harness.wires.forEach(function (w) {
      if (!w.pairGroup) return;
      (byGroup[w.pairGroup] = byGroup[w.pairGroup] || []).push(w);
    });

    var desiredYByGroup = {};
    Object.keys(byGroup).forEach(function (g) {
      if (byGroup[g].length < 2) return; // singletons draw as plain wires
      var ys = [];
      byGroup[g].forEach(function (w) {
        ys.push(layout.pinYA(w.pinA));
        ys.push(layout.pinYB(w.pinB));
      });
      desiredYByGroup[g] = ys.reduce(function (a, b) { return a + b; }, 0) / ys.length;
    });
    var sharedYByGroup = spreadCenterlines(desiredYByGroup);

    return harness.wires.map(function (w) {
      var x1 = layout.xARight, y1 = layout.pinYA(w.pinA);
      var x2 = layout.xBLeft, y2 = layout.pinYB(w.pinB);
      var d;
      if (w.pairGroup && byGroup[w.pairGroup].length > 1) {
        var group = byGroup[w.pairGroup];
        var indexInGroup = group.indexOf(w);
        var phase = (indexInGroup / group.length) * 2 * Math.PI;
        d = twistedStrandPath(x1, y1, x2, y2, sharedYByGroup[w.pairGroup], phase);
      } else {
        d = sCurvePath(x1, y1, x2, y2);
      }
      return { wireId: w.id, d: d, color: w.color, pairGroup: w.pairGroup };
    });
  }

  global.CG = global.CG || {};
  global.CG.diagram = global.CG.diagram || {};
  global.CG.diagram.geometry = {
    computeLayout: computeLayout,
    buildWirePaths: buildWirePaths,
    sCurvePath: sCurvePath,
    smoothPathFromPoints: smoothPathFromPoints
  };
})(window);
