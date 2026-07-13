// Standard wire color palette (WireViz-style abbreviations) plus a handful of common
// striped combinations used for twisted-pair signal wires.
(function (global) {
  'use strict';

  var map = {
    BK: { name: 'Black', hex: '#1a1a1a' },
    BN: { name: 'Brown', hex: '#8b4513' },
    RD: { name: 'Red', hex: '#e2231a' },
    OG: { name: 'Orange', hex: '#ff8c00' },
    YE: { name: 'Yellow', hex: '#f5d800' },
    GN: { name: 'Green', hex: '#1a9c4b' },
    BU: { name: 'Blue', hex: '#1a5fd8' },
    VT: { name: 'Violet', hex: '#7a1ad8' },
    GY: { name: 'Grey', hex: '#8c8c8c' },
    WH: { name: 'White', hex: '#ffffff', stroke: '#999999' },
    PK: { name: 'Pink', hex: '#ff7fb0' },
    TQ: { name: 'Turquoise', hex: '#30c9c0' },
    'BK-WH': { name: 'Black/White', hex: '#1a1a1a', hex2: '#ffffff' },
    'RD-BK': { name: 'Red/Black', hex: '#e2231a', hex2: '#1a1a1a' },
    'YE-BU': { name: 'Yellow/Blue', hex: '#f5d800', hex2: '#1a5fd8' },
    'GN-YE': { name: 'Green/Yellow', hex: '#1a9c4b', hex2: '#f5d800' }
  };

  var order = ['BK', 'BN', 'RD', 'OG', 'YE', 'GN', 'BU', 'VT', 'GY', 'WH', 'PK', 'TQ',
    'BK-WH', 'RD-BK', 'YE-BU', 'GN-YE'];

  global.CG = global.CG || {};
  global.CG.data = global.CG.data || {};
  global.CG.data.colors = { map: map, order: order };
})(window);
