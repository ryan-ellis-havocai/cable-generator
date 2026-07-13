// Minimal generic pub/sub used by the store. No app-specific knowledge here.
(function (global) {
  'use strict';

  function createEmitter() {
    var listeners = [];
    return {
      subscribe: function (fn) {
        listeners.push(fn);
        return function unsubscribe() {
          var idx = listeners.indexOf(fn);
          if (idx !== -1) listeners.splice(idx, 1);
        };
      },
      emit: function () {
        var args = arguments;
        // snapshot so a listener unsubscribing mid-emit doesn't skip others
        listeners.slice().forEach(function (fn) {
          fn.apply(null, args);
        });
      }
    };
  }

  global.CG = global.CG || {};
  global.CG.createEmitter = createEmitter;
})(window);
