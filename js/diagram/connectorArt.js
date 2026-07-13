// JST-GH housing artwork, kept deliberately simple. Two faces:
//   - top/latch face (the default, latch up): a box with an inner box representing the
//     latch clip.
//   - bottom/cavity face (shown when flipped, latch down): a plain box.
// Drawn in a (u, v) coordinate system — u runs along the pin row, v across the housing
// depth with v=0 at the wire edge and v=D at the mating edge — so one drawing serves
// both sides (side A is mirrored automatically).
(function (global) {
  'use strict';

  function draw(g, el, opts) {
    var side = opts.side;
    var bodyLeft = opts.bodyLeft, bodyTop = opts.bodyTop;
    var D = opts.width; // housing depth (across)
    var L = opts.height; // housing length (along the pin row)
    var bodyRight = bodyLeft + D;

    function X(v) { return side === 'A' ? bodyRight - v : bodyLeft + v; }
    function U(u) { return bodyTop + u; }

    function rectUV(u1, v1, u2, v2, r, cls) {
      var x1 = X(v1), x2 = X(v2);
      var attrs = {
        x: Math.min(x1, x2), y: U(Math.min(u1, u2)),
        width: Math.abs(x2 - x1), height: Math.abs(u2 - u1),
        'class': cls
      };
      if (r) { attrs.rx = r; attrs.ry = r; }
      g.appendChild(el('rect', attrs));
    }

    // The housing body — a simple box either way.
    rectUV(0, 0, L, D, 3, 'cg-connector-body');

    // Latch-up (the default): the latch clip, an inner box toward the mating edge.
    // Flipped = latch down = looking at the plain cavity face, so no clip.
    if (!opts.flipped) {
      var inset = Math.min(14, L * 0.18);
      rectUV(inset, D * 0.45, L - inset, D - 7, 2, 'cg-art-line');
    }
  }

  global.CG = global.CG || {};
  global.CG.diagram = global.CG.diagram || {};
  global.CG.diagram.connectorArt = { draw: draw };
})(window);
