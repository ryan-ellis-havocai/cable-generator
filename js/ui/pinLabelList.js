// Preact/htm widget for a connector's per-pin signal-name labels. This is a genuine
// add/remove list (position count changes resize it), so it's built with Preact rather
// than hand-rolled DOM diffing — see the plan notes on focus-loss bugs.
(function (global) {
  'use strict';

  var CG = global.CG;
  var html = htmPreact.html;

  function PinLabelRow(props) {
    return html`
      <div class="cg-pin-label-row" key=${props.index}>
        <span class="cg-pin-label-num">${props.index + 1}</span>
        <input type="text" value=${props.value} placeholder="signal name"
          onInput=${function (e) { props.onChange(props.index, e.target.value); }} />
      </div>
    `;
  }

  function PinLabelList(props) {
    return html`
      <div class="cg-pin-label-list">
        ${props.pinLabels.map(function (label, i) {
          return html`<${PinLabelRow} key=${i} index=${i} value=${label} onChange=${props.onChange} />`;
        })}
      </div>
    `;
  }

  function init(config) {
    var container = document.getElementById(config.mountId);
    var key = config.key; // 'connectorA' | 'connectorB'

    function onChange(index, value) {
      CG.store.update(function (h) { h[key].pinLabels[index] = value; });
    }

    function doRender(h) {
      htmPreact.render(html`<${PinLabelList} pinLabels=${h[key].pinLabels} onChange=${onChange} />`, container);
    }

    CG.store.subscribe(doRender);
    doRender(CG.store.get());
  }

  global.CG = global.CG || {};
  global.CG.ui = global.CG.ui || {};
  global.CG.ui.pinLabelList = { init: init };
})(window);
