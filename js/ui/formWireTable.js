// Preact/htm wire-mapping table: add/remove/reorder-free list of wires with pin refs,
// color, and twisted-pair grouping. Gauge, strip length, crimp terminal/tool, and length
// all live on the harness itself (js/ui/formHarnessInfo.js) since they're the same for
// every wire in a harness — only color and pin mapping actually vary per wire.
(function (global) {
  'use strict';

  var CG = global.CG;
  var html = htmPreact.html;

  function clampInt(value, min, max, fallback) {
    var n = parseInt(value, 10);
    if (isNaN(n)) return fallback;
    return Math.min(Math.max(n, min), max);
  }

  function WireRow(props) {
    var w = props.wire;
    var colors = CG.data.colors;
    var swatchStyle = 'background:' + colors.map[w.color].hex +
      (colors.map[w.color].hex2 ? ', linear-gradient(90deg,' + colors.map[w.color].hex + ' 50%,' + colors.map[w.color].hex2 + ' 50%)' : '');

    function field(name, value) { props.onField(w.id, name, value); }
    function inputClass(base, invalid) { return invalid ? base + ' cg-input-invalid' : base; }

    return html`
      <tr key=${w.id} data-wire-id=${w.id}>
        <td><input class=${inputClass('cg-num-input', props.pinAInvalid)} type="number" min="1" max=${props.maxA} value=${w.pinA}
          title=${props.pinAInvalid ? 'Another wire already uses this pin on Connector A' : ''}
          onInput=${function (e) { field('pinA', clampInt(e.target.value, 1, props.maxA, w.pinA)); }} /></td>
        <td><input class=${inputClass('cg-num-input', props.pinBInvalid)} type="number" min="1" max=${props.maxB} value=${w.pinB}
          title=${props.pinBInvalid ? 'Another wire already uses this pin on Connector B' : ''}
          onInput=${function (e) { field('pinB', clampInt(e.target.value, 1, props.maxB, w.pinB)); }} /></td>
        <td class="cg-color-cell">
          <span class="cg-color-swatch" style=${swatchStyle}></span>
          <select value=${w.color} onChange=${function (e) { field('color', e.target.value); }}>
            ${colors.order.map(function (c) { return html`<option value=${c}>${colors.map[c].name}</option>`; })}
          </select>
        </td>
        <td><input class=${inputClass('cg-text-input', props.pairGroupInvalid)} type="text" list="cg-pair-group-list" value=${w.pairGroup || ''} placeholder="e.g. TP1"
          title=${props.pairGroupInvalid ? 'A twisted pair needs exactly 2 wires in this group' : ''}
          onInput=${function (e) { field('pairGroup', e.target.value.trim() || null); }} /></td>
        <td><button class="cg-icon-button" title="Remove wire" onClick=${function () { props.onRemove(w.id); }}>✕</button></td>
      </tr>
    `;
  }

  function uniqueGroups(wires) {
    var seen = {};
    var out = [];
    wires.forEach(function (w) {
      if (w.pairGroup && !seen[w.pairGroup]) { seen[w.pairGroup] = true; out.push(w.pairGroup); }
    });
    return out;
  }

  function wireIdSet(dupeEntries) {
    var set = {};
    dupeEntries.forEach(function (entry) {
      entry.wireIds.forEach(function (id) { set[id] = true; });
    });
    return set;
  }

  function WireTable(props) {
    var h = props.harness;
    var validity = props.validity;
    var pinASet = wireIdSet(validity.duplicatePins.A);
    var pinBSet = wireIdSet(validity.duplicatePins.B);
    var invalidGroupNames = {};
    validity.invalidPairGroups.forEach(function (g) { invalidGroupNames[g.pairGroup] = true; });

    return html`
      <div>
        <table class="cg-wire-table">
          <thead>
            <tr>
              <th>Pin A</th><th>Pin B</th><th>Color</th><th>Pair Group</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${h.wires.map(function (w) {
              return html`<${WireRow} key=${w.id} wire=${w} maxA=${h.connectorA.positionCount} maxB=${h.connectorB.positionCount}
                pinAInvalid=${!!pinASet[w.id]} pinBInvalid=${!!pinBSet[w.id]}
                pairGroupInvalid=${!!(w.pairGroup && invalidGroupNames[w.pairGroup])}
                onField=${props.onField} onRemove=${props.onRemove} />`;
            })}
          </tbody>
        </table>
        <datalist id="cg-pair-group-list">
          ${uniqueGroups(h.wires).map(function (g) { return html`<option value=${g} />`; })}
        </datalist>
        <div class="cg-wire-table-actions">
          <button class="cg-secondary-button" onClick=${props.onAdd}>+ Add Wire</button>
        </div>
        ${validity.duplicatePins.A.map(function (d) {
          return html`<div class="cg-warning" key=${'a' + d.pin}>Connector A pin ${d.pin} is used by ${d.wireIds.length} wires — a pin can only take one wire.</div>`;
        })}
        ${validity.duplicatePins.B.map(function (d) {
          return html`<div class="cg-warning" key=${'b' + d.pin}>Connector B pin ${d.pin} is used by ${d.wireIds.length} wires — a pin can only take one wire.</div>`;
        })}
        ${validity.invalidPairGroups.map(function (g) {
          return html`<div class="cg-warning" key=${'g' + g.pairGroup}>Pair "${g.pairGroup}" has ${g.count} wire${g.count === 1 ? '' : 's'} — a twisted pair needs exactly 2.</div>`;
        })}
      </div>
    `;
  }

  function init(config) {
    var container = document.getElementById(config.mountId);

    function onField(id, name, value) {
      CG.store.update(function (h) {
        var w = h.wires.filter(function (w) { return w.id === id; })[0];
        if (w) w[name] = value;
      });
    }

    function onRemove(id) {
      CG.store.update(function (h) {
        h.wires = h.wires.filter(function (w) { return w.id !== id; });
      });
    }

    function onAdd() {
      CG.store.update(function (h) {
        h.wires.push(CG.model.createWire(1, 1, CG.data.colors.order[h.wires.length % CG.data.colors.order.length]));
      });
    }

    function doRender(h) {
      var validity = CG.data.validation.validateHarness(h);
      htmPreact.render(html`<${WireTable} harness=${h} validity=${validity}
        onField=${onField} onRemove=${onRemove} onAdd=${onAdd} />`, container);
    }

    CG.store.subscribe(doRender);
    doRender(CG.store.get());
  }

  global.CG = global.CG || {};
  global.CG.ui = global.CG.ui || {};
  global.CG.ui.formWireTable = { init: init };
})(window);
