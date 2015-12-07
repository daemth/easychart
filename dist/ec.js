(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Standalone extraction of Backbone.Events, no external dependency required.
 * Degrades nicely when Backone/underscore are already available in the current
 * global context.
 *
 * Note that docs suggest to use underscore's `_.extend()` method to add Events
 * support to some given object. A `mixin()` method has been added to the Events
 * prototype to avoid using underscore for that sole purpose:
 *
 *     var myEventEmitter = BackboneEvents.mixin({});
 *
 * Or for a function constructor:
 *
 *     function MyConstructor(){}
 *     MyConstructor.prototype.foo = function(){}
 *     BackboneEvents.mixin(MyConstructor.prototype);
 *
 * (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
 * (c) 2013 Nicolas Perriault
 */
/* global exports:true, define, module */
(function() {
  var root = this,
      nativeForEach = Array.prototype.forEach,
      hasOwnProperty = Object.prototype.hasOwnProperty,
      slice = Array.prototype.slice,
      idCounter = 0;

  // Returns a partial implementation matching the minimal API subset required
  // by Backbone.Events
  function miniscore() {
    return {
      keys: Object.keys || function (obj) {
        if (typeof obj !== "object" && typeof obj !== "function" || obj === null) {
          throw new TypeError("keys() called on a non-object");
        }
        var key, keys = [];
        for (key in obj) {
          if (obj.hasOwnProperty(key)) {
            keys[keys.length] = key;
          }
        }
        return keys;
      },

      uniqueId: function(prefix) {
        var id = ++idCounter + '';
        return prefix ? prefix + id : id;
      },

      has: function(obj, key) {
        return hasOwnProperty.call(obj, key);
      },

      each: function(obj, iterator, context) {
        if (obj == null) return;
        if (nativeForEach && obj.forEach === nativeForEach) {
          obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
          for (var i = 0, l = obj.length; i < l; i++) {
            iterator.call(context, obj[i], i, obj);
          }
        } else {
          for (var key in obj) {
            if (this.has(obj, key)) {
              iterator.call(context, obj[key], key, obj);
            }
          }
        }
      },

      once: function(func) {
        var ran = false, memo;
        return function() {
          if (ran) return memo;
          ran = true;
          memo = func.apply(this, arguments);
          func = null;
          return memo;
        };
      }
    };
  }

  var _ = miniscore(), Events;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }

      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeners = this._listeners;
      if (!listeners) return this;
      var deleteListener = !name && !callback;
      if (typeof name === 'object') callback = this;
      if (obj) (listeners = {})[obj._listenerId] = obj;
      for (var id in listeners) {
        listeners[id].off(name, callback, this);
        if (deleteListener) delete this._listeners[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeners = this._listeners || (this._listeners = {});
      var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
      listeners[id] = obj;
      if (typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Mixin utility
  Events.mixin = function(proto) {
    var exports = ['on', 'once', 'off', 'trigger', 'stopListening', 'listenTo',
                   'listenToOnce', 'bind', 'unbind'];
    _.each(exports, function(name) {
      proto[name] = this[name];
    }, this);
    return proto;
  };

  // Export Events as BackboneEvents depending on current context
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Events;
    }
    exports.BackboneEvents = Events;
  }else if (typeof define === "function"  && typeof define.amd == "object") {
    define(function() {
      return Events;
    });
  } else {
    root.BackboneEvents = Events;
  }
})(this);

},{}],2:[function(require,module,exports){
module.exports = require('./backbone-events-standalone');

},{"./backbone-events-standalone":1}],3:[function(require,module,exports){

},{}],4:[function(require,module,exports){
/*!
 * Cross-Browser Split 1.1.1
 * Copyright 2007-2012 Steven Levithan <stevenlevithan.com>
 * Available under the MIT License
 * ECMAScript compliant, uniform cross-browser split method
 */

/**
 * Splits a string into an array of strings using a regex or string separator. Matches of the
 * separator are not included in the result array. However, if `separator` is a regex that contains
 * capturing groups, backreferences are spliced into the result each time `separator` is matched.
 * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
 * cross-browser.
 * @param {String} str String to split.
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {Array} Array of substrings.
 * @example
 *
 * // Basic use
 * split('a b c d', ' ');
 * // -> ['a', 'b', 'c', 'd']
 *
 * // With limit
 * split('a b c d', ' ', 2);
 * // -> ['a', 'b']
 *
 * // Backreferences in result array
 * split('..word1 word2..', /([a-z]+)(\d+)/i);
 * // -> ['..', 'word', '1', ' ', 'word', '2', '..']
 */
module.exports = (function split(undef) {

  var nativeSplit = String.prototype.split,
    compliantExecNpcg = /()??/.exec("")[1] === undef,
    // NPCG: nonparticipating capturing group
    self;

  self = function(str, separator, limit) {
    // If `separator` is not a regex, use `nativeSplit`
    if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
      return nativeSplit.call(str, separator, limit);
    }
    var output = [],
      flags = (separator.ignoreCase ? "i" : "") + (separator.multiline ? "m" : "") + (separator.extended ? "x" : "") + // Proposed for ES6
      (separator.sticky ? "y" : ""),
      // Firefox 3+
      lastLastIndex = 0,
      // Make `global` and avoid `lastIndex` issues by working with a copy
      separator = new RegExp(separator.source, flags + "g"),
      separator2, match, lastIndex, lastLength;
    str += ""; // Type-convert
    if (!compliantExecNpcg) {
      // Doesn't need flags gy, but they don't hurt
      separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
    }
    /* Values for `limit`, per the spec:
     * If undefined: 4294967295 // Math.pow(2, 32) - 1
     * If 0, Infinity, or NaN: 0
     * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
     * If negative number: 4294967296 - Math.floor(Math.abs(limit))
     * If other: Type-convert, then use the above rules
     */
    limit = limit === undef ? -1 >>> 0 : // Math.pow(2, 32) - 1
    limit >>> 0; // ToUint32(limit)
    while (match = separator.exec(str)) {
      // `separator.lastIndex` is not reliable cross-browser
      lastIndex = match.index + match[0].length;
      if (lastIndex > lastLastIndex) {
        output.push(str.slice(lastLastIndex, match.index));
        // Fix browsers whose `exec` methods don't consistently return `undefined` for
        // nonparticipating capturing groups
        if (!compliantExecNpcg && match.length > 1) {
          match[0].replace(separator2, function() {
            for (var i = 1; i < arguments.length - 2; i++) {
              if (arguments[i] === undef) {
                match[i] = undef;
              }
            }
          });
        }
        if (match.length > 1 && match.index < str.length) {
          Array.prototype.push.apply(output, match.slice(1));
        }
        lastLength = match[0].length;
        lastLastIndex = lastIndex;
        if (output.length >= limit) {
          break;
        }
      }
      if (separator.lastIndex === match.index) {
        separator.lastIndex++; // Avoid an infinite loop
      }
    }
    if (lastLastIndex === str.length) {
      if (lastLength || !separator.test("")) {
        output.push("");
      }
    } else {
      output.push(str.slice(lastLastIndex));
    }
    return output.length > limit ? output.slice(0, limit) : output;
  };

  return self;
})();

},{}],5:[function(require,module,exports){
arguments[4][3][0].apply(exports,arguments)
},{"dup":3}],6:[function(require,module,exports){
module.exports = function(obj) {
    if (typeof obj === 'string') return camelCase(obj);
    return walk(obj);
};

function walk (obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (isDate(obj) || isRegex(obj)) return obj;
    if (isArray(obj)) return map(obj, walk);
    return reduce(objectKeys(obj), function (acc, key) {
        var camel = camelCase(key);
        acc[camel] = walk(obj[key]);
        return acc;
    }, {});
}

function camelCase(str) {
    return str.replace(/[_.-](\w|$)/g, function (_,x) {
        return x.toUpperCase();
    });
}

var isArray = Array.isArray || function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
};

var isDate = function (obj) {
    return Object.prototype.toString.call(obj) === '[object Date]';
};

var isRegex = function (obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

var has = Object.prototype.hasOwnProperty;
var objectKeys = Object.keys || function (obj) {
    var keys = [];
    for (var key in obj) {
        if (has.call(obj, key)) keys.push(key);
    }
    return keys;
};

function map (xs, f) {
    if (xs.map) return xs.map(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        res.push(f(xs[i], i));
    }
    return res;
}

function reduce (xs, f, acc) {
    if (xs.reduce) return xs.reduce(f, acc);
    for (var i = 0; i < xs.length; i++) {
        acc = f(acc, xs[i], i);
    }
    return acc;
}

},{}],7:[function(require,module,exports){
/**
 * cuid.js
 * Collision-resistant UID generator for browsers and node.
 * Sequential for fast db lookups and recency sorting.
 * Safe for element IDs and server-side lookups.
 *
 * Extracted from CLCTR
 *
 * Copyright (c) Eric Elliott 2012
 * MIT License
 */

/*global window, navigator, document, require, process, module */
(function (app) {
  'use strict';
  var namespace = 'cuid',
    c = 0,
    blockSize = 4,
    base = 36,
    discreteValues = Math.pow(base, blockSize),

    pad = function pad(num, size) {
      var s = "000000000" + num;
      return s.substr(s.length-size);
    },

    randomBlock = function randomBlock() {
      return pad((Math.random() *
            discreteValues << 0)
            .toString(base), blockSize);
    },

    safeCounter = function () {
      c = (c < discreteValues) ? c : 0;
      c++; // this is not subliminal
      return c - 1;
    },

    api = function cuid() {
      // Starting with a lowercase letter makes
      // it HTML element ID friendly.
      var letter = 'c', // hard-coded allows for sequential access

        // timestamp
        // warning: this exposes the exact date and time
        // that the uid was created.
        timestamp = (new Date().getTime()).toString(base),

        // Prevent same-machine collisions.
        counter,

        // A few chars to generate distinct ids for different
        // clients (so different computers are far less
        // likely to generate the same id)
        fingerprint = api.fingerprint(),

        // Grab some more chars from Math.random()
        random = randomBlock() + randomBlock();

        counter = pad(safeCounter().toString(base), blockSize);

      return  (letter + timestamp + counter + fingerprint + random);
    };

  api.slug = function slug() {
    var date = new Date().getTime().toString(36),
      counter,
      print = api.fingerprint().slice(0,1) +
        api.fingerprint().slice(-1),
      random = randomBlock().slice(-2);

      counter = safeCounter().toString(36).slice(-4);

    return date.slice(-2) +
      counter + print + random;
  };

  api.globalCount = function globalCount() {
    // We want to cache the results of this
    var cache = (function calc() {
        var i,
          count = 0;

        for (i in window) {
          count++;
        }

        return count;
      }());

    api.globalCount = function () { return cache; };
    return cache;
  };

  api.fingerprint = function browserPrint() {
    return pad((navigator.mimeTypes.length +
      navigator.userAgent.length).toString(36) +
      api.globalCount().toString(36), 4);
  };

  // don't change anything from here down.
  if (app.register) {
    app.register(namespace, api);
  } else if (typeof module !== 'undefined') {
    module.exports = api;
  } else {
    app[namespace] = api;
  }

}(this.applitude || this));

},{}],8:[function(require,module,exports){
var EvStore = require("ev-store")

module.exports = addEvent

function addEvent(target, type, handler) {
    var events = EvStore(target)
    var event = events[type]

    if (!event) {
        events[type] = handler
    } else if (Array.isArray(event)) {
        if (event.indexOf(handler) === -1) {
            event.push(handler)
        }
    } else if (event !== handler) {
        events[type] = [event, handler]
    }
}

},{"ev-store":15}],9:[function(require,module,exports){
var globalDocument = require("global/document")
var EvStore = require("ev-store")
var createStore = require("weakmap-shim/create-store")

var addEvent = require("./add-event.js")
var removeEvent = require("./remove-event.js")
var ProxyEvent = require("./proxy-event.js")

var HANDLER_STORE = createStore()

module.exports = DOMDelegator

function DOMDelegator(document) {
    if (!(this instanceof DOMDelegator)) {
        return new DOMDelegator(document);
    }

    document = document || globalDocument

    this.target = document.documentElement
    this.events = {}
    this.rawEventListeners = {}
    this.globalListeners = {}
}

DOMDelegator.prototype.addEventListener = addEvent
DOMDelegator.prototype.removeEventListener = removeEvent

DOMDelegator.allocateHandle =
    function allocateHandle(func) {
        var handle = new Handle()

        HANDLER_STORE(handle).func = func;

        return handle
    }

DOMDelegator.transformHandle =
    function transformHandle(handle, broadcast) {
        var func = HANDLER_STORE(handle).func

        return this.allocateHandle(function (ev) {
            broadcast(ev, func);
        })
    }

DOMDelegator.prototype.addGlobalEventListener =
    function addGlobalEventListener(eventName, fn) {
        var listeners = this.globalListeners[eventName] || [];
        if (listeners.indexOf(fn) === -1) {
            listeners.push(fn)
        }

        this.globalListeners[eventName] = listeners;
    }

DOMDelegator.prototype.removeGlobalEventListener =
    function removeGlobalEventListener(eventName, fn) {
        var listeners = this.globalListeners[eventName] || [];

        var index = listeners.indexOf(fn)
        if (index !== -1) {
            listeners.splice(index, 1)
        }
    }

DOMDelegator.prototype.listenTo = function listenTo(eventName) {
    if (!(eventName in this.events)) {
        this.events[eventName] = 0;
    }

    this.events[eventName]++;

    if (this.events[eventName] !== 1) {
        return
    }

    var listener = this.rawEventListeners[eventName]
    if (!listener) {
        listener = this.rawEventListeners[eventName] =
            createHandler(eventName, this)
    }

    this.target.addEventListener(eventName, listener, true)
}

DOMDelegator.prototype.unlistenTo = function unlistenTo(eventName) {
    if (!(eventName in this.events)) {
        this.events[eventName] = 0;
    }

    if (this.events[eventName] === 0) {
        throw new Error("already unlistened to event.");
    }

    this.events[eventName]--;

    if (this.events[eventName] !== 0) {
        return
    }

    var listener = this.rawEventListeners[eventName]

    if (!listener) {
        throw new Error("dom-delegator#unlistenTo: cannot " +
            "unlisten to " + eventName)
    }

    this.target.removeEventListener(eventName, listener, true)
}

function createHandler(eventName, delegator) {
    var globalListeners = delegator.globalListeners;
    var delegatorTarget = delegator.target;

    return handler

    function handler(ev) {
        var globalHandlers = globalListeners[eventName] || []

        if (globalHandlers.length > 0) {
            var globalEvent = new ProxyEvent(ev);
            globalEvent.currentTarget = delegatorTarget;
            callListeners(globalHandlers, globalEvent)
        }

        findAndInvokeListeners(ev.target, ev, eventName)
    }
}

function findAndInvokeListeners(elem, ev, eventName) {
    var listener = getListener(elem, eventName)

    if (listener && listener.handlers.length > 0) {
        var listenerEvent = new ProxyEvent(ev);
        listenerEvent.currentTarget = listener.currentTarget
        callListeners(listener.handlers, listenerEvent)

        if (listenerEvent._bubbles) {
            var nextTarget = listener.currentTarget.parentNode
            findAndInvokeListeners(nextTarget, ev, eventName)
        }
    }
}

function getListener(target, type) {
    // terminate recursion if parent is `null`
    if (target === null || typeof target === "undefined") {
        return null
    }

    var events = EvStore(target)
    // fetch list of handler fns for this event
    var handler = events[type]
    var allHandler = events.event

    if (!handler && !allHandler) {
        return getListener(target.parentNode, type)
    }

    var handlers = [].concat(handler || [], allHandler || [])
    return new Listener(target, handlers)
}

function callListeners(handlers, ev) {
    handlers.forEach(function (handler) {
        if (typeof handler === "function") {
            handler(ev)
        } else if (typeof handler.handleEvent === "function") {
            handler.handleEvent(ev)
        } else if (handler.type === "dom-delegator-handle") {
            HANDLER_STORE(handler).func(ev)
        } else {
            throw new Error("dom-delegator: unknown handler " +
                "found: " + JSON.stringify(handlers));
        }
    })
}

function Listener(target, handlers) {
    this.currentTarget = target
    this.handlers = handlers
}

function Handle() {
    this.type = "dom-delegator-handle"
}

},{"./add-event.js":8,"./proxy-event.js":11,"./remove-event.js":12,"ev-store":15,"global/document":19,"weakmap-shim/create-store":118}],10:[function(require,module,exports){
var Individual = require("individual")
var cuid = require("cuid")
var globalDocument = require("global/document")

var DOMDelegator = require("./dom-delegator.js")

var versionKey = "13"
var cacheKey = "__DOM_DELEGATOR_CACHE@" + versionKey
var cacheTokenKey = "__DOM_DELEGATOR_CACHE_TOKEN@" + versionKey
var delegatorCache = Individual(cacheKey, {
    delegators: {}
})
var commonEvents = [
    "blur", "change", "click",  "contextmenu", "dblclick",
    "error","focus", "focusin", "focusout", "input", "keydown",
    "keypress", "keyup", "load", "mousedown", "mouseup",
    "resize", "select", "submit", "touchcancel",
    "touchend", "touchstart", "unload"
]

/*  Delegator is a thin wrapper around a singleton `DOMDelegator`
        instance.

    Only one DOMDelegator should exist because we do not want
        duplicate event listeners bound to the DOM.

    `Delegator` will also `listenTo()` all events unless
        every caller opts out of it
*/
module.exports = Delegator

function Delegator(opts) {
    opts = opts || {}
    var document = opts.document || globalDocument

    var cacheKey = document[cacheTokenKey]

    if (!cacheKey) {
        cacheKey =
            document[cacheTokenKey] = cuid()
    }

    var delegator = delegatorCache.delegators[cacheKey]

    if (!delegator) {
        delegator = delegatorCache.delegators[cacheKey] =
            new DOMDelegator(document)
    }

    if (opts.defaultEvents !== false) {
        for (var i = 0; i < commonEvents.length; i++) {
            delegator.listenTo(commonEvents[i])
        }
    }

    return delegator
}

Delegator.allocateHandle = DOMDelegator.allocateHandle;
Delegator.transformHandle = DOMDelegator.transformHandle;

},{"./dom-delegator.js":9,"cuid":7,"global/document":19,"individual":20}],11:[function(require,module,exports){
var inherits = require("inherits")

var ALL_PROPS = [
    "altKey", "bubbles", "cancelable", "ctrlKey",
    "eventPhase", "metaKey", "relatedTarget", "shiftKey",
    "target", "timeStamp", "type", "view", "which"
]
var KEY_PROPS = ["char", "charCode", "key", "keyCode"]
var MOUSE_PROPS = [
    "button", "buttons", "clientX", "clientY", "layerX",
    "layerY", "offsetX", "offsetY", "pageX", "pageY",
    "screenX", "screenY", "toElement"
]

var rkeyEvent = /^key|input/
var rmouseEvent = /^(?:mouse|pointer|contextmenu)|click/

module.exports = ProxyEvent

function ProxyEvent(ev) {
    if (!(this instanceof ProxyEvent)) {
        return new ProxyEvent(ev)
    }

    if (rkeyEvent.test(ev.type)) {
        return new KeyEvent(ev)
    } else if (rmouseEvent.test(ev.type)) {
        return new MouseEvent(ev)
    }

    for (var i = 0; i < ALL_PROPS.length; i++) {
        var propKey = ALL_PROPS[i]
        this[propKey] = ev[propKey]
    }

    this._rawEvent = ev
    this._bubbles = false;
}

ProxyEvent.prototype.preventDefault = function () {
    this._rawEvent.preventDefault()
}

ProxyEvent.prototype.startPropagation = function () {
    this._bubbles = true;
}

function MouseEvent(ev) {
    for (var i = 0; i < ALL_PROPS.length; i++) {
        var propKey = ALL_PROPS[i]
        this[propKey] = ev[propKey]
    }

    for (var j = 0; j < MOUSE_PROPS.length; j++) {
        var mousePropKey = MOUSE_PROPS[j]
        this[mousePropKey] = ev[mousePropKey]
    }

    this._rawEvent = ev
}

inherits(MouseEvent, ProxyEvent)

function KeyEvent(ev) {
    for (var i = 0; i < ALL_PROPS.length; i++) {
        var propKey = ALL_PROPS[i]
        this[propKey] = ev[propKey]
    }

    for (var j = 0; j < KEY_PROPS.length; j++) {
        var keyPropKey = KEY_PROPS[j]
        this[keyPropKey] = ev[keyPropKey]
    }

    this._rawEvent = ev
}

inherits(KeyEvent, ProxyEvent)

},{"inherits":21}],12:[function(require,module,exports){
var EvStore = require("ev-store")

module.exports = removeEvent

function removeEvent(target, type, handler) {
    var events = EvStore(target)
    var event = events[type]

    if (!event) {
        return
    } else if (Array.isArray(event)) {
        var index = event.indexOf(handler)
        if (index !== -1) {
            event.splice(index, 1)
        }
    } else if (event === handler) {
        events[type] = null
    }
}

},{"ev-store":15}],13:[function(require,module,exports){
module.exports = dragDrop

var flatten = require('flatten')
var parallel = require('run-parallel')
var throttle = require('lodash.throttle')

function dragDrop (elem, ondrop) {
  if (typeof elem === 'string') elem = window.document.querySelector(elem)

  var onDragOver = makeOnDragOver(elem)
  var onDrop = makeOnDrop(elem, ondrop)

  elem.addEventListener('dragenter', stopEvent, false)
  elem.addEventListener('dragover', onDragOver, false)
  elem.addEventListener('drop', onDrop, false)

  // Function to remove drag-drop listeners
  return function remove () {
    if (elem instanceof window.Element) elem.classList.remove('drag')
    elem.removeEventListener('dragenter', stopEvent, false)
    elem.removeEventListener('dragover', onDragOver, false)
    elem.removeEventListener('drop', onDrop, false)
  }
}

function stopEvent (e) {
  e.stopPropagation()
  e.preventDefault()
  return false
}

function makeOnDragOver (elem) {
  var fn = throttle(function () {
    if (elem instanceof window.Element) elem.classList.add('drag')

    if (elem.timeout) clearTimeout(elem.timeout)
    elem.timeout = setTimeout(function () {
      if (elem instanceof window.Element) elem.classList.remove('drag')
    }, 150)
  }, 100, {trailing: false})

  return function (e) {
    e.stopPropagation()
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    fn()
  }
}

function makeOnDrop (elem, ondrop) {
  return function (e) {
    e.stopPropagation()
    e.preventDefault()
    if (elem instanceof window.Element) elem.classList.remove('drag')
    var pos = { x: e.clientX, y: e.clientY }
    if (e.dataTransfer.items) {
      // Handle directories in Chrome using the proprietary FileSystem API
      parallel(toArray(e.dataTransfer.items).map(function (item) {
        return function (cb) {
          processEntry(item.webkitGetAsEntry(), cb)
        }
      }), function (err, results) {
        if (err) return // there will never be an err here
        ondrop(flatten(results), pos)
      })
    } else {
      var files = toArray(e.dataTransfer.files)
      files.forEach(function (file) {
        file.fullPath = '/' + file.name
      })
      ondrop(files, pos)
    }

    return false
  }
}

function processEntry (entry, cb) {
  var entries = []

  if (entry.isFile) {
    entry.file(function (file) {
      file.fullPath = entry.fullPath  // preserve pathing for consumer
      cb(null, file)
    })
  } else if (entry.isDirectory) {
    var reader = entry.createReader()
    readEntries()
  }

  function readEntries () {
    reader.readEntries(function (entries_) {
      if (entries_.length > 0) {
        entries = entries.concat(toArray(entries_))
        readEntries() // continue reading entries until `readEntries` returns no more
      } else {
        doneEntries()
      }
    })
  }

  function doneEntries () {
    parallel(entries.map(function (entry) {
      return function (cb) {
        processEntry(entry, cb)
      }
    }), cb)
  }
}

function toArray (list) {
  return Array.prototype.slice.call(list || [], 0)
}

},{"flatten":18,"lodash.throttle":78,"run-parallel":88}],14:[function(require,module,exports){
var camelize = require("camelize")
var template = require("string-template")
var extend = require("xtend/mutable")

module.exports = TypedError

function TypedError(args) {
    if (!args) {
        throw new Error("args is required");
    }
    if (!args.type) {
        throw new Error("args.type is required");
    }
    if (!args.message) {
        throw new Error("args.message is required");
    }

    var message = args.message

    if (args.type && !args.name) {
        var errorName = camelize(args.type) + "Error"
        args.name = errorName[0].toUpperCase() + errorName.substr(1)
    }

    extend(createError, args);
    createError._name = args.name;

    return createError;

    function createError(opts) {
        var result = new Error()

        Object.defineProperty(result, "type", {
            value: result.type,
            enumerable: true,
            writable: true,
            configurable: true
        })

        var options = extend({}, args, opts)

        extend(result, options)
        result.message = template(message, options)

        return result
    }
}


},{"camelize":6,"string-template":89,"xtend/mutable":121}],15:[function(require,module,exports){
'use strict';

var OneVersionConstraint = require('individual/one-version');

var MY_VERSION = '7';
OneVersionConstraint('ev-store', MY_VERSION);

var hashKey = '__EV_STORE_KEY@' + MY_VERSION;

module.exports = EvStore;

function EvStore(elem) {
    var hash = elem[hashKey];

    if (!hash) {
        hash = elem[hashKey] = {};
    }

    return hash;
}

},{"individual/one-version":17}],16:[function(require,module,exports){
(function (global){
'use strict';

/*global window, global*/

var root = typeof window !== 'undefined' ?
    window : typeof global !== 'undefined' ?
    global : {};

module.exports = Individual;

function Individual(key, value) {
    if (key in root) {
        return root[key];
    }

    root[key] = value;

    return value;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],17:[function(require,module,exports){
'use strict';

var Individual = require('./index.js');

module.exports = OneVersion;

function OneVersion(moduleName, version, defaultValue) {
    var key = '__INDIVIDUAL_ONE_VERSION_' + moduleName;
    var enforceKey = key + '_ENFORCE_SINGLETON';

    var versionValue = Individual(enforceKey, version);

    if (versionValue !== version) {
        throw new Error('Can only have one copy of ' +
            moduleName + '.\n' +
            'You already have version ' + versionValue +
            ' installed.\n' +
            'This means you cannot install version ' + version);
    }

    return Individual(key, defaultValue);
}

},{"./index.js":16}],18:[function(require,module,exports){
module.exports = function flatten(list, depth) {
  depth = (typeof depth == 'number') ? depth : Infinity;

  return _flatten(list, 1);

  function _flatten(list, d) {
    return list.reduce(function (acc, item) {
      if (Array.isArray(item) && d < depth) {
        return acc.concat(_flatten(item, d + 1));
      }
      else {
        return acc.concat(item);
      }
    }, []);
  }
};

},{}],19:[function(require,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

if (typeof document !== 'undefined') {
    module.exports = document;
} else {
    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }

    module.exports = doccy;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"min-document":3}],20:[function(require,module,exports){
(function (global){
var root = typeof window !== 'undefined' ?
    window : typeof global !== 'undefined' ?
    global : {};

module.exports = Individual

function Individual(key, value) {
    if (root[key]) {
        return root[key]
    }

    Object.defineProperty(root, key, {
        value: value
        , configurable: true
    })

    return value
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],21:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],22:[function(require,module,exports){
"use strict";

module.exports = function isObject(x) {
	return typeof x === "object" && x !== null;
};

},{}],23:[function(require,module,exports){
/**
 * lodash 3.0.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function arrayCopy(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

module.exports = arrayCopy;

},{}],24:[function(require,module,exports){
/**
 * lodash 3.0.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * A specialized version of `_.forEach` for arrays without support for callback
 * shorthands or `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

module.exports = arrayEach;

},{}],25:[function(require,module,exports){
/**
 * lodash 3.0.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * A specialized version of `_.map` for arrays without support for callback
 * shorthands or `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

module.exports = arrayMap;

},{}],26:[function(require,module,exports){
/**
 * lodash 3.2.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var baseCopy = require('lodash._basecopy'),
    keys = require('lodash.keys');

/**
 * The base implementation of `_.assign` without support for argument juggling,
 * multiple sources, and `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssign(object, source) {
  return source == null
    ? object
    : baseCopy(source, keys(source), object);
}

module.exports = baseAssign;

},{"lodash._basecopy":29,"lodash.keys":68}],27:[function(require,module,exports){
/**
 * lodash 3.3.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var baseIsEqual = require('lodash._baseisequal'),
    bindCallback = require('lodash._bindcallback'),
    isArray = require('lodash.isarray'),
    pairs = require('lodash.pairs');

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\n\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/,
    rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\n\\]|\\.)*?)\2)\]/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/**
 * Converts `value` to a string if it's not one. An empty string is returned
 * for `null` or `undefined` values.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  return value == null ? '' : (value + '');
}

/**
 * The base implementation of `_.callback` which supports specifying the
 * number of arguments to provide to `func`.
 *
 * @private
 * @param {*} [func=_.identity] The value to convert to a callback.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {number} [argCount] The number of arguments to provide to `func`.
 * @returns {Function} Returns the callback.
 */
function baseCallback(func, thisArg, argCount) {
  var type = typeof func;
  if (type == 'function') {
    return thisArg === undefined
      ? func
      : bindCallback(func, thisArg, argCount);
  }
  if (func == null) {
    return identity;
  }
  if (type == 'object') {
    return baseMatches(func);
  }
  return thisArg === undefined
    ? property(func)
    : baseMatchesProperty(func, thisArg);
}

/**
 * The base implementation of `get` without support for string paths
 * and default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} path The path of the property to get.
 * @param {string} [pathKey] The key representation of path.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path, pathKey) {
  if (object == null) {
    return;
  }
  if (pathKey !== undefined && pathKey in toObject(object)) {
    path = [pathKey];
  }
  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[path[index++]];
  }
  return (index && index == length) ? object : undefined;
}

/**
 * The base implementation of `_.isMatch` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Array} matchData The propery names, values, and compare flags to match.
 * @param {Function} [customizer] The function to customize comparing objects.
 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
 */
function baseIsMatch(object, matchData, customizer) {
  var index = matchData.length,
      length = index,
      noCustomizer = !customizer;

  if (object == null) {
    return !length;
  }
  object = toObject(object);
  while (index--) {
    var data = matchData[index];
    if ((noCustomizer && data[2])
          ? data[1] !== object[data[0]]
          : !(data[0] in object)
        ) {
      return false;
    }
  }
  while (++index < length) {
    data = matchData[index];
    var key = data[0],
        objValue = object[key],
        srcValue = data[1];

    if (noCustomizer && data[2]) {
      if (objValue === undefined && !(key in object)) {
        return false;
      }
    } else {
      var result = customizer ? customizer(objValue, srcValue, key) : undefined;
      if (!(result === undefined ? baseIsEqual(srcValue, objValue, customizer, true) : result)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * The base implementation of `_.matches` which does not clone `source`.
 *
 * @private
 * @param {Object} source The object of property values to match.
 * @returns {Function} Returns the new function.
 */
function baseMatches(source) {
  var matchData = getMatchData(source);
  if (matchData.length == 1 && matchData[0][2]) {
    var key = matchData[0][0],
        value = matchData[0][1];

    return function(object) {
      if (object == null) {
        return false;
      }
      return object[key] === value && (value !== undefined || (key in toObject(object)));
    };
  }
  return function(object) {
    return baseIsMatch(object, matchData);
  };
}

/**
 * The base implementation of `_.matchesProperty` which does not clone `srcValue`.
 *
 * @private
 * @param {string} path The path of the property to get.
 * @param {*} srcValue The value to compare.
 * @returns {Function} Returns the new function.
 */
function baseMatchesProperty(path, srcValue) {
  var isArr = isArray(path),
      isCommon = isKey(path) && isStrictComparable(srcValue),
      pathKey = (path + '');

  path = toPath(path);
  return function(object) {
    if (object == null) {
      return false;
    }
    var key = pathKey;
    object = toObject(object);
    if ((isArr || !isCommon) && !(key in object)) {
      object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
      if (object == null) {
        return false;
      }
      key = last(path);
      object = toObject(object);
    }
    return object[key] === srcValue
      ? (srcValue !== undefined || (key in object))
      : baseIsEqual(srcValue, object[key], undefined, true);
  };
}

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

/**
 * A specialized version of `baseProperty` which supports deep paths.
 *
 * @private
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new function.
 */
function basePropertyDeep(path) {
  var pathKey = (path + '');
  path = toPath(path);
  return function(object) {
    return baseGet(object, path, pathKey);
  };
}

/**
 * The base implementation of `_.slice` without an iteratee call guard.
 *
 * @private
 * @param {Array} array The array to slice.
 * @param {number} [start=0] The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the slice of `array`.
 */
function baseSlice(array, start, end) {
  var index = -1,
      length = array.length;

  start = start == null ? 0 : (+start || 0);
  if (start < 0) {
    start = -start > length ? 0 : (length + start);
  }
  end = (end === undefined || end > length) ? length : (+end || 0);
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : ((end - start) >>> 0);
  start >>>= 0;

  var result = Array(length);
  while (++index < length) {
    result[index] = array[index + start];
  }
  return result;
}

/**
 * Gets the propery names, values, and compare flags of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the match data of `object`.
 */
function getMatchData(object) {
  var result = pairs(object),
      length = result.length;

  while (length--) {
    result[length][2] = isStrictComparable(result[length][1]);
  }
  return result;
}

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  var type = typeof value;
  if ((type == 'string' && reIsPlainProp.test(value)) || type == 'number') {
    return true;
  }
  if (isArray(value)) {
    return false;
  }
  var result = !reIsDeepProp.test(value);
  return result || (object != null && value in toObject(object));
}

/**
 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` if suitable for strict
 *  equality comparisons, else `false`.
 */
function isStrictComparable(value) {
  return value === value && !isObject(value);
}

/**
 * Converts `value` to an object if it's not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Object} Returns the object.
 */
function toObject(value) {
  return isObject(value) ? value : Object(value);
}

/**
 * Converts `value` to property path array if it's not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Array} Returns the property path array.
 */
function toPath(value) {
  if (isArray(value)) {
    return value;
  }
  var result = [];
  baseToString(value).replace(rePropName, function(match, number, quote, string) {
    result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
}

/**
 * Gets the last element of `array`.
 *
 * @static
 * @memberOf _
 * @category Array
 * @param {Array} array The array to query.
 * @returns {*} Returns the last element of `array`.
 * @example
 *
 * _.last([1, 2, 3]);
 * // => 3
 */
function last(array) {
  var length = array ? array.length : 0;
  return length ? array[length - 1] : undefined;
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * This method returns the first argument provided to it.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'user': 'fred' };
 *
 * _.identity(object) === object;
 * // => true
 */
function identity(value) {
  return value;
}

/**
 * Creates a function that returns the property value at `path` on a
 * given object.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var objects = [
 *   { 'a': { 'b': { 'c': 2 } } },
 *   { 'a': { 'b': { 'c': 1 } } }
 * ];
 *
 * _.map(objects, _.property('a.b.c'));
 * // => [2, 1]
 *
 * _.pluck(_.sortBy(objects, _.property(['a', 'b', 'c'])), 'a.b.c');
 * // => [1, 2]
 */
function property(path) {
  return isKey(path) ? baseProperty(path) : basePropertyDeep(path);
}

module.exports = baseCallback;

},{"lodash._baseisequal":36,"lodash._bindcallback":41,"lodash.isarray":58,"lodash.pairs":72}],28:[function(require,module,exports){
(function (global){
/**
 * lodash 3.3.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var arrayCopy = require('lodash._arraycopy'),
    arrayEach = require('lodash._arrayeach'),
    baseAssign = require('lodash._baseassign'),
    baseFor = require('lodash._basefor'),
    isArray = require('lodash.isarray'),
    keys = require('lodash.keys');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to match `RegExp` flags from their coerced string values. */
var reFlags = /\w*$/;

/** Used to identify `toStringTag` values supported by `_.clone`. */
var cloneableTags = {};
cloneableTags[argsTag] = cloneableTags[arrayTag] =
cloneableTags[arrayBufferTag] = cloneableTags[boolTag] =
cloneableTags[dateTag] = cloneableTags[float32Tag] =
cloneableTags[float64Tag] = cloneableTags[int8Tag] =
cloneableTags[int16Tag] = cloneableTags[int32Tag] =
cloneableTags[numberTag] = cloneableTags[objectTag] =
cloneableTags[regexpTag] = cloneableTags[stringTag] =
cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
cloneableTags[errorTag] = cloneableTags[funcTag] =
cloneableTags[mapTag] = cloneableTags[setTag] =
cloneableTags[weakMapTag] = false;

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/** Native method references. */
var ArrayBuffer = global.ArrayBuffer,
    Uint8Array = global.Uint8Array;

/**
 * The base implementation of `_.clone` without support for argument juggling
 * and `this` binding `customizer` functions.
 *
 * @private
 * @param {*} value The value to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @param {Function} [customizer] The function to customize cloning values.
 * @param {string} [key] The key of `value`.
 * @param {Object} [object] The object `value` belongs to.
 * @param {Array} [stackA=[]] Tracks traversed source objects.
 * @param {Array} [stackB=[]] Associates clones with source counterparts.
 * @returns {*} Returns the cloned value.
 */
function baseClone(value, isDeep, customizer, key, object, stackA, stackB) {
  var result;
  if (customizer) {
    result = object ? customizer(value, key, object) : customizer(value);
  }
  if (result !== undefined) {
    return result;
  }
  if (!isObject(value)) {
    return value;
  }
  var isArr = isArray(value);
  if (isArr) {
    result = initCloneArray(value);
    if (!isDeep) {
      return arrayCopy(value, result);
    }
  } else {
    var tag = objToString.call(value),
        isFunc = tag == funcTag;

    if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
      result = initCloneObject(isFunc ? {} : value);
      if (!isDeep) {
        return baseAssign(result, value);
      }
    } else {
      return cloneableTags[tag]
        ? initCloneByTag(value, tag, isDeep)
        : (object ? value : {});
    }
  }
  // Check for circular references and return its corresponding clone.
  stackA || (stackA = []);
  stackB || (stackB = []);

  var length = stackA.length;
  while (length--) {
    if (stackA[length] == value) {
      return stackB[length];
    }
  }
  // Add the source value to the stack of traversed objects and associate it with its clone.
  stackA.push(value);
  stackB.push(result);

  // Recursively populate clone (susceptible to call stack limits).
  (isArr ? arrayEach : baseForOwn)(value, function(subValue, key) {
    result[key] = baseClone(subValue, isDeep, customizer, key, value, stackA, stackB);
  });
  return result;
}

/**
 * The base implementation of `_.forOwn` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn(object, iteratee) {
  return baseFor(object, iteratee, keys);
}

/**
 * Creates a clone of the given array buffer.
 *
 * @private
 * @param {ArrayBuffer} buffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function bufferClone(buffer) {
  var result = new ArrayBuffer(buffer.byteLength),
      view = new Uint8Array(result);

  view.set(new Uint8Array(buffer));
  return result;
}

/**
 * Initializes an array clone.
 *
 * @private
 * @param {Array} array The array to clone.
 * @returns {Array} Returns the initialized clone.
 */
function initCloneArray(array) {
  var length = array.length,
      result = new array.constructor(length);

  // Add array properties assigned by `RegExp#exec`.
  if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
    result.index = array.index;
    result.input = array.input;
  }
  return result;
}

/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject(object) {
  var Ctor = object.constructor;
  if (!(typeof Ctor == 'function' && Ctor instanceof Ctor)) {
    Ctor = Object;
  }
  return new Ctor;
}

/**
 * Initializes an object clone based on its `toStringTag`.
 *
 * **Note:** This function only supports cloning values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to clone.
 * @param {string} tag The `toStringTag` of the object to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneByTag(object, tag, isDeep) {
  var Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag:
      return bufferClone(object);

    case boolTag:
    case dateTag:
      return new Ctor(+object);

    case float32Tag: case float64Tag:
    case int8Tag: case int16Tag: case int32Tag:
    case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
      var buffer = object.buffer;
      return new Ctor(isDeep ? bufferClone(buffer) : buffer, object.byteOffset, object.length);

    case numberTag:
    case stringTag:
      return new Ctor(object);

    case regexpTag:
      var result = new Ctor(object.source, reFlags.exec(object));
      result.lastIndex = object.lastIndex;
  }
  return result;
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = baseClone;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"lodash._arraycopy":23,"lodash._arrayeach":24,"lodash._baseassign":26,"lodash._basefor":34,"lodash.isarray":58,"lodash.keys":68}],29:[function(require,module,exports){
/**
 * lodash 3.0.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property names to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @returns {Object} Returns `object`.
 */
function baseCopy(source, props, object) {
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];
    object[key] = source[key];
  }
  return object;
}

module.exports = baseCopy;

},{}],30:[function(require,module,exports){
/**
 * lodash 3.0.4 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var keys = require('lodash.keys');

/**
 * Used as the [maximum length](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * The base implementation of `_.forEach` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object|string} Returns `collection`.
 */
var baseEach = createBaseEach(baseForOwn);

/**
 * The base implementation of `baseForIn` and `baseForOwn` which iterates
 * over `object` properties returned by `keysFunc` invoking `iteratee` for
 * each property. Iteratee functions may exit iteration early by explicitly
 * returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

/**
 * The base implementation of `_.forOwn` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn(object, iteratee) {
  return baseFor(object, iteratee, keys);
}

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

/**
 * Creates a `baseEach` or `baseEachRight` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseEach(eachFunc, fromRight) {
  return function(collection, iteratee) {
    var length = collection ? getLength(collection) : 0;
    if (!isLength(length)) {
      return eachFunc(collection, iteratee);
    }
    var index = fromRight ? length : -1,
        iterable = toObject(collection);

    while ((fromRight ? index-- : ++index < length)) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}

/**
 * Creates a base function for `_.forIn` or `_.forInRight`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var iterable = toObject(object),
        props = keysFunc(object),
        length = props.length,
        index = fromRight ? length : -1;

    while ((fromRight ? index-- : ++index < length)) {
      var key = props[index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Converts `value` to an object if it's not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Object} Returns the object.
 */
function toObject(value) {
  return isObject(value) ? value : Object(value);
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = baseEach;

},{"lodash.keys":68}],31:[function(require,module,exports){
/**
 * lodash 3.0.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * The base implementation of `_.find`, `_.findLast`, `_.findKey`, and `_.findLastKey`,
 * without support for callback shorthands and `this` binding, which iterates
 * over `collection` using the provided `eachFunc`.
 *
 * @private
 * @param {Array|Object|string} collection The collection to search.
 * @param {Function} predicate The function invoked per iteration.
 * @param {Function} eachFunc The function to iterate over `collection`.
 * @param {boolean} [retKey] Specify returning the key of the found element
 *  instead of the element itself.
 * @returns {*} Returns the found element or its key, else `undefined`.
 */
function baseFind(collection, predicate, eachFunc, retKey) {
  var result;
  eachFunc(collection, function(value, key, collection) {
    if (predicate(value, key, collection)) {
      result = retKey ? key : value;
      return false;
    }
  });
  return result;
}

module.exports = baseFind;

},{}],32:[function(require,module,exports){
/**
 * lodash 3.6.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * The base implementation of `_.findIndex` and `_.findLastIndex` without
 * support for callback shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {Function} predicate The function invoked per iteration.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseFindIndex(array, predicate, fromRight) {
  var length = array.length,
      index = fromRight ? length : -1;

  while ((fromRight ? index-- : ++index < length)) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }
  return -1;
}

module.exports = baseFindIndex;

},{}],33:[function(require,module,exports){
/**
 * lodash 3.1.4 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var isArguments = require('lodash.isarguments'),
    isArray = require('lodash.isarray');

/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

/**
 * The base implementation of `_.flatten` with added support for restricting
 * flattening and specifying the start index.
 *
 * @private
 * @param {Array} array The array to flatten.
 * @param {boolean} [isDeep] Specify a deep flatten.
 * @param {boolean} [isStrict] Restrict flattening to arrays-like objects.
 * @param {Array} [result=[]] The initial result value.
 * @returns {Array} Returns the new flattened array.
 */
function baseFlatten(array, isDeep, isStrict, result) {
  result || (result = []);

  var index = -1,
      length = array.length;

  while (++index < length) {
    var value = array[index];
    if (isObjectLike(value) && isArrayLike(value) &&
        (isStrict || isArray(value) || isArguments(value))) {
      if (isDeep) {
        // Recursively flatten arrays (susceptible to call stack limits).
        baseFlatten(value, isDeep, isStrict, result);
      } else {
        arrayPush(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

/**
 * Checks if `value` is array-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 */
function isArrayLike(value) {
  return value != null && isLength(getLength(value));
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

module.exports = baseFlatten;

},{"lodash.isarguments":57,"lodash.isarray":58}],34:[function(require,module,exports){
/**
 * lodash 3.0.2 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * The base implementation of `baseForIn` and `baseForOwn` which iterates
 * over `object` properties returned by `keysFunc` invoking `iteratee` for
 * each property. Iteratee functions may exit iteration early by explicitly
 * returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

/**
 * Creates a base function for `_.forIn` or `_.forInRight`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var iterable = toObject(object),
        props = keysFunc(object),
        length = props.length,
        index = fromRight ? length : -1;

    while ((fromRight ? index-- : ++index < length)) {
      var key = props[index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

/**
 * Converts `value` to an object if it's not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Object} Returns the object.
 */
function toObject(value) {
  return isObject(value) ? value : Object(value);
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = baseFor;

},{}],35:[function(require,module,exports){
/**
 * lodash 3.1.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * The base implementation of `_.indexOf` without support for binary searches.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseIndexOf(array, value, fromIndex) {
  if (value !== value) {
    return indexOfNaN(array, fromIndex);
  }
  var index = fromIndex - 1,
      length = array.length;

  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}

/**
 * Gets the index at which the first occurrence of `NaN` is found in `array`.
 * If `fromRight` is provided elements of `array` are iterated from right to left.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched `NaN`, else `-1`.
 */
function indexOfNaN(array, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 0 : -1);

  while ((fromRight ? index-- : ++index < length)) {
    var other = array[index];
    if (other !== other) {
      return index;
    }
  }
  return -1;
}

module.exports = baseIndexOf;

},{}],36:[function(require,module,exports){
/**
 * lodash 3.0.7 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var isArray = require('lodash.isarray'),
    isTypedArray = require('lodash.istypedarray'),
    keys = require('lodash.keys');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    stringTag = '[object String]';

/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * A specialized version of `_.some` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

/**
 * The base implementation of `_.isEqual` without support for `this` binding
 * `customizer` functions.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {Function} [customizer] The function to customize comparing values.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, customizer, isLoose, stackA, stackB) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, baseIsEqual, customizer, isLoose, stackA, stackB);
}

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing objects.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA=[]] Tracks traversed `value` objects.
 * @param {Array} [stackB=[]] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = arrayTag,
      othTag = arrayTag;

  if (!objIsArr) {
    objTag = objToString.call(object);
    if (objTag == argsTag) {
      objTag = objectTag;
    } else if (objTag != objectTag) {
      objIsArr = isTypedArray(object);
    }
  }
  if (!othIsArr) {
    othTag = objToString.call(other);
    if (othTag == argsTag) {
      othTag = objectTag;
    } else if (othTag != objectTag) {
      othIsArr = isTypedArray(other);
    }
  }
  var objIsObj = objTag == objectTag,
      othIsObj = othTag == objectTag,
      isSameTag = objTag == othTag;

  if (isSameTag && !(objIsArr || objIsObj)) {
    return equalByTag(object, other, objTag);
  }
  if (!isLoose) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      return equalFunc(objIsWrapped ? object.value() : object, othIsWrapped ? other.value() : other, customizer, isLoose, stackA, stackB);
    }
  }
  if (!isSameTag) {
    return false;
  }
  // Assume cyclic values are equal.
  // For more information on detecting circular references see https://es5.github.io/#JO.
  stackA || (stackA = []);
  stackB || (stackB = []);

  var length = stackA.length;
  while (length--) {
    if (stackA[length] == object) {
      return stackB[length] == other;
    }
  }
  // Add `object` and `other` to the stack of traversed objects.
  stackA.push(object);
  stackB.push(other);

  var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, customizer, isLoose, stackA, stackB);

  stackA.pop();
  stackB.pop();

  return result;
}

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing arrays.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var index = -1,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isLoose && othLength > arrLength)) {
    return false;
  }
  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index],
        result = customizer ? customizer(isLoose ? othValue : arrValue, isLoose ? arrValue : othValue, index) : undefined;

    if (result !== undefined) {
      if (result) {
        continue;
      }
      return false;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (isLoose) {
      if (!arraySome(other, function(othValue) {
            return arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB);
          })) {
        return false;
      }
    } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB))) {
      return false;
    }
  }
  return true;
}

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} value The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag) {
  switch (tag) {
    case boolTag:
    case dateTag:
      // Coerce dates and booleans to numbers, dates to milliseconds and booleans
      // to `1` or `0` treating invalid dates coerced to `NaN` as not equal.
      return +object == +other;

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case numberTag:
      // Treat `NaN` vs. `NaN` as equal.
      return (object != +object)
        ? other != +other
        : object == +other;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings primitives and string
      // objects as equal. See https://es5.github.io/#x15.10.6.4 for more details.
      return object == (other + '');
  }
  return false;
}

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing values.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var objProps = keys(object),
      objLength = objProps.length,
      othProps = keys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isLoose) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isLoose ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  var skipCtor = isLoose;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key],
        result = customizer ? customizer(isLoose ? othValue : objValue, isLoose? objValue : othValue, key) : undefined;

    // Recursively compare objects (susceptible to call stack limits).
    if (!(result === undefined ? equalFunc(objValue, othValue, customizer, isLoose, stackA, stackB) : result)) {
      return false;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (!skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = baseIsEqual;

},{"lodash.isarray":58,"lodash.istypedarray":66,"lodash.keys":68}],37:[function(require,module,exports){
/**
 * lodash 3.8.2 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** Used to detect unsigned integer values. */
var reIsUint = /^\d+$/;

/** Used for native method references. */
var arrayProto = Array.prototype;

/** Native method references. */
var splice = arrayProto.splice;

/**
 * Used as the [maximum length](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * The base implementation of `_.pullAt` without support for individual
 * index arguments and capturing the removed elements.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {number[]} indexes The indexes of elements to remove.
 * @returns {Array} Returns `array`.
 */
function basePullAt(array, indexes) {
  var length = array ? indexes.length : 0;
  while (length--) {
    var index = indexes[length];
    if (index != previous && isIndex(index)) {
      var previous = index;
      splice.call(array, index, 1);
    }
  }
  return array;
}

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return value > -1 && value % 1 == 0 && value < length;
}

module.exports = basePullAt;

},{}],38:[function(require,module,exports){
/**
 * lodash 3.0.3 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * The base implementation of `_.slice` without an iteratee call guard.
 *
 * @private
 * @param {Array} array The array to slice.
 * @param {number} [start=0] The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the slice of `array`.
 */
function baseSlice(array, start, end) {
  var index = -1,
      length = array.length;

  start = start == null ? 0 : (+start || 0);
  if (start < 0) {
    start = -start > length ? 0 : (length + start);
  }
  end = (end === undefined || end > length) ? length : (+end || 0);
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : ((end - start) >>> 0);
  start >>>= 0;

  var result = Array(length);
  while (++index < length) {
    result[index] = array[index + start];
  }
  return result;
}

module.exports = baseSlice;

},{}],39:[function(require,module,exports){
/**
 * lodash 3.0.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * Converts `value` to a string if it's not one. An empty string is returned
 * for `null` or `undefined` values.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  return value == null ? '' : (value + '');
}

module.exports = baseToString;

},{}],40:[function(require,module,exports){
/**
 * lodash 3.0.3 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var baseIndexOf = require('lodash._baseindexof'),
    cacheIndexOf = require('lodash._cacheindexof'),
    createCache = require('lodash._createcache');

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * The base implementation of `_.uniq` without support for callback shorthands
 * and `this` binding.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} [iteratee] The function invoked per iteration.
 * @returns {Array} Returns the new duplicate-value-free array.
 */
function baseUniq(array, iteratee) {
  var index = -1,
      indexOf = baseIndexOf,
      length = array.length,
      isCommon = true,
      isLarge = isCommon && length >= LARGE_ARRAY_SIZE,
      seen = isLarge ? createCache() : null,
      result = [];

  if (seen) {
    indexOf = cacheIndexOf;
    isCommon = false;
  } else {
    isLarge = false;
    seen = iteratee ? [] : result;
  }
  outer:
  while (++index < length) {
    var value = array[index],
        computed = iteratee ? iteratee(value, index, array) : value;

    if (isCommon && value === value) {
      var seenIndex = seen.length;
      while (seenIndex--) {
        if (seen[seenIndex] === computed) {
          continue outer;
        }
      }
      if (iteratee) {
        seen.push(computed);
      }
      result.push(value);
    }
    else if (indexOf(seen, computed, 0) < 0) {
      if (iteratee || isLarge) {
        seen.push(computed);
      }
      result.push(value);
    }
  }
  return result;
}

module.exports = baseUniq;

},{"lodash._baseindexof":35,"lodash._cacheindexof":42,"lodash._createcache":46}],41:[function(require,module,exports){
/**
 * lodash 3.0.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * A specialized version of `baseCallback` which only supports `this` binding
 * and specifying the number of arguments to provide to `func`.
 *
 * @private
 * @param {Function} func The function to bind.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {number} [argCount] The number of arguments to provide to `func`.
 * @returns {Function} Returns the callback.
 */
function bindCallback(func, thisArg, argCount) {
  if (typeof func != 'function') {
    return identity;
  }
  if (thisArg === undefined) {
    return func;
  }
  switch (argCount) {
    case 1: return function(value) {
      return func.call(thisArg, value);
    };
    case 3: return function(value, index, collection) {
      return func.call(thisArg, value, index, collection);
    };
    case 4: return function(accumulator, value, index, collection) {
      return func.call(thisArg, accumulator, value, index, collection);
    };
    case 5: return function(value, other, key, object, source) {
      return func.call(thisArg, value, other, key, object, source);
    };
  }
  return function() {
    return func.apply(thisArg, arguments);
  };
}

/**
 * This method returns the first argument provided to it.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'user': 'fred' };
 *
 * _.identity(object) === object;
 * // => true
 */
function identity(value) {
  return value;
}

module.exports = bindCallback;

},{}],42:[function(require,module,exports){
/**
 * lodash 3.0.2 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * Checks if `value` is in `cache` mimicking the return signature of
 * `_.indexOf` by returning `0` if the value is found, else `-1`.
 *
 * @private
 * @param {Object} cache The cache to search.
 * @param {*} value The value to search for.
 * @returns {number} Returns `0` if `value` is found, else `-1`.
 */
function cacheIndexOf(cache, value) {
  var data = cache.data,
      result = (typeof value == 'string' || isObject(value)) ? data.set.has(value) : data.hash[value];

  return result ? 0 : -1;
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = cacheIndexOf;

},{}],43:[function(require,module,exports){
/**
 * lodash 3.0.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * Used by `_.trim` and `_.trimLeft` to get the index of the first character
 * of `string` that is not found in `chars`.
 *
 * @private
 * @param {string} string The string to inspect.
 * @param {string} chars The characters to find.
 * @returns {number} Returns the index of the first character not found in `chars`.
 */
function charsLeftIndex(string, chars) {
  var index = -1,
      length = string.length;

  while (++index < length && chars.indexOf(string.charAt(index)) > -1) {}
  return index;
}

module.exports = charsLeftIndex;

},{}],44:[function(require,module,exports){
/**
 * lodash 3.0.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * Used by `_.trim` and `_.trimRight` to get the index of the last character
 * of `string` that is not found in `chars`.
 *
 * @private
 * @param {string} string The string to inspect.
 * @param {string} chars The characters to find.
 * @returns {number} Returns the index of the last character not found in `chars`.
 */
function charsRightIndex(string, chars) {
  var index = string.length;

  while (index-- && chars.indexOf(string.charAt(index)) > -1) {}
  return index;
}

module.exports = charsRightIndex;

},{}],45:[function(require,module,exports){
/**
 * lodash 3.1.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var bindCallback = require('lodash._bindcallback'),
    isIterateeCall = require('lodash._isiterateecall'),
    restParam = require('lodash.restparam');

/**
 * Creates a function that assigns properties of source object(s) to a given
 * destination object.
 *
 * **Note:** This function is used to create `_.assign`, `_.defaults`, and `_.merge`.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return restParam(function(object, sources) {
    var index = -1,
        length = object == null ? 0 : sources.length,
        customizer = length > 2 ? sources[length - 2] : undefined,
        guard = length > 2 ? sources[2] : undefined,
        thisArg = length > 1 ? sources[length - 1] : undefined;

    if (typeof customizer == 'function') {
      customizer = bindCallback(customizer, thisArg, 5);
      length -= 2;
    } else {
      customizer = typeof thisArg == 'function' ? thisArg : undefined;
      length -= (customizer ? 1 : 0);
    }
    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, customizer);
      }
    }
    return object;
  });
}

module.exports = createAssigner;

},{"lodash._bindcallback":41,"lodash._isiterateecall":48,"lodash.restparam":75}],46:[function(require,module,exports){
(function (global){
/**
 * lodash 3.1.2 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var getNative = require('lodash._getnative');

/** Native method references. */
var Set = getNative(global, 'Set');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeCreate = getNative(Object, 'create');

/**
 *
 * Creates a cache object to store unique values.
 *
 * @private
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var length = values ? values.length : 0;

  this.data = { 'hash': nativeCreate(null), 'set': new Set };
  while (length--) {
    this.push(values[length]);
  }
}

/**
 * Adds `value` to the cache.
 *
 * @private
 * @name push
 * @memberOf SetCache
 * @param {*} value The value to cache.
 */
function cachePush(value) {
  var data = this.data;
  if (typeof value == 'string' || isObject(value)) {
    data.set.add(value);
  } else {
    data.hash[value] = true;
  }
}

/**
 * Creates a `Set` cache object to optimize linear searches of large arrays.
 *
 * @private
 * @param {Array} [values] The values to cache.
 * @returns {null|Object} Returns the new cache object if `Set` is supported, else `null`.
 */
function createCache(values) {
  return (nativeCreate && Set) ? new SetCache(values) : null;
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

// Add functions to the `Set` cache.
SetCache.prototype.push = cachePush;

module.exports = createCache;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"lodash._getnative":47}],47:[function(require,module,exports){
/**
 * lodash 3.9.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** `Object#toString` result references. */
var funcTag = '[object Function]';

/** Used to detect host constructors (Safari > 5). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var fnToString = Function.prototype.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  fnToString.call(hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = object == null ? undefined : object[key];
  return isNative(value) ? value : undefined;
}

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in older versions of Chrome and Safari which return 'function' for regexes
  // and Safari 8 equivalents which return 'object' for typed array constructors.
  return isObject(value) && objToString.call(value) == funcTag;
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is a native function.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
 * @example
 *
 * _.isNative(Array.prototype.push);
 * // => true
 *
 * _.isNative(_);
 * // => false
 */
function isNative(value) {
  if (value == null) {
    return false;
  }
  if (isFunction(value)) {
    return reIsNative.test(fnToString.call(value));
  }
  return isObjectLike(value) && reIsHostCtor.test(value);
}

module.exports = getNative;

},{}],48:[function(require,module,exports){
/**
 * lodash 3.0.9 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** Used to detect unsigned integer values. */
var reIsUint = /^\d+$/;

/**
 * Used as the [maximum length](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

/**
 * Checks if `value` is array-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 */
function isArrayLike(value) {
  return value != null && isLength(getLength(value));
}

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return value > -1 && value % 1 == 0 && value < length;
}

/**
 * Checks if the provided arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call, else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
      ? (isArrayLike(object) && isIndex(index, object.length))
      : (type == 'string' && index in object)) {
    var other = object[index];
    return value === value ? (value === other) : (other !== other);
  }
  return false;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = isIterateeCall;

},{}],49:[function(require,module,exports){
/**
 * lodash 3.0.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * Used by `trimmedLeftIndex` and `trimmedRightIndex` to determine if a
 * character code is whitespace.
 *
 * @private
 * @param {number} charCode The character code to inspect.
 * @returns {boolean} Returns `true` if `charCode` is whitespace, else `false`.
 */
function isSpace(charCode) {
  return ((charCode <= 160 && (charCode >= 9 && charCode <= 13) || charCode == 32 || charCode == 160) || charCode == 5760 || charCode == 6158 ||
    (charCode >= 8192 && (charCode <= 8202 || charCode == 8232 || charCode == 8233 || charCode == 8239 || charCode == 8287 || charCode == 12288 || charCode == 65279)));
}

/**
 * Used by `_.trim` and `_.trimLeft` to get the index of the first non-whitespace
 * character of `string`.
 *
 * @private
 * @param {string} string The string to inspect.
 * @returns {number} Returns the index of the first non-whitespace character.
 */
function trimmedLeftIndex(string) {
  var index = -1,
      length = string.length;

  while (++index < length && isSpace(string.charCodeAt(index))) {}
  return index;
}

module.exports = trimmedLeftIndex;

},{}],50:[function(require,module,exports){
/**
 * lodash 3.0.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * Used by `trimmedLeftIndex` and `trimmedRightIndex` to determine if a
 * character code is whitespace.
 *
 * @private
 * @param {number} charCode The character code to inspect.
 * @returns {boolean} Returns `true` if `charCode` is whitespace, else `false`.
 */
function isSpace(charCode) {
  return ((charCode <= 160 && (charCode >= 9 && charCode <= 13) || charCode == 32 || charCode == 160) || charCode == 5760 || charCode == 6158 ||
    (charCode >= 8192 && (charCode <= 8202 || charCode == 8232 || charCode == 8233 || charCode == 8239 || charCode == 8287 || charCode == 12288 || charCode == 65279)));
}

/**
 * Used by `_.trim` and `_.trimRight` to get the index of the last non-whitespace
 * character of `string`.
 *
 * @private
 * @param {string} string The string to inspect.
 * @returns {number} Returns the index of the last non-whitespace character.
 */
function trimmedRightIndex(string) {
  var index = string.length;

  while (index-- && isSpace(string.charCodeAt(index))) {}
  return index;
}

module.exports = trimmedRightIndex;

},{}],51:[function(require,module,exports){
/**
 * lodash 3.0.2 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var baseClone = require('lodash._baseclone'),
    bindCallback = require('lodash._bindcallback');

/**
 * Creates a deep clone of `value`. If `customizer` is provided it's invoked
 * to produce the cloned values. If `customizer` returns `undefined` cloning
 * is handled by the method instead. The `customizer` is bound to `thisArg`
 * and invoked with up to three argument; (value [, index|key, object]).
 *
 * **Note:** This method is loosely based on the
 * [structured clone algorithm](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm).
 * The enumerable properties of `arguments` objects and objects created by
 * constructors other than `Object` are cloned to plain `Object` objects. An
 * empty object is returned for uncloneable values such as functions, DOM nodes,
 * Maps, Sets, and WeakMaps.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to deep clone.
 * @param {Function} [customizer] The function to customize cloning values.
 * @param {*} [thisArg] The `this` binding of `customizer`.
 * @returns {*} Returns the deep cloned value.
 * @example
 *
 * var users = [
 *   { 'user': 'barney' },
 *   { 'user': 'fred' }
 * ];
 *
 * var deep = _.cloneDeep(users);
 * deep[0] === users[0];
 * // => false
 *
 * // using a customizer callback
 * var el = _.cloneDeep(document.body, function(value) {
 *   if (_.isElement(value)) {
 *     return value.cloneNode(true);
 *   }
 * });
 *
 * el === document.body
 * // => false
 * el.nodeName
 * // => BODY
 * el.childNodes.length;
 * // => 20
 */
function cloneDeep(value, customizer, thisArg) {
  return typeof customizer == 'function'
    ? baseClone(value, true, bindCallback(customizer, thisArg, 3))
    : baseClone(value, true);
}

module.exports = cloneDeep;

},{"lodash._baseclone":28,"lodash._bindcallback":41}],52:[function(require,module,exports){
/**
 * lodash 3.1.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var getNative = require('lodash._getnative');

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Native method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max,
    nativeNow = getNative(Date, 'now');

/**
 * Gets the number of milliseconds that have elapsed since the Unix epoch
 * (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @category Date
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => logs the number of milliseconds it took for the deferred function to be invoked
 */
var now = nativeNow || function() {
  return new Date().getTime();
};

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed invocations. Provide an options object to indicate that `func`
 * should be invoked on the leading and/or trailing edge of the `wait` timeout.
 * Subsequent calls to the debounced function return the result of the last
 * `func` invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
 * on the trailing edge of the timeout only if the the debounced function is
 * invoked more than once during the `wait` timeout.
 *
 * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options] The options object.
 * @param {boolean} [options.leading=false] Specify invoking on the leading
 *  edge of the timeout.
 * @param {number} [options.maxWait] The maximum time `func` is allowed to be
 *  delayed before it is invoked.
 * @param {boolean} [options.trailing=true] Specify invoking on the trailing
 *  edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // avoid costly calculations while the window size is in flux
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // invoke `sendMail` when the click event is fired, debouncing subsequent calls
 * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // ensure `batchLog` is invoked once after 1 second of debounced calls
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', _.debounce(batchLog, 250, {
 *   'maxWait': 1000
 * }));
 *
 * // cancel a debounced call
 * var todoChanges = _.debounce(batchLog, 1000);
 * Object.observe(models.todo, todoChanges);
 *
 * Object.observe(models, function(changes) {
 *   if (_.find(changes, { 'user': 'todo', 'type': 'delete'})) {
 *     todoChanges.cancel();
 *   }
 * }, ['delete']);
 *
 * // ...at some point `models.todo` is changed
 * models.todo.completed = true;
 *
 * // ...before 1 second has passed `models.todo` is deleted
 * // which cancels the debounced `todoChanges` call
 * delete models.todo;
 */
function debounce(func, wait, options) {
  var args,
      maxTimeoutId,
      result,
      stamp,
      thisArg,
      timeoutId,
      trailingCall,
      lastCalled = 0,
      maxWait = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = wait < 0 ? 0 : (+wait || 0);
  if (options === true) {
    var leading = true;
    trailing = false;
  } else if (isObject(options)) {
    leading = !!options.leading;
    maxWait = 'maxWait' in options && nativeMax(+options.maxWait || 0, wait);
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function cancel() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (maxTimeoutId) {
      clearTimeout(maxTimeoutId);
    }
    lastCalled = 0;
    maxTimeoutId = timeoutId = trailingCall = undefined;
  }

  function complete(isCalled, id) {
    if (id) {
      clearTimeout(id);
    }
    maxTimeoutId = timeoutId = trailingCall = undefined;
    if (isCalled) {
      lastCalled = now();
      result = func.apply(thisArg, args);
      if (!timeoutId && !maxTimeoutId) {
        args = thisArg = undefined;
      }
    }
  }

  function delayed() {
    var remaining = wait - (now() - stamp);
    if (remaining <= 0 || remaining > wait) {
      complete(trailingCall, maxTimeoutId);
    } else {
      timeoutId = setTimeout(delayed, remaining);
    }
  }

  function maxDelayed() {
    complete(trailing, timeoutId);
  }

  function debounced() {
    args = arguments;
    stamp = now();
    thisArg = this;
    trailingCall = trailing && (timeoutId || !leading);

    if (maxWait === false) {
      var leadingCall = leading && !timeoutId;
    } else {
      if (!maxTimeoutId && !leading) {
        lastCalled = stamp;
      }
      var remaining = maxWait - (stamp - lastCalled),
          isCalled = remaining <= 0 || remaining > maxWait;

      if (isCalled) {
        if (maxTimeoutId) {
          maxTimeoutId = clearTimeout(maxTimeoutId);
        }
        lastCalled = stamp;
        result = func.apply(thisArg, args);
      }
      else if (!maxTimeoutId) {
        maxTimeoutId = setTimeout(maxDelayed, remaining);
      }
    }
    if (isCalled && timeoutId) {
      timeoutId = clearTimeout(timeoutId);
    }
    else if (!timeoutId && wait !== maxWait) {
      timeoutId = setTimeout(delayed, wait);
    }
    if (leadingCall) {
      isCalled = true;
      result = func.apply(thisArg, args);
    }
    if (isCalled && !timeoutId && !maxTimeoutId) {
      args = thisArg = undefined;
    }
    return result;
  }
  debounced.cancel = cancel;
  return debounced;
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = debounce;

},{"lodash._getnative":47}],53:[function(require,module,exports){
/**
 * lodash 3.0.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var baseSlice = require('lodash._baseslice'),
    isIterateeCall = require('lodash._isiterateecall');

/**
 * Creates a slice of `array` with `n` elements dropped from the beginning.
 *
 * @static
 * @memberOf _
 * @type Function
 * @category Array
 * @param {Array} array The array to query.
 * @param {number} [n=1] The number of elements to drop.
 * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
 * @returns {Array} Returns the slice of `array`.
 * @example
 *
 * _.drop([1, 2, 3]);
 * // => [2, 3]
 *
 * _.drop([1, 2, 3], 2);
 * // => [3]
 *
 * _.drop([1, 2, 3], 5);
 * // => []
 *
 * _.drop([1, 2, 3], 0);
 * // => [1, 2, 3]
 */
function drop(array, n, guard) {
  var length = array ? array.length : 0;
  if (!length) {
    return [];
  }
  if (guard ? isIterateeCall(array, n, guard) : n == null) {
    n = 1;
  }
  return baseSlice(array, n < 0 ? 0 : n);
}

module.exports = drop;

},{"lodash._baseslice":38,"lodash._isiterateecall":48}],54:[function(require,module,exports){
/**
 * lodash 3.2.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var baseCallback = require('lodash._basecallback'),
    baseEach = require('lodash._baseeach'),
    baseFind = require('lodash._basefind'),
    baseFindIndex = require('lodash._basefindindex'),
    isArray = require('lodash.isarray');

/**
 * Creates a `_.find` or `_.findLast` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new find function.
 */
function createFind(eachFunc, fromRight) {
  return function(collection, predicate, thisArg) {
    predicate = baseCallback(predicate, thisArg, 3);
    if (isArray(collection)) {
      var index = baseFindIndex(collection, predicate, fromRight);
      return index > -1 ? collection[index] : undefined;
    }
    return baseFind(collection, predicate, eachFunc);
  };
}

/**
 * Iterates over elements of `collection`, returning the first element
 * `predicate` returns truthy for. The predicate is bound to `thisArg` and
 * invoked with three arguments: (value, index|key, collection).
 *
 * If a property name is provided for `predicate` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `predicate` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * @static
 * @memberOf _
 * @alias detect
 * @category Collection
 * @param {Array|Object|string} collection The collection to search.
 * @param {Function|Object|string} [predicate=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `predicate`.
 * @returns {*} Returns the matched element, else `undefined`.
 * @example
 *
 * var users = [
 *   { 'user': 'barney',  'age': 36, 'active': true },
 *   { 'user': 'fred',    'age': 40, 'active': false },
 *   { 'user': 'pebbles', 'age': 1,  'active': true }
 * ];
 *
 * _.result(_.find(users, function(chr) {
 *   return chr.age < 40;
 * }), 'user');
 * // => 'barney'
 *
 * // using the `_.matches` callback shorthand
 * _.result(_.find(users, { 'age': 1, 'active': true }), 'user');
 * // => 'pebbles'
 *
 * // using the `_.matchesProperty` callback shorthand
 * _.result(_.find(users, 'active', false), 'user');
 * // => 'fred'
 *
 * // using the `_.property` callback shorthand
 * _.result(_.find(users, 'active'), 'user');
 * // => 'barney'
 */
var find = createFind(baseEach);

module.exports = find;

},{"lodash._basecallback":27,"lodash._baseeach":30,"lodash._basefind":31,"lodash._basefindindex":32,"lodash.isarray":58}],55:[function(require,module,exports){
/**
 * lodash 3.0.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * Gets the first element of `array`.
 *
 * @static
 * @memberOf _
 * @alias head
 * @category Array
 * @param {Array} array The array to query.
 * @returns {*} Returns the first element of `array`.
 * @example
 *
 * _.first([1, 2, 3]);
 * // => 1
 *
 * _.first([]);
 * // => undefined
 */
function first(array) {
  return array ? array[0] : undefined;
}

module.exports = first;

},{}],56:[function(require,module,exports){
/**
 * lodash 3.0.3 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var arrayEach = require('lodash._arrayeach'),
    baseEach = require('lodash._baseeach'),
    bindCallback = require('lodash._bindcallback'),
    isArray = require('lodash.isarray');

/**
 * Creates a function for `_.forEach` or `_.forEachRight`.
 *
 * @private
 * @param {Function} arrayFunc The function to iterate over an array.
 * @param {Function} eachFunc The function to iterate over a collection.
 * @returns {Function} Returns the new each function.
 */
function createForEach(arrayFunc, eachFunc) {
  return function(collection, iteratee, thisArg) {
    return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
      ? arrayFunc(collection, iteratee)
      : eachFunc(collection, bindCallback(iteratee, thisArg, 3));
  };
}

/**
 * Iterates over elements of `collection` invoking `iteratee` for each element.
 * The `iteratee` is bound to `thisArg` and invoked with three arguments:
 * (value, index|key, collection). Iteratee functions may exit iteration early
 * by explicitly returning `false`.
 *
 * **Note:** As with other "Collections" methods, objects with a "length" property
 * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
 * may be used for object iteration.
 *
 * @static
 * @memberOf _
 * @alias each
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Array|Object|string} Returns `collection`.
 * @example
 *
 * _([1, 2]).forEach(function(n) {
 *   console.log(n);
 * }).value();
 * // => logs each value from left to right and returns the array
 *
 * _.forEach({ 'a': 1, 'b': 2 }, function(n, key) {
 *   console.log(n, key);
 * });
 * // => logs each value-key pair and returns the object (iteration order is not guaranteed)
 */
var forEach = createForEach(arrayEach, baseEach);

module.exports = forEach;

},{"lodash._arrayeach":24,"lodash._baseeach":30,"lodash._bindcallback":41,"lodash.isarray":58}],57:[function(require,module,exports){
/**
 * lodash 3.0.4 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Native method references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

/**
 * Checks if `value` is array-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 */
function isArrayLike(value) {
  return value != null && isLength(getLength(value));
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is classified as an `arguments` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  return isObjectLike(value) && isArrayLike(value) &&
    hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
}

module.exports = isArguments;

},{}],58:[function(require,module,exports){
/**
 * lodash 3.0.4 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** `Object#toString` result references. */
var arrayTag = '[object Array]',
    funcTag = '[object Function]';

/** Used to detect host constructors (Safari > 5). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var fnToString = Function.prototype.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  fnToString.call(hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/* Native method references for those with the same name as other `lodash` methods. */
var nativeIsArray = getNative(Array, 'isArray');

/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = object == null ? undefined : object[key];
  return isNative(value) ? value : undefined;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(function() { return arguments; }());
 * // => false
 */
var isArray = nativeIsArray || function(value) {
  return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
};

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in older versions of Chrome and Safari which return 'function' for regexes
  // and Safari 8 equivalents which return 'object' for typed array constructors.
  return isObject(value) && objToString.call(value) == funcTag;
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is a native function.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
 * @example
 *
 * _.isNative(Array.prototype.push);
 * // => true
 *
 * _.isNative(_);
 * // => false
 */
function isNative(value) {
  if (value == null) {
    return false;
  }
  if (isFunction(value)) {
    return reIsNative.test(fnToString.call(value));
  }
  return isObjectLike(value) && reIsHostCtor.test(value);
}

module.exports = isArray;

},{}],59:[function(require,module,exports){
/**
 * lodash 3.0.4 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var isArguments = require('lodash.isarguments'),
    isArray = require('lodash.isarray'),
    isFunction = require('lodash.isfunction'),
    isString = require('lodash.isstring'),
    keys = require('lodash.keys');

/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Used as the [maximum length](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

/**
 * Checks if `value` is array-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 */
function isArrayLike(value) {
  return value != null && isLength(getLength(value));
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is empty. A value is considered empty unless it is an
 * `arguments` object, array, string, or jQuery-like collection with a length
 * greater than `0` or an object with own enumerable properties.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {Array|Object|string} value The value to inspect.
 * @returns {boolean} Returns `true` if `value` is empty, else `false`.
 * @example
 *
 * _.isEmpty(null);
 * // => true
 *
 * _.isEmpty(true);
 * // => true
 *
 * _.isEmpty(1);
 * // => true
 *
 * _.isEmpty([1, 2, 3]);
 * // => false
 *
 * _.isEmpty({ 'a': 1 });
 * // => false
 */
function isEmpty(value) {
  if (value == null) {
    return true;
  }
  if (isArrayLike(value) && (isArray(value) || isString(value) || isArguments(value) ||
      (isObjectLike(value) && isFunction(value.splice)))) {
    return !value.length;
  }
  return !keys(value).length;
}

module.exports = isEmpty;

},{"lodash.isarguments":57,"lodash.isarray":58,"lodash.isfunction":61,"lodash.isstring":65,"lodash.keys":68}],60:[function(require,module,exports){
/**
 * lodash 3.0.4 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var baseIsEqual = require('lodash._baseisequal'),
    bindCallback = require('lodash._bindcallback');

/**
 * Performs a deep comparison between two values to determine if they are
 * equivalent. If `customizer` is provided it is invoked to compare values.
 * If `customizer` returns `undefined` comparisons are handled by the method
 * instead. The `customizer` is bound to `thisArg` and invoked with three
 * arguments: (value, other [, index|key]).
 *
 * **Note:** This method supports comparing arrays, booleans, `Date` objects,
 * numbers, `Object` objects, regexes, and strings. Objects are compared by
 * their own, not inherited, enumerable properties. Functions and DOM nodes
 * are **not** supported. Provide a customizer function to extend support
 * for comparing other values.
 *
 * @static
 * @memberOf _
 * @alias eq
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {Function} [customizer] The function to customize value comparisons.
 * @param {*} [thisArg] The `this` binding of `customizer`.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'user': 'fred' };
 * var other = { 'user': 'fred' };
 *
 * object == other;
 * // => false
 *
 * _.isEqual(object, other);
 * // => true
 *
 * // using a customizer callback
 * var array = ['hello', 'goodbye'];
 * var other = ['hi', 'goodbye'];
 *
 * _.isEqual(array, other, function(value, other) {
 *   if (_.every([value, other], RegExp.prototype.test, /^h(?:i|ello)$/)) {
 *     return true;
 *   }
 * });
 * // => true
 */
function isEqual(value, other, customizer, thisArg) {
  customizer = typeof customizer == 'function' ? bindCallback(customizer, thisArg, 3) : undefined;
  var result = customizer ? customizer(value, other) : undefined;
  return  result === undefined ? baseIsEqual(value, other, customizer) : !!result;
}

module.exports = isEqual;

},{"lodash._baseisequal":36,"lodash._bindcallback":41}],61:[function(require,module,exports){
/**
 * lodash 3.0.6 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** `Object#toString` result references. */
var funcTag = '[object Function]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in older versions of Chrome and Safari which return 'function' for regexes
  // and Safari 8 equivalents which return 'object' for typed array constructors.
  return isObject(value) && objToString.call(value) == funcTag;
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = isFunction;

},{}],62:[function(require,module,exports){
/**
 * lodash 3.0.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var isNumber = require('lodash.isnumber');

/**
 * Checks if `value` is `NaN`.
 *
 * **Note:** This method is not the same as native `isNaN` which returns `true`
 * for `undefined` and other non-numeric values. See the [ES5 spec](https://es5.github.io/#x15.1.2.4)
 * for more details.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
 * @example
 *
 * _.isNaN(NaN);
 * // => true
 *
 * _.isNaN(new Number(NaN));
 * // => true
 *
 * isNaN(undefined);
 * // => true
 *
 * _.isNaN(undefined);
 * // => false
 */
function isNaN(value) {
  // An `NaN` primitive is the only value that is not equal to itself.
  // Perform the `toStringTag` check first to avoid errors with some host objects in IE.
  return isNumber(value) && value != +value;
}

module.exports = isNaN;

},{"lodash.isnumber":63}],63:[function(require,module,exports){
/**
 * lodash 3.0.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** `Object#toString` result references. */
var numberTag = '[object Number]';

/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Number` primitive or object.
 *
 * **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are classified
 * as numbers, use the `_.isFinite` method.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isNumber(8.4);
 * // => true
 *
 * _.isNumber(NaN);
 * // => true
 *
 * _.isNumber('8.4');
 * // => false
 */
function isNumber(value) {
  return typeof value == 'number' || (isObjectLike(value) && objToString.call(value) == numberTag);
}

module.exports = isNumber;

},{}],64:[function(require,module,exports){
/**
 * lodash 3.2.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var baseFor = require('lodash._basefor'),
    isArguments = require('lodash.isarguments'),
    keysIn = require('lodash.keysin');

/** `Object#toString` result references. */
var objectTag = '[object Object]';

/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * The base implementation of `_.forIn` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForIn(object, iteratee) {
  return baseFor(object, iteratee, keysIn);
}

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * **Note:** This method assumes objects created by the `Object` constructor
 * have no inherited enumerable properties.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  var Ctor;

  // Exit early for non `Object` objects.
  if (!(isObjectLike(value) && objToString.call(value) == objectTag && !isArguments(value)) ||
      (!hasOwnProperty.call(value, 'constructor') && (Ctor = value.constructor, typeof Ctor == 'function' && !(Ctor instanceof Ctor)))) {
    return false;
  }
  // IE < 9 iterates inherited properties before own properties. If the first
  // iterated property is an object's own property then there are no inherited
  // enumerable properties.
  var result;
  // In most environments an object's own properties are iterated before
  // its inherited properties. If the last iterated property is an object's
  // own property then there are no inherited enumerable properties.
  baseForIn(value, function(subValue, key) {
    result = key;
  });
  return result === undefined || hasOwnProperty.call(value, result);
}

module.exports = isPlainObject;

},{"lodash._basefor":34,"lodash.isarguments":57,"lodash.keysin":69}],65:[function(require,module,exports){
/**
 * lodash 3.0.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** `Object#toString` result references. */
var stringTag = '[object String]';

/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `String` primitive or object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isString('abc');
 * // => true
 *
 * _.isString(1);
 * // => false
 */
function isString(value) {
  return typeof value == 'string' || (isObjectLike(value) && objToString.call(value) == stringTag);
}

module.exports = isString;

},{}],66:[function(require,module,exports){
/**
 * lodash 3.0.2 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dateTag] = typedArrayTags[errorTag] =
typedArrayTags[funcTag] = typedArrayTags[mapTag] =
typedArrayTags[numberTag] = typedArrayTags[objectTag] =
typedArrayTags[regexpTag] = typedArrayTags[setTag] =
typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Used as the [maximum length](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
function isTypedArray(value) {
  return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objToString.call(value)];
}

module.exports = isTypedArray;

},{}],67:[function(require,module,exports){
/**
 * lodash 3.0.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * Checks if `value` is `undefined`.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `undefined`, else `false`.
 * @example
 *
 * _.isUndefined(void 0);
 * // => true
 *
 * _.isUndefined(null);
 * // => false
 */
function isUndefined(value) {
  return value === undefined;
}

module.exports = isUndefined;

},{}],68:[function(require,module,exports){
/**
 * lodash 3.1.2 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var getNative = require('lodash._getnative'),
    isArguments = require('lodash.isarguments'),
    isArray = require('lodash.isarray');

/** Used to detect unsigned integer values. */
var reIsUint = /^\d+$/;

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/* Native method references for those with the same name as other `lodash` methods. */
var nativeKeys = getNative(Object, 'keys');

/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

/**
 * Checks if `value` is array-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 */
function isArrayLike(value) {
  return value != null && isLength(getLength(value));
}

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return value > -1 && value % 1 == 0 && value < length;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * A fallback implementation of `Object.keys` which creates an array of the
 * own enumerable property names of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function shimKeys(object) {
  var props = keysIn(object),
      propsLength = props.length,
      length = propsLength && object.length;

  var allowIndexes = !!length && isLength(length) &&
    (isArray(object) || isArguments(object));

  var index = -1,
      result = [];

  while (++index < propsLength) {
    var key = props[index];
    if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
      result.push(key);
    }
  }
  return result;
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/6.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
var keys = !nativeKeys ? shimKeys : function(object) {
  var Ctor = object == null ? undefined : object.constructor;
  if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
      (typeof object != 'function' && isArrayLike(object))) {
    return shimKeys(object);
  }
  return isObject(object) ? nativeKeys(object) : [];
};

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  if (object == null) {
    return [];
  }
  if (!isObject(object)) {
    object = Object(object);
  }
  var length = object.length;
  length = (length && isLength(length) &&
    (isArray(object) || isArguments(object)) && length) || 0;

  var Ctor = object.constructor,
      index = -1,
      isProto = typeof Ctor == 'function' && Ctor.prototype === object,
      result = Array(length),
      skipIndexes = length > 0;

  while (++index < length) {
    result[index] = (index + '');
  }
  for (var key in object) {
    if (!(skipIndexes && isIndex(key, length)) &&
        !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = keys;

},{"lodash._getnative":47,"lodash.isarguments":57,"lodash.isarray":58}],69:[function(require,module,exports){
/**
 * lodash 3.0.8 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var isArguments = require('lodash.isarguments'),
    isArray = require('lodash.isarray');

/** Used to detect unsigned integer values. */
var reIsUint = /^\d+$/;

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used as the [maximum length](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return value > -1 && value % 1 == 0 && value < length;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  if (object == null) {
    return [];
  }
  if (!isObject(object)) {
    object = Object(object);
  }
  var length = object.length;
  length = (length && isLength(length) &&
    (isArray(object) || isArguments(object)) && length) || 0;

  var Ctor = object.constructor,
      index = -1,
      isProto = typeof Ctor == 'function' && Ctor.prototype === object,
      result = Array(length),
      skipIndexes = length > 0;

  while (++index < length) {
    result[index] = (index + '');
  }
  for (var key in object) {
    if (!(skipIndexes && isIndex(key, length)) &&
        !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = keysIn;

},{"lodash.isarguments":57,"lodash.isarray":58}],70:[function(require,module,exports){
/**
 * lodash 3.1.4 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var arrayMap = require('lodash._arraymap'),
    baseCallback = require('lodash._basecallback'),
    baseEach = require('lodash._baseeach'),
    isArray = require('lodash.isarray');

/**
 * Used as the [maximum length](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * The base implementation of `_.map` without support for callback shorthands
 * and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function baseMap(collection, iteratee) {
  var index = -1,
      result = isArrayLike(collection) ? Array(collection.length) : [];

  baseEach(collection, function(value, key, collection) {
    result[++index] = iteratee(value, key, collection);
  });
  return result;
}

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

/**
 * Checks if `value` is array-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 */
function isArrayLike(value) {
  return value != null && isLength(getLength(value));
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Creates an array of values by running each element in `collection` through
 * `iteratee`. The `iteratee` is bound to `thisArg` and invoked with three
 * arguments: (value, index|key, collection).
 *
 * If a property name is provided for `iteratee` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `iteratee` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * Many lodash methods are guarded to work as iteratees for methods like
 * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
 *
 * The guarded methods are:
 * `ary`, `callback`, `chunk`, `clone`, `create`, `curry`, `curryRight`,
 * `drop`, `dropRight`, `every`, `fill`, `flatten`, `invert`, `max`, `min`,
 * `parseInt`, `slice`, `sortBy`, `take`, `takeRight`, `template`, `trim`,
 * `trimLeft`, `trimRight`, `trunc`, `random`, `range`, `sample`, `some`,
 * `sum`, `uniq`, and `words`
 *
 * @static
 * @memberOf _
 * @alias collect
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function|Object|string} [iteratee=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Array} Returns the new mapped array.
 * @example
 *
 * function timesThree(n) {
 *   return n * 3;
 * }
 *
 * _.map([1, 2], timesThree);
 * // => [3, 6]
 *
 * _.map({ 'a': 1, 'b': 2 }, timesThree);
 * // => [3, 6] (iteration order is not guaranteed)
 *
 * var users = [
 *   { 'user': 'barney' },
 *   { 'user': 'fred' }
 * ];
 *
 * // using the `_.property` callback shorthand
 * _.map(users, 'user');
 * // => ['barney', 'fred']
 */
function map(collection, iteratee, thisArg) {
  var func = isArray(collection) ? arrayMap : baseMap;
  iteratee = baseCallback(iteratee, thisArg, 3);
  return func(collection, iteratee);
}

module.exports = map;

},{"lodash._arraymap":25,"lodash._basecallback":27,"lodash._baseeach":30,"lodash.isarray":58}],71:[function(require,module,exports){
/**
 * lodash 3.3.2 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var arrayCopy = require('lodash._arraycopy'),
    arrayEach = require('lodash._arrayeach'),
    createAssigner = require('lodash._createassigner'),
    isArguments = require('lodash.isarguments'),
    isArray = require('lodash.isarray'),
    isPlainObject = require('lodash.isplainobject'),
    isTypedArray = require('lodash.istypedarray'),
    keys = require('lodash.keys'),
    toPlainObject = require('lodash.toplainobject');

/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * The base implementation of `_.merge` without support for argument juggling,
 * multiple sources, and `this` binding `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {Function} [customizer] The function to customize merged values.
 * @param {Array} [stackA=[]] Tracks traversed source objects.
 * @param {Array} [stackB=[]] Associates values with source counterparts.
 * @returns {Object} Returns `object`.
 */
function baseMerge(object, source, customizer, stackA, stackB) {
  if (!isObject(object)) {
    return object;
  }
  var isSrcArr = isArrayLike(source) && (isArray(source) || isTypedArray(source)),
      props = isSrcArr ? undefined : keys(source);

  arrayEach(props || source, function(srcValue, key) {
    if (props) {
      key = srcValue;
      srcValue = source[key];
    }
    if (isObjectLike(srcValue)) {
      stackA || (stackA = []);
      stackB || (stackB = []);
      baseMergeDeep(object, source, key, baseMerge, customizer, stackA, stackB);
    }
    else {
      var value = object[key],
          result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
          isCommon = result === undefined;

      if (isCommon) {
        result = srcValue;
      }
      if ((result !== undefined || (isSrcArr && !(key in object))) &&
          (isCommon || (result === result ? (result !== value) : (value === value)))) {
        object[key] = result;
      }
    }
  });
  return object;
}

/**
 * A specialized version of `baseMerge` for arrays and objects which performs
 * deep merges and tracks traversed objects enabling objects with circular
 * references to be merged.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {string} key The key of the value to merge.
 * @param {Function} mergeFunc The function to merge values.
 * @param {Function} [customizer] The function to customize merged values.
 * @param {Array} [stackA=[]] Tracks traversed source objects.
 * @param {Array} [stackB=[]] Associates values with source counterparts.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseMergeDeep(object, source, key, mergeFunc, customizer, stackA, stackB) {
  var length = stackA.length,
      srcValue = source[key];

  while (length--) {
    if (stackA[length] == srcValue) {
      object[key] = stackB[length];
      return;
    }
  }
  var value = object[key],
      result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
      isCommon = result === undefined;

  if (isCommon) {
    result = srcValue;
    if (isArrayLike(srcValue) && (isArray(srcValue) || isTypedArray(srcValue))) {
      result = isArray(value)
        ? value
        : (isArrayLike(value) ? arrayCopy(value) : []);
    }
    else if (isPlainObject(srcValue) || isArguments(srcValue)) {
      result = isArguments(value)
        ? toPlainObject(value)
        : (isPlainObject(value) ? value : {});
    }
    else {
      isCommon = false;
    }
  }
  // Add the source value to the stack of traversed objects and associate
  // it with its merged value.
  stackA.push(srcValue);
  stackB.push(result);

  if (isCommon) {
    // Recursively merge objects and arrays (susceptible to call stack limits).
    object[key] = mergeFunc(result, srcValue, customizer, stackA, stackB);
  } else if (result === result ? (result !== value) : (value === value)) {
    object[key] = result;
  }
}

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

/**
 * Checks if `value` is array-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 */
function isArrayLike(value) {
  return value != null && isLength(getLength(value));
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Recursively merges own enumerable properties of the source object(s), that
 * don't resolve to `undefined` into the destination object. Subsequent sources
 * overwrite property assignments of previous sources. If `customizer` is
 * provided it is invoked to produce the merged values of the destination and
 * source properties. If `customizer` returns `undefined` merging is handled
 * by the method instead. The `customizer` is bound to `thisArg` and invoked
 * with five arguments: (objectValue, sourceValue, key, object, source).
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @param {Function} [customizer] The function to customize assigned values.
 * @param {*} [thisArg] The `this` binding of `customizer`.
 * @returns {Object} Returns `object`.
 * @example
 *
 * var users = {
 *   'data': [{ 'user': 'barney' }, { 'user': 'fred' }]
 * };
 *
 * var ages = {
 *   'data': [{ 'age': 36 }, { 'age': 40 }]
 * };
 *
 * _.merge(users, ages);
 * // => { 'data': [{ 'user': 'barney', 'age': 36 }, { 'user': 'fred', 'age': 40 }] }
 *
 * // using a customizer callback
 * var object = {
 *   'fruits': ['apple'],
 *   'vegetables': ['beet']
 * };
 *
 * var other = {
 *   'fruits': ['banana'],
 *   'vegetables': ['carrot']
 * };
 *
 * _.merge(object, other, function(a, b) {
 *   if (_.isArray(a)) {
 *     return a.concat(b);
 *   }
 * });
 * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot'] }
 */
var merge = createAssigner(baseMerge);

module.exports = merge;

},{"lodash._arraycopy":23,"lodash._arrayeach":24,"lodash._createassigner":45,"lodash.isarguments":57,"lodash.isarray":58,"lodash.isplainobject":64,"lodash.istypedarray":66,"lodash.keys":68,"lodash.toplainobject":79}],72:[function(require,module,exports){
/**
 * lodash 3.0.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var keys = require('lodash.keys');

/**
 * Converts `value` to an object if it's not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Object} Returns the object.
 */
function toObject(value) {
  return isObject(value) ? value : Object(value);
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Creates a two dimensional array of the key-value pairs for `object`,
 * e.g. `[[key1, value1], [key2, value2]]`.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the new array of key-value pairs.
 * @example
 *
 * _.pairs({ 'barney': 36, 'fred': 40 });
 * // => [['barney', 36], ['fred', 40]] (iteration order is not guaranteed)
 */
function pairs(object) {
  object = toObject(object);

  var index = -1,
      props = keys(object),
      length = props.length,
      result = Array(length);

  while (++index < length) {
    var key = props[index];
    result[index] = [key, object[key]];
  }
  return result;
}

module.exports = pairs;

},{"lodash.keys":68}],73:[function(require,module,exports){
/**
 * lodash 3.1.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var baseCallback = require('lodash._basecallback'),
    basePullAt = require('lodash._basepullat');

/**
 * Removes all elements from `array` that `predicate` returns truthy for
 * and returns an array of the removed elements. The predicate is bound to
 * `thisArg` and invoked with three arguments: (value, index, array).
 *
 * If a property name is provided for `predicate` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `predicate` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * **Note:** Unlike `_.filter`, this method mutates `array`.
 *
 * @static
 * @memberOf _
 * @category Array
 * @param {Array} array The array to modify.
 * @param {Function|Object|string} [predicate=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `predicate`.
 * @returns {Array} Returns the new array of removed elements.
 * @example
 *
 * var array = [1, 2, 3, 4];
 * var evens = _.remove(array, function(n) {
 *   return n % 2 == 0;
 * });
 *
 * console.log(array);
 * // => [1, 3]
 *
 * console.log(evens);
 * // => [2, 4]
 */
function remove(array, predicate, thisArg) {
  var result = [];
  if (!(array && array.length)) {
    return result;
  }
  var index = -1,
      indexes = [],
      length = array.length;

  predicate = baseCallback(predicate, thisArg, 3);
  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result.push(value);
      indexes.push(index);
    }
  }
  basePullAt(array, indexes);
  return result;
}

module.exports = remove;

},{"lodash._basecallback":27,"lodash._basepullat":37}],74:[function(require,module,exports){
/**
 * lodash 3.0.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var baseSlice = require('lodash._baseslice'),
    isIterateeCall = require('lodash._isiterateecall');

/**
 * Creates a slice of `array` with `n` elements dropped from the beginning.
 *
 * @static
 * @memberOf _
 * @type Function
 * @category Array
 * @param {Array} array The array to query.
 * @param {number} [n=1] The number of elements to drop.
 * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
 * @returns {Array} Returns the slice of `array`.
 * @example
 *
 * _.drop([1, 2, 3]);
 * // => [2, 3]
 *
 * _.drop([1, 2, 3], 2);
 * // => [3]
 *
 * _.drop([1, 2, 3], 5);
 * // => []
 *
 * _.drop([1, 2, 3], 0);
 * // => [1, 2, 3]
 */
function drop(array, n, guard) {
  var length = array ? array.length : 0;
  if (!length) {
    return [];
  }
  if (guard ? isIterateeCall(array, n, guard) : n == null) {
    n = 1;
  }
  return baseSlice(array, n < 0 ? 0 : n);
}

/**
 * Gets all but the first element of `array`.
 *
 * @static
 * @memberOf _
 * @alias tail
 * @category Array
 * @param {Array} array The array to query.
 * @returns {Array} Returns the slice of `array`.
 * @example
 *
 * _.rest([1, 2, 3]);
 * // => [2, 3]
 */
function rest(array) {
  return drop(array, 1);
}

module.exports = rest;

},{"lodash._baseslice":38,"lodash._isiterateecall":48}],75:[function(require,module,exports){
/**
 * lodash 3.6.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Native method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates a function that invokes `func` with the `this` binding of the
 * created function and arguments from `start` and beyond provided as an array.
 *
 * **Note:** This method is based on the [rest parameter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters).
 *
 * @static
 * @memberOf _
 * @category Function
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var say = _.restParam(function(what, names) {
 *   return what + ' ' + _.initial(names).join(', ') +
 *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
 * });
 *
 * say('hello', 'fred', 'barney', 'pebbles');
 * // => 'hello fred, barney, & pebbles'
 */
function restParam(func, start) {
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  start = nativeMax(start === undefined ? (func.length - 1) : (+start || 0), 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        rest = Array(length);

    while (++index < length) {
      rest[index] = args[start + index];
    }
    switch (start) {
      case 0: return func.call(this, rest);
      case 1: return func.call(this, args[0], rest);
      case 2: return func.call(this, args[0], args[1], rest);
    }
    var otherArgs = Array(start + 1);
    index = -1;
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = rest;
    return func.apply(this, otherArgs);
  };
}

module.exports = restParam;

},{}],76:[function(require,module,exports){
/**
 * lodash 3.0.2 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var keys = require('lodash.keys');

/**
 * Used as the [maximum length](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Gets the size of `collection` by returning its length for array-like
 * values or the number of own enumerable properties for objects.
 *
 * @static
 * @memberOf _
 * @category Collection
 * @param {Array|Object|string} collection The collection to inspect.
 * @returns {number} Returns the size of `collection`.
 * @example
 *
 * _.size([1, 2, 3]);
 * // => 3
 *
 * _.size({ 'a': 1, 'b': 2 });
 * // => 2
 *
 * _.size('pebbles');
 * // => 7
 */
function size(collection) {
  var length = collection ? getLength(collection) : 0;
  return isLength(length) ? length : keys(collection).length;
}

module.exports = size;

},{"lodash.keys":68}],77:[function(require,module,exports){
/**
 * lodash 3.0.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var baseSlice = require('lodash._baseslice'),
    isIterateeCall = require('lodash._isiterateecall');

/**
 * Creates a slice of `array` from `start` up to, but not including, `end`.
 *
 * **Note:** This function is used instead of `Array#slice` to support node
 * lists in IE < 9 and to ensure dense arrays are returned.
 *
 * @static
 * @memberOf _
 * @category Array
 * @param {Array} array The array to slice.
 * @param {number} [start=0] The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the slice of `array`.
 */
function slice(array, start, end) {
  var length = array ? array.length : 0;
  if (!length) {
    return [];
  }
  if (end && typeof end != 'number' && isIterateeCall(array, start, end)) {
    start = 0;
    end = length;
  }
  return baseSlice(array, start, end);
}

module.exports = slice;

},{"lodash._baseslice":38,"lodash._isiterateecall":48}],78:[function(require,module,exports){
/**
 * lodash 3.0.4 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var debounce = require('lodash.debounce');

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a throttled function that only invokes `func` at most once per
 * every `wait` milliseconds. The throttled function comes with a `cancel`
 * method to cancel delayed invocations. Provide an options object to indicate
 * that `func` should be invoked on the leading and/or trailing edge of the
 * `wait` timeout. Subsequent calls to the throttled function return the
 * result of the last `func` call.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
 * on the trailing edge of the timeout only if the the throttled function is
 * invoked more than once during the `wait` timeout.
 *
 * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
 * for details over the differences between `_.throttle` and `_.debounce`.
 *
 * @static
 * @memberOf _
 * @category Function
 * @param {Function} func The function to throttle.
 * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
 * @param {Object} [options] The options object.
 * @param {boolean} [options.leading=true] Specify invoking on the leading
 *  edge of the timeout.
 * @param {boolean} [options.trailing=true] Specify invoking on the trailing
 *  edge of the timeout.
 * @returns {Function} Returns the new throttled function.
 * @example
 *
 * // avoid excessively updating the position while scrolling
 * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
 *
 * // invoke `renewToken` when the click event is fired, but not more than once every 5 minutes
 * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
 *   'trailing': false
 * }));
 *
 * // cancel a trailing throttled call
 * jQuery(window).on('popstate', throttled.cancel);
 */
function throttle(func, wait, options) {
  var leading = true,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  if (options === false) {
    leading = false;
  } else if (isObject(options)) {
    leading = 'leading' in options ? !!options.leading : leading;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }
  return debounce(func, wait, { 'leading': leading, 'maxWait': +wait, 'trailing': trailing });
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = throttle;

},{"lodash.debounce":52}],79:[function(require,module,exports){
/**
 * lodash 3.0.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var baseCopy = require('lodash._basecopy'),
    keysIn = require('lodash.keysin');

/**
 * Converts `value` to a plain object flattening inherited enumerable
 * properties of `value` to own properties of the plain object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {Object} Returns the converted plain object.
 * @example
 *
 * function Foo() {
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.assign({ 'a': 1 }, new Foo);
 * // => { 'a': 1, 'b': 2 }
 *
 * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
 * // => { 'a': 1, 'b': 2, 'c': 3 }
 */
function toPlainObject(value) {
  return baseCopy(value, keysIn(value));
}

module.exports = toPlainObject;

},{"lodash._basecopy":29,"lodash.keysin":69}],80:[function(require,module,exports){
/**
 * lodash 3.0.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var baseToString = require('lodash._basetostring'),
    charsLeftIndex = require('lodash._charsleftindex'),
    charsRightIndex = require('lodash._charsrightindex'),
    isIterateeCall = require('lodash._isiterateecall'),
    trimmedLeftIndex = require('lodash._trimmedleftindex'),
    trimmedRightIndex = require('lodash._trimmedrightindex');

/**
 * Removes leading and trailing whitespace or specified characters from `string`.
 *
 * @static
 * @memberOf _
 * @category String
 * @param {string} [string=''] The string to trim.
 * @param {string} [chars=whitespace] The characters to trim.
 * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
 * @returns {string} Returns the trimmed string.
 * @example
 *
 * _.trim('  abc  ');
 * // => 'abc'
 *
 * _.trim('-_-abc-_-', '_-');
 * // => 'abc'
 *
 * _.map(['  foo  ', '  bar  '], _.trim);
 * // => ['foo', 'bar]
 */
function trim(string, chars, guard) {
  var value = string;
  string = baseToString(string);
  if (!string) {
    return string;
  }
  if (guard ? isIterateeCall(value, chars, guard) : chars == null) {
    return string.slice(trimmedLeftIndex(string), trimmedRightIndex(string) + 1);
  }
  chars = (chars + '');
  return string.slice(charsLeftIndex(string, chars), charsRightIndex(string, chars) + 1);
}

module.exports = trim;

},{"lodash._basetostring":39,"lodash._charsleftindex":43,"lodash._charsrightindex":44,"lodash._isiterateecall":48,"lodash._trimmedleftindex":49,"lodash._trimmedrightindex":50}],81:[function(require,module,exports){
/**
 * lodash 3.1.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var baseFlatten = require('lodash._baseflatten'),
    baseUniq = require('lodash._baseuniq'),
    restParam = require('lodash.restparam');

/**
 * Creates an array of unique values, in order, of the provided arrays using
 * `SameValueZero` for equality comparisons.
 *
 * **Note:** [`SameValueZero`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero)
 * comparisons are like strict equality comparisons, e.g. `===`, except that
 * `NaN` matches `NaN`.
 *
 * @static
 * @memberOf _
 * @category Array
 * @param {...Array} [arrays] The arrays to inspect.
 * @returns {Array} Returns the new array of combined values.
 * @example
 *
 * _.union([1, 2], [4, 2], [2, 1]);
 * // => [1, 2, 4]
 */
var union = restParam(function(arrays) {
  return baseUniq(baseFlatten(arrays, false, true));
});

module.exports = union;

},{"lodash._baseflatten":33,"lodash._baseuniq":40,"lodash.restparam":75}],82:[function(require,module,exports){
var raf = require("raf")
var TypedError = require("error/typed")

var InvalidUpdateInRender = TypedError({
    type: "main-loop.invalid.update.in-render",
    message: "main-loop: Unexpected update occurred in loop.\n" +
        "We are currently rendering a view, " +
            "you can't change state right now.\n" +
        "The diff is: {stringDiff}.\n" +
        "SUGGESTED FIX: find the state mutation in your view " +
            "or rendering function and remove it.\n" +
        "The view should not have any side effects.\n",
    diff: null,
    stringDiff: null
})

module.exports = main

function main(initialState, view, opts) {
    opts = opts || {}

    var currentState = initialState
    var create = opts.create
    var diff = opts.diff
    var patch = opts.patch
    var redrawScheduled = false

    var tree = opts.initialTree || view(currentState)
    var target = opts.target || create(tree, opts)
    var inRenderingTransaction = false

    currentState = null

    var loop = {
        state: initialState,
        target: target,
        update: update
    }
    return loop

    function update(state) {
        if (inRenderingTransaction) {
            throw InvalidUpdateInRender({
                diff: state._diff,
                stringDiff: JSON.stringify(state._diff)
            })
        }

        if (currentState === null && !redrawScheduled) {
            redrawScheduled = true
            raf(redraw)
        }

        currentState = state
        loop.state = state
    }

    function redraw() {
        redrawScheduled = false
        if (currentState === null) {
            return
        }

        inRenderingTransaction = true
        var newTree = view(currentState)

        if (opts.createOnly) {
            inRenderingTransaction = false
            create(newTree, opts)
        } else {
            var patches = diff(tree, newTree, opts)
            inRenderingTransaction = false
            target = patch(target, patches, opts)
        }

        tree = newTree
        currentState = null
    }
}

},{"error/typed":14,"raf":87}],83:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
(function() {
  var Events, Mediator, mediator;

  Events = require('backbone-events-standalone');

  Mediator = (function() {
    Mediator.prototype.attributes = {};

    function Mediator() {}

    Mediator.prototype.set = function(key, data) {
      return this.attributes[key] = data;
    };

    Mediator.prototype.get = function(key) {
      return this.attributes[key];
    };

    return Mediator;

  })();

  Events.mixin(Mediator.prototype);

  mediator = new Mediator;

  mediator.Mediator = Mediator;

  module.exports = mediator;

}).call(this);

},{"backbone-events-standalone":2}],84:[function(require,module,exports){
/*!
	Papa Parse
	v4.1.2
	https://github.com/mholt/PapaParse
*/
(function(global)
{
	"use strict";

	var IS_WORKER = !global.document && !!global.postMessage,
		IS_PAPA_WORKER = IS_WORKER && /(\?|&)papaworker(=|&|$)/.test(global.location.search),
		LOADED_SYNC = false, AUTO_SCRIPT_PATH;
	var workers = {}, workerIdCounter = 0;

	var Papa = {};

	Papa.parse = CsvToJson;
	Papa.unparse = JsonToCsv;

	Papa.RECORD_SEP = String.fromCharCode(30);
	Papa.UNIT_SEP = String.fromCharCode(31);
	Papa.BYTE_ORDER_MARK = "\ufeff";
	Papa.BAD_DELIMITERS = ["\r", "\n", "\"", Papa.BYTE_ORDER_MARK];
	Papa.WORKERS_SUPPORTED = !IS_WORKER && !!global.Worker;
	Papa.SCRIPT_PATH = null;	// Must be set by your code if you use workers and this lib is loaded asynchronously

	// Configurable chunk sizes for local and remote files, respectively
	Papa.LocalChunkSize = 1024 * 1024 * 10;	// 10 MB
	Papa.RemoteChunkSize = 1024 * 1024 * 5;	// 5 MB
	Papa.DefaultDelimiter = ",";			// Used if not specified and detection fails

	// Exposed for testing and development only
	Papa.Parser = Parser;
	Papa.ParserHandle = ParserHandle;
	Papa.NetworkStreamer = NetworkStreamer;
	Papa.FileStreamer = FileStreamer;
	Papa.StringStreamer = StringStreamer;

	if (typeof module !== 'undefined' && module.exports)
	{
		// Export to Node...
		module.exports = Papa;
	}
	else if (isFunction(global.define) && global.define.amd)
	{
		// Wireup with RequireJS
		define(function() { return Papa; });
	}
	else
	{
		// ...or as browser global
		global.Papa = Papa;
	}

	if (global.jQuery)
	{
		var $ = global.jQuery;
		$.fn.parse = function(options)
		{
			var config = options.config || {};
			var queue = [];

			this.each(function(idx)
			{
				var supported = $(this).prop('tagName').toUpperCase() == "INPUT"
								&& $(this).attr('type').toLowerCase() == "file"
								&& global.FileReader;

				if (!supported || !this.files || this.files.length == 0)
					return true;	// continue to next input element

				for (var i = 0; i < this.files.length; i++)
				{
					queue.push({
						file: this.files[i],
						inputElem: this,
						instanceConfig: $.extend({}, config)
					});
				}
			});

			parseNextFile();	// begin parsing
			return this;		// maintains chainability


			function parseNextFile()
			{
				if (queue.length == 0)
				{
					if (isFunction(options.complete))
						options.complete();
					return;
				}

				var f = queue[0];

				if (isFunction(options.before))
				{
					var returned = options.before(f.file, f.inputElem);

					if (typeof returned === 'object')
					{
						if (returned.action == "abort")
						{
							error("AbortError", f.file, f.inputElem, returned.reason);
							return;	// Aborts all queued files immediately
						}
						else if (returned.action == "skip")
						{
							fileComplete();	// parse the next file in the queue, if any
							return;
						}
						else if (typeof returned.config === 'object')
							f.instanceConfig = $.extend(f.instanceConfig, returned.config);
					}
					else if (returned == "skip")
					{
						fileComplete();	// parse the next file in the queue, if any
						return;
					}
				}

				// Wrap up the user's complete callback, if any, so that ours also gets executed
				var userCompleteFunc = f.instanceConfig.complete;
				f.instanceConfig.complete = function(results)
				{
					if (isFunction(userCompleteFunc))
						userCompleteFunc(results, f.file, f.inputElem);
					fileComplete();
				};

				Papa.parse(f.file, f.instanceConfig);
			}

			function error(name, file, elem, reason)
			{
				if (isFunction(options.error))
					options.error({name: name}, file, elem, reason);
			}

			function fileComplete()
			{
				queue.splice(0, 1);
				parseNextFile();
			}
		}
	}


	if (IS_PAPA_WORKER)
	{
		global.onmessage = workerThreadReceivedMessage;
	}
	else if (Papa.WORKERS_SUPPORTED)
	{
		AUTO_SCRIPT_PATH = getScriptPath();

		// Check if the script was loaded synchronously
		if (!document.body)
		{
			// Body doesn't exist yet, must be synchronous
			LOADED_SYNC = true;
		}
		else
		{
			document.addEventListener('DOMContentLoaded', function () {
				LOADED_SYNC = true;
			}, true);
		}
	}




	function CsvToJson(_input, _config)
	{
		_config = _config || {};

		if (_config.worker && Papa.WORKERS_SUPPORTED)
		{
			var w = newWorker();

			w.userStep = _config.step;
			w.userChunk = _config.chunk;
			w.userComplete = _config.complete;
			w.userError = _config.error;

			_config.step = isFunction(_config.step);
			_config.chunk = isFunction(_config.chunk);
			_config.complete = isFunction(_config.complete);
			_config.error = isFunction(_config.error);
			delete _config.worker;	// prevent infinite loop

			w.postMessage({
				input: _input,
				config: _config,
				workerId: w.id
			});

			return;
		}

		var streamer = null;
		if (typeof _input === 'string')
		{
			if (_config.download)
				streamer = new NetworkStreamer(_config);
			else
				streamer = new StringStreamer(_config);
		}
		else if ((global.File && _input instanceof File) || _input instanceof Object)	// ...Safari. (see issue #106)
			streamer = new FileStreamer(_config);

		return streamer.stream(_input);
	}






	function JsonToCsv(_input, _config)
	{
		var _output = "";
		var _fields = [];

		// Default configuration

		/** whether to surround every datum with quotes */
		var _quotes = false;

		/** delimiting character */
		var _delimiter = ",";

		/** newline character(s) */
		var _newline = "\r\n";

		unpackConfig();

		if (typeof _input === 'string')
			_input = JSON.parse(_input);

		if (_input instanceof Array)
		{
			if (!_input.length || _input[0] instanceof Array)
				return serialize(null, _input);
			else if (typeof _input[0] === 'object')
				return serialize(objectKeys(_input[0]), _input);
		}
		else if (typeof _input === 'object')
		{
			if (typeof _input.data === 'string')
				_input.data = JSON.parse(_input.data);

			if (_input.data instanceof Array)
			{
				if (!_input.fields)
					_input.fields = _input.data[0] instanceof Array
									? _input.fields
									: objectKeys(_input.data[0]);

				if (!(_input.data[0] instanceof Array) && typeof _input.data[0] !== 'object')
					_input.data = [_input.data];	// handles input like [1,2,3] or ["asdf"]
			}

			return serialize(_input.fields || [], _input.data || []);
		}

		// Default (any valid paths should return before this)
		throw "exception: Unable to serialize unrecognized input";


		function unpackConfig()
		{
			if (typeof _config !== 'object')
				return;

			if (typeof _config.delimiter === 'string'
				&& _config.delimiter.length == 1
				&& Papa.BAD_DELIMITERS.indexOf(_config.delimiter) == -1)
			{
				_delimiter = _config.delimiter;
			}

			if (typeof _config.quotes === 'boolean'
				|| _config.quotes instanceof Array)
				_quotes = _config.quotes;

			if (typeof _config.newline === 'string')
				_newline = _config.newline;
		}


		/** Turns an object's keys into an array */
		function objectKeys(obj)
		{
			if (typeof obj !== 'object')
				return [];
			var keys = [];
			for (var key in obj)
				keys.push(key);
			return keys;
		}

		/** The double for loop that iterates the data and writes out a CSV string including header row */
		function serialize(fields, data)
		{
			var csv = "";

			if (typeof fields === 'string')
				fields = JSON.parse(fields);
			if (typeof data === 'string')
				data = JSON.parse(data);

			var hasHeader = fields instanceof Array && fields.length > 0;
			var dataKeyedByField = !(data[0] instanceof Array);

			// If there a header row, write it first
			if (hasHeader)
			{
				for (var i = 0; i < fields.length; i++)
				{
					if (i > 0)
						csv += _delimiter;
					csv += safe(fields[i], i);
				}
				if (data.length > 0)
					csv += _newline;
			}

			// Then write out the data
			for (var row = 0; row < data.length; row++)
			{
				var maxCol = hasHeader ? fields.length : data[row].length;

				for (var col = 0; col < maxCol; col++)
				{
					if (col > 0)
						csv += _delimiter;
					var colIdx = hasHeader && dataKeyedByField ? fields[col] : col;
					csv += safe(data[row][colIdx], col);
				}

				if (row < data.length - 1)
					csv += _newline;
			}

			return csv;
		}

		/** Encloses a value around quotes if needed (makes a value safe for CSV insertion) */
		function safe(str, col)
		{
			if (typeof str === "undefined" || str === null)
				return "";

			str = str.toString().replace(/"/g, '""');

			var needsQuotes = (typeof _quotes === 'boolean' && _quotes)
							|| (_quotes instanceof Array && _quotes[col])
							|| hasAny(str, Papa.BAD_DELIMITERS)
							|| str.indexOf(_delimiter) > -1
							|| str.charAt(0) == ' '
							|| str.charAt(str.length - 1) == ' ';

			return needsQuotes ? '"' + str + '"' : str;
		}

		function hasAny(str, substrings)
		{
			for (var i = 0; i < substrings.length; i++)
				if (str.indexOf(substrings[i]) > -1)
					return true;
			return false;
		}
	}

	/** ChunkStreamer is the base prototype for various streamer implementations. */
	function ChunkStreamer(config)
	{
		this._handle = null;
		this._paused = false;
		this._finished = false;
		this._input = null;
		this._baseIndex = 0;
		this._partialLine = "";
		this._rowCount = 0;
		this._start = 0;
		this._nextChunk = null;
		this.isFirstChunk = true;
		this._completeResults = {
			data: [],
			errors: [],
			meta: {}
		};
		replaceConfig.call(this, config);

		this.parseChunk = function(chunk)
		{
			// First chunk pre-processing
			if (this.isFirstChunk && isFunction(this._config.beforeFirstChunk))
			{
				var modifiedChunk = this._config.beforeFirstChunk(chunk);
				if (modifiedChunk !== undefined)
					chunk = modifiedChunk;
			}
			this.isFirstChunk = false;

			// Rejoin the line we likely just split in two by chunking the file
			var aggregate = this._partialLine + chunk;
			this._partialLine = "";

			var results = this._handle.parse(aggregate, this._baseIndex, !this._finished);
			
			if (this._handle.paused() || this._handle.aborted())
				return;
			
			var lastIndex = results.meta.cursor;
			
			if (!this._finished)
			{
				this._partialLine = aggregate.substring(lastIndex - this._baseIndex);
				this._baseIndex = lastIndex;
			}

			if (results && results.data)
				this._rowCount += results.data.length;

			var finishedIncludingPreview = this._finished || (this._config.preview && this._rowCount >= this._config.preview);

			if (IS_PAPA_WORKER)
			{
				global.postMessage({
					results: results,
					workerId: Papa.WORKER_ID,
					finished: finishedIncludingPreview
				});
			}
			else if (isFunction(this._config.chunk))
			{
				this._config.chunk(results, this._handle);
				if (this._paused)
					return;
				results = undefined;
				this._completeResults = undefined;
			}

			if (!this._config.step && !this._config.chunk) {
				this._completeResults.data = this._completeResults.data.concat(results.data);
				this._completeResults.errors = this._completeResults.errors.concat(results.errors);
				this._completeResults.meta = results.meta;
			}

			if (finishedIncludingPreview && isFunction(this._config.complete) && (!results || !results.meta.aborted))
				this._config.complete(this._completeResults);

			if (!finishedIncludingPreview && (!results || !results.meta.paused))
				this._nextChunk();

			return results;
		};

		this._sendError = function(error)
		{
			if (isFunction(this._config.error))
				this._config.error(error);
			else if (IS_PAPA_WORKER && this._config.error)
			{
				global.postMessage({
					workerId: Papa.WORKER_ID,
					error: error,
					finished: false
				});
			}
		};

		function replaceConfig(config)
		{
			// Deep-copy the config so we can edit it
			var configCopy = copy(config);
			configCopy.chunkSize = parseInt(configCopy.chunkSize);	// parseInt VERY important so we don't concatenate strings!
			if (!config.step && !config.chunk)
				configCopy.chunkSize = null;  // disable Range header if not streaming; bad values break IIS - see issue #196
			this._handle = new ParserHandle(configCopy);
			this._handle.streamer = this;
			this._config = configCopy;	// persist the copy to the caller
		}
	}


	function NetworkStreamer(config)
	{
		config = config || {};
		if (!config.chunkSize)
			config.chunkSize = Papa.RemoteChunkSize;
		ChunkStreamer.call(this, config);

		var xhr;

		if (IS_WORKER)
		{
			this._nextChunk = function()
			{
				this._readChunk();
				this._chunkLoaded();
			};
		}
		else
		{
			this._nextChunk = function()
			{
				this._readChunk();
			};
		}

		this.stream = function(url)
		{
			this._input = url;
			this._nextChunk();	// Starts streaming
		};

		this._readChunk = function()
		{
			if (this._finished)
			{
				this._chunkLoaded();
				return;
			}

			xhr = new XMLHttpRequest();
			
			if (!IS_WORKER)
			{
				xhr.onload = bindFunction(this._chunkLoaded, this);
				xhr.onerror = bindFunction(this._chunkError, this);
			}

			xhr.open("GET", this._input, !IS_WORKER);
			
			if (this._config.chunkSize)
			{
				var end = this._start + this._config.chunkSize - 1;	// minus one because byte range is inclusive
				xhr.setRequestHeader("Range", "bytes="+this._start+"-"+end);
				xhr.setRequestHeader("If-None-Match", "webkit-no-cache"); // https://bugs.webkit.org/show_bug.cgi?id=82672
			}

			try {
				xhr.send();
			}
			catch (err) {
				this._chunkError(err.message);
			}

			if (IS_WORKER && xhr.status == 0)
				this._chunkError();
			else
				this._start += this._config.chunkSize;
		}

		this._chunkLoaded = function()
		{
			if (xhr.readyState != 4)
				return;

			if (xhr.status < 200 || xhr.status >= 400)
			{
				this._chunkError();
				return;
			}

			this._finished = !this._config.chunkSize || this._start > getFileSize(xhr);
			this.parseChunk(xhr.responseText);
		}

		this._chunkError = function(errorMessage)
		{
			var errorText = xhr.statusText || errorMessage;
			this._sendError(errorText);
		}

		function getFileSize(xhr)
		{
			var contentRange = xhr.getResponseHeader("Content-Range");
			return parseInt(contentRange.substr(contentRange.lastIndexOf("/") + 1));
		}
	}
	NetworkStreamer.prototype = Object.create(ChunkStreamer.prototype);
	NetworkStreamer.prototype.constructor = NetworkStreamer;


	function FileStreamer(config)
	{
		config = config || {};
		if (!config.chunkSize)
			config.chunkSize = Papa.LocalChunkSize;
		ChunkStreamer.call(this, config);

		var reader, slice;

		// FileReader is better than FileReaderSync (even in worker) - see http://stackoverflow.com/q/24708649/1048862
		// But Firefox is a pill, too - see issue #76: https://github.com/mholt/PapaParse/issues/76
		var usingAsyncReader = typeof FileReader !== 'undefined';	// Safari doesn't consider it a function - see issue #105

		this.stream = function(file)
		{
			this._input = file;
			slice = file.slice || file.webkitSlice || file.mozSlice;

			if (usingAsyncReader)
			{
				reader = new FileReader();		// Preferred method of reading files, even in workers
				reader.onload = bindFunction(this._chunkLoaded, this);
				reader.onerror = bindFunction(this._chunkError, this);
			}
			else
				reader = new FileReaderSync();	// Hack for running in a web worker in Firefox

			this._nextChunk();	// Starts streaming
		};

		this._nextChunk = function()
		{
			if (!this._finished && (!this._config.preview || this._rowCount < this._config.preview))
				this._readChunk();
		}

		this._readChunk = function()
		{
			var input = this._input;
			if (this._config.chunkSize)
			{
				var end = Math.min(this._start + this._config.chunkSize, this._input.size);
				input = slice.call(input, this._start, end);
			}
			var txt = reader.readAsText(input, this._config.encoding);
			if (!usingAsyncReader)
				this._chunkLoaded({ target: { result: txt } });	// mimic the async signature
		}

		this._chunkLoaded = function(event)
		{
			// Very important to increment start each time before handling results
			this._start += this._config.chunkSize;
			this._finished = !this._config.chunkSize || this._start >= this._input.size;
			this.parseChunk(event.target.result);
		}

		this._chunkError = function()
		{
			this._sendError(reader.error);
		}

	}
	FileStreamer.prototype = Object.create(ChunkStreamer.prototype);
	FileStreamer.prototype.constructor = FileStreamer;


	function StringStreamer(config)
	{
		config = config || {};
		ChunkStreamer.call(this, config);

		var string;
		var remaining;
		this.stream = function(s)
		{
			string = s;
			remaining = s;
			return this._nextChunk();
		}
		this._nextChunk = function()
		{
			if (this._finished) return;
			var size = this._config.chunkSize;
			var chunk = size ? remaining.substr(0, size) : remaining;
			remaining = size ? remaining.substr(size) : '';
			this._finished = !remaining;
			return this.parseChunk(chunk);
		}
	}
	StringStreamer.prototype = Object.create(StringStreamer.prototype);
	StringStreamer.prototype.constructor = StringStreamer;



	// Use one ParserHandle per entire CSV file or string
	function ParserHandle(_config)
	{
		// One goal is to minimize the use of regular expressions...
		var FLOAT = /^\s*-?(\d*\.?\d+|\d+\.?\d*)(e[-+]?\d+)?\s*$/i;

		var self = this;
		var _stepCounter = 0;	// Number of times step was called (number of rows parsed)
		var _input;				// The input being parsed
		var _parser;			// The core parser being used
		var _paused = false;	// Whether we are paused or not
		var _aborted = false;   // Whether the parser has aborted or not
		var _delimiterError;	// Temporary state between delimiter detection and processing results
		var _fields = [];		// Fields are from the header row of the input, if there is one
		var _results = {		// The last results returned from the parser
			data: [],
			errors: [],
			meta: {}
		};

		if (isFunction(_config.step))
		{
			var userStep = _config.step;
			_config.step = function(results)
			{
				_results = results;

				if (needsHeaderRow())
					processResults();
				else	// only call user's step function after header row
				{
					processResults();

					// It's possbile that this line was empty and there's no row here after all
					if (_results.data.length == 0)
						return;

					_stepCounter += results.data.length;
					if (_config.preview && _stepCounter > _config.preview)
						_parser.abort();
					else
						userStep(_results, self);
				}
			};
		}

		/**
		 * Parses input. Most users won't need, and shouldn't mess with, the baseIndex
		 * and ignoreLastRow parameters. They are used by streamers (wrapper functions)
		 * when an input comes in multiple chunks, like from a file.
		 */
		this.parse = function(input, baseIndex, ignoreLastRow)
		{
			if (!_config.newline)
				_config.newline = guessLineEndings(input);

			_delimiterError = false;
			if (!_config.delimiter)
			{
				var delimGuess = guessDelimiter(input);
				if (delimGuess.successful)
					_config.delimiter = delimGuess.bestDelimiter;
				else
				{
					_delimiterError = true;	// add error after parsing (otherwise it would be overwritten)
					_config.delimiter = Papa.DefaultDelimiter;
				}
				_results.meta.delimiter = _config.delimiter;
			}

			var parserConfig = copy(_config);
			if (_config.preview && _config.header)
				parserConfig.preview++;	// to compensate for header row

			_input = input;
			_parser = new Parser(parserConfig);
			_results = _parser.parse(_input, baseIndex, ignoreLastRow);
			processResults();
			return _paused ? { meta: { paused: true } } : (_results || { meta: { paused: false } });
		};

		this.paused = function()
		{
			return _paused;
		};

		this.pause = function()
		{
			_paused = true;
			_parser.abort();
			_input = _input.substr(_parser.getCharIndex());
		};

		this.resume = function()
		{
			_paused = false;
			self.streamer.parseChunk(_input);
		};

		this.aborted = function () {
			return _aborted;
		}

		this.abort = function()
		{
			_aborted = true;
			_parser.abort();
			_results.meta.aborted = true;
			if (isFunction(_config.complete))
				_config.complete(_results);
			_input = "";
		};

		function processResults()
		{
			if (_results && _delimiterError)
			{
				addError("Delimiter", "UndetectableDelimiter", "Unable to auto-detect delimiting character; defaulted to '"+Papa.DefaultDelimiter+"'");
				_delimiterError = false;
			}

			if (_config.skipEmptyLines)
			{
				for (var i = 0; i < _results.data.length; i++)
					if (_results.data[i].length == 1 && _results.data[i][0] == "")
						_results.data.splice(i--, 1);
			}

			if (needsHeaderRow())
				fillHeaderFields();

			return applyHeaderAndDynamicTyping();
		}

		function needsHeaderRow()
		{
			return _config.header && _fields.length == 0;
		}

		function fillHeaderFields()
		{
			if (!_results)
				return;
			for (var i = 0; needsHeaderRow() && i < _results.data.length; i++)
				for (var j = 0; j < _results.data[i].length; j++)
					_fields.push(_results.data[i][j]);
			_results.data.splice(0, 1);
		}

		function applyHeaderAndDynamicTyping()
		{
			if (!_results || (!_config.header && !_config.dynamicTyping))
				return _results;

			for (var i = 0; i < _results.data.length; i++)
			{
				var row = {};

				for (var j = 0; j < _results.data[i].length; j++)
				{
					if (_config.dynamicTyping)
					{
						var value = _results.data[i][j];
						if (value == "true" || value == "TRUE")
							_results.data[i][j] = true;
						else if (value == "false" || value == "FALSE")
							_results.data[i][j] = false;
						else
							_results.data[i][j] = tryParseFloat(value);
					}

					if (_config.header)
					{
						if (j >= _fields.length)
						{
							if (!row["__parsed_extra"])
								row["__parsed_extra"] = [];
							row["__parsed_extra"].push(_results.data[i][j]);
						}
						else
							row[_fields[j]] = _results.data[i][j];
					}
				}

				if (_config.header)
				{
					_results.data[i] = row;
					if (j > _fields.length)
						addError("FieldMismatch", "TooManyFields", "Too many fields: expected " + _fields.length + " fields but parsed " + j, i);
					else if (j < _fields.length)
						addError("FieldMismatch", "TooFewFields", "Too few fields: expected " + _fields.length + " fields but parsed " + j, i);
				}
			}

			if (_config.header && _results.meta)
				_results.meta.fields = _fields;
			return _results;
		}

		function guessDelimiter(input)
		{
			var delimChoices = [",", "\t", "|", ";", Papa.RECORD_SEP, Papa.UNIT_SEP];
			var bestDelim, bestDelta, fieldCountPrevRow;

			for (var i = 0; i < delimChoices.length; i++)
			{
				var delim = delimChoices[i];
				var delta = 0, avgFieldCount = 0;
				fieldCountPrevRow = undefined;

				var preview = new Parser({
					delimiter: delim,
					preview: 10
				}).parse(input);

				for (var j = 0; j < preview.data.length; j++)
				{
					var fieldCount = preview.data[j].length;
					avgFieldCount += fieldCount;

					if (typeof fieldCountPrevRow === 'undefined')
					{
						fieldCountPrevRow = fieldCount;
						continue;
					}
					else if (fieldCount > 1)
					{
						delta += Math.abs(fieldCount - fieldCountPrevRow);
						fieldCountPrevRow = fieldCount;
					}
				}

				if (preview.data.length > 0)
					avgFieldCount /= preview.data.length;

				if ((typeof bestDelta === 'undefined' || delta < bestDelta)
					&& avgFieldCount > 1.99)
				{
					bestDelta = delta;
					bestDelim = delim;
				}
			}

			_config.delimiter = bestDelim;

			return {
				successful: !!bestDelim,
				bestDelimiter: bestDelim
			}
		}

		function guessLineEndings(input)
		{
			input = input.substr(0, 1024*1024);	// max length 1 MB

			var r = input.split('\r');

			if (r.length == 1)
				return '\n';

			var numWithN = 0;
			for (var i = 0; i < r.length; i++)
			{
				if (r[i][0] == '\n')
					numWithN++;
			}

			return numWithN >= r.length / 2 ? '\r\n' : '\r';
		}

		function tryParseFloat(val)
		{
			var isNumber = FLOAT.test(val);
			return isNumber ? parseFloat(val) : val;
		}

		function addError(type, code, msg, row)
		{
			_results.errors.push({
				type: type,
				code: code,
				message: msg,
				row: row
			});
		}
	}





	/** The core parser implements speedy and correct CSV parsing */
	function Parser(config)
	{
		// Unpack the config object
		config = config || {};
		var delim = config.delimiter;
		var newline = config.newline;
		var comments = config.comments;
		var step = config.step;
		var preview = config.preview;
		var fastMode = config.fastMode;

		// Delimiter must be valid
		if (typeof delim !== 'string'
			|| Papa.BAD_DELIMITERS.indexOf(delim) > -1)
			delim = ",";

		// Comment character must be valid
		if (comments === delim)
			throw "Comment character same as delimiter";
		else if (comments === true)
			comments = "#";
		else if (typeof comments !== 'string'
			|| Papa.BAD_DELIMITERS.indexOf(comments) > -1)
			comments = false;

		// Newline must be valid: \r, \n, or \r\n
		if (newline != '\n' && newline != '\r' && newline != '\r\n')
			newline = '\n';

		// We're gonna need these at the Parser scope
		var cursor = 0;
		var aborted = false;

		this.parse = function(input, baseIndex, ignoreLastRow)
		{
			// For some reason, in Chrome, this speeds things up (!?)
			if (typeof input !== 'string')
				throw "Input must be a string";

			// We don't need to compute some of these every time parse() is called,
			// but having them in a more local scope seems to perform better
			var inputLen = input.length,
				delimLen = delim.length,
				newlineLen = newline.length,
				commentsLen = comments.length;
			var stepIsFunction = typeof step === 'function';

			// Establish starting state
			cursor = 0;
			var data = [], errors = [], row = [], lastCursor = 0;

			if (!input)
				return returnable();

			if (fastMode || (fastMode !== false && input.indexOf('"') === -1))
			{
				var rows = input.split(newline);
				for (var i = 0; i < rows.length; i++)
				{
					var row = rows[i];
					cursor += row.length;
					if (i !== rows.length - 1)
						cursor += newline.length;
					else if (ignoreLastRow)
						return returnable();
					if (comments && row.substr(0, commentsLen) == comments)
						continue;
					if (stepIsFunction)
					{
						data = [];
						pushRow(row.split(delim));
						doStep();
						if (aborted)
							return returnable();
					}
					else
						pushRow(row.split(delim));
					if (preview && i >= preview)
					{
						data = data.slice(0, preview);
						return returnable(true);
					}
				}
				return returnable();
			}

			var nextDelim = input.indexOf(delim, cursor);
			var nextNewline = input.indexOf(newline, cursor);

			// Parser loop
			for (;;)
			{
				// Field has opening quote
				if (input[cursor] == '"')
				{
					// Start our search for the closing quote where the cursor is
					var quoteSearch = cursor;

					// Skip the opening quote
					cursor++;

					for (;;)
					{
						// Find closing quote
						var quoteSearch = input.indexOf('"', quoteSearch+1);

						if (quoteSearch === -1)
						{
							if (!ignoreLastRow) {
								// No closing quote... what a pity
								errors.push({
									type: "Quotes",
									code: "MissingQuotes",
									message: "Quoted field unterminated",
									row: data.length,	// row has yet to be inserted
									index: cursor
								});
							}
							return finish();
						}

						if (quoteSearch === inputLen-1)
						{
							// Closing quote at EOF
							var value = input.substring(cursor, quoteSearch).replace(/""/g, '"');
							return finish(value);
						}

						// If this quote is escaped, it's part of the data; skip it
						if (input[quoteSearch+1] == '"')
						{
							quoteSearch++;
							continue;
						}

						if (input[quoteSearch+1] == delim)
						{
							// Closing quote followed by delimiter
							row.push(input.substring(cursor, quoteSearch).replace(/""/g, '"'));
							cursor = quoteSearch + 1 + delimLen;
							nextDelim = input.indexOf(delim, cursor);
							nextNewline = input.indexOf(newline, cursor);
							break;
						}

						if (input.substr(quoteSearch+1, newlineLen) === newline)
						{
							// Closing quote followed by newline
							row.push(input.substring(cursor, quoteSearch).replace(/""/g, '"'));
							saveRow(quoteSearch + 1 + newlineLen);
							nextDelim = input.indexOf(delim, cursor);	// because we may have skipped the nextDelim in the quoted field

							if (stepIsFunction)
							{
								doStep();
								if (aborted)
									return returnable();
							}
							
							if (preview && data.length >= preview)
								return returnable(true);

							break;
						}
					}

					continue;
				}

				// Comment found at start of new line
				if (comments && row.length === 0 && input.substr(cursor, commentsLen) === comments)
				{
					if (nextNewline == -1)	// Comment ends at EOF
						return returnable();
					cursor = nextNewline + newlineLen;
					nextNewline = input.indexOf(newline, cursor);
					nextDelim = input.indexOf(delim, cursor);
					continue;
				}

				// Next delimiter comes before next newline, so we've reached end of field
				if (nextDelim !== -1 && (nextDelim < nextNewline || nextNewline === -1))
				{
					row.push(input.substring(cursor, nextDelim));
					cursor = nextDelim + delimLen;
					nextDelim = input.indexOf(delim, cursor);
					continue;
				}

				// End of row
				if (nextNewline !== -1)
				{
					row.push(input.substring(cursor, nextNewline));
					saveRow(nextNewline + newlineLen);

					if (stepIsFunction)
					{
						doStep();
						if (aborted)
							return returnable();
					}

					if (preview && data.length >= preview)
						return returnable(true);

					continue;
				}

				break;
			}


			return finish();


			function pushRow(row)
			{
				data.push(row);
				lastCursor = cursor;
			}

			/**
			 * Appends the remaining input from cursor to the end into
			 * row, saves the row, calls step, and returns the results.
			 */
			function finish(value)
			{
				if (ignoreLastRow)
					return returnable();
				if (typeof value === 'undefined')
					value = input.substr(cursor);
				row.push(value);
				cursor = inputLen;	// important in case parsing is paused
				pushRow(row);
				if (stepIsFunction)
					doStep();
				return returnable();
			}

			/**
			 * Appends the current row to the results. It sets the cursor
			 * to newCursor and finds the nextNewline. The caller should
			 * take care to execute user's step function and check for
			 * preview and end parsing if necessary.
			 */
			function saveRow(newCursor)
			{
				cursor = newCursor;
				pushRow(row);
				row = [];
				nextNewline = input.indexOf(newline, cursor);
			}

			/** Returns an object with the results, errors, and meta. */
			function returnable(stopped)
			{
				return {
					data: data,
					errors: errors,
					meta: {
						delimiter: delim,
						linebreak: newline,
						aborted: aborted,
						truncated: !!stopped,
						cursor: lastCursor + (baseIndex || 0)
					}
				};
			}

			/** Executes the user's step function and resets data & errors. */
			function doStep()
			{
				step(returnable());
				data = [], errors = [];
			}
		};

		/** Sets the abort flag */
		this.abort = function()
		{
			aborted = true;
		};

		/** Gets the cursor position */
		this.getCharIndex = function()
		{
			return cursor;
		};
	}


	// If you need to load Papa Parse asynchronously and you also need worker threads, hard-code
	// the script path here. See: https://github.com/mholt/PapaParse/issues/87#issuecomment-57885358
	function getScriptPath()
	{
		var scripts = document.getElementsByTagName('script');
		return scripts.length ? scripts[scripts.length - 1].src : '';
	}

	function newWorker()
	{
		if (!Papa.WORKERS_SUPPORTED)
			return false;
		if (!LOADED_SYNC && Papa.SCRIPT_PATH === null)
			throw new Error(
				'Script path cannot be determined automatically when Papa Parse is loaded asynchronously. ' +
				'You need to set Papa.SCRIPT_PATH manually.'
			);
		var workerUrl = Papa.SCRIPT_PATH || AUTO_SCRIPT_PATH;
		// Append "papaworker" to the search string to tell papaparse that this is our worker.
		workerUrl += (workerUrl.indexOf('?') !== -1 ? '&' : '?') + 'papaworker';
		var w = new global.Worker(workerUrl);
		w.onmessage = mainThreadReceivedMessage;
		w.id = workerIdCounter++;
		workers[w.id] = w;
		return w;
	}

	/** Callback when main thread receives a message */
	function mainThreadReceivedMessage(e)
	{
		var msg = e.data;
		var worker = workers[msg.workerId];
		var aborted = false;

		if (msg.error)
			worker.userError(msg.error, msg.file);
		else if (msg.results && msg.results.data)
		{
			var abort = function() {
				aborted = true;
				completeWorker(msg.workerId, { data: [], errors: [], meta: { aborted: true } });
			};

			var handle = {
				abort: abort,
				pause: notImplemented,
				resume: notImplemented
			};

			if (isFunction(worker.userStep))
			{
				for (var i = 0; i < msg.results.data.length; i++)
				{
					worker.userStep({
						data: [msg.results.data[i]],
						errors: msg.results.errors,
						meta: msg.results.meta
					}, handle);
					if (aborted)
						break;
				}
				delete msg.results;	// free memory ASAP
			}
			else if (isFunction(worker.userChunk))
			{
				worker.userChunk(msg.results, handle, msg.file);
				delete msg.results;
			}
		}

		if (msg.finished && !aborted)
			completeWorker(msg.workerId, msg.results);
	}

	function completeWorker(workerId, results) {
		var worker = workers[workerId];
		if (isFunction(worker.userComplete))
			worker.userComplete(results);
		worker.terminate();
		delete workers[workerId];
	}

	function notImplemented() {
		throw "Not implemented.";
	}

	/** Callback when worker thread receives a message */
	function workerThreadReceivedMessage(e)
	{
		var msg = e.data;

		if (typeof Papa.WORKER_ID === 'undefined' && msg)
			Papa.WORKER_ID = msg.workerId;

		if (typeof msg.input === 'string')
		{
			global.postMessage({
				workerId: Papa.WORKER_ID,
				results: Papa.parse(msg.input, msg.config),
				finished: true
			});
		}
		else if ((global.File && msg.input instanceof File) || msg.input instanceof Object)	// thank you, Safari (see issue #106)
		{
			var results = Papa.parse(msg.input, msg.config);
			if (results)
				global.postMessage({
					workerId: Papa.WORKER_ID,
					results: results,
					finished: true
				});
		}
	}

	/** Makes a deep copy of an array or object (mostly) */
	function copy(obj)
	{
		if (typeof obj !== 'object')
			return obj;
		var cpy = obj instanceof Array ? [] : {};
		for (var key in obj)
			cpy[key] = copy(obj[key]);
		return cpy;
	}

	function bindFunction(f, self)
	{
		return function() { f.apply(self, arguments); };
	}

	function isFunction(func)
	{
		return typeof func === 'function';
	}
})(typeof window !== 'undefined' ? window : this);

},{}],85:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.6.3
(function() {
  var getNanoSeconds, hrtime, loadTime;

  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    module.exports = function() {
      return performance.now();
    };
  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
    module.exports = function() {
      return (getNanoSeconds() - loadTime) / 1e6;
    };
    hrtime = process.hrtime;
    getNanoSeconds = function() {
      var hr;
      hr = hrtime();
      return hr[0] * 1e9 + hr[1];
    };
    loadTime = getNanoSeconds();
  } else if (Date.now) {
    module.exports = function() {
      return Date.now() - loadTime;
    };
    loadTime = Date.now();
  } else {
    module.exports = function() {
      return new Date().getTime() - loadTime;
    };
    loadTime = new Date().getTime();
  }

}).call(this);

/*

*/

}).call(this,require('_process'))

},{"_process":86}],86:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],87:[function(require,module,exports){
var now = require('performance-now')
  , global = typeof window === 'undefined' ? {} : window
  , vendors = ['moz', 'webkit']
  , suffix = 'AnimationFrame'
  , raf = global['request' + suffix]
  , caf = global['cancel' + suffix] || global['cancelRequest' + suffix]
  , isNative = true

for(var i = 0; i < vendors.length && !raf; i++) {
  raf = global[vendors[i] + 'Request' + suffix]
  caf = global[vendors[i] + 'Cancel' + suffix]
      || global[vendors[i] + 'CancelRequest' + suffix]
}

// Some versions of FF have rAF but not cAF
if(!raf || !caf) {
  isNative = false

  var last = 0
    , id = 0
    , queue = []
    , frameDuration = 1000 / 60

  raf = function(callback) {
    if(queue.length === 0) {
      var _now = now()
        , next = Math.max(0, frameDuration - (_now - last))
      last = next + _now
      setTimeout(function() {
        var cp = queue.slice(0)
        // Clear queue here to prevent
        // callbacks from appending listeners
        // to the current frame's queue
        queue.length = 0
        for(var i = 0; i < cp.length; i++) {
          if(!cp[i].cancelled) {
            try{
              cp[i].callback(last)
            } catch(e) {
              setTimeout(function() { throw e }, 0)
            }
          }
        }
      }, Math.round(next))
    }
    queue.push({
      handle: ++id,
      callback: callback,
      cancelled: false
    })
    return id
  }

  caf = function(handle) {
    for(var i = 0; i < queue.length; i++) {
      if(queue[i].handle === handle) {
        queue[i].cancelled = true
      }
    }
  }
}

module.exports = function(fn) {
  // Wrap in a new function to prevent
  // `cancel` potentially being assigned
  // to the native rAF function
  if(!isNative) {
    return raf.call(global, fn)
  }
  return raf.call(global, function() {
    try{
      fn.apply(this, arguments)
    } catch(e) {
      setTimeout(function() { throw e }, 0)
    }
  })
}
module.exports.cancel = function() {
  caf.apply(global, arguments)
}

},{"performance-now":85}],88:[function(require,module,exports){
(function (process){
module.exports = function (tasks, cb) {
  var results, pending, keys
  var isSync = true

  if (Array.isArray(tasks)) {
    results = []
    pending = tasks.length
  } else {
    keys = Object.keys(tasks)
    results = {}
    pending = keys.length
  }

  function done (err) {
    function end () {
      if (cb) cb(err, results)
      cb = null
    }
    if (isSync) process.nextTick(end)
    else end()
  }

  function each (i, err, result) {
    results[i] = result
    if (--pending === 0 || err) {
      done(err)
    }
  }

  if (!pending) {
    // empty
    done(null)
  } else if (keys) {
    // object
    keys.forEach(function (key) {
      tasks[key](each.bind(undefined, key))
    })
  } else {
    // array
    tasks.forEach(function (task, i) {
      task(each.bind(undefined, i))
    })
  }

  isSync = false
}

}).call(this,require('_process'))

},{"_process":86}],89:[function(require,module,exports){
var nargs = /\{([0-9a-zA-Z]+)\}/g
var slice = Array.prototype.slice

module.exports = template

function template(string) {
    var args

    if (arguments.length === 2 && typeof arguments[1] === "object") {
        args = arguments[1]
    } else {
        args = slice.call(arguments, 1)
    }

    if (!args || !args.hasOwnProperty) {
        args = {}
    }

    return string.replace(nargs, function replaceArg(match, i, index) {
        var result

        if (string[index - 1] === "{" &&
            string[index + match.length] === "}") {
            return i
        } else {
            result = args.hasOwnProperty(i) ? args[i] : null
            if (result === null || result === undefined) {
                return ""
            }

            return result
        }
    })
}

},{}],90:[function(require,module,exports){
/*!
* vdom-virtualize
* Copyright 2014 by Marcel Klehr <mklehr@gmx.net>
*
* (MIT LICENSE)
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*/
var VNode = require("virtual-dom/vnode/vnode")
  , VText = require("virtual-dom/vnode/vtext")
  , VComment = require("./vcomment")

module.exports = createVNode

function createVNode(domNode, key) {
  key = key || null // XXX: Leave out `key` for now... merely used for (re-)ordering

  if(domNode.nodeType == 1) return createFromElement(domNode, key)
  if(domNode.nodeType == 3) return createFromTextNode(domNode, key)
  if(domNode.nodeType == 8) return createFromCommentNode(domNode, key)
  return
}

createVNode.fromHTML = function(html, key) {
  var rootNode = null;

  try {
    // Everything except iOS 7 Safari, IE 8/9, Andriod Browser 4.1/4.3
    var parser = new DOMParser();
    var doc = parser.parseFromString(html, 'text/html');
    rootNode = doc.documentElement;
  } catch(e) {
    // Old browsers
    var ifr = document.createElement('iframe');
    ifr.setAttribute('data-content', html);
    ifr.src = 'javascript: window.frameElement.getAttribute("data-content");';
    document.head.appendChild(ifr);
    rootNode = ifr.contentDocument.documentElement;
    setTimeout(function() {
      ifr.remove(); // Garbage collection
    }, 0);
  }

  return createVNode(rootNode, key);
};

function createFromTextNode(tNode) {
  return new VText(tNode.nodeValue)
}


function createFromCommentNode(cNode) {
  return new VComment(cNode.nodeValue)
}


function createFromElement(el) {
  var tagName = el.tagName
  , namespace = el.namespaceURI == 'http://www.w3.org/1999/xhtml'? null : el.namespaceURI
  , properties = getElementProperties(el)
  , children = []

  for (var i = 0; i < el.childNodes.length; i++) {
    children.push(createVNode(el.childNodes[i]/*, i*/))
  }

  return new VNode(tagName, properties, children, null, namespace)
}


function getElementProperties(el) {
  var obj = {}

  props.forEach(function(propName) {
    if(!el[propName]) return

    // Special case: style
    // .style is a DOMStyleDeclaration, thus we need to iterate over all
    // rules to create a hash of applied css properties.
    //
    // You can directly set a specific .style[prop] = value so patching with vdom
    // is possible.
    if("style" == propName) {
      var css = {}
        , styleProp
      if (el.style.length) {
        for(var i=0; i<el.style.length; i++) {
          styleProp = el.style[i]
          css[styleProp] = el.style.getPropertyValue(styleProp) // XXX: add support for "!important" via getPropertyPriority()!
        }
      } else { // IE8
        for (var styleProp in el.style) {
          if (el.style[styleProp] && el.style.hasOwnProperty(styleProp)) {
            css[styleProp] = el.style[styleProp];
          }
        }
      }

      obj[propName] = css
      return
    }

    // https://msdn.microsoft.com/en-us/library/cc848861%28v=vs.85%29.aspx
    // The img element does not support the HREF content attribute.
    // In addition, the href property is read-only for the img Document Object Model (DOM) object
    if (el.tagName.toLowerCase() === 'img' && propName === 'href') {
      return;
    }

    // Special case: dataset
    // we can iterate over .dataset with a simple for..in loop.
    // The all-time foo with data-* attribs is the dash-snake to camelCase
    // conversion.
    //
    // *This is compatible with h(), but not with every browser, thus this section was removed in favor
    // of attributes (specified below)!*
    //
    // .dataset properties are directly accessible as transparent getters/setters, so
    // patching with vdom is possible.
    /*if("dataset" == propName) {
      var data = {}
      for(var p in el.dataset) {
        data[p] = el.dataset[p]
      }
      obj[propName] = data
      return
    }*/

    // Special case: attributes
    // these are a NamedNodeMap, but we can just convert them to a hash for vdom,
    // because of https://github.com/Matt-Esch/virtual-dom/blob/master/vdom/apply-properties.js#L57
    if("attributes" == propName){
      var atts = Array.prototype.slice.call(el[propName]);
      var hash = atts.reduce(function(o,a){
        var name = a.name;
        if(obj[name]) return o;
        o[name] = el.getAttribute(a.name);
        return o;
      },{});
      return obj[propName] = hash;
    }
    if("tabIndex" == propName && el.tabIndex === -1) return

    // Special case: contentEditable
    // browser use 'inherit' by default on all nodes, but does not allow setting it to ''
    // diffing virtualize dom will trigger error
    // ref: https://github.com/Matt-Esch/virtual-dom/issues/176
    if("contentEditable" == propName && el[propName] === 'inherit') return

    if('object' === typeof el[propName]) return

    // default: just copy the property
    obj[propName] = el[propName]
    return
  })

  return obj
}

/**
 * DOMNode property white list
 * Taken from https://github.com/Raynos/react/blob/dom-property-config/src/browser/ui/dom/DefaultDOMPropertyConfig.js
 */
var props =

module.exports.properties = [
 "accept"
,"accessKey"
,"action"
,"alt"
,"async"
,"autoComplete"
,"autoPlay"
,"cellPadding"
,"cellSpacing"
,"checked"
,"className"
,"colSpan"
,"content"
,"contentEditable"
,"controls"
,"crossOrigin"
,"data"
//,"dataset" removed since attributes handles data-attributes
,"defer"
,"dir"
,"download"
,"draggable"
,"encType"
,"formNoValidate"
,"href"
,"hrefLang"
,"htmlFor"
,"httpEquiv"
,"icon"
,"id"
,"label"
,"lang"
,"list"
,"loop"
,"max"
,"mediaGroup"
,"method"
,"min"
,"multiple"
,"muted"
,"name"
,"noValidate"
,"pattern"
,"placeholder"
,"poster"
,"preload"
,"radioGroup"
,"readOnly"
,"rel"
,"required"
,"rowSpan"
,"sandbox"
,"scope"
,"scrollLeft"
,"scrolling"
,"scrollTop"
,"selected"
,"span"
,"spellCheck"
,"src"
,"srcDoc"
,"srcSet"
,"start"
,"step"
,"style"
,"tabIndex"
,"target"
,"title"
,"type"
,"value"

// Non-standard Properties
,"autoCapitalize"
,"autoCorrect"
,"property"

, "attributes"
]

var attrs =
module.exports.attrs = [
 "allowFullScreen"
,"allowTransparency"
,"charSet"
,"cols"
,"contextMenu"
,"dateTime"
,"disabled"
,"form"
,"frameBorder"
,"height"
,"hidden"
,"maxLength"
,"role"
,"rows"
,"seamless"
,"size"
,"width"
,"wmode"

// SVG Properties
,"cx"
,"cy"
,"d"
,"dx"
,"dy"
,"fill"
,"fx"
,"fy"
,"gradientTransform"
,"gradientUnits"
,"offset"
,"points"
,"r"
,"rx"
,"ry"
,"spreadMethod"
,"stopColor"
,"stopOpacity"
,"stroke"
,"strokeLinecap"
,"strokeWidth"
,"textAnchor"
,"transform"
,"version"
,"viewBox"
,"x1"
,"x2"
,"x"
,"y1"
,"y2"
,"y"
]

},{"./vcomment":91,"virtual-dom/vnode/vnode":113,"virtual-dom/vnode/vtext":115}],91:[function(require,module,exports){
module.exports = VirtualComment

function VirtualComment(text) {
  this.text = String(text)
}

VirtualComment.prototype.type = 'Widget'

VirtualComment.prototype.init = function() {
  return document.createComment(this.text)
}

VirtualComment.prototype.update = function(previous, domNode) {
  if(this.text === previous.text) return
  domNode.nodeValue = this.text
}

},{}],92:[function(require,module,exports){
var createElement = require("./vdom/create-element.js")

module.exports = createElement

},{"./vdom/create-element.js":97}],93:[function(require,module,exports){
var diff = require("./vtree/diff.js")

module.exports = diff

},{"./vtree/diff.js":117}],94:[function(require,module,exports){
var h = require("./virtual-hyperscript/index.js")

module.exports = h

},{"./virtual-hyperscript/index.js":104}],95:[function(require,module,exports){
var patch = require("./vdom/patch.js")

module.exports = patch

},{"./vdom/patch.js":100}],96:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook.js")

module.exports = applyProperties

function applyProperties(node, props, previous) {
    for (var propName in props) {
        var propValue = props[propName]

        if (propValue === undefined) {
            removeProperty(node, propName, propValue, previous);
        } else if (isHook(propValue)) {
            removeProperty(node, propName, propValue, previous)
            if (propValue.hook) {
                propValue.hook(node,
                    propName,
                    previous ? previous[propName] : undefined)
            }
        } else {
            if (isObject(propValue)) {
                patchObject(node, props, previous, propName, propValue);
            } else {
                node[propName] = propValue
            }
        }
    }
}

function removeProperty(node, propName, propValue, previous) {
    if (previous) {
        var previousValue = previous[propName]

        if (!isHook(previousValue)) {
            if (propName === "attributes") {
                for (var attrName in previousValue) {
                    node.removeAttribute(attrName)
                }
            } else if (propName === "style") {
                for (var i in previousValue) {
                    node.style[i] = ""
                }
            } else if (typeof previousValue === "string") {
                node[propName] = ""
            } else {
                node[propName] = null
            }
        } else if (previousValue.unhook) {
            previousValue.unhook(node, propName, propValue)
        }
    }
}

function patchObject(node, props, previous, propName, propValue) {
    var previousValue = previous ? previous[propName] : undefined

    // Set attributes
    if (propName === "attributes") {
        for (var attrName in propValue) {
            var attrValue = propValue[attrName]

            if (attrValue === undefined) {
                node.removeAttribute(attrName)
            } else {
                node.setAttribute(attrName, attrValue)
            }
        }

        return
    }

    if(previousValue && isObject(previousValue) &&
        getPrototype(previousValue) !== getPrototype(propValue)) {
        node[propName] = propValue
        return
    }

    if (!isObject(node[propName])) {
        node[propName] = {}
    }

    var replacer = propName === "style" ? "" : undefined

    for (var k in propValue) {
        var value = propValue[k]
        node[propName][k] = (value === undefined) ? replacer : value
    }
}

function getPrototype(value) {
    if (Object.getPrototypeOf) {
        return Object.getPrototypeOf(value)
    } else if (value.__proto__) {
        return value.__proto__
    } else if (value.constructor) {
        return value.constructor.prototype
    }
}

},{"../vnode/is-vhook.js":108,"is-object":22}],97:[function(require,module,exports){
var document = require("global/document")

var applyProperties = require("./apply-properties")

var isVNode = require("../vnode/is-vnode.js")
var isVText = require("../vnode/is-vtext.js")
var isWidget = require("../vnode/is-widget.js")
var handleThunk = require("../vnode/handle-thunk.js")

module.exports = createElement

function createElement(vnode, opts) {
    var doc = opts ? opts.document || document : document
    var warn = opts ? opts.warn : null

    vnode = handleThunk(vnode).a

    if (isWidget(vnode)) {
        return vnode.init()
    } else if (isVText(vnode)) {
        return doc.createTextNode(vnode.text)
    } else if (!isVNode(vnode)) {
        if (warn) {
            warn("Item is not a valid virtual dom node", vnode)
        }
        return null
    }

    var node = (vnode.namespace === null) ?
        doc.createElement(vnode.tagName) :
        doc.createElementNS(vnode.namespace, vnode.tagName)

    var props = vnode.properties
    applyProperties(node, props)

    var children = vnode.children

    for (var i = 0; i < children.length; i++) {
        var childNode = createElement(children[i], opts)
        if (childNode) {
            node.appendChild(childNode)
        }
    }

    return node
}

},{"../vnode/handle-thunk.js":106,"../vnode/is-vnode.js":109,"../vnode/is-vtext.js":110,"../vnode/is-widget.js":111,"./apply-properties":96,"global/document":19}],98:[function(require,module,exports){
// Maps a virtual DOM tree onto a real DOM tree in an efficient manner.
// We don't want to read all of the DOM nodes in the tree so we use
// the in-order tree indexing to eliminate recursion down certain branches.
// We only recurse into a DOM node if we know that it contains a child of
// interest.

var noChild = {}

module.exports = domIndex

function domIndex(rootNode, tree, indices, nodes) {
    if (!indices || indices.length === 0) {
        return {}
    } else {
        indices.sort(ascending)
        return recurse(rootNode, tree, indices, nodes, 0)
    }
}

function recurse(rootNode, tree, indices, nodes, rootIndex) {
    nodes = nodes || {}


    if (rootNode) {
        if (indexInRange(indices, rootIndex, rootIndex)) {
            nodes[rootIndex] = rootNode
        }

        var vChildren = tree.children

        if (vChildren) {

            var childNodes = rootNode.childNodes

            for (var i = 0; i < tree.children.length; i++) {
                rootIndex += 1

                var vChild = vChildren[i] || noChild
                var nextIndex = rootIndex + (vChild.count || 0)

                // skip recursion down the tree if there are no nodes down here
                if (indexInRange(indices, rootIndex, nextIndex)) {
                    recurse(childNodes[i], vChild, indices, nodes, rootIndex)
                }

                rootIndex = nextIndex
            }
        }
    }

    return nodes
}

// Binary search for an index in the interval [left, right]
function indexInRange(indices, left, right) {
    if (indices.length === 0) {
        return false
    }

    var minIndex = 0
    var maxIndex = indices.length - 1
    var currentIndex
    var currentItem

    while (minIndex <= maxIndex) {
        currentIndex = ((maxIndex + minIndex) / 2) >> 0
        currentItem = indices[currentIndex]

        if (minIndex === maxIndex) {
            return currentItem >= left && currentItem <= right
        } else if (currentItem < left) {
            minIndex = currentIndex + 1
        } else  if (currentItem > right) {
            maxIndex = currentIndex - 1
        } else {
            return true
        }
    }

    return false;
}

function ascending(a, b) {
    return a > b ? 1 : -1
}

},{}],99:[function(require,module,exports){
var applyProperties = require("./apply-properties")

var isWidget = require("../vnode/is-widget.js")
var VPatch = require("../vnode/vpatch.js")

var updateWidget = require("./update-widget")

module.exports = applyPatch

function applyPatch(vpatch, domNode, renderOptions) {
    var type = vpatch.type
    var vNode = vpatch.vNode
    var patch = vpatch.patch

    switch (type) {
        case VPatch.REMOVE:
            return removeNode(domNode, vNode)
        case VPatch.INSERT:
            return insertNode(domNode, patch, renderOptions)
        case VPatch.VTEXT:
            return stringPatch(domNode, vNode, patch, renderOptions)
        case VPatch.WIDGET:
            return widgetPatch(domNode, vNode, patch, renderOptions)
        case VPatch.VNODE:
            return vNodePatch(domNode, vNode, patch, renderOptions)
        case VPatch.ORDER:
            reorderChildren(domNode, patch)
            return domNode
        case VPatch.PROPS:
            applyProperties(domNode, patch, vNode.properties)
            return domNode
        case VPatch.THUNK:
            return replaceRoot(domNode,
                renderOptions.patch(domNode, patch, renderOptions))
        default:
            return domNode
    }
}

function removeNode(domNode, vNode) {
    var parentNode = domNode.parentNode

    if (parentNode) {
        parentNode.removeChild(domNode)
    }

    destroyWidget(domNode, vNode);

    return null
}

function insertNode(parentNode, vNode, renderOptions) {
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode) {
        parentNode.appendChild(newNode)
    }

    return parentNode
}

function stringPatch(domNode, leftVNode, vText, renderOptions) {
    var newNode

    if (domNode.nodeType === 3) {
        domNode.replaceData(0, domNode.length, vText.text)
        newNode = domNode
    } else {
        var parentNode = domNode.parentNode
        newNode = renderOptions.render(vText, renderOptions)

        if (parentNode && newNode !== domNode) {
            parentNode.replaceChild(newNode, domNode)
        }
    }

    return newNode
}

function widgetPatch(domNode, leftVNode, widget, renderOptions) {
    var updating = updateWidget(leftVNode, widget)
    var newNode

    if (updating) {
        newNode = widget.update(leftVNode, domNode) || domNode
    } else {
        newNode = renderOptions.render(widget, renderOptions)
    }

    var parentNode = domNode.parentNode

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    if (!updating) {
        destroyWidget(domNode, leftVNode)
    }

    return newNode
}

function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
    var parentNode = domNode.parentNode
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    return newNode
}

function destroyWidget(domNode, w) {
    if (typeof w.destroy === "function" && isWidget(w)) {
        w.destroy(domNode)
    }
}

function reorderChildren(domNode, moves) {
    var childNodes = domNode.childNodes
    var keyMap = {}
    var node
    var remove
    var insert

    for (var i = 0; i < moves.removes.length; i++) {
        remove = moves.removes[i]
        node = childNodes[remove.from]
        if (remove.key) {
            keyMap[remove.key] = node
        }
        domNode.removeChild(node)
    }

    var length = childNodes.length
    for (var j = 0; j < moves.inserts.length; j++) {
        insert = moves.inserts[j]
        node = keyMap[insert.key]
        // this is the weirdest bug i've ever seen in webkit
        domNode.insertBefore(node, insert.to >= length++ ? null : childNodes[insert.to])
    }
}

function replaceRoot(oldRoot, newRoot) {
    if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
        oldRoot.parentNode.replaceChild(newRoot, oldRoot)
    }

    return newRoot;
}

},{"../vnode/is-widget.js":111,"../vnode/vpatch.js":114,"./apply-properties":96,"./update-widget":101}],100:[function(require,module,exports){
var document = require("global/document")
var isArray = require("x-is-array")

var render = require("./create-element")
var domIndex = require("./dom-index")
var patchOp = require("./patch-op")
module.exports = patch

function patch(rootNode, patches, renderOptions) {
    renderOptions = renderOptions || {}
    renderOptions.patch = renderOptions.patch && renderOptions.patch !== patch
        ? renderOptions.patch
        : patchRecursive
    renderOptions.render = renderOptions.render || render

    return renderOptions.patch(rootNode, patches, renderOptions)
}

function patchRecursive(rootNode, patches, renderOptions) {
    var indices = patchIndices(patches)

    if (indices.length === 0) {
        return rootNode
    }

    var index = domIndex(rootNode, patches.a, indices)
    var ownerDocument = rootNode.ownerDocument

    if (!renderOptions.document && ownerDocument !== document) {
        renderOptions.document = ownerDocument
    }

    for (var i = 0; i < indices.length; i++) {
        var nodeIndex = indices[i]
        rootNode = applyPatch(rootNode,
            index[nodeIndex],
            patches[nodeIndex],
            renderOptions)
    }

    return rootNode
}

function applyPatch(rootNode, domNode, patchList, renderOptions) {
    if (!domNode) {
        return rootNode
    }

    var newNode

    if (isArray(patchList)) {
        for (var i = 0; i < patchList.length; i++) {
            newNode = patchOp(patchList[i], domNode, renderOptions)

            if (domNode === rootNode) {
                rootNode = newNode
            }
        }
    } else {
        newNode = patchOp(patchList, domNode, renderOptions)

        if (domNode === rootNode) {
            rootNode = newNode
        }
    }

    return rootNode
}

function patchIndices(patches) {
    var indices = []

    for (var key in patches) {
        if (key !== "a") {
            indices.push(Number(key))
        }
    }

    return indices
}

},{"./create-element":97,"./dom-index":98,"./patch-op":99,"global/document":19,"x-is-array":120}],101:[function(require,module,exports){
var isWidget = require("../vnode/is-widget.js")

module.exports = updateWidget

function updateWidget(a, b) {
    if (isWidget(a) && isWidget(b)) {
        if ("name" in a && "name" in b) {
            return a.id === b.id
        } else {
            return a.init === b.init
        }
    }

    return false
}

},{"../vnode/is-widget.js":111}],102:[function(require,module,exports){
'use strict';

var EvStore = require('ev-store');

module.exports = EvHook;

function EvHook(value) {
    if (!(this instanceof EvHook)) {
        return new EvHook(value);
    }

    this.value = value;
}

EvHook.prototype.hook = function (node, propertyName) {
    var es = EvStore(node);
    var propName = propertyName.substr(3);

    es[propName] = this.value;
};

EvHook.prototype.unhook = function(node, propertyName) {
    var es = EvStore(node);
    var propName = propertyName.substr(3);

    es[propName] = undefined;
};

},{"ev-store":15}],103:[function(require,module,exports){
'use strict';

module.exports = SoftSetHook;

function SoftSetHook(value) {
    if (!(this instanceof SoftSetHook)) {
        return new SoftSetHook(value);
    }

    this.value = value;
}

SoftSetHook.prototype.hook = function (node, propertyName) {
    if (node[propertyName] !== this.value) {
        node[propertyName] = this.value;
    }
};

},{}],104:[function(require,module,exports){
'use strict';

var isArray = require('x-is-array');

var VNode = require('../vnode/vnode.js');
var VText = require('../vnode/vtext.js');
var isVNode = require('../vnode/is-vnode');
var isVText = require('../vnode/is-vtext');
var isWidget = require('../vnode/is-widget');
var isHook = require('../vnode/is-vhook');
var isVThunk = require('../vnode/is-thunk');

var parseTag = require('./parse-tag.js');
var softSetHook = require('./hooks/soft-set-hook.js');
var evHook = require('./hooks/ev-hook.js');

module.exports = h;

function h(tagName, properties, children) {
    var childNodes = [];
    var tag, props, key, namespace;

    if (!children && isChildren(properties)) {
        children = properties;
        props = {};
    }

    props = props || properties || {};
    tag = parseTag(tagName, props);

    // support keys
    if (props.hasOwnProperty('key')) {
        key = props.key;
        props.key = undefined;
    }

    // support namespace
    if (props.hasOwnProperty('namespace')) {
        namespace = props.namespace;
        props.namespace = undefined;
    }

    // fix cursor bug
    if (tag === 'INPUT' &&
        !namespace &&
        props.hasOwnProperty('value') &&
        props.value !== undefined &&
        !isHook(props.value)
    ) {
        props.value = softSetHook(props.value);
    }

    transformProperties(props);

    if (children !== undefined && children !== null) {
        addChild(children, childNodes, tag, props);
    }


    return new VNode(tag, props, childNodes, key, namespace);
}

function addChild(c, childNodes, tag, props) {
    if (typeof c === 'string') {
        childNodes.push(new VText(c));
    } else if (typeof c === 'number') {
        childNodes.push(new VText(String(c)));
    } else if (isChild(c)) {
        childNodes.push(c);
    } else if (isArray(c)) {
        for (var i = 0; i < c.length; i++) {
            addChild(c[i], childNodes, tag, props);
        }
    } else if (c === null || c === undefined) {
        return;
    } else {
        throw UnexpectedVirtualElement({
            foreignObject: c,
            parentVnode: {
                tagName: tag,
                properties: props
            }
        });
    }
}

function transformProperties(props) {
    for (var propName in props) {
        if (props.hasOwnProperty(propName)) {
            var value = props[propName];

            if (isHook(value)) {
                continue;
            }

            if (propName.substr(0, 3) === 'ev-') {
                // add ev-foo support
                props[propName] = evHook(value);
            }
        }
    }
}

function isChild(x) {
    return isVNode(x) || isVText(x) || isWidget(x) || isVThunk(x);
}

function isChildren(x) {
    return typeof x === 'string' || isArray(x) || isChild(x);
}

function UnexpectedVirtualElement(data) {
    var err = new Error();

    err.type = 'virtual-hyperscript.unexpected.virtual-element';
    err.message = 'Unexpected virtual child passed to h().\n' +
        'Expected a VNode / Vthunk / VWidget / string but:\n' +
        'got:\n' +
        errorString(data.foreignObject) +
        '.\n' +
        'The parent vnode is:\n' +
        errorString(data.parentVnode)
        '\n' +
        'Suggested fix: change your `h(..., [ ... ])` callsite.';
    err.foreignObject = data.foreignObject;
    err.parentVnode = data.parentVnode;

    return err;
}

function errorString(obj) {
    try {
        return JSON.stringify(obj, null, '    ');
    } catch (e) {
        return String(obj);
    }
}

},{"../vnode/is-thunk":107,"../vnode/is-vhook":108,"../vnode/is-vnode":109,"../vnode/is-vtext":110,"../vnode/is-widget":111,"../vnode/vnode.js":113,"../vnode/vtext.js":115,"./hooks/ev-hook.js":102,"./hooks/soft-set-hook.js":103,"./parse-tag.js":105,"x-is-array":120}],105:[function(require,module,exports){
'use strict';

var split = require('browser-split');

var classIdSplit = /([\.#]?[a-zA-Z0-9\u007F-\uFFFF_:-]+)/;
var notClassId = /^\.|#/;

module.exports = parseTag;

function parseTag(tag, props) {
    if (!tag) {
        return 'DIV';
    }

    var noId = !(props.hasOwnProperty('id'));

    var tagParts = split(tag, classIdSplit);
    var tagName = null;

    if (notClassId.test(tagParts[1])) {
        tagName = 'DIV';
    }

    var classes, part, type, i;

    for (i = 0; i < tagParts.length; i++) {
        part = tagParts[i];

        if (!part) {
            continue;
        }

        type = part.charAt(0);

        if (!tagName) {
            tagName = part;
        } else if (type === '.') {
            classes = classes || [];
            classes.push(part.substring(1, part.length));
        } else if (type === '#' && noId) {
            props.id = part.substring(1, part.length);
        }
    }

    if (classes) {
        if (props.className) {
            classes.push(props.className);
        }

        props.className = classes.join(' ');
    }

    return props.namespace ? tagName : tagName.toUpperCase();
}

},{"browser-split":4}],106:[function(require,module,exports){
var isVNode = require("./is-vnode")
var isVText = require("./is-vtext")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")

module.exports = handleThunk

function handleThunk(a, b) {
    var renderedA = a
    var renderedB = b

    if (isThunk(b)) {
        renderedB = renderThunk(b, a)
    }

    if (isThunk(a)) {
        renderedA = renderThunk(a, null)
    }

    return {
        a: renderedA,
        b: renderedB
    }
}

function renderThunk(thunk, previous) {
    var renderedThunk = thunk.vnode

    if (!renderedThunk) {
        renderedThunk = thunk.vnode = thunk.render(previous)
    }

    if (!(isVNode(renderedThunk) ||
            isVText(renderedThunk) ||
            isWidget(renderedThunk))) {
        throw new Error("thunk did not return a valid node");
    }

    return renderedThunk
}

},{"./is-thunk":107,"./is-vnode":109,"./is-vtext":110,"./is-widget":111}],107:[function(require,module,exports){
module.exports = isThunk

function isThunk(t) {
    return t && t.type === "Thunk"
}

},{}],108:[function(require,module,exports){
module.exports = isHook

function isHook(hook) {
    return hook &&
      (typeof hook.hook === "function" && !hook.hasOwnProperty("hook") ||
       typeof hook.unhook === "function" && !hook.hasOwnProperty("unhook"))
}

},{}],109:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualNode

function isVirtualNode(x) {
    return x && x.type === "VirtualNode" && x.version === version
}

},{"./version":112}],110:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualText

function isVirtualText(x) {
    return x && x.type === "VirtualText" && x.version === version
}

},{"./version":112}],111:[function(require,module,exports){
module.exports = isWidget

function isWidget(w) {
    return w && w.type === "Widget"
}

},{}],112:[function(require,module,exports){
module.exports = "2"

},{}],113:[function(require,module,exports){
var version = require("./version")
var isVNode = require("./is-vnode")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")
var isVHook = require("./is-vhook")

module.exports = VirtualNode

var noProperties = {}
var noChildren = []

function VirtualNode(tagName, properties, children, key, namespace) {
    this.tagName = tagName
    this.properties = properties || noProperties
    this.children = children || noChildren
    this.key = key != null ? String(key) : undefined
    this.namespace = (typeof namespace === "string") ? namespace : null

    var count = (children && children.length) || 0
    var descendants = 0
    var hasWidgets = false
    var hasThunks = false
    var descendantHooks = false
    var hooks

    for (var propName in properties) {
        if (properties.hasOwnProperty(propName)) {
            var property = properties[propName]
            if (isVHook(property) && property.unhook) {
                if (!hooks) {
                    hooks = {}
                }

                hooks[propName] = property
            }
        }
    }

    for (var i = 0; i < count; i++) {
        var child = children[i]
        if (isVNode(child)) {
            descendants += child.count || 0

            if (!hasWidgets && child.hasWidgets) {
                hasWidgets = true
            }

            if (!hasThunks && child.hasThunks) {
                hasThunks = true
            }

            if (!descendantHooks && (child.hooks || child.descendantHooks)) {
                descendantHooks = true
            }
        } else if (!hasWidgets && isWidget(child)) {
            if (typeof child.destroy === "function") {
                hasWidgets = true
            }
        } else if (!hasThunks && isThunk(child)) {
            hasThunks = true;
        }
    }

    this.count = count + descendants
    this.hasWidgets = hasWidgets
    this.hasThunks = hasThunks
    this.hooks = hooks
    this.descendantHooks = descendantHooks
}

VirtualNode.prototype.version = version
VirtualNode.prototype.type = "VirtualNode"

},{"./is-thunk":107,"./is-vhook":108,"./is-vnode":109,"./is-widget":111,"./version":112}],114:[function(require,module,exports){
var version = require("./version")

VirtualPatch.NONE = 0
VirtualPatch.VTEXT = 1
VirtualPatch.VNODE = 2
VirtualPatch.WIDGET = 3
VirtualPatch.PROPS = 4
VirtualPatch.ORDER = 5
VirtualPatch.INSERT = 6
VirtualPatch.REMOVE = 7
VirtualPatch.THUNK = 8

module.exports = VirtualPatch

function VirtualPatch(type, vNode, patch) {
    this.type = Number(type)
    this.vNode = vNode
    this.patch = patch
}

VirtualPatch.prototype.version = version
VirtualPatch.prototype.type = "VirtualPatch"

},{"./version":112}],115:[function(require,module,exports){
var version = require("./version")

module.exports = VirtualText

function VirtualText(text) {
    this.text = String(text)
}

VirtualText.prototype.version = version
VirtualText.prototype.type = "VirtualText"

},{"./version":112}],116:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook")

module.exports = diffProps

function diffProps(a, b) {
    var diff

    for (var aKey in a) {
        if (!(aKey in b)) {
            diff = diff || {}
            diff[aKey] = undefined
        }

        var aValue = a[aKey]
        var bValue = b[aKey]

        if (aValue === bValue) {
            continue
        } else if (isObject(aValue) && isObject(bValue)) {
            if (getPrototype(bValue) !== getPrototype(aValue)) {
                diff = diff || {}
                diff[aKey] = bValue
            } else if (isHook(bValue)) {
                 diff = diff || {}
                 diff[aKey] = bValue
            } else {
                var objectDiff = diffProps(aValue, bValue)
                if (objectDiff) {
                    diff = diff || {}
                    diff[aKey] = objectDiff
                }
            }
        } else {
            diff = diff || {}
            diff[aKey] = bValue
        }
    }

    for (var bKey in b) {
        if (!(bKey in a)) {
            diff = diff || {}
            diff[bKey] = b[bKey]
        }
    }

    return diff
}

function getPrototype(value) {
  if (Object.getPrototypeOf) {
    return Object.getPrototypeOf(value)
  } else if (value.__proto__) {
    return value.__proto__
  } else if (value.constructor) {
    return value.constructor.prototype
  }
}

},{"../vnode/is-vhook":108,"is-object":22}],117:[function(require,module,exports){
var isArray = require("x-is-array")

var VPatch = require("../vnode/vpatch")
var isVNode = require("../vnode/is-vnode")
var isVText = require("../vnode/is-vtext")
var isWidget = require("../vnode/is-widget")
var isThunk = require("../vnode/is-thunk")
var handleThunk = require("../vnode/handle-thunk")

var diffProps = require("./diff-props")

module.exports = diff

function diff(a, b) {
    var patch = { a: a }
    walk(a, b, patch, 0)
    return patch
}

function walk(a, b, patch, index) {
    if (a === b) {
        return
    }

    var apply = patch[index]
    var applyClear = false

    if (isThunk(a) || isThunk(b)) {
        thunks(a, b, patch, index)
    } else if (b == null) {

        // If a is a widget we will add a remove patch for it
        // Otherwise any child widgets/hooks must be destroyed.
        // This prevents adding two remove patches for a widget.
        if (!isWidget(a)) {
            clearState(a, patch, index)
            apply = patch[index]
        }

        apply = appendPatch(apply, new VPatch(VPatch.REMOVE, a, b))
    } else if (isVNode(b)) {
        if (isVNode(a)) {
            if (a.tagName === b.tagName &&
                a.namespace === b.namespace &&
                a.key === b.key) {
                var propsPatch = diffProps(a.properties, b.properties)
                if (propsPatch) {
                    apply = appendPatch(apply,
                        new VPatch(VPatch.PROPS, a, propsPatch))
                }
                apply = diffChildren(a, b, patch, apply, index)
            } else {
                apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
                applyClear = true
            }
        } else {
            apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
            applyClear = true
        }
    } else if (isVText(b)) {
        if (!isVText(a)) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
            applyClear = true
        } else if (a.text !== b.text) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
        }
    } else if (isWidget(b)) {
        if (!isWidget(a)) {
            applyClear = true
        }

        apply = appendPatch(apply, new VPatch(VPatch.WIDGET, a, b))
    }

    if (apply) {
        patch[index] = apply
    }

    if (applyClear) {
        clearState(a, patch, index)
    }
}

function diffChildren(a, b, patch, apply, index) {
    var aChildren = a.children
    var orderedSet = reorder(aChildren, b.children)
    var bChildren = orderedSet.children

    var aLen = aChildren.length
    var bLen = bChildren.length
    var len = aLen > bLen ? aLen : bLen

    for (var i = 0; i < len; i++) {
        var leftNode = aChildren[i]
        var rightNode = bChildren[i]
        index += 1

        if (!leftNode) {
            if (rightNode) {
                // Excess nodes in b need to be added
                apply = appendPatch(apply,
                    new VPatch(VPatch.INSERT, null, rightNode))
            }
        } else {
            walk(leftNode, rightNode, patch, index)
        }

        if (isVNode(leftNode) && leftNode.count) {
            index += leftNode.count
        }
    }

    if (orderedSet.moves) {
        // Reorder nodes last
        apply = appendPatch(apply, new VPatch(
            VPatch.ORDER,
            a,
            orderedSet.moves
        ))
    }

    return apply
}

function clearState(vNode, patch, index) {
    // TODO: Make this a single walk, not two
    unhook(vNode, patch, index)
    destroyWidgets(vNode, patch, index)
}

// Patch records for all destroyed widgets must be added because we need
// a DOM node reference for the destroy function
function destroyWidgets(vNode, patch, index) {
    if (isWidget(vNode)) {
        if (typeof vNode.destroy === "function") {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(VPatch.REMOVE, vNode, null)
            )
        }
    } else if (isVNode(vNode) && (vNode.hasWidgets || vNode.hasThunks)) {
        var children = vNode.children
        var len = children.length
        for (var i = 0; i < len; i++) {
            var child = children[i]
            index += 1

            destroyWidgets(child, patch, index)

            if (isVNode(child) && child.count) {
                index += child.count
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

// Create a sub-patch for thunks
function thunks(a, b, patch, index) {
    var nodes = handleThunk(a, b)
    var thunkPatch = diff(nodes.a, nodes.b)
    if (hasPatches(thunkPatch)) {
        patch[index] = new VPatch(VPatch.THUNK, null, thunkPatch)
    }
}

function hasPatches(patch) {
    for (var index in patch) {
        if (index !== "a") {
            return true
        }
    }

    return false
}

// Execute hooks when two nodes are identical
function unhook(vNode, patch, index) {
    if (isVNode(vNode)) {
        if (vNode.hooks) {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(
                    VPatch.PROPS,
                    vNode,
                    undefinedKeys(vNode.hooks)
                )
            )
        }

        if (vNode.descendantHooks || vNode.hasThunks) {
            var children = vNode.children
            var len = children.length
            for (var i = 0; i < len; i++) {
                var child = children[i]
                index += 1

                unhook(child, patch, index)

                if (isVNode(child) && child.count) {
                    index += child.count
                }
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

function undefinedKeys(obj) {
    var result = {}

    for (var key in obj) {
        result[key] = undefined
    }

    return result
}

// List diff, naive left to right reordering
function reorder(aChildren, bChildren) {
    // O(M) time, O(M) memory
    var bChildIndex = keyIndex(bChildren)
    var bKeys = bChildIndex.keys
    var bFree = bChildIndex.free

    if (bFree.length === bChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(N) time, O(N) memory
    var aChildIndex = keyIndex(aChildren)
    var aKeys = aChildIndex.keys
    var aFree = aChildIndex.free

    if (aFree.length === aChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(MAX(N, M)) memory
    var newChildren = []

    var freeIndex = 0
    var freeCount = bFree.length
    var deletedItems = 0

    // Iterate through a and match a node in b
    // O(N) time,
    for (var i = 0 ; i < aChildren.length; i++) {
        var aItem = aChildren[i]
        var itemIndex

        if (aItem.key) {
            if (bKeys.hasOwnProperty(aItem.key)) {
                // Match up the old keys
                itemIndex = bKeys[aItem.key]
                newChildren.push(bChildren[itemIndex])

            } else {
                // Remove old keyed items
                itemIndex = i - deletedItems++
                newChildren.push(null)
            }
        } else {
            // Match the item in a with the next free item in b
            if (freeIndex < freeCount) {
                itemIndex = bFree[freeIndex++]
                newChildren.push(bChildren[itemIndex])
            } else {
                // There are no free items in b to match with
                // the free items in a, so the extra free nodes
                // are deleted.
                itemIndex = i - deletedItems++
                newChildren.push(null)
            }
        }
    }

    var lastFreeIndex = freeIndex >= bFree.length ?
        bChildren.length :
        bFree[freeIndex]

    // Iterate through b and append any new keys
    // O(M) time
    for (var j = 0; j < bChildren.length; j++) {
        var newItem = bChildren[j]

        if (newItem.key) {
            if (!aKeys.hasOwnProperty(newItem.key)) {
                // Add any new keyed items
                // We are adding new items to the end and then sorting them
                // in place. In future we should insert new items in place.
                newChildren.push(newItem)
            }
        } else if (j >= lastFreeIndex) {
            // Add any leftover non-keyed items
            newChildren.push(newItem)
        }
    }

    var simulate = newChildren.slice()
    var simulateIndex = 0
    var removes = []
    var inserts = []
    var simulateItem

    for (var k = 0; k < bChildren.length;) {
        var wantedItem = bChildren[k]
        simulateItem = simulate[simulateIndex]

        // remove items
        while (simulateItem === null && simulate.length) {
            removes.push(remove(simulate, simulateIndex, null))
            simulateItem = simulate[simulateIndex]
        }

        if (!simulateItem || simulateItem.key !== wantedItem.key) {
            // if we need a key in this position...
            if (wantedItem.key) {
                if (simulateItem && simulateItem.key) {
                    // if an insert doesn't put this key in place, it needs to move
                    if (bKeys[simulateItem.key] !== k + 1) {
                        removes.push(remove(simulate, simulateIndex, simulateItem.key))
                        simulateItem = simulate[simulateIndex]
                        // if the remove didn't put the wanted item in place, we need to insert it
                        if (!simulateItem || simulateItem.key !== wantedItem.key) {
                            inserts.push({key: wantedItem.key, to: k})
                        }
                        // items are matching, so skip ahead
                        else {
                            simulateIndex++
                        }
                    }
                    else {
                        inserts.push({key: wantedItem.key, to: k})
                    }
                }
                else {
                    inserts.push({key: wantedItem.key, to: k})
                }
                k++
            }
            // a key in simulate has no matching wanted key, remove it
            else if (simulateItem && simulateItem.key) {
                removes.push(remove(simulate, simulateIndex, simulateItem.key))
            }
        }
        else {
            simulateIndex++
            k++
        }
    }

    // remove all the remaining nodes from simulate
    while(simulateIndex < simulate.length) {
        simulateItem = simulate[simulateIndex]
        removes.push(remove(simulate, simulateIndex, simulateItem && simulateItem.key))
    }

    // If the only moves we have are deletes then we can just
    // let the delete patch remove these items.
    if (removes.length === deletedItems && !inserts.length) {
        return {
            children: newChildren,
            moves: null
        }
    }

    return {
        children: newChildren,
        moves: {
            removes: removes,
            inserts: inserts
        }
    }
}

function remove(arr, index, key) {
    arr.splice(index, 1)

    return {
        from: index,
        key: key
    }
}

function keyIndex(children) {
    var keys = {}
    var free = []
    var length = children.length

    for (var i = 0; i < length; i++) {
        var child = children[i]

        if (child.key) {
            keys[child.key] = i
        } else {
            free.push(i)
        }
    }

    return {
        keys: keys,     // A hash of key name to index
        free: free      // An array of unkeyed item indices
    }
}

function appendPatch(apply, patch) {
    if (apply) {
        if (isArray(apply)) {
            apply.push(patch)
        } else {
            apply = [apply, patch]
        }

        return apply
    } else {
        return patch
    }
}

},{"../vnode/handle-thunk":106,"../vnode/is-thunk":107,"../vnode/is-vnode":109,"../vnode/is-vtext":110,"../vnode/is-widget":111,"../vnode/vpatch":114,"./diff-props":116,"x-is-array":120}],118:[function(require,module,exports){
var hiddenStore = require('./hidden-store.js');

module.exports = createStore;

function createStore() {
    var key = {};

    return function (obj) {
        if ((typeof obj !== 'object' || obj === null) &&
            typeof obj !== 'function'
        ) {
            throw new Error('Weakmap-shim: Key must be object')
        }

        var store = obj.valueOf(key);
        return store && store.identity === key ?
            store : hiddenStore(obj, key);
    };
}

},{"./hidden-store.js":119}],119:[function(require,module,exports){
module.exports = hiddenStore;

function hiddenStore(obj, key) {
    var store = { identity: key };
    var valueOf = obj.valueOf;

    Object.defineProperty(obj, "valueOf", {
        value: function (value) {
            return value !== key ?
                valueOf.apply(this, arguments) : store;
        },
        writable: true
    });

    return store;
}

},{}],120:[function(require,module,exports){
var nativeIsArray = Array.isArray
var toString = Object.prototype.toString

module.exports = nativeIsArray || isArray

function isArray(obj) {
    return toString.call(obj) === "[object Array]"
}

},{}],121:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend(target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],122:[function(require,module,exports){
(function() {
    // Load the framework and Highcharts. Framework is passed as a parameter.
    var mediator;
    var configService;
    var that = {};
    that.load = function (element, services) {
        mediator = services.mediator;
        configService = services.config;
        var options = configService.get();
        options.chart.renderTo = element;
        var chart = new Highcharts.Chart(options);
        mediator.on('configUpdate', function () {
            mediator.trigger('treeUpdate'); // to update series-tab-name
            var options = configService.get();
            options.chart.renderTo = element;
            chart = new Highcharts.Chart(options);
        });
        mediator.on('dataUpdate', function () {
            var options = configService.get();
            options.chart.renderTo = element;
            chart = new Highcharts.Chart(options);
        });
        mediator.on('dataValueUpdate', function () {
            var options = configService.get();
            options.chart.renderTo = element;
            chart = new Highcharts.Chart(options);
        });
    };
    module.exports = that;
})();
},{}],123:[function(require,module,exports){
(function () {
    var constructor = function (services) {
        var optionsService = services.options;
        var mediator = services.mediator;
        var configService = services.config;

        var options = optionsService.get();
        var propertyServices = require('../factories/properties');
        var _ = {
            isUndefined: require('lodash.isundefined'),
            find: require('lodash.find'),
            map: require('lodash.map'),
            cloneDeep: require('lodash.clonedeep'),
            remove: require('lodash.remove'),
            forEach: require('lodash.foreach'),
            first: require('lodash.first')
        };
        var h = require('virtual-dom/h');

        var tabs;
        var activeTab = _.first(options).id;

        var activeTabChild;
        var that = {};

        that.template = function () {
            var tabs = h('ul', {className: "vertical-tabs"},
                [
                    generateGenericTabs(genericConfig(options), activeTab),
                    generateSeriesTabs(typeConfig(options, 'series'), activeTab)
                ]);
            var content = h('div', [
                generateContent(options, activeTab, activeTabChild)
            ]);
            var container = h('div', {className: 'vertical-tabs-container'}, [tabs, content]);
            return container;
        };

        function genericConfig(options) {
            var newOptions = _.cloneDeep(options);
            return _.remove(newOptions, function (panel) {
                return panel.id !== "series";
            })
        }

        function typeConfig(options, type) {
            return _.find(options, function (item) {
                return item.id == type;
            })
        }

        function generateContent(panels, activeId, activeChildId) {
            var activePanel = _.find(panels, function (panel) {
                return panel.id == activeId;
            });
            var content;
            switch (activePanel.id) {
                case 'series':
                    content = generateSeriesContent(activePanel, activeChildId);
                    break;
                default:
                    content = generateGenericContent(activePanel);
            }
            return content;
        }

        function generateGenericContent(panel) {
            var title = h('h2', panel.panelTitle);
            var presetList = [];
            _.forEach(panel.panes, function (pane) {
                var inputs = [];
                _.forEach(pane.options, function (option) {
                    inputs.push(propertyServices.get(option, configService));
                });

                var item = h('h3', pane.title);
                presetList.push(h('div', [item, inputs]))
            });

            return h('div', {className: "vertical-tab-content-container"}, [title, presetList]);
        }

        function generateSeriesContent(panel, child) {
            var series = configService.get().series;
            if (!_.isUndefined(child)) {
                return seriesPanel(panel, series[child], child);
            } else {
                return seriesPanel(panel, series[0], 0);
            }
        }

        function seriesPanel(panel, series, index) {
            var title = h('h2', series.name);
            var presetList = [];
            _.forEach(panel.panes, function (pane) {
                var inputs = [];
                _.forEach(pane.options, function (option) {
                    inputs.push(propertyServices.get(option, configService, 'series.' + index + option.fullname.replace("series", "")));
                });

                var item = h('h3', pane.title);
                presetList.push(h('div', [item, inputs]))
            });
            return h('div', {className: "vertical-tab-content-container"}, [title, presetList]);
        }

        function generateGenericTabs(panes, active) {
            var links = [];
            _.forEach(panes, function (pane, index) {
                var children = [];
                var className = pane.id === activeTab ? 'active' : '';
                var link = h('li', {className: className},
                    h('a', {
                            'href': '#' + pane.panelTitle,
                            'ev-click': function (e) {
                                e.preventDefault();
                                setActive(pane.id);
                            }
                        }, [pane.panelTitle, children]
                    )
                );

                links.push(link);
            });
            return links;
        }

        function generateSeriesTabs(config, activeTab) {
            if(!_.isUndefined(config)){
                var series = configService.get().series;
                var links = [];
                var className = '';
                if (config.id == activeTab) {
                    className = "vertical-tab is-active";
                    _.forEach(series, function (serie, index) {
                        links.push(
                            h('li.hover', {
                                'ev-click': function (e) {
                                    e.preventDefault();
                                    setActive(config.id, index);
                                }
                            }, serie.name ? serie.name : 'serie ' + index)
                        )
                    })
                }
                else {
                    className = '';
                }

                return h('li', {'className': className}, [
                    h('a', {
                        'href': '#data-series',
                        'ev-click': function () {
                            setActive(config.id);
                        }
                    }, 'data series'),
                    h('ul', links)
                ])
            }

        }

        function setActive(id, child) {
            activeTab = id;
            activeTabChild = _.isUndefined(child) ? 0 : child;
            mediator.trigger('treeUpdate');
        }

        return that;
    };

    module.exports = constructor;

})();
},{"../factories/properties":134,"lodash.clonedeep":51,"lodash.find":54,"lodash.first":55,"lodash.foreach":56,"lodash.isundefined":67,"lodash.map":70,"lodash.remove":73,"virtual-dom/h":94}],124:[function(require,module,exports){
(function () {
    var constructor = function(services){
        var h = require('virtual-dom/h');
        var paste = require('./import/paste');
        var upload = require('./import/upload');
        var dad = require('./import/dragAndDrop');
        var url = require('./import/url');
        var activeTab = 'paste';
        var mediator = services.mediator;

        var tabOptions = {
            paste:{
                label: 'Paste CSV',
                template: function(){
                    return paste.template(services);
                }
            },
            upload:{
                label: 'upload CSV',
                template: function(){
                    return h('div', [
                        upload.template(services),
                        dad.template(services)
                    ]);
                }
            },
            url:{
                label: 'url CSV',
                template: function(){
                    return url.template(services);
                }
            }
        };

        function tabLinks() {
            var links = ['paste', 'upload', 'url'];
            return h('ul.tab-list', links.map(function (id) {
                var className = activeTab === id ? 'is-active' : '';
                return h('li.tab-link', {
                    'className': className,
                    'ev-click': function () {
                        activeTab = id;
                        mediator.trigger('treeUpdate');
                    }
                }, tabOptions[id].label)
            }))
        }

        function template (){
            return h('div.accordion-tabs-minimal', [
                tabLinks(),
                tabOptions[activeTab].template()
            ]);
        }

        return {
            template: template
        };
    };


    module.exports = constructor;
})();




},{"./import/dragAndDrop":125,"./import/paste":126,"./import/upload":127,"./import/url":128,"virtual-dom/h":94}],125:[function(require,module,exports){
(function () {
    var dragDrop = require('drag-drop');
    var dataService;
    var papa = require('papaparse');
    var h = require('virtual-dom/h');

    var that = {};
    that.template = function (services) {
        dataService = services.data;

        var Hook = function () {};
        Hook.prototype.hook = function (node) {
            dragDrop(node, function (files) {
                console.log('Here are the dropped files', files);

                // `files` is an Array!
                files.forEach(function (file) {

                    // convert the file to a Buffer that we can use!
                    var reader = new FileReader();

                    reader.addEventListener('load', function (e) {
                        saveData(reader.result)
                    });

                    reader.addEventListener('error', function (err) {
                        console.error('FileReader error' + err)
                    });
                    reader.readAsText(file);
                })
            });
        };

        return h('div.file_drop', {
            'hook': new Hook()
        }, 'Drop your files here');
    };
    function saveData(value) {
        dataService.set(papa.parse(value).data);
    }

    module.exports = that;
})();

},{"drag-drop":13,"papaparse":84,"virtual-dom/h":94}],126:[function(require,module,exports){
(function () {
    var dataService;
    var papa = require('papaparse');
    var h = require('virtual-dom/h');

    var that = {};
    that.template = function (services) {
        dataService = services.data;
        var inputNode;
        var Hook = function(){};
        Hook.prototype.hook = function(node) {
            inputNode = node;
        };

        var input = h('textArea', {
            "hook": new Hook()
        });

        var importElement = h('button.btn', {
            'ev-click': function(){
                saveData(inputNode.value)
            }
        }, 'import');

        function saveData(value) {
            dataService.set(papa.parse(value).data);
        }

        return h('div', [input, importElement])
    };
    module.exports = that;
})();

},{"papaparse":84,"virtual-dom/h":94}],127:[function(require,module,exports){
(function () {
    var dataService;
    var papa = require('papaparse');
    var h = require('virtual-dom/h');
    var that = {};
    that.template = function (services) {
        dataService = services.data;
        var uploadElement;
        // Check for the various File API support.
        if (window.FileReader) {
            uploadElement =
                h('input', {
                    type: 'file',
                    onchange: function(e){
                        loadFile(e);
                    }
                }, 'upload');
        }

        function loadFile(e) {
            var file = e.target.files[0];
            var reader  = new FileReader();
            reader.onloadend = function () {
                saveData(reader.result)
            };
            if (file) {
                reader.readAsText(file);
            }
        }

        function saveData(value) {
            dataService.set(papa.parse(value).data);
        }

        return uploadElement;
    };

    module.exports = that;
})();
},{"papaparse":84,"virtual-dom/h":94}],128:[function(require,module,exports){
(function () {
    var that = {};
    var papa = require('papaparse');
    var h = require('virtual-dom/h');
    that.template = function (services) {
        var dataService = services.data;

        var inputNode;
        var Hook = function(){};
        Hook.prototype.hook = function(node) {
            inputNode = node;
        };

        var input = h('input', {
            "hook": new Hook()
        });

        var importElement = h('button.btn', {
            'ev-click': function () {
                that.loadUrl(inputNode.value, dataService)
            }
        }, 'import');

        return h('div', [input, importElement])
    };

    that.loadUrl = function (url, dataService) {
        var oReq = new XMLHttpRequest();
        oReq.addEventListener("load", function (data) {
            console.log(data);
        });
        oReq.open("GET", url, true);
        oReq.send();
        //dataService.set(papa.parse(value).data);
    };

    module.exports = that;
})();

},{"papaparse":84,"virtual-dom/h":94}],129:[function(require,module,exports){
(function () {
    var constructor = function(services){
        var _ = {
            forEach: require('lodash.foreach'),
            trim: require('lodash.trim'),
            size: require('lodash.size')
        };
        var h = require('virtual-dom/h');
        var data = services.data.get();
        var mediator = services.mediator;

        mediator.on('dataUpdate', function (_data_) {
            data = _data_;
        });

        function template() {
            var rows = [];
            _.forEach(data, function (row, rowIndex) {
                var cells = [];
                _.forEach(row, function(cell, cellIndex){
                    cells.push(h('td',{
                        contentEditable : true,
                        "ev-input": function(e){
                            var value = _.trim(e.target.innerHTML);
                            if(cell !== e.target.innerHTML){
                                services.data.setValue(rowIndex,cellIndex, value);
                            }
                        }
                    }, cell));
                });
                rows.push(h('tr', cells));
            });
            return h('table.table--data.table--bordered', rows);
        }

        return {
            template: template
        };
    };

    module.exports = constructor;

})();





},{"lodash.foreach":56,"lodash.size":76,"lodash.trim":80,"virtual-dom/h":94}],130:[function(require,module,exports){
(function () {
    var constructor = function(services){
        var that = {};
        var _ = {
            find: require('lodash.find'),
            forEach: require('lodash.foreach'),
            first: require('lodash.first')
        };
        var h = require('virtual-dom/h');
        var templateTypes = require('../config/templates.json');
        var iconLoader = require('../factories/iconLoader');
        var mediator = services.mediator;
        var config;
        var activeTab = _.first(templateTypes).id;
        config = services.config;

        that.template = function(){
            var tabs = generateTabs(templateTypes, activeTab);
            var content = generateContent(templateTypes, activeTab);
            return h('div', {className: 'vertical-tabs-container'}, [tabs, content]);
        };

        function generateContent(types, activeId) {
            var activeType = _.find(types, function (type) {
                return type.id == activeId;
            });
            var title = h('h2', activeType.type);
            var presetList = [];
            var svg = iconLoader.get(activeType.icon);
            _.forEach(activeType.presets, function (preset) {
                var item = h('a',
                    {
                        className: "templatelist__item",
                        'ev-click': function () {
                            config.setPreset(activeType.id, preset.id);
                        }
                    }, [
                        svg,
                        h('div', preset.title)
                    ]);
                presetList.push(item)
            });
            var presetGrid = h('div', {className: "templatelist"}, presetList);
            return h('div', {className: "vertical-tab-content-container"}, [title, presetGrid]);
        }

        function generateTabs(types, active) {
            var links = [];
            _.forEach(types, function (type, index) {
                var className = type.id === activeTab ? 'active' : '';

                var link = h('li', {
                    'className': className
                }, h('a', {
                    'href' : '#' + type.type,
                    'ev-click' : function (e) {
                        e.preventDefault();
                        activeTab = type.id;
                        mediator.trigger('treeUpdate');
                    }
                },type.type));

                links.push(link);
            });
            return tabs = h('ul', {className: "vertical-tabs"}, links);
        }

        return that;
    };


    module.exports = constructor;
})();
},{"../config/templates.json":132,"../factories/iconLoader":133,"lodash.find":54,"lodash.first":55,"lodash.foreach":56,"virtual-dom/h":94}],131:[function(require,module,exports){
module.exports=module.exports = [
    {
        "id": "chart",
        "panelTitle": "Chart settings",
        "panes": [
            {
                "title": "Chart type and interaction",
                "options": [
                    {
                        "name": "chart--type",
                        "fullname": "chart.type",
                        "title": "type",
                        "parent": "chart",
                        "isParent": false,
                        "returnType": "String",
                        "defaults": "column",
                        "values": "[\"line\", \"spline\", \"column\", \"bar\", \"area\", \"areaspline\", \"pie\", \"arearange\", \"areasplinerange\", \"boxplot\", \"bubble\", \"columnrange\", \"errorbar\", \"funnel\", \"gauge\", \"heatmap\", \"polygon\", \"pyramid\", \"scatter\", \"solidgauge\", \"treemap\", \"waterfall\"]",
                        "since": "2.1.0",
                        "description": "The default series type for the chart. Can be any of the chart types listed under <a href=\"#plotOptions\">plotOptions</a>.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/type-bar/\" target=\"_blank\">Bar</a>",
                        "deprecated": false
                    },
                    {
                        "name": "chart--inverted",
                        "fullname": "chart.inverted",
                        "title": "inverted",
                        "parent": "chart",
                        "isParent": false,
                        "returnType": "Boolean",
                        "defaults": "false",
                        "since": "",
                        "description": "Whether to invert the axes so that the x axis is vertical and y axis is horizontal.\r When true, the x axis is reversed by default. If a bar series is present in the chart,\r it will be inverted automatically.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/inverted/\" target=\"_blank\">Inverted line</a>",
                        "seeAlso": "",
                        "deprecated": false
                    },
                    {
                        "name": "chart--zoomType",
                        "fullname": "chart.zoomType",
                        "title": "zoomType",
                        "parent": "chart",
                        "isParent": false,
                        "returnType": "String",
                        "values": "[null, \"x\", \"y\", \"xy\"]",
                        "description": "Decides in what dimensions the user can zoom by dragging the mouse. Can be one of <code>x</code>, <code>y</code> or <code>xy</code>.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/zoomtype-none/\" target=\"_blank\">None by default</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/zoomtype-x/\" target=\"_blank\">x</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/zoomtype-y/\" target=\"_blank\">y</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/zoomtype-xy/\" target=\"_blank\">xy</a>",
                        "seeAlso": "<a href=\"#chart.panKey\">panKey</a>",
                        "deprecated": false
                    },
                    {
                        "name": "plotOptions-column--stacking",
                        "fullname": "plotOptions.column.stacking",
                        "title": "column stacking",
                        "parent": "plotOptions-column",
                        "isParent": false,
                        "returnType": "String",
                        "values": "[null, \"normal\", \"percent\"]",
                        "description": "Whether to stack the values of each series on top of each other. Possible values are null to disable, \"normal\" to stack by value or \"percent\".",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/plotoptions/series-stacking-line/\" target=\"_blank\">Line</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/plotoptions/series-stacking-column/\" target=\"_blank\">column</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/plotoptions/series-stacking-bar/\" target=\"_blank\">bar</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/plotoptions/series-stacking-area/\" target=\"_blank\">area</a> with \"normal\" stacking. \r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/plotoptions/series-stacking-percent-line/\" target=\"_blank\">Line</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/plotoptions/series-stacking-percent-column/\" target=\"_blank\">column</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/plotoptions/series-stacking-percent-bar/\" target=\"_blank\">bar</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/plotoptions/series-stacking-percent-area/\" target=\"_blank\">area</a> with \"percent\" stacking.",
                        "seeAlso": "<a href=\"#yAxis.reversedStacks\">yAxis.reversedStacks</a>",
                        "deprecated": false
                    },
                    {
                        "name": "plotOptions-bar--stacking",
                        "fullname": "plotOptions.bar.stacking",
                        "title": "bar stacking",
                        "parent": "plotOptions-bar",
                        "isParent": false,
                        "returnType": "String",
                        "values": "[null, \"normal\", \"percent\"]",
                        "description": "Whether to stack the values of each series on top of each other. Possible values are null to disable, \"normal\" to stack by value or \"percent\".",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/plotoptions/series-stacking-line/\" target=\"_blank\">Line</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/plotoptions/series-stacking-column/\" target=\"_blank\">column</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/plotoptions/series-stacking-bar/\" target=\"_blank\">bar</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/plotoptions/series-stacking-area/\" target=\"_blank\">area</a> with \"normal\" stacking. \r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/plotoptions/series-stacking-percent-line/\" target=\"_blank\">Line</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/plotoptions/series-stacking-percent-column/\" target=\"_blank\">column</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/plotoptions/series-stacking-percent-bar/\" target=\"_blank\">bar</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/plotoptions/series-stacking-percent-area/\" target=\"_blank\">area</a> with \"percent\" stacking.",
                        "seeAlso": "<a href=\"#yAxis.reversedStacks\">yAxis.reversedStacks</a>",
                        "deprecated": false
                    }
                ]
            },
            {
                "title": "Size and margins",
                "options": [
                    {
                        "name": "chart--width",
                        "fullname": "chart.width",
                        "title": "width",
                        "parent": "chart",
                        "isParent": false,
                        "returnType": "Number",
                        "description": "An explicit width for the chart. By default the width is calculated from the offset width of the containing element.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/width/\" target=\"_blank\">800px wide</a>",
                        "defaults": "600"
                    },
                    {
                        "name": "chart--height",
                        "fullname": "chart.height",
                        "title": "height",
                        "parent": "chart",
                        "isParent": false,
                        "returnType": "Number",
                        "description": "An explicit height for the chart. By default the height is calculated from the offset height of the containing element, or 400 pixels if the containing element's height is 0.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/height/\" target=\"_blank\">500px height</a>",
                        "deprecated": false
                    },
                    {
                        "name": "chart--spacingTop",
                        "fullname": "chart.spacingTop",
                        "title": "spacingTop",
                        "parent": "chart",
                        "isParent": false,
                        "returnType": "Number",
                        "defaults": "10",
                        "since": "2.1",
                        "description": "<p>The space between the top edge of the chart and the content (plot area, axis title and labels, title, subtitle or \r\n legend in top position).</p>",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/spacingtop-100/\" target=\"_blank\">A top spacing of 100</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/spacingtop-10/\" target=\"_blank\">floating chart title makes the plot area align to the \r\n\t\t\tdefault spacingTop of 10.</a>.",
                        "deprecated": false
                    },
                    {
                        "name": "chart--spacingRight",
                        "fullname": "chart.spacingRight",
                        "title": "spacingRight",
                        "parent": "chart",
                        "isParent": false,
                        "returnType": "Number",
                        "defaults": "10",
                        "since": "2.1",
                        "description": "<p>The space between the right edge of the chart and the content (plot area, axis title and labels, title, subtitle or \r legend in top position).</p>",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/spacingright-100/\" target=\"_blank\">Spacing set to 100</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/spacingright-legend/\" target=\"_blank\">legend in right position with default spacing</a>",
                        "deprecated": false
                    },
                    {
                        "name": "chart--spacingBottom",
                        "fullname": "chart.spacingBottom",
                        "title": "spacingBottom",
                        "parent": "chart",
                        "isParent": false,
                        "returnType": "Number",
                        "defaults": "15",
                        "since": "2.1",
                        "description": "<p>The space between the bottom edge of the chart and the content (plot area, axis title and labels, title, subtitle or \r legend in top position).</p>",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/spacingbottom/\" target=\"_blank\">Spacing bottom set to 100</a>.",
                        "deprecated": false
                    },
                    {
                        "name": "chart--spacingLeft",
                        "fullname": "chart.spacingLeft",
                        "title": "spacingLeft",
                        "parent": "chart",
                        "isParent": false,
                        "returnType": "Number",
                        "defaults": "10",
                        "since": "2.1",
                        "description": "<p>The space between the left edge of the chart and the content (plot area, axis title and labels, title, subtitle or \r legend in top position).</p>",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/spacingleft/\" target=\"_blank\">Spacing left set to 100</a>",
                        "deprecated": false
                    }
                ]
            }
        ]
    },
    {
        "id": "colorsAndBorders",
        "panelTitle": "Colors and borders",
        "panes": [
            {
                "title": "default colors",
                "options": [
                    {
                        "name": "colors",
                        "fullname": "colors",
                        "title": "colors",
                        "isParent": false,
                        "returnType": "Array<Color>",
                        "defaults": [
                            "#3799ba",
                            "#57f2a9",
                            "#c900a1",
                            "#1a9944",
                            "#7eeae5",
                            "#ed8c71",
                            "#899cf4",
                            "#e07dc6",
                            "#5addb0"
                        ],
                        "description": "<p>An array containing the default colors for the chart's series. When all colors are used, new colors are pulled from the start again. Defaults to:\r\n<pre>colors: ['#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9', \r\n   '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1']</pre>\r\n\r\nDefault colors can also be set on a series or series.type basis, see <a href=\"#plotOptions.column.colors\">column.colors</a>, <a href=\"#plotOptions.pie.colors\">pie.colors</a>.\r\n</p>\r\n\r\n<h3>Legacy</h3>\r\n<p>In Highcharts 3.x, the default colors were:\r\n<pre>colors: ['#2f7ed8', '#0d233a', '#8bbc21', '#910000', '#1aadce', \r\n   '#492970', '#f28f43', '#77a1e5', '#c42525', '#a6c96a']</pre>\r\n</p>\r\n\r\n<p>In Highcharts 2.x, the default colors were:\r\n<pre>colors: ['#4572A7', '#AA4643', '#89A54E', '#80699B', '#3D96AE', \r\n   '#DB843D', '#92A8CD', '#A47D7C', '#B5CA92']</pre></p>",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/colors/\" target=\"_blank\">Assign a global color theme</a>",
                        "deprecated": false
                    }
                ]
            },
            {
                "title": "Chart area",
                "options": [
                    {
                        "name": "chart--backgroundColor",
                        "fullname": "chart.backgroundColor",
                        "title": "backgroundColor",
                        "parent": "chart",
                        "isParent": false,
                        "returnType": "Color",
                        "defaults": "#FFFFFF",
                        "description": "The background color or gradient for the outer chart area.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/backgroundcolor-color/\" target=\"_blank\">Color</a>,\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/backgroundcolor-gradient/\" target=\"_blank\">gradient</a>"
                    },
                    {
                        "name": "chart--borderWidth",
                        "fullname": "chart.borderWidth",
                        "title": "borderWidth",
                        "parent": "chart",
                        "isParent": false,
                        "returnType": "Number",
                        "defaults": "0",
                        "description": "The pixel width of the outer chart border.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/borderwidth/\" target=\"_blank\">5px border</a>",
                        "deprecated": false
                    },
                    {
                        "name": "chart--borderRadius",
                        "fullname": "chart.borderRadius",
                        "title": "borderRadius",
                        "parent": "chart",
                        "isParent": false,
                        "returnType": "Number",
                        "defaults": "0",
                        "description": "The corner radius of the outer chart border.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/borderradius/\" target=\"_blank\">20px radius</a>",
                        "deprecated": false
                    },
                    {
                        "name": "chart--borderColor",
                        "fullname": "chart.borderColor",
                        "title": "borderColor",
                        "parent": "chart",
                        "isParent": false,
                        "returnType": "Color",
                        "defaults": "#4572A7",
                        "description": "The color of the outer chart border.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/bordercolor/\" target=\"_blank\">Brown border</a>",
                        "deprecated": false
                    }
                ]
            },
            {
                "title": "Plot area",
                "options": [
                    {
                        "name": "chart--plotBackgroundColor",
                        "fullname": "chart.plotBackgroundColor",
                        "title": "plotBackgroundColor",
                        "parent": "chart",
                        "isParent": false,
                        "returnType": "Color",
                        "description": "The background color or gradient for the plot area.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/plotbackgroundcolor-color/\" target=\"_blank\">Color</a>,\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/plotbackgroundcolor-gradient/\" target=\"_blank\">gradient</a>"
                    },
                    {
                        "name": "chart--plotBackgroundImage",
                        "fullname": "chart.plotBackgroundImage",
                        "title": "plotBackgroundImage",
                        "parent": "chart",
                        "isParent": false,
                        "returnType": "String",
                        "description": "The URL for an image to use as the plot background. To set an image as the background for the entire chart, set a CSS background image to the container element. Note that for the image to be applied to exported charts, its URL needs to be accessible by the export server.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/plotbackgroundimage/\" target=\"_blank\">Skies</a>",
                        "deprecated": false
                    },
                    {
                        "name": "chart--plotBorderWidth",
                        "fullname": "chart.plotBorderWidth",
                        "title": "plotBorderWidth",
                        "parent": "chart",
                        "isParent": false,
                        "returnType": "Number",
                        "defaults": "0",
                        "description": "The pixel width of the plot area border.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/plotborderwidth/\" target=\"_blank\">1px border</a>"
                    },
                    {
                        "name": "chart--plotBorderColor",
                        "fullname": "chart.plotBorderColor",
                        "title": "plotBorderColor",
                        "parent": "chart",
                        "isParent": false,
                        "returnType": "Color",
                        "defaults": "#C0C0C0",
                        "description": "The color of the inner chart or plot area border.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/plotbordercolor/\" target=\"_blank\">Blue border</a>"
                    }
                ]
            }
        ]
    },
    {
        "id": "titles",
        "panelTitle": "Titles",
        "panes": [
            {
                "title": "Titles",
                "options": [
                    {
                        "name": "title--text",
                        "fullname": "title.text",
                        "title": "chart title",
                        "parent": "title",
                        "isParent": false,
                        "returnType": "String",
                        "defaults": "Chart title",
                        "description": "The title of the chart. To disable the title, set the <code>text</code> to <code>null</code>.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/title/text/\" target=\"_blank\">Custom title</a>"
                    },
                    {
                        "name": "subtitle--text",
                        "fullname": "subtitle.text",
                        "title": "chart subtitle",
                        "parent": "subtitle",
                        "isParent": false,
                        "returnType": "String",
                        "description": "The subtitle of the chart.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/subtitle/text/\" target=\"_blank\">Custom subtitle</a>,\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/subtitle/text-formatted/\" target=\"_blank\">formatted and linked text.</a>"
                    },
                    {
                        "name": "yAxis-title--text",
                        "fullname": "yAxis.title.text",
                        "title": "Y axis title",
                        "parent": "yAxis-title",
                        "isParent": false,
                        "returnType": "String",
                        "defaults": "Values",
                        "description": "The actual text of the axis title. Horizontal texts can contain HTML, \r but rotated texts are painted using vector techniques and must be \r clean text. The Y axis title is disabled by setting the <code>text</code>\r option to <code>null</code>.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/xaxis/title-text/\" target=\"_blank\">Custom HTML</a> title for X axis",
                        "deprecated": false
                    },
                    {
                        "name": "xAxis-title--text",
                        "fullname": "xAxis.title.text",
                        "title": "X axis title",
                        "parent": "xAxis-title",
                        "isParent": false,
                        "returnType": "String",
                        "description": "The actual text of the axis title. It can contain basic HTML text markup like &lt;b&gt;, &lt;i&gt; and spans with style.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/xaxis/title-text/\" target=\"_blank\">Custom HTML</a> title for X axis"
                    }
                ]
            },
            {
                "title": "Title advanced",
                "options": [
                    {
                        "name": "title--style",
                        "fullname": "title.style",
                        "title": "style",
                        "parent": "title",
                        "isParent": false,
                        "returnType": "CSSObject",
                        "defaults": "{ \"color\": \"#333333\", \"fontSize\": \"18px\" }",
                        "description": "CSS styles for the title. Use this for font styling, but use <code>align</code>, <code>x</code> and <code>y</code> for text alignment.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/title/style/\" target=\"_blank\">Custom color and weight</a>",
                        "deprecated": false
                    }
                ]
            }
        ]
    },
    {
        "id": "axes",
        "panelTitle": "Axes",
        "panes": [
            {
                "title": "Axes setup",
                "options": []
            },
            {
                "title": "X axis",
                "options": [
                    {
                        "name": "xAxis--type",
                        "fullname": "xAxis.type",
                        "title": "type",
                        "parent": "xAxis",
                        "isParent": false,
                        "returnType": "String",
                        "defaults": "category",
                        "values": "[\"linear\", \"logarithmic\", \"datetime\", \"category\"]",
                        "description": "The type of axis. Can be one of <code>\"linear\"</code>, <code>\"logarithmic\"</code>, <code>\"datetime\"</code> or <code>\"category\"</code>. In a datetime axis, the numbers are given in milliseconds, and tick marks are placed \t\ton appropriate values like full hours or days. In a category axis, the <a href=\"#series.data\">point names</a> of the chart's series are used for categories, if not a <a href=\"#xAxis.categories\">categories</a> array is defined.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/xaxis/type-linear/\" target=\"_blank\">\"linear\"</a>, \r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/xaxis/type-datetime/\" target=\"_blank\">\"datetime\" with regular intervals</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/xaxis/type-datetime-irregular/\" target=\"_blank\">\"datetime\" with irregular intervals</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/yaxis/type-log/\" target=\"_blank\">\"logarithmic\"</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/yaxis/type-log-minorgrid/\" target=\"_blank\">\"logarithmic\" with minor grid lines</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/xaxis/type-log-both/\" target=\"_blank\">\"logarithmic\" on two axes</a>.",
                        "deprecated": false
                    },
                    {
                        "name": "xAxis--min",
                        "fullname": "xAxis.min",
                        "title": "min",
                        "parent": "xAxis",
                        "isParent": false,
                        "returnType": "Number",
                        "description": "The minimum value of the axis. If <code>null</code> the min value is automatically calculated. If the <code>startOnTick</code> option is true, the <code>min</code> value might be rounded down.",
                        "demo": "Y axis min of <a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/yaxis/min-startontick-false/\" target=\"_blank\">-50 with startOnTick to false</a>,\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/yaxis/min-startontick-true/\" target=\"_blank\">-50 with startOnTick true by default</a>"
                    },
                    {
                        "name": "xAxis--opposite",
                        "fullname": "xAxis.opposite",
                        "title": "opposite",
                        "parent": "xAxis",
                        "isParent": false,
                        "returnType": "Boolean",
                        "defaults": "false",
                        "description": "Whether to display the axis on the opposite side of the normal. The normal is on the left side for vertical axes and bottom for horizontal, so the opposite sides will be right and top respectively. This is typically used with dual or multiple axes.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/yaxis/opposite/\" target=\"_blank\">Secondary Y axis opposite</a>"
                    },
                    {
                        "name": "xAxis--reversed",
                        "fullname": "xAxis.reversed",
                        "title": "reversed",
                        "parent": "xAxis",
                        "isParent": false,
                        "returnType": "Boolean",
                        "defaults": "false",
                        "description": "Whether to reverse the axis so that the highest number is closest to the origin. If the chart is inverted, the x axis is reversed by default.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/yaxis/reversed/\" target=\"_blank\">Reversed Y axis</a>",
                        "deprecated": false
                    },
                    {
                        "name": "xAxis--tickInterval",
                        "fullname": "xAxis.tickInterval",
                        "title": "tickInterval",
                        "parent": "xAxis",
                        "isParent": false,
                        "returnType": "Number",
                        "description": "<p>The interval of the tick marks in axis units. When <code>null</code>, the tick interval\r\n is computed to approximately follow the <a href=\"#xAxis.tickPixelInterval\">tickPixelInterval</a> on linear and datetime axes.\r\n On categorized axes, a <code>null</code> tickInterval will default to 1, one category. \r\n Note that datetime axes are based on milliseconds, so for \r\n example an interval of one day is expressed as <code>24 * 3600 * 1000</code>.</p>\r\n <p>On logarithmic axes, the tickInterval is based on powers, so a tickInterval of 1 means\r\n \tone tick on each of 0.1, 1, 10, 100 etc. A tickInterval of 2 means a tick of 0.1, 10, 1000 etc.\r\n \tA tickInterval of 0.2 puts a tick on 0.1, 0.2, 0.4, 0.6, 0.8, 1, 2, 4, 6, 8, 10, 20, 40 etc.</p>\r\n<p>If the tickInterval is too dense for labels to be drawn, Highcharts may remove ticks.</p>",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/xaxis/tickinterval-5/\" target=\"_blank\">Tick interval of 5 on a linear axis</a>",
                        "seeAlso": "<a href=\"#xAxis.tickPixelInterval\">tickPixelInterval</a>, <a href=\"#xAxis.tickPositions\">tickPositions</a>, <a href=\"#xAxis.tickPositioner\">tickPositioner</a>",
                        "deprecated": false
                    },
                    {
                        "name": "xAxis-labels--format",
                        "fullname": "xAxis.labels.format",
                        "title": "format",
                        "parent": "xAxis-labels",
                        "isParent": false,
                        "returnType": "String",
                        "defaults": "{value}",
                        "since": "3.0",
                        "description": "A <a href=\"http://www.highcharts.com/docs/chart-concepts/labels-and-string-formatting\">format string</a> for the axis label. ",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/yaxis/labels-format/\" target=\"_blank\">Add units to Y axis label</a>",
                        "deprecated": false
                    },
                    {
                        "name": "xAxis-labels--rotation",
                        "fullname": "xAxis.labels.rotation",
                        "title": "rotation",
                        "parent": "xAxis-labels",
                        "isParent": false,
                        "returnType": "Number",
                        "defaults": "0",
                        "description": "Rotation of the labels in degrees.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/xaxis/labels-rotation/\" target=\"_blank\">X axis labels rotated 90°</a>"
                    },
                    {
                        "name": "xAxis-labels--align",
                        "fullname": "xAxis.labels.align",
                        "title": "align",
                        "parent": "xAxis-labels",
                        "isParent": false,
                        "returnType": "String",
                        "defaults": "center",
                        "values": "[\"left\", \"center\", \"right\"]",
                        "description": "What part of the string the given position is anchored to. Can be one of <code>\"left\"</code>, <code>\"center\"</code> or <code>\"right\"</code>. Defaults to an intelligent guess based on which side of the chart the axis is on and the rotation of the label.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/xaxis/labels-align-left/\" target=\"_blank\">\"left\"</a>, \r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/xaxis/labels-align-right/\" target=\"_blank\">\"right\"</a> on X axis",
                        "deprecated": false
                    }
                ]
            },
            {
                "title": "Value axis",
                "options": [
                    {
                        "name": "yAxis--type",
                        "fullname": "yAxis.type",
                        "title": "type",
                        "parent": "yAxis",
                        "isParent": false,
                        "returnType": "String",
                        "defaults": "linear",
                        "values": "[\"linear\", \"logarithmic\", \"datetime\", \"category\"]",
                        "description": "The type of axis. Can be one of <code>\"linear\"</code>, <code>\"logarithmic\"</code>, <code>\"datetime\"</code> or <code>\"category\"</code>. In a datetime axis, the numbers are given in milliseconds, and tick marks are placed \t\ton appropriate values like full hours or days. In a category axis, the <a href=\"#series.data\">point names</a> of the chart's series are used for categories, if not a <a href=\"#xAxis.categories\">categories</a> array is defined.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/xaxis/type-linear/\" target=\"_blank\">\"linear\"</a>, \r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/xaxis/type-datetime/\" target=\"_blank\">\"datetime\" with regular intervals</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/xaxis/type-datetime-irregular/\" target=\"_blank\">\"datetime\" with irregular intervals</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/yaxis/type-log/\" target=\"_blank\">\"logarithmic\"</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/yaxis/type-log-minorgrid/\" target=\"_blank\">\"logarithmic\" with minor grid lines</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/xaxis/type-log-both/\" target=\"_blank\">\"logarithmic\" on two axes</a>.",
                        "deprecated": false
                    },
                    {
                        "name": "yAxis--min",
                        "fullname": "yAxis.min",
                        "title": "min",
                        "parent": "yAxis",
                        "isParent": false,
                        "returnType": "Number",
                        "description": "<p>The minimum value of the axis. If <code>null</code> the min value is automatically calculated.</p>\r\n\r\n<p>If the <code>startOnTick</code> option is true, the <code>min</code> value might be rounded down.</p>\r\n\r\n<p>The automatically calculated minimum value is also affected by <a href=\"#yAxis.floor\">floor</a>, <a href=\"#yAxis.minPadding\">minPadding</a>, <a href=\"#yAxis.minRange\">minRange</a> as well as <a href=\"#plotOptions.series.threshold\">series.threshold</a> and <a href=\"#plotOptions.series.softThreshold\">series.softThreshold</a>.</p>",
                        "demo": "Y axis min of <a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/yaxis/min-startontick-false/\" target=\"_blank\">-50 with startOnTick to false</a>,\r\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/yaxis/min-startontick-true/\" target=\"_blank\">-50 with startOnTick true by default</a>",
                        "deprecated": false
                    },
                    {
                        "name": "yAxis--opposite",
                        "fullname": "yAxis.opposite",
                        "title": "opposite",
                        "parent": "yAxis",
                        "isParent": false,
                        "returnType": "Boolean",
                        "defaults": "false",
                        "description": "Whether to display the axis on the opposite side of the normal. The normal is on the left side for vertical axes and bottom for horizontal, so the opposite sides will be right and top respectively. This is typically used with dual or multiple axes.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/yaxis/opposite/\" target=\"_blank\">Secondary Y axis opposite</a>"
                    },
                    {
                        "name": "yAxis--reversed",
                        "fullname": "yAxis.reversed",
                        "title": "reversed",
                        "parent": "yAxis",
                        "isParent": false,
                        "returnType": "Boolean",
                        "defaults": "false",
                        "description": "Whether to reverse the axis so that the highest number is closest to the origin. If the chart is inverted, the x axis is reversed by default.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/yaxis/reversed/\" target=\"_blank\">Reversed Y axis</a>",
                        "deprecated": false
                    },
                    {
                        "name": "yAxis-labels--format",
                        "fullname": "yAxis.labels.format",
                        "title": "format",
                        "parent": "yAxis-labels",
                        "isParent": false,
                        "returnType": "String",
                        "defaults": "{value}",
                        "since": "3.0",
                        "description": "A <a href=\"http://www.highcharts.com/docs/chart-concepts/labels-and-string-formatting\">format string</a> for the axis label. ",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/yaxis/labels-format/\" target=\"_blank\">Add units to Y axis label</a>",
                        "deprecated": false
                    },
                    {
                        "name": "yAxis-labels--rotation",
                        "fullname": "yAxis.labels.rotation",
                        "title": "rotation",
                        "parent": "yAxis-labels",
                        "isParent": false,
                        "returnType": "Number",
                        "defaults": "0",
                        "description": "Rotation of the labels in degrees.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/xaxis/labels-rotation/\" target=\"_blank\">X axis labels rotated 90°</a>"
                    }
                ]
            }
        ]
    },
    {
        "id": "legend",
        "panelTitle": "Legend",
        "panes": [
            {
                "title": "General",
                "options": [
                    {
                        "name": "legend--enabled",
                        "fullname": "legend.enabled",
                        "title": "enabled",
                        "parent": "legend",
                        "isParent": false,
                        "returnType": "Boolean",
                        "defaults": "true",
                        "description": "Enable or disable the legend.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/legend/enabled-false/\" target=\"_blank\">Legend disabled</a>"
                    },
                    {
                        "name": "legend--layout",
                        "fullname": "legend.layout",
                        "title": "layout",
                        "parent": "legend",
                        "isParent": false,
                        "returnType": "String",
                        "defaults": "horizontal",
                        "values": "[\"horizontal\", \"vertical\"]",
                        "description": "The layout of the legend items. Can be one of \"horizontal\" or \"vertical\".",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/legend/layout-horizontal/\" target=\"_blank\">Horizontal by default</a>,\n\t\t\t<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/legend/layout-vertical/\" target=\"_blank\">vertical</a>"
                    }
                ]
            },
            {
                "title": "Placement",
                "options": [
                    {
                        "name": "legend--align",
                        "fullname": "legend.align",
                        "title": "align",
                        "parent": "legend",
                        "isParent": false,
                        "returnType": "String",
                        "defaults": "center",
                        "values": "[\"left\", \"center\", \"right\"]",
                        "since": "2.0",
                        "description": "<p>The horizontal alignment of the legend box within the chart area. Valid values are <code>left</code>, <code>center</code> and <code>right</code>.</p>\r\n\r\n<p>In the case that the legend is aligned in a corner position, the <code>layout</code> option will determine whether to place it above/below or on the side of the plot area.</p>",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/legend/align/\" target=\"_blank\">Legend at the right of the chart</a>",
                        "deprecated": false
                    },
                    {
                        "name": "legend--verticalAlign",
                        "fullname": "legend.verticalAlign",
                        "title": "verticalAlign",
                        "parent": "legend",
                        "isParent": false,
                        "returnType": "String",
                        "defaults": "bottom",
                        "values": "[\"top\", \"middle\", \"bottom\"]",
                        "since": "2.0",
                        "description": "<p>The vertical alignment of the legend box. Can be one of <code>top</code>, <code>middle</code> or  <code>bottom</code>. Vertical position can be further determined by the <code>y</code> option.</p>\r\n\r\n<p>In the case that the legend is aligned in a corner position, the <code>layout</code> option will determine whether to place it above/below or on the side of the plot area.</p>",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/legend/verticalalign/\" target=\"_blank\">Legend 100px from the top of the chart</a>",
                        "deprecated": false
                    }
                ]
            },
            {
                "title": "Color and border",
                "options": []
            }
        ]
    },
    {
        "id": "tooltip",
        "panelTitle": "Tooltip",
        "panes": [
            {
                "title": "General",
                "options": [
                    {
                        "name": "tooltip--headerFormat",
                        "fullname": "tooltip.headerFormat",
                        "title": "headerFormat",
                        "parent": "tooltip",
                        "isParent": false,
                        "returnType": "String",
                        "defaults": "",
                        "values": "",
                        "since": "",
                        "description": "<p>The HTML of the tooltip header line. Variables are enclosed by curly brackets. Available variables\t\t\tare <code>point.key</code>, <code>series.name</code>, <code>series.color</code> and other members from the <code>point</code> and <code>series</code> objects. The <code>point.key</code> variable contains the category name, x value or datetime string depending on the type of axis. For datetime axes, the <code>point.key</code> date format can be set using tooltip.xDateFormat.</p>\r \r\n<p>Defaults to <code>&lt;span style=\"font-size: 10px\"&gt;{point.key}&lt;/span&gt;&lt;br/&gt;</code></p>",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/tooltip/footerformat/\" target=\"_blank\">A HTML table in the tooltip</a>",
                        "seeAlso": "",
                        "deprecated": false
                    },
                    {
                        "name": "tooltip--pointFormat",
                        "fullname": "tooltip.pointFormat",
                        "title": "pointFormat",
                        "parent": "tooltip",
                        "isParent": false,
                        "returnType": "String",
                        "defaults": "<span style=\"color:{point.color}\">\\u25CF</span> {series.name}: <b>{point.y}</b><br/>",
                        "since": "2.2",
                        "description": "<p>The HTML of the point's line in the tooltip. Variables are enclosed by curly brackets. Available variables are point.x, point.y, series.name and series.color and other properties on the same form. Furthermore,  point.y can be extended by the <code>tooltip.valuePrefix</code> and <code>tooltip.valueSuffix</code> variables. This can also be overridden for each series, which makes it a good hook for displaying units.</p>",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/tooltip/pointformat/\" target=\"_blank\">A different point format with value suffix</a>",
                        "deprecated": false
                    },
                    {
                        "name": "tooltip--valuePrefix",
                        "fullname": "tooltip.valuePrefix",
                        "title": "valuePrefix",
                        "parent": "tooltip",
                        "isParent": false,
                        "returnType": "String",
                        "since": "2.2",
                        "description": "A string to prepend to each series' y value. Overridable in each series' tooltip options object.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/tooltip/valuedecimals/\" target=\"_blank\">Set decimals, prefix and suffix for the value</a>"
                    },
                    {
                        "name": "tooltip--valueSuffix",
                        "fullname": "tooltip.valueSuffix",
                        "title": "valueSuffix",
                        "parent": "tooltip",
                        "isParent": false,
                        "returnType": "String",
                        "since": "2.2",
                        "description": "A string to append to each series' y value. Overridable in each series' tooltip options object.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/tooltip/valuedecimals/\" target=\"_blank\">Set decimals, prefix and suffix for the value</a>"
                    }
                ]
            },
            {
                "title": "Color and border",
                "options": []
            }
        ]
    },
    {
        "id": "exportingCredits",
        "panelTitle": "Exporting/Credits",
        "panes": [
            {
                "title": "Exporting",
                "options": [
                    {
                        "name": "exporting--enabled",
                        "fullname": "exporting.enabled",
                        "title": "enabled",
                        "parent": "exporting",
                        "isParent": false,
                        "returnType": "Boolean",
                        "defaults": "true",
                        "since": "2.0",
                        "description": "Whether to enable the exporting module. Disabling the module will hide the context button, but API methods will still be available.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/exporting/enabled-false/\" target=\"_blank\">Exporting module is loaded but disabled</a>",
                        "deprecated": false
                    }
                ]
            },
            {
                "title": "Credits",
                "options": [
                    {
                        "name": "credits--enabled",
                        "fullname": "credits.enabled",
                        "title": "enabled",
                        "parent": "credits",
                        "isParent": false,
                        "returnType": "Boolean",
                        "defaults": "false",
                        "description": "Whether to show the credits text.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/credits/enabled-false/\" target=\"_blank\">Credits disabled</a>"
                    },
                    {
                        "name": "credits--text",
                        "fullname": "credits.text",
                        "title": "text",
                        "parent": "credits",
                        "isParent": false,
                        "returnType": "String",
                        "defaults": "easychart.org",
                        "description": "The text for the credits label.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/credits/href/\" target=\"_blank\">Custom URL and text</a>"
                    },
                    {
                        "name": "credits--href",
                        "fullname": "credits.href",
                        "title": "href",
                        "parent": "credits",
                        "isParent": false,
                        "returnType": "String",
                        "defaults": "http://www.easychart.org",
                        "description": "The URL for the credits label.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/credits/href/\" target=\"_blank\">Custom URL and text</a>"
                    }
                ]
            }
        ]
    },
    {
        "id": "series",
        "panelTitle": "Series",
        "panes": [
            {
                "title": "Series configuration",
                "options": [
                    {
                        "name": "series--name",
                        "fullname": "series.name",
                        "title": "name",
                        "parent": "series",
                        "isParent": false,
                        "returnType": "String",
                        "description": "The name of the series as shown in the legend, tooltip etc.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/series/name/\" target=\"_blank\">Series name</a>"
                    },
                    {
                        "name": "series--index",
                        "fullname": "series.index",
                        "title": "index",
                        "parent": "series",
                        "isParent": false,
                        "returnType": "Number",
                        "since": "2.3.0",
                        "description": "The index of the series in the chart, affecting the internal index in the <code>chart.series</code> array, the visible Z index as well as the order in the legend.",
                        "demo": "",
                        "seeAlso": "",
                        "deprecated": false
                    },
                    {
                        "name": "series--type",
                        "fullname": "series.type",
                        "title": "type",
                        "parent": "series",
                        "isParent": false,
                        "returnType": "String",
                        "values": "[null, \"line\", \"spline\", \"column\", \"area\", \"areaspline\", \"pie\", \"arearange\", \"areasplinerange\", \"boxplot\", \"bubble\", \"columnrange\", \"errorbar\", \"funnel\", \"gauge\", \"scatter\", \"waterfall\"]",
                        "since": "",
                        "description": "The type of series. Can be one of <code>area</code>, <code>areaspline</code>,\r <code>bar</code>, <code>column</code>, <code>line</code>, <code>pie</code>,\r <code>scatter</code> or <code>spline</code>. From version 2.3, <code>arearange</code>, <code>areasplinerange</code> and <code>columnrange</code> are supported with the highcharts-more.js component.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/series/type/\" target=\"_blank\">Line and column in the same chart</a>",
                        "seeAlso": "",
                        "deprecated": false
                    }
                ]
            }
        ]
    }
]
},{}],132:[function(require,module,exports){
module.exports=module.exports = [
  {
    "id": "line",
    "type": "Line charts",
    "icon": "line",
    "presets": [
      {
        "id": "basic",
        "title": "Line chart",
        "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "line"
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "dataLabels",
        "title": "With data labels",
        "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values. Data labels by default displays the Y value.",
        "definition": {
          "chart": {
            "type": "line"
          },
          "xAxis": {
            "type": "category"
          },
          "plotOptions": {
            "series": {
              "dataLabels": {
                "enabled": true
              }
            }
          }
        }
      },
      {
        "id": "spline",
        "title": "Spline",
        "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "spline"
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "splineDataLabels",
        "title": "Spline with labels",
        "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "spline"
          },
          "xAxis": {
            "type": "category"
          },
          "plotOptions": {
            "series": {
              "dataLabels": {
                "enabled": true
              }
            }
          }
        }
      },
      {
        "id": "splineLogarithmic",
        "title": "Logarithmic",
        "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "spline"
          },
          "xAxis": {
            "type": "category"
          },
          "yAxis": {
            "type": "logarithmic"
          },
          "plotOptions": {
            "series": {
              "dataLabels": {
                "enabled": true
              }
            }
          }
        }
      },
      {
        "id": "step",
        "title": "Step line",
        "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "line"
          },
          "xAxis": {
            "type": "category"
          },
          "plotOptions": {
            "series": {
              "step": "left"
            }
          }
        }
      },
      {
        "id": "stepWithLabels",
        "title": "Step line with labels",
        "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "line"
          },
          "xAxis": {
            "type": "category"
          },
          "plotOptions": {
            "series": {
              "step": "left",
              "dataLabels": {
                "enabled": true
              }
            }
          }
        }
      },
      {
        "id": "inverted",
        "title": "Inverted",
        "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "line",
            "inverted": true
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "negativeColor",
        "title": "Negative color",
        "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "line"
          },
          "xAxis": {
            "type": "category"
          },
          "plotOptions": {
            "series": {
              "negativeColor": "#0088FF"
            }
          }
        }
      },
      {
        "id": "errorBar",
        "title": "Error bar",
        "desc": "Requires one data column for X values or categories, subsequently one data column for the series' Y values and two columns for the error bar series maximum and minimum.",
        "definition": {
          "chart": {
            "type": "line"
          },
          "xAxis": {
            "type": "category"
          },
          "series": [
            {"type": null},
            {"type": "errorbar"}
          ]
        }
      },
      {
        "id": "combinationColumn",
        "title": "Combination chart",
        "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "line"
          },
          "xAxis": {
            "type": "category"
          },
          "series": [
            {"type": null},
            {"type": "column"}
          ]
        }
      }
    ]
  },
  {
    "id": "area",
    "type": "Area charts",
    "icon": "area",
    "presets": [
      {
        "id": "basic",
        "title": "Area Chart",
        "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "area"
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "withLabels",
        "title": "Area with labels",
        "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "area"
          },
          "xAxis": {
            "type": "category"
          },
          "plotOptions": {
            "series": {
              "dataLabels": {
                "enabled": true
              }
            }
          }
        }
      },
      {
        "id": "stacked",
        "title": "Stacked",
        "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "area"
          },
          "xAxis": {
            "type": "category"
          },
          "plotOptions": {
            "series": {
              "stacking": "normal"
            }
          }
        }
      },
      {
        "id": "stackedWithLabels",
        "title": "Stacked with labels",
        "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "area"
          },
          "xAxis": {
            "type": "category"
          },
          "plotOptions": {
            "series": {
              "stacking": "normal",
              "dataLabels": {
                "enabled": true
              }
            }
          }
        }
      },
      {
        "id": "stackedPercentage",
        "title": "Stacked percentage",
        "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "area"
          },
          "xAxis": {
            "type": "category"
          },
          "plotOptions": {
            "series": {
              "stacking": "percent"
            }
          }
        }
      },
      {
        "id": "inverted",
        "title": "Inverted",
        "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "area",
            "inverted": true
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "invertedWithLabels",
        "title": "Inverted with labels",
        "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "area",
            "inverted": true
          },
          "xAxis": {
            "type": "category"
          },
          "plotOptions": {
            "series": {
              "stacking": "normal",
              "dataLabels": {
                "enabled": true
              }
            }
          }
        }
      },
      {
        "id": "stepLine",
        "title": "Step line",
        "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "area"
          },
          "xAxis": {
            "type": "category"
          },
          "plotOptions": {
            "series": {
              "step": "left"
            }
          }
        }
      },
      {
        "id": "negativeColor",
        "title": "Negative color",
        "desc": "Displays negative values with an alternative color. Colors can be set in plotOptions.series.negativeColor. Requires one column for X values or categories, subsequently one column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "area"
          },
          "xAxis": {
            "type": "category"
          },
          "plotOptions": {
            "series": {
              "negativeColor": "#0088FF",
              "color": "#FF000000"
            }
          }
        }
      },
      {
        "id": "range",
        "title": "Area range",
        "desc": "Requires one data column for X values or categories, subsequently two data column for each arearange series' Y values.",
        "definition": {
          "chart": {
            "type": "arearange"
          },
          "xAxis": {
            "type": "category"
          }
        }
      }
    ]
  },
  {
    "id": "column",
    "type": "Column charts",
    "icon": "column",
    "presets": [
      {
        "id": "basic",
        "title": "Basic",
        "description": "Grouped column chart. Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "column"
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "withLabels",
        "title": "With labels",
        "description": "Grouped column chart. Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "column"
          },
          "xAxis": {
            "type": "category"
          },
          "plotOptions":{
            "series":{
              "dataLabels":{
                "enabled": true
              }
            }
          }
        }
      },
      {
        "id": "3d",
        "title": "Column 3D",
        "description": "Grouped column chart. Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "column",
            "margin": 75,
            "options3d": {
              "enabled": true,
              "alpha": 15,
              "beta": 15,
              "depth": 50,
              "viewDistance": 15
            }
          },
          "plotOptions": {
            "column": {
              "depth": 25
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "stacked",
        "title": "Stacked",
        "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "column"
          },
          "plotOptions": {
            "series": {
              "stacking": "normal"
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "stackedWithLabels",
        "title": "Stacked with labels",
        "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "column"
          },
          "plotOptions": {
            "series": {
              "stacking": "normal",
              "dataLabels": {
                "enabled": true
              }
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "stacked3d",
        "title": "Stacked 3D",
        "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "column",
            "margin": 75,
            "options3d": {
              "enabled": true,
              "alpha": 15,
              "beta": 15,
              "depth": 50,
              "viewDistance": 15
            }
          },
          "plotOptions": {
            "column": {
              "depth": 25
            },
            "series": {
              "stacking": "normal"
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "stackedPercent",
        "title": "Stacked percent",
        "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "column"
          },
          "plotOptions": {
            "series": {
              "stacking": "percent"
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "stackedPercentWithLabels",
        "title": "Stacked percent with labels",
        "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "column"
          },
          "plotOptions": {
            "series": {
              "stacking": "percent",
              "dataLabels": {
                "enabled": true
              }
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "negativeColor",
        "title": "Negative color",
        "desc": "Displays negative values with an alternative color. Colors can be set in plotOptions.series.negativeColor. Requires one column for X values or categories, subsequently one column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "column"
          },
          "plotOptions":{
            "series":{
              "negativeColor": "#0088FF",
              "color": "#FF0000"
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "multiColor",
        "title": "Multi color",
        "desc": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "column"
          },
          "plotOptions":{
            "series":{
              "colorByPoint": true
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "logarithmic",
        "title": "Logarithmic",
        "desc": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "column"
          },
          "xAxis": {
            "type": "category"
          },
          "yAxis": {
            "type": "logarithmic",
            "minorTickInterval": "auto"
          }
        }
      },
      {
        "id": "range",
        "title": "Columnrange",
        "desc": "Requires one data column for X values or categories, subsequently two data columns for each series' Y values.",
        "definition": {
          "chart": {
            "type": "columnrange"
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "rangeWithLabels",
        "title": "Columnrange with labels",
        "desc": "Requires one data column for X values or categories, subsequently two data columns for each series' Y values.",
        "definition": {
          "chart": {
            "type": "columnrange"
          },
          "xAxis": {
            "type": "category"
          },
          "plotOptions":{
            "series":{
              "dataLabels":{
                "enabled": true
              }
            }
          }
        }
      },
      {
        "id": "packed",
        "title": "Packed Columns",
        "desc": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "column"
          },
          "plotOptions": {
            "series": {
              "pointPadding": 0,
              "groupPadding": 0,
              "borderWidth": 0,
              "shadow": false
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "errorbar",
        "title": "Error bar",
        "desc": "Requires one data column for X values or categories, subsequently one data column for the series' Y values. and two columns for the error bar series maximum and minimum.",
        "definition": {
          "chart": {
            "type": "column"
          },
          "series": [
            {"type": null},
            {
              "type": "errorbar",
              "showInLegend": true
            }
          ],
          "xAxis": {
            "type": "category"
          }
        }
      }
    ]
  },
  {
    "id": "bar",
    "type": "Bar charts",
    "icon": "bar",
    "presets": [
      {
        "id": "basic",
        "title": "Basic bar",
        "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "column",
            "inverted": true
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "basicWithLabels",
        "title": "Basic with labels",
        "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "column",
            "inverted": true
          },
          "xAxis": {
            "type": "category"
          },
          "plotOptions":{
            "series":{
              "dataLabels":{
                "enabled": true
              }
            }
          }
        }
      },
      {
        "id": "stacked",
        "title": "Stacked bar",
        "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "column",
            "inverted": true
          },
          "plotOptions": {
            "series": {
              "stacking": "normal"
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "stackedWithLabels",
        "title": "Stacked with labels",
        "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "column",
            "inverted": true
          },
          "plotOptions": {
            "series": {
              "stacking": "normal",
              "dataLabels": {
                "enabled": true
              }
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "stackedPercentage",
        "title": "Stacked percentage bar",
        "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "column",
            "inverted": true
          },
          "plotOptions": {
            "series": {
              "stacking": "percent"
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "stackedPercentageWithLabels",
        "title": "Stacked percentage bar with labels",
        "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "column",
            "inverted": true
          },
          "plotOptions": {
            "series": {
              "stacking": "percent",
              "dataLabels": {
                "enabled": true
              }
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "negativeColor",
        "title": "Negative color",
        "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "column",
            "inverted": true
          },
          "plotOptions":{
            "series":{
              "negativeColor": "#0088FF",
              "color": "#FF0000"
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "multiColor",
        "title": "Multi color",
        "desc": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "column",
            "inverted": true
          },
          "plotOptions": {
            "series": {
              "colorByPoint": true
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "horizontalColumnrange",
        "title": "Horizontal columnrange",
        "desc": "Requires one data column for X values or categories, subsequently two data columns for each series' Y values.",
        "definition": {
          "chart": {
            "type": "columnrange",
            "inverted": true
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "logarithmic",
        "title": "Logarithmic",
        "desc": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "column",
            "inverted": true
          },
          "yAxis": {
            "type": "logarithmic",
            "minorTickInterval": "auto"
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "horizontalColumnrangeWithLabels",
        "title": "Horizontal columnrange with labels",
        "desc": "Requires one data column for X values or categories, subsequently two data columns for each series' Y values.",
        "definition": {
          "chart": {
            "type": "columnrange",
            "inverted": true
          },
          "plotOptions": {
            "series": {
              "dataLabels": {
                "enabled": true
              }
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "packedBars",
        "title": "Packed Bars",
        "desc": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
        "definition": {
          "chart": {
            "type": "column",
            "inverted": true
          },
          "plotOptions": {
            "series": {
              "pointPadding": 0,
              "groupPadding": 0,
              "borderWidth": 0,
              "shadow": false
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "errorbar",
        "title": "Error bar",
        "desc": "Requires one data column for X values or categories, subsequently one data column for the series' Y values. and two columns for the error bar series maximum and minimum.",
        "definition": {
          "chart": {
            "type": "column",
            "inverted": true
          },
          "xAxis": {
            "type": "category"
          },
          "series": [
            {"type": null},
            {"type": "errorbar"}
          ]
        }
      }
    ]
  },
  {
    "id": "scatterAndBubble",
    "type": "Scatter and bubble",
    "icon": "spider",
    "presets": [
      {
        "id": "scatter",
        "title": "Scatter chart",
        "description": "Requires one data column for X values and one for Y values.",
        "definition": {
          "chart": {
            "type": "scatter"
          }
        }
      },
      {
        "id": "bubble",
        "title": "Bubble chart",
        "description": "Requires three data columns: one for X values, one for Y values and one for the size of the bubble (Z value).",
        "definition": {
          "chart": {
            "type": "bubble"
          }
        }
      },
      {
        "id": "scatterWithLine",
        "title": "Scatter with line",
        "description": "Requires one data column for X values and one for Y values.",
        "definition": {
          "chart": {
            "type": "scatter"
          },
          "plotOptions":{
            "series":{
              "lineWidth": 1
            }
          }
        }
      },
      {
        "id": "scatterWithLineNoMarker",
        "title": "Scatter with line, no marker",
        "description": "Requires one data column for X values and one for Y values.",
        "definition": {
          "chart": {
            "type": "scatter"
          },
          "plotOptions":{
            "series":{
              "lineWidth": 1,
              "marker":{
                "enabled": false
              }
            }
          }
        }
      }
    ]
  },
  {
    "id": "pie",
    "type": "Pie charts",
    "icon": "spider",
    "presets": [
      {
        "id": "basic",
        "title": "Pie chart",
        "description": "Requires two data columns: one for slice names (shown in data labels) and one for their values.",
        "definition": {
          "chart": {
            "type": "pie"
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "3d",
        "title": "3D pie chart",
        "description": "Requires two data columns: one for slice names (shown in data labels) and one for their values.",
        "definition": {
          "chart": {
            "type": "pie",
            "options3d": {
              "enabled": true,
              "alpha": 45,
              "beta": 0
            }
          },
          "plotOptions": {
            "pie": {
              "allowPointSelect": true,
              "depth": 35,
              "cursor": "pointer"
            },
            "series": {
              "dataLabels": {
                "enabled": true
              }
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "withLegend",
        "title": "Pie chart",
        "description": "Requires two data columns: one for slice names (shown in legend) and one for their values.",
        "definition": {
          "chart": {
            "type": "pie"
          },
          "plotOptions": {
            "pie": {
              "allowPointSelect": true,
              "cursor": true,
              "showInLegend": true,
              "dataLabels": {
                "enabled": false
              }
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "3dWithLegend",
        "title": "3D pie with legend",
        "description": "Requires two data columns: one for slice names (shown in legend) and one for their values.",
        "definition": {
          "chart": {
            "type": "pie",
            "options3d": {
              "enabled": true,
              "alpha": 45,
              "beta": 0
            }
          },
          "plotOptions": {
            "pie": {
              "allowPointSelect": true,
              "depth": 35,
              "cursor": "pointer",
              "showInLegend": true,
              "dataLabels": {
                "enabled": false
              }
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "donut",
        "title": "Donut",
        "description": "Requires two data columns: one for slice names (shown in data labels) and one for their values.",
        "definition": {
          "chart": {
            "type": "pie"
          },
          "plotOptions": {
            "pie": {
              "allowPointSelect": true,
              "cursor": true,
              "innerSize": "60%",
              "dataLabels": {
                "enabled": true
              }
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "donutWithLegend",
        "title": "Donut with legend",
        "description": "Requires two data columns: one for slice names (shown in legend) and one for their values.",
        "definition": {
          "chart": {
            "type": "pie"
          },
          "plotOptions": {
            "pie": {
              "allowPointSelect": true,
              "cursor": true,
              "showInLegend": true,
              "innerSize": "60%",
              "dataLabels": {
                "enabled": false
              }
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "3dDonut",
        "title": "3D donut chart",
        "description": "Requires two data columns: one for slice names (shown in data labels) and one for their values.",
        "definition": {
          "chart": {
            "type": "pie",
            "options3d": {
              "enabled": true,
              "alpha": 45,
              "beta": 0
            }
          },
          "plotOptions": {
            "pie": {
              "allowPointSelect": true,
              "depth": 35,
              "innerSize": "60%",
              "cursor": "pointer"
            },
            "series": {
              "dataLabels": {
                "enabled": true
              }
            }
          }
        }
      },
      {
        "id": "3dDonutWithLegend",
        "title": "3D donut chart with legend",
        "description": "Requires two data columns: one for slice names (shown in legend) and one for their values.",
        "definition": {
          "chart": {
            "type": "pie",
            "options3d": {
              "enabled": true,
              "alpha": 45,
              "beta": 0
            }
          },
          "plotOptions": {
            "pie": {
              "allowPointSelect": true,
              "depth": 35,
              "cursor": "pointer",
              "showInLegend": true,
              "innerSize": "60%"
            },
            "series": {
              "dataLabels": {
                "enabled": false
              }
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "semiCircleDonut",
        "title": "Semi circle donut",
        "description": "Requires two data columns: one for slice names (shown in data labels) and one for their values.",
        "definition": {
          "chart": {
            "type": "pie"
          },
          "plotOptions": {
            "pie": {
              "allowPointSelect": false,
              "dataLabels": {
                "distance": -30,
                "style": {
                  "fontWeight": "bold",
                  "color": "white",
                  "textShadow": "0px 1px 2px black"
                }
              },
              "innerSize": "50%",
              "startAngle": -90,
              "endAngle": 90,
              "center": ["50%", "75%"]
            },
            "series": {
              "dataLabels": {
                "enabled": true
              }
            }
          },
          "xAxis": {
            "type": "category"
          }
        }
      }
    ]
  },
  {
    "id": "polar",
    "type": "Polar charts",
    "icon": "bar",
    "presets": [
      {
        "id": "line",
        "title": "Polar line",
        "description": "Requires one column for X values or categories (labels around the perimeter), subsequently one column for each series' Y values (plotted from center and out).",
        "definition": {
          "chart": {
            "type": "line",
            "polar": true
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "spider",
        "title": "Spider line",
        "description": "Requires one column for X values or categories (labels around the perimeter), subsequently one column for each series' Y values (plotted from center and out).",
        "definition": {
          "chart": {
            "type": "line",
            "polar": true
          },
          "xAxis": {
            "tickmarkPlacement": "on",
            "lineWidth": 0
          },
          "yAxis": {
            "lineWidth": 0,
            "gridLineInterpolation": "polygon"
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "area",
        "title": "Polar area",
        "description": "Requires one column for X values or categories (labels around the perimeter), subsequently one column for each series' Y values (plotted from center and out).",
        "definition": {
          "chart": {
            "type": "area",
            "polar": true
          },
          "xAxis": {
            "type": "category"
          }
        }
      },
      {
        "id": "spiderArea",
        "title": "Spider area",
        "description": "Requires one column for X values or categories (labels around the perimeter), subsequently one column for each series' Y values (plotted from center and out).",
        "definition": {
          "chart": {
            "type": "area",
            "polar": true
          },
          "xAxis": {
            "tickmarkPlacement": "on",
            "lineWidth": 0
          },
          "yAxis": {
            "lineWidth": 0,
            "gridLineInterpolation": "polygon"
          },
          "xAxis": {
            "type": "category"
          }
        }
      }
    ]
  }
]
},{}],133:[function(require,module,exports){
(function () {
    var includeFolder = undefined,
        icons = (function(){var self={},fs = require("fs");
self["area"] = "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t viewBox=\"-461 322 100 100\" style=\"enable-background:new -461 322 100 100;\" xml:space=\"preserve\">\r\n<g>\r\n\t<g>\r\n\t\t<path d=\"M-366,419h-90.5c-0.8,0-1.5-0.7-1.5-1.5V327c0-0.8,0.7-1.5,1.5-1.5s1.5,0.7,1.5,1.5v89h89c0.8,0,1.5,0.7,1.5,1.5\r\n\t\t\tS-365.2,419-366,419z\"/>\r\n\t</g>\r\n\t<g>\r\n\t\t<path d=\"M-402,382c-0.3,0-0.5-0.1-0.7-0.3l-30.3-30.3l-22.3,22.3c-0.4,0.4-1,0.4-1.4,0s-0.4-1,0-1.4l23-23c0.4-0.4,1-0.4,1.4,0\r\n\t\t\tl31,31c0.4,0.4,0.4,1,0,1.4C-401.5,381.9-401.7,382-402,382z\"/>\r\n\t</g>\r\n\t<g>\r\n\t\t<path d=\"M-372,418c-0.6,0-1-0.4-1-1v-65.5l-37.3,40.1c-0.2,0.2-0.4,0.3-0.7,0.3c-0.3,0-0.5-0.1-0.7-0.3l-21.3-21.3l-22.3,22.3\r\n\t\t\tc-0.4,0.4-1,0.4-1.4,0s-0.4-1,0-1.4l23-23c0.4-0.4,1-0.4,1.4,0l21.3,21.3l38.3-41.2c0.3-0.3,0.7-0.4,1.1-0.2\r\n\t\t\tc0.4,0.1,0.6,0.5,0.6,0.9v68C-371,417.6-371.4,418-372,418z\"/>\r\n\t</g>\r\n</g>\r\n</svg>\r\n";
self["bar"] = "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t viewBox=\"-461 322 100 100\" style=\"enable-background:new -461 322 100 100;\" xml:space=\"preserve\">\r\n<g>\r\n\t<g>\r\n\t\t<path d=\"M-366,419h-90.5c-0.8,0-1.5-0.7-1.5-1.5V327c0-0.8,0.7-1.5,1.5-1.5s1.5,0.7,1.5,1.5v89h89c0.8,0,1.5,0.7,1.5,1.5\r\n\t\t\tS-365.2,419-366,419z\"/>\r\n\t</g>\r\n\t<path d=\"M-421,365v16h-34v-16H-421 M-421,363h-34c-1.1,0-2,0.9-2,2v16c0,1.1,0.9,2,2,2h34c1.1,0,2-0.9,2-2v-16\r\n\t\tC-419,363.9-419.9,363-421,363L-421,363z\"/>\r\n\t<path d=\"M-401,340v17h-54v-17H-401 M-401,338h-54c-1.1,0-2,0.9-2,2v17c0,1.1,0.9,2,2,2h54c1.1,0,2-0.9,2-2v-17\r\n\t\tC-399,338.9-399.9,338-401,338L-401,338z\"/>\r\n\t<path d=\"M-381,389v17h-74v-17H-381 M-381,387h-74c-1.1,0-2,0.9-2,2v17c0,1.1,0.9,2,2,2h74c1.1,0,2-0.9,2-2v-17\r\n\t\tC-379,387.9-379.9,387-381,387L-381,387z\"/>\r\n</g>\r\n</svg>\r\n";
self["bubble"] = "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" x=\"0px\" y=\"0px\" viewBox=\"0 0 100 125\" enable-background=\"new 0 0 100 100\" xml:space=\"preserve\"><g><g><path d=\"M95,97H4.5C3.671,97,3,96.328,3,95.5V5c0-0.829,0.671-1.5,1.5-1.5S6,4.171,6,5v89h89c0.828,0,1.5,0.672,1.5,1.5    S95.828,97,95,97z\"/></g><g><path d=\"M50.5,63.5C42.505,63.5,36,56.995,36,49s6.505-14.5,14.5-14.5S65,41.005,65,49S58.495,63.5,50.5,63.5z M50.5,36.5    C43.607,36.5,38,42.107,38,49s5.607,12.5,12.5,12.5S63,55.893,63,49S57.393,36.5,50.5,36.5z\"/></g><g><path d=\"M23.5,71.5c-4.687,0-8.5-3.813-8.5-8.5s3.813-8.5,8.5-8.5S32,58.313,32,63S28.187,71.5,23.5,71.5z M23.5,56.5    c-3.584,0-6.5,2.916-6.5,6.5s2.916,6.5,6.5,6.5S30,66.584,30,63S27.084,56.5,23.5,56.5z\"/></g><g><path d=\"M76.5,58.5c-4.687,0-8.5-3.813-8.5-8.5c0-4.687,3.813-8.5,8.5-8.5S85,45.313,85,50C85,54.687,81.187,58.5,76.5,58.5z     M76.5,43.5c-3.584,0-6.5,2.916-6.5,6.5s2.916,6.5,6.5,6.5S83,53.584,83,50S80.084,43.5,76.5,43.5z\"/></g><g><path d=\"M51.5,31.5c-4.687,0-8.5-3.813-8.5-8.5s3.813-8.5,8.5-8.5c4.687,0,8.5,3.813,8.5,8.5S56.187,31.5,51.5,31.5z M51.5,16.5    c-3.584,0-6.5,2.916-6.5,6.5s2.916,6.5,6.5,6.5S58,26.584,58,23S55.084,16.5,51.5,16.5z\"/></g></g><text x=\"0\" y=\"115\" fill=\"#000000\" font-size=\"5px\" font-weight=\"bold\" font-family=\"'Helvetica Neue', Helvetica, Arial-Unicode, Arial, Sans-serif\">Created by Agus Purwanto</text><text x=\"0\" y=\"120\" fill=\"#000000\" font-size=\"5px\" font-weight=\"bold\" font-family=\"'Helvetica Neue', Helvetica, Arial-Unicode, Arial, Sans-serif\">from the Noun Project</text></svg>";
self["chart"] = "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" style=\"font-family:'lucida grande', 'lucida sans unicode', arial, helvetica, sans-serif;font-size:12px;\" xmlns=\"http://www.w3.org/2000/svg\" width=\"600\" height=\"400\"><desc>Created with Highcharts 4.1.9</desc><defs><clipPath id=\"highcharts-10\"><rect x=\"0\" y=\"0\" width=\"273\" height=\"497\"></rect></clipPath></defs><rect x=\"0\" y=\"0\" width=\"600\" height=\"400\" strokeWidth=\"0\" fill=\"#FFFFFF\" class=\" highcharts-background\"></rect><g class=\"highcharts-grid\" ></g><g class=\"highcharts-grid\" ><path fill=\"none\" d=\"M 92.5 42 L 92.5 315\" stroke=\"#D8D8D8\" stroke-width=\"1\"  opacity=\"1\"></path><path fill=\"none\" d=\"M 142.5 42 L 142.5 315\" stroke=\"#D8D8D8\" stroke-width=\"1\"  opacity=\"1\"></path><path fill=\"none\" d=\"M 191.5 42 L 191.5 315\" stroke=\"#D8D8D8\" stroke-width=\"1\"  opacity=\"1\"></path><path fill=\"none\" d=\"M 241.5 42 L 241.5 315\" stroke=\"#D8D8D8\" stroke-width=\"1\"  opacity=\"1\"></path><path fill=\"none\" d=\"M 291.5 42 L 291.5 315\" stroke=\"#D8D8D8\" stroke-width=\"1\"  opacity=\"1\"></path><path fill=\"none\" d=\"M 341.5 42 L 341.5 315\" stroke=\"#D8D8D8\" stroke-width=\"1\"  opacity=\"1\"></path><path fill=\"none\" d=\"M 390.5 42 L 390.5 315\" stroke=\"#D8D8D8\" stroke-width=\"1\"  opacity=\"1\"></path><path fill=\"none\" d=\"M 440.5 42 L 440.5 315\" stroke=\"#D8D8D8\" stroke-width=\"1\"  opacity=\"1\"></path><path fill=\"none\" d=\"M 490.5 42 L 490.5 315\" stroke=\"#D8D8D8\" stroke-width=\"1\"  opacity=\"1\"></path><path fill=\"none\" d=\"M 539.5 42 L 539.5 315\" stroke=\"#D8D8D8\" stroke-width=\"1\"  opacity=\"1\"></path><path fill=\"none\" d=\"M 590.5 42 L 590.5 315\" stroke=\"#D8D8D8\" stroke-width=\"1\"  opacity=\"1\"></path></g><g class=\"highcharts-axis\" ><path fill=\"none\" d=\"M 93 97.5 L 83 97.5\" stroke=\"#C0D0E0\" stroke-width=\"1\" opacity=\"1\"></path><path fill=\"none\" d=\"M 93 151.5 L 83 151.5\" stroke=\"#C0D0E0\" stroke-width=\"1\" opacity=\"1\"></path><path fill=\"none\" d=\"M 93 206.5 L 83 206.5\" stroke=\"#C0D0E0\" stroke-width=\"1\" opacity=\"1\"></path><path fill=\"none\" d=\"M 93 260.5 L 83 260.5\" stroke=\"#C0D0E0\" stroke-width=\"1\" opacity=\"1\"></path><path fill=\"none\" d=\"M 93 315.5 L 83 315.5\" stroke=\"#C0D0E0\" stroke-width=\"1\" opacity=\"1\"></path><path fill=\"none\" d=\"M 93 41.5 L 83 41.5\" stroke=\"#C0D0E0\" stroke-width=\"1\" opacity=\"1\"></path><path fill=\"none\" d=\"M 92.5 42 L 92.5 315\" stroke=\"#C0D0E0\" stroke-width=\"1\"  visibility=\"visible\"></path></g><g class=\"highcharts-axis\" ><text x=\"341.5\"  text-anchor=\"middle\" transform=\"translate(0,0)\" class=\" highcharts-yaxis-title\" style=\"color:#707070;fill:#707070;\" visibility=\"visible\" y=\"350\">Values</text></g><g class=\"highcharts-series-group\" ><g class=\"highcharts-series highcharts-series-0\" visibility=\"visible\"  transform=\"translate(590,315) rotate(90) scale(-1,1) scale(1 1)\" width=\"497\" height=\"273\" clip-path=\"url(#highcharts-10)\"><rect x=\"218\" y=\"399\" width=\"19\" height=\"99\" fill=\"#7cb5ec\" rx=\"0\" ry=\"0\"></rect><rect x=\"164\" y=\"399\" width=\"18\" height=\"99\" fill=\"#7cb5ec\" rx=\"0\" ry=\"0\"></rect><rect x=\"109\" y=\"399\" width=\"18\" height=\"99\" fill=\"#7cb5ec\" rx=\"0\" ry=\"0\"></rect><rect x=\"55\" y=\"399\" width=\"18\" height=\"99\" fill=\"#7cb5ec\" rx=\"0\" ry=\"0\"></rect><rect x=\"0\" y=\"399\" width=\"18\" height=\"99\" fill=\"#7cb5ec\" rx=\"0\" ry=\"0\"></rect></g><g class=\"highcharts-markers highcharts-series-0\" visibility=\"visible\"  transform=\"translate(590,315) rotate(90) scale(-1,1) scale(1 1)\" width=\"497\" height=\"273\" clip-path=\"none\"></g><g class=\"highcharts-series highcharts-series-1\" visibility=\"visible\"  transform=\"translate(590,315) rotate(90) scale(-1,1) scale(1 1)\" width=\"497\" height=\"273\" clip-path=\"url(#highcharts-10)\"><rect x=\"237\" y=\"158\" width=\"18\" height=\"340\" fill=\"#434348\" rx=\"0\" ry=\"0\"></rect><rect x=\"182\" y=\"230\" width=\"18\" height=\"268\" fill=\"#434348\" rx=\"0\" ry=\"0\"></rect><rect x=\"127\" y=\"216\" width=\"19\" height=\"282\" fill=\"#434348\" rx=\"0\" ry=\"0\"></rect><rect x=\"73\" y=\"92\" width=\"18\" height=\"406\" fill=\"#434348\" rx=\"0\" ry=\"0\"></rect><rect x=\"18\" y=\"122\" width=\"18\" height=\"376\" fill=\"#434348\" rx=\"0\" ry=\"0\"></rect></g><g class=\"highcharts-markers highcharts-series-1\" visibility=\"visible\"  transform=\"translate(590,315) rotate(90) scale(-1,1) scale(1 1)\" width=\"497\" height=\"273\" clip-path=\"none\"></g><g class=\"highcharts-series highcharts-series-2\" visibility=\"visible\"  transform=\"translate(590,315) rotate(90) scale(-1,1) scale(1 1)\" width=\"497\" height=\"273\" clip-path=\"url(#highcharts-10)\"><rect x=\"255\" y=\"142\" width=\"18\" height=\"356\" fill=\"#90ed7d\" rx=\"0\" ry=\"0\"></rect><rect x=\"200\" y=\"214\" width=\"18\" height=\"284\" fill=\"#90ed7d\" rx=\"0\" ry=\"0\"></rect><rect x=\"146\" y=\"202\" width=\"18\" height=\"296\" fill=\"#90ed7d\" rx=\"0\" ry=\"0\"></rect><rect x=\"91\" y=\"61\" width=\"18\" height=\"437\" fill=\"#90ed7d\" rx=\"0\" ry=\"0\"></rect><rect x=\"36\" y=\"102\" width=\"19\" height=\"396\" fill=\"#90ed7d\" rx=\"0\" ry=\"0\"></rect></g><g class=\"highcharts-markers highcharts-series-2\" visibility=\"visible\"  transform=\"translate(590,315) rotate(90) scale(-1,1) scale(1 1)\" width=\"497\" height=\"273\" clip-path=\"none\"></g></g><text x=\"300\" text-anchor=\"middle\" class=\"highcharts-title\"  style=\"color:#333333;font-size:18px;fill:#333333;width:536px;\" y=\"24\"><tspan>Chart title</tspan></text><g class=\"highcharts-legend\"  transform=\"translate(180,362)\"><g ><g><g class=\"highcharts-legend-item\"  transform=\"translate(8,3)\"><text x=\"21\" style=\"color:#333333;font-size:12px;font-weight:bold;cursor:pointer;fill:#333333;\" text-anchor=\"start\"  y=\"15\">test</text><rect x=\"0\" y=\"4\" width=\"16\" height=\"12\"  fill=\"#7cb5ec\"></rect></g><g class=\"highcharts-legend-item\"  transform=\"translate(71,3)\"><text x=\"21\" y=\"15\" style=\"color:#333333;font-size:12px;font-weight:bold;cursor:pointer;fill:#333333;\" text-anchor=\"start\" >lowpoint</text><rect x=\"0\" y=\"4\" width=\"16\" height=\"12\"  fill=\"#434348\"></rect></g><g class=\"highcharts-legend-item\"  transform=\"translate(159,3)\"><text x=\"21\" y=\"15\" style=\"color:#333333;font-size:12px;font-weight:bold;cursor:pointer;fill:#333333;\" text-anchor=\"start\" >highpoint</text><rect x=\"0\" y=\"4\" width=\"16\" height=\"12\"  fill=\"#90ed7d\"></rect></g></g></g></g><g class=\"highcharts-axis-labels highcharts-xaxis-labels\" ><text x=\"78\" style=\"color:#606060;cursor:default;font-size:11px;fill:#606060;width:188px;text-overflow:clip;\" text-anchor=\"end\" transform=\"translate(0,0)\" y=\"75\" opacity=\"1\"><tspan>experiment 6</tspan></text><text x=\"78\" style=\"color:#606060;cursor:default;font-size:11px;fill:#606060;width:188px;text-overflow:clip;\" text-anchor=\"end\" transform=\"translate(0,0)\" y=\"130\" opacity=\"1\"><tspan>experiment 7</tspan></text><text x=\"78\" style=\"color:#606060;cursor:default;font-size:11px;fill:#606060;width:188px;text-overflow:clip;\" text-anchor=\"end\" transform=\"translate(0,0)\" y=\"185\" opacity=\"1\"><tspan>experiment 8</tspan></text><text x=\"78\" style=\"color:#606060;cursor:default;font-size:11px;fill:#606060;width:188px;text-overflow:clip;\" text-anchor=\"end\" transform=\"translate(0,0)\" y=\"239\" opacity=\"1\"><tspan>experiment 9</tspan></text><text x=\"78\" style=\"color:#606060;cursor:default;font-size:11px;fill:#606060;width:188px;text-overflow:clip;\" text-anchor=\"end\" transform=\"translate(0,0)\" y=\"294\" opacity=\"1\"><tspan>experiment 10</tspan></text></g><g class=\"highcharts-axis-labels highcharts-yaxis-labels\" ><text x=\"93\" style=\"color:#606060;cursor:default;font-size:11px;fill:#606060;\" text-anchor=\"middle\" transform=\"translate(0,0)\" y=\"334\" opacity=\"1\">0</text><text x=\"142.7\" style=\"color:#606060;cursor:default;font-size:11px;fill:#606060;\" text-anchor=\"middle\" transform=\"translate(0,0)\" y=\"334\" opacity=\"1\">25</text><text x=\"192.4\" style=\"color:#606060;cursor:default;font-size:11px;fill:#606060;\" text-anchor=\"middle\" transform=\"translate(0,0)\" y=\"334\" opacity=\"1\">50</text><text x=\"242.1\" style=\"color:#606060;cursor:default;font-size:11px;fill:#606060;\" text-anchor=\"middle\" transform=\"translate(0,0)\" y=\"334\" opacity=\"1\">75</text><text x=\"291.8\" style=\"color:#606060;cursor:default;font-size:11px;fill:#606060;\" text-anchor=\"middle\" transform=\"translate(0,0)\" y=\"334\" opacity=\"1\">100</text><text x=\"341.5\" style=\"color:#606060;cursor:default;font-size:11px;fill:#606060;\" text-anchor=\"middle\" transform=\"translate(0,0)\" y=\"334\" opacity=\"1\">125</text><text x=\"391.2\" style=\"color:#606060;cursor:default;font-size:11px;fill:#606060;\" text-anchor=\"middle\" transform=\"translate(0,0)\" y=\"334\" opacity=\"1\">150</text><text x=\"440.9\" style=\"color:#606060;cursor:default;font-size:11px;fill:#606060;\" text-anchor=\"middle\" transform=\"translate(0,0)\" y=\"334\" opacity=\"1\">175</text><text x=\"490.6\" style=\"color:#606060;cursor:default;font-size:11px;fill:#606060;\" text-anchor=\"middle\" transform=\"translate(0,0)\" y=\"334\" opacity=\"1\">200</text><text x=\"540.3\" style=\"color:#606060;cursor:default;font-size:11px;fill:#606060;\" text-anchor=\"middle\" transform=\"translate(0,0)\" y=\"334\" opacity=\"1\">225</text><text x=\"581\" style=\"color:#606060;cursor:default;font-size:11px;fill:#606060;\" text-anchor=\"middle\" transform=\"translate(0,0)\" y=\"334\" opacity=\"1\">250</text></g><g class=\"highcharts-tooltip\"  style=\"cursor:default;padding:0;pointer-events:none;white-space:nowrap;\" transform=\"translate(0,-9999)\"><path fill=\"none\" d=\"M 3.5 0.5 L 13.5 0.5 C 16.5 0.5 16.5 0.5 16.5 3.5 L 16.5 13.5 C 16.5 16.5 16.5 16.5 13.5 16.5 L 3.5 16.5 C 0.5 16.5 0.5 16.5 0.5 13.5 L 0.5 3.5 C 0.5 0.5 0.5 0.5 3.5 0.5\"  stroke=\"black\" stroke-opacity=\"0.049999999999999996\" stroke-width=\"5\" transform=\"translate(1, 1)\"></path><path fill=\"none\" d=\"M 3.5 0.5 L 13.5 0.5 C 16.5 0.5 16.5 0.5 16.5 3.5 L 16.5 13.5 C 16.5 16.5 16.5 16.5 13.5 16.5 L 3.5 16.5 C 0.5 16.5 0.5 16.5 0.5 13.5 L 0.5 3.5 C 0.5 0.5 0.5 0.5 3.5 0.5\"  stroke=\"black\" stroke-opacity=\"0.09999999999999999\" stroke-width=\"3\" transform=\"translate(1, 1)\"></path><path fill=\"none\" d=\"M 3.5 0.5 L 13.5 0.5 C 16.5 0.5 16.5 0.5 16.5 3.5 L 16.5 13.5 C 16.5 16.5 16.5 16.5 13.5 16.5 L 3.5 16.5 C 0.5 16.5 0.5 16.5 0.5 13.5 L 0.5 3.5 C 0.5 0.5 0.5 0.5 3.5 0.5\"  stroke=\"black\" stroke-opacity=\"0.15\" stroke-width=\"1\" transform=\"translate(1, 1)\"></path><path fill=\"rgb(249, 249, 249)\" fill-opacity=\" .85\" d=\"M 3.5 0.5 L 13.5 0.5 C 16.5 0.5 16.5 0.5 16.5 3.5 L 16.5 13.5 C 16.5 16.5 16.5 16.5 13.5 16.5 L 3.5 16.5 C 0.5 16.5 0.5 16.5 0.5 13.5 L 0.5 3.5 C 0.5 0.5 0.5 0.5 3.5 0.5\"></path><text x=\"8\"  style=\"font-size:12px;color:#333333;fill:#333333;\" y=\"20\"></text></g><text x=\"590\" text-anchor=\"end\"  style=\"cursor:pointer;color:#909090;font-size:9px;fill:#909090;\" y=\"395\">Highcharts.com</text></svg>";
self["column"] = "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t viewBox=\"-461 322 100 100\" style=\"enable-background:new -461 322 100 100;\" xml:space=\"preserve\">\r\n<g>\r\n\t<g>\r\n\t\t<path d=\"M-366,419h-90.5c-0.8,0-1.5-0.7-1.5-1.5V327c0-0.8,0.7-1.5,1.5-1.5s1.5,0.7,1.5,1.5v89h89c0.8,0,1.5,0.7,1.5,1.5\r\n\t\t\tS-365.2,419-366,419z\"/>\r\n\t</g>\r\n\t<g>\r\n\t\t<path d=\"M-403,382v34h-16v-34H-403 M-403,380h-16c-1.1,0-2,0.9-2,2v34c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2v-34\r\n\t\t\tC-401,380.9-401.9,380-403,380L-403,380z\"/>\r\n\t</g>\r\n\t<g>\r\n\t\t<path d=\"M-427,362v54h-17v-54H-427 M-427,360h-17c-1.1,0-2,0.9-2,2v54c0,1.1,0.9,2,2,2h17c1.1,0,2-0.9,2-2v-54\r\n\t\t\tC-425,360.9-425.9,360-427,360L-427,360z\"/>\r\n\t</g>\r\n\t<g>\r\n\t\t<path d=\"M-378,342v74h-17v-74H-378 M-378,340h-17c-1.1,0-2,0.9-2,2v74c0,1.1,0.9,2,2,2h17c1.1,0,2-0.9,2-2v-74\r\n\t\t\tC-376,340.9-376.9,340-378,340L-378,340z\"/>\r\n\t</g>\r\n</g>\r\n</svg>\r\n";
self["iconInfo"] = "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t width=\"512px\" height=\"512px\" viewBox=\"0 0 512 512\" enable-background=\"new 0 0 512 512\" xml:space=\"preserve\">\r\n<g>\r\n\t<path fill=\"#aaa\" d=\"M256,0C114.609,0,0,114.609,0,256s114.609,256,256,256s256-114.609,256-256S397.391,0,256,0z M256,472\r\n\t\tc-119.297,0-216-96.703-216-216S136.703,40,256,40s216,96.703,216,216S375.297,472,256,472z\"/>\r\n\t<rect fill=\"#aaa\" x=\"240\" y=\"352\" width=\"32\" height=\"32\"/>\r\n\t<path fill=\"#aaa\" d=\"M317.734,150.148c-6.484-6.625-14.688-11.922-24.766-16.031c-10.203-4.102-22.172-6.117-36.281-6.117\r\n\t\tc-11.969,0-22.875,2.016-32.781,6.117c-9.938,4.109-18.5,9.773-25.688,17.125c-7.125,7.289-12.672,14.508-16.5,24.773\r\n\t\tC177.906,186.281,176,192,176,208h32.656c0-16,4.234-28.109,12.938-38.516c8.594-10.453,20.266-14.82,35.094-14.82\r\n\t\tc14.438,0,25.234,3.914,32.172,10.938c6.875,7.023,10.391,17.086,10.391,29.797c0,9.883-3.25,18.758-9.734,26.492\r\n\t\tc-6.375,7.75-13.359,15.297-20.844,22.438c-7.594,7.141-13.672,14.766-19.953,22.641S240,284.016,240,294.469V320h32v-13.75\r\n\t\tc0-8.203,1.203-15.312,4.406-21.516c3.094-6.219,6.953-11.859,11.844-16.891c4.734-5.094,9.812-10,15.469-14.828\r\n\t\tc5.5-4.766,10.781-9.859,15.531-15.172c4.844-5.344,8.875-11.344,11.938-17.969c3.219-6.625,4.828-14.406,4.828-23.477\r\n\t\tc0-7.875-1.422-15.891-4.391-24.039C328.719,164.148,324.031,156.766,317.734,150.148z\"/>\r\n</g>\r\n</svg>\r\n";
self["line"] = "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t viewBox=\"-461 322 100 100\" style=\"enable-background:new -461 322 100 100;\" xml:space=\"preserve\">\r\n<g>\r\n\t<g>\r\n\t\t<path d=\"M-366,419h-90.5c-0.8,0-1.5-0.7-1.5-1.5V327c0-0.8,0.7-1.5,1.5-1.5s1.5,0.7,1.5,1.5v89h89c0.8,0,1.5,0.7,1.5,1.5\r\n\t\t\tS-365.2,419-366,419z\"/>\r\n\t</g>\r\n\t<g>\r\n\t\t<path d=\"M-456,385c-0.3,0-0.5-0.1-0.7-0.3c-0.4-0.4-0.4-1,0-1.4l23-23c0.4-0.4,1-0.4,1.4,0l21.3,21.3l38.3-41.2\r\n\t\t\tc0.4-0.4,1-0.4,1.4-0.1s0.4,1,0.1,1.4l-39,42c-0.2,0.2-0.4,0.3-0.7,0.3c-0.3,0-0.5-0.1-0.7-0.3l-21.3-21.3l-22.3,22.3\r\n\t\t\tC-455.5,384.9-455.7,385-456,385z\"/>\r\n\t</g>\r\n\t<g>\r\n\t\t<path d=\"M-456,404c-0.3,0-0.5-0.1-0.7-0.3c-0.4-0.4-0.4-1,0-1.4l23-23c0.4-0.4,1-0.4,1.4,0l21.3,21.3l38.3-41.2\r\n\t\t\tc0.4-0.4,1-0.4,1.4-0.1s0.4,1,0.1,1.4l-39,42c-0.2,0.2-0.4,0.3-0.7,0.3c-0.3,0-0.5-0.1-0.7-0.3l-21.3-21.3l-22.3,22.3\r\n\t\t\tC-455.5,403.9-455.7,404-456,404z\"/>\r\n\t</g>\r\n</g>\r\n</svg>\r\n";
self["logo"] = "<svg version=\"1.1\" id=\"Laag_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t viewBox=\"0 0 247.8 61.6\" enable-background=\"new 0 0 247.8 61.6\" xml:space=\"preserve\">\r\n<circle fill=\"#C6F4C3\" cx=\"237.8\" cy=\"25.1\" r=\"5.8\"/>\r\n<g>\r\n\t<path fill=\"#ffffff\" d=\"M24,6v6.8H10v5.5H24v6.4H10v5.5H24V37H2.8V6H24z\"/>\r\n\t<path fill=\"#ffffff\" d=\"M36.6,31.5L34.7,37h-7.6L37.7,6h10.5l10.7,31h-7.7l-1.9-5.5H36.6z M46.9,24.7l-4-11.6l-4,11.6H46.9z\"/>\r\n\t<path fill=\"#ffffff\" d=\"M59.6,28.6c2.8,1.2,5.4,2.1,8.6,2.1c1.9,0,3.3-0.4,4.1-0.9c0.9-0.5,1.3-1.2,1.3-1.9c0-1.1-0.9-1.9-2.3-2.5\r\n\t\tc-0.7-0.3-1.5-0.6-2.4-0.9c-1.8-0.6-3.7-1.3-5.5-2.3c-1.8-1-3.3-2.3-4.1-4.3c-0.4-1-0.7-2.1-0.7-3.5c0-3.5,1.5-5.7,3.8-7\r\n\t\ts5.1-1.8,7.8-1.8c3.2,0,6,0.7,7.8,1.3v6.2L78,13.2c-0.5-0.2-1.6-0.4-2.9-0.6c-1.3-0.2-2.8-0.4-4.3-0.4c-1.3,0-2.6,0.1-3.6,0.5\r\n\t\ts-1.6,0.9-1.6,1.8c0,1.1,1,1.9,2.4,2.5c0.7,0.4,1.6,0.7,2.5,1c1.9,0.7,3.9,1.4,5.8,2.3c1.9,1,3.4,2.3,4.3,4.1\r\n\t\tc0.4,0.9,0.7,2,0.7,3.2c0,3.2-1.7,5.6-4.2,7.3c-2.5,1.7-5.8,2.5-9.1,2.5c-3.1,0-6.1-0.8-8.4-2.4V28.6z\"/>\r\n\t<path fill=\"#ffffff\" d=\"M83.3,6h7.2l5.8,11.8L102.1,6h7.3l-9.4,19.4V37h-7.2V25.4L83.3,6z\"/>\r\n\t<path fill=\"#ffffff\" d=\"M129.3,34.1v2.2c-2,0.8-3.8,1.2-5.7,1.2c-2.9,0-5.7-0.9-7.8-3s-3.4-5.3-3.4-9.8c0-4.5,1.3-7.6,3.3-9.6c2-2,4.8-2.9,7.8-2.9\r\n\t\tc1.9,0,3.7,0.3,5.7,1.2v2.1l-0.2,0.3c-1.7-0.7-3.3-0.9-5-0.9c-2.4,0-4.6,0.6-6.2,2.2c-1.6,1.5-2.6,4-2.6,7.6s1,6.2,2.6,7.9\r\n\t\tc1.6,1.7,3.8,2.5,6.2,2.5c1.6,0,3.3-0.3,5-0.9L129.3,34.1z\"/>\r\n\t<path fill=\"#ffffff\" d=\"M138.6,3.4v11.4c2.3-1.5,4.8-2.7,7.5-2.7c1.9,0,3.9,0.6,5.4,1.8c1.5,1.3,2.5,3.2,2.5,6v17h-2.7v-16c0-2.2-0.7-3.7-1.7-4.8\r\n\t\tc-1-1-2.4-1.5-3.9-1.5c-1.2,0-2.5,0.3-3.7,0.8c-1.2,0.5-2.4,1.2-3.3,2V37h-2.7V3.9l2.4-0.5H138.6z\"/>\r\n\t<path fill=\"#ffffff\" d=\"M177.2,28.8c0,1.4,0.3,2.8,0.9,3.9c0.6,1.1,1.6,1.9,2.9,2.2l-1.5,2.5c-1.8-0.6-3.1-2-3.9-3.8c-0.6,1.1-1.6,2-2.8,2.7\r\n\t\tc-1.2,0.7-2.8,1.1-4.5,1.1c-1.6,0-3.6-0.4-5.1-1.5c-1.6-1.1-2.7-3-2.7-6c0-2.3,0.7-4,2.2-5.2s3.9-1.8,7.2-1.8\r\n\t\tc1.2,0,2.7,0.1,4.9,0.3v-3.4c0-1.9-0.7-3.2-1.6-4c-1-0.8-2.3-1.1-3.6-1.1c-1.8,0-4.4,0.5-6.6,1.6l-0.7-2.5c2.3-1.1,5-1.7,7.4-1.7\r\n\t\tc2.1,0,4,0.5,5.5,1.7c1.4,1.2,2.3,3.3,2.3,6.3V28.8z M174.5,25.6c-1.8-0.2-2.7-0.2-3.8-0.2c-1.4,0-3.3,0-4.9,0.6\r\n\t\tc-1.6,0.6-2.8,1.7-2.8,3.8c0,1.3,0.5,2.6,1.4,3.5c0.9,0.9,2.2,1.5,3.9,1.5c2.6,0,4.7-1.3,6.1-4V25.6z\"/>\r\n\t<path fill=\"#ffffff\" d=\"M187.6,12.6l0.8,2.5c1.8-2,3.9-3,6.1-3c1.2,0,2.2,0.3,3.3,0.7l-0.9,2.4c-1.2-0.4-1.7-0.6-2.7-0.6c-2.4,0-4.2,1.2-5.9,3.4\r\n\t\tV37h-2.7V12.6H187.6z\"/>\r\n\t<path fill=\"#ffffff\" d=\"M215.1,36.6c-1.7,0.6-3.2,0.9-4.6,0.9c-1.3,0-3.1-0.3-4.6-1.4c-1.5-1.2-2.6-3.2-2.6-6.8v-14h-2.7v-2.7h2.7V8.2l2.4-0.4h0.3\r\n\t\tv4.9h6v2.7h-6v12.5c0,2.6,0.4,4.3,1.3,5.4c0.8,1.1,2,1.6,3.4,1.6c1.1,0,2.3-0.3,3.7-0.8L215.1,36.6z\"/>\r\n</g>\r\n<g>\r\n\t<path fill=\"#97CCC2\" d=\"M4,46.5v3.3C4.7,49.3,5.4,49,6.2,49c0.5,0,1.1,0.2,1.6,0.5c0.4,0.4,0.7,0.9,0.7,1.7v5H7.7v-4.7\r\n\t\tc0-0.6-0.2-1.1-0.5-1.4c-0.3-0.3-0.7-0.4-1.1-0.4c-0.4,0-0.7,0.1-1.1,0.2c-0.4,0.2-0.7,0.4-1,0.6v5.7H3.3v-9.6L4,46.5L4,46.5z\"/>\r\n\t<path fill=\"#97CCC2\" d=\"M11.6,47.4c0-0.2,0.1-0.3,0.2-0.4c0.1-0.1,0.3-0.2,0.4-0.2s0.3,0.1,0.4,0.2c0.1,0.1,0.2,0.2,0.2,0.4\r\n\t\tc0,0.1-0.1,0.3-0.2,0.4c-0.1,0.1-0.3,0.2-0.4,0.2s-0.3-0.1-0.4-0.2C11.7,47.7,11.6,47.5,11.6,47.4z M11.8,56.2v-7.1h0.8v7.1H11.8z\"\r\n\t\t/>\r\n\t<path fill=\"#97CCC2\" d=\"M18.8,54.8c1,0,1.7,0.2,2.1,0.6c0.5,0.4,0.7,0.9,0.7,1.4c0,0.7-0.5,1.4-1.2,1.9s-1.6,0.8-2.5,0.8\r\n\t\tc-0.8,0-1.5-0.3-1.9-0.7c-0.5-0.4-0.7-1-0.7-1.5c0-0.7,0.3-1.4,0.9-1.9c-0.4-0.2-0.6-0.6-0.6-1c0-0.4,0.2-0.9,0.5-1.3\r\n\t\tc-0.4-0.4-0.6-1-0.6-1.6c0-0.7,0.3-1.3,0.7-1.7c0.5-0.4,1.1-0.7,1.9-0.7c0.6,0,1.1,0.2,1.5,0.4c0.3-0.2,0.6-0.4,0.9-0.6\r\n\t\tc0.3-0.1,0.6-0.2,0.8-0.2l0.3,0.7c-0.4,0-0.9,0.2-1.3,0.6c0.3,0.4,0.5,0.9,0.5,1.4c0,0.7-0.3,1.3-0.7,1.7s-1.1,0.7-1.9,0.7\r\n\t\tc-0.6,0-1-0.1-1.4-0.4c-0.2,0.2-0.3,0.5-0.3,0.6c0,0.1,0.1,0.3,0.2,0.4c0.1,0.1,0.4,0.2,0.6,0.2H18.8z M16.8,55.5\r\n\t\tc-0.5,0.5-0.8,1.1-0.8,1.7c0,0.4,0.2,0.8,0.5,1.1s0.8,0.5,1.5,0.5c0.8,0,1.5-0.2,2-0.6s0.8-0.8,0.8-1.3c0-0.6-0.3-0.9-0.8-1.1\r\n\t\ts-1.3-0.2-2.1-0.2H16.8z M18.1,49.8c-0.6,0-1.1,0.2-1.4,0.5c-0.3,0.3-0.5,0.7-0.5,1.1s0.2,0.8,0.5,1.1s0.8,0.5,1.4,0.5\r\n\t\tc0.6,0,1.1-0.2,1.4-0.5s0.4-0.7,0.4-1.1s-0.2-0.8-0.5-1.1C19.1,50,18.7,49.8,18.1,49.8z\"/>\r\n\t<path fill=\"#97CCC2\" d=\"M24.7,46.5v3.3c0.7-0.4,1.4-0.8,2.2-0.8c0.5,0,1.1,0.2,1.6,0.5c0.4,0.4,0.7,0.9,0.7,1.7v5h-0.8v-4.7\r\n\t\tc0-0.6-0.2-1.1-0.5-1.4c-0.3-0.3-0.7-0.4-1.1-0.4c-0.4,0-0.7,0.1-1.1,0.2c-0.4,0.2-0.7,0.4-1,0.6v5.7h-0.8v-9.6L24.7,46.5\r\n\t\tL24.7,46.5z\"/>\r\n\t<path fill=\"#97CCC2\" d=\"M36.7,55.4V56c-0.6,0.2-1.1,0.3-1.7,0.3c-0.9,0-1.7-0.3-2.3-0.9s-1-1.5-1-2.9c0-1.3,0.4-2.2,1-2.8\r\n\t\ts1.4-0.8,2.3-0.8c0.6,0,1.1,0.1,1.7,0.3V50L36.7,50c-0.5-0.2-1-0.3-1.5-0.3c-0.7,0-1.4,0.2-1.8,0.6s-0.8,1.2-0.8,2.2\r\n\t\ts0.3,1.8,0.8,2.3s1.1,0.7,1.8,0.7C35.7,55.6,36.2,55.5,36.7,55.4L36.7,55.4z\"/>\r\n\t<path fill=\"#97CCC2\" d=\"M40.2,46.5v3.3c0.7-0.4,1.4-0.8,2.2-0.8c0.5,0,1.1,0.2,1.6,0.5c0.4,0.4,0.7,0.9,0.7,1.7v5h-0.8v-4.7\r\n\t\tc0-0.6-0.2-1.1-0.5-1.4c-0.3-0.3-0.7-0.4-1.1-0.4c-0.4,0-0.7,0.1-1.1,0.2c-0.4,0.2-0.7,0.4-1,0.6v5.7h-0.8v-9.6L40.2,46.5\r\n\t\tL40.2,46.5z\"/>\r\n\t<path fill=\"#97CCC2\" d=\"M52.3,53.9c0,0.4,0.1,0.8,0.3,1.1s0.5,0.6,0.8,0.6l-0.4,0.7c-0.5-0.2-0.9-0.6-1.1-1.1\r\n\t\tc-0.2,0.3-0.5,0.6-0.8,0.8s-0.8,0.3-1.3,0.3c-0.5,0-1-0.1-1.5-0.4c-0.5-0.3-0.8-0.9-0.8-1.8c0-0.7,0.2-1.2,0.6-1.5s1.1-0.5,2.1-0.5\r\n\t\tc0.4,0,0.8,0,1.4,0.1v-1c0-0.5-0.2-0.9-0.5-1.2s-0.7-0.3-1.1-0.3c-0.5,0-1.3,0.2-1.9,0.5l-0.2-0.7c0.7-0.3,1.4-0.5,2.2-0.5\r\n\t\tc0.6,0,1.2,0.1,1.6,0.5c0.4,0.4,0.7,1,0.7,1.8V53.9z M51.5,52.9c-0.5-0.1-0.8-0.1-1.1-0.1c-0.4,0-1,0-1.4,0.2\r\n\t\tc-0.5,0.2-0.8,0.5-0.8,1.1c0,0.4,0.1,0.8,0.4,1c0.3,0.3,0.6,0.4,1.1,0.4c0.8,0,1.4-0.4,1.8-1.2V52.9z\"/>\r\n\t<path fill=\"#97CCC2\" d=\"M56.1,49.1l0.2,0.7c0.5-0.6,1.1-0.9,1.8-0.9c0.3,0,0.6,0.1,1,0.2l-0.3,0.7c-0.3-0.1-0.5-0.2-0.8-0.2\r\n\t\tc-0.7,0-1.2,0.3-1.7,1v5.5h-0.8v-7.1H56.1z\"/>\r\n\t<path fill=\"#97CCC2\" d=\"M64.9,56.1c-0.5,0.2-0.9,0.3-1.3,0.3c-0.4,0-0.9-0.1-1.3-0.4s-0.8-0.9-0.8-2v-4.1h-0.8v-0.8h0.8v-1.3\r\n\t\tl0.7-0.1h0.1v1.4H64v0.8h-1.7v3.7c0,0.7,0.1,1.3,0.4,1.6c0.2,0.3,0.6,0.5,1,0.5c0.3,0,0.7-0.1,1.1-0.2L64.9,56.1z\"/>\r\n\t<path fill=\"#97CCC2\" d=\"M66.6,55.4c0.2,0.1,0.4,0.1,0.7,0.2c0.3,0,0.5,0.1,0.8,0.1c0.4,0,0.9-0.1,1.3-0.3c0.4-0.2,0.7-0.5,0.7-1\r\n\t\tc0-0.5-0.4-0.8-0.9-1.1c-0.3-0.1-0.5-0.3-0.8-0.4c-0.6-0.2-1.1-0.6-1.5-1.1c-0.2-0.2-0.3-0.6-0.3-0.9c0-0.6,0.3-1.1,0.7-1.4\r\n\t\tc0.4-0.3,1-0.5,1.7-0.5c0.5,0,0.9,0.1,1.3,0.2v0.7l0,0c-0.3-0.1-0.8-0.2-1.3-0.2c-0.4,0-0.8,0.1-1,0.2c-0.3,0.2-0.4,0.4-0.4,0.8\r\n\t\tc0,0.4,0.2,0.7,0.5,0.9c0.3,0.2,0.8,0.4,1.2,0.6c0.4,0.2,0.9,0.4,1.2,0.7c0.3,0.3,0.5,0.7,0.5,1.3c0,0.7-0.3,1.3-0.9,1.6\r\n\t\tc-0.5,0.4-1.2,0.6-2,0.6c-0.5,0-1-0.1-1.5-0.3L66.6,55.4L66.6,55.4z\"/>\r\n\t<path fill=\"#97CCC2\" d=\"M76.2,51.9v0.8h-3.4v-0.8H76.2z\"/>\r\n\t<path fill=\"#97CCC2\" d=\"M79.4,49.1l0.2,0.6c0.5-0.5,1.2-0.8,2-0.8c1,0,1.7,0.4,2.2,1.1s0.8,1.6,0.8,2.6c0,1.1-0.4,2-1,2.7\r\n\t\ts-1.5,1-2.5,1c-0.4,0-1-0.1-1.5-0.2v3.2h-0.8V49.1H79.4z M79.6,55.3c0.5,0.2,1,0.3,1.5,0.3c0.7,0,1.4-0.3,1.9-0.8s0.8-1.3,0.8-2.2\r\n\t\tc0-0.8-0.2-1.5-0.6-2s-1-0.9-1.8-0.9c-0.8,0-1.4,0.3-1.8,0.9V55.3z\"/>\r\n\t<path fill=\"#97CCC2\" d=\"M86.7,52.7c0-1,0.3-2,0.9-2.6S89,49,89.9,49c1,0,1.8,0.4,2.3,1.1c0.5,0.7,0.9,1.6,0.9,2.6\r\n\t\tc0,1-0.3,1.9-0.9,2.6s-1.4,1.1-2.3,1.1c-1,0-1.8-0.4-2.3-1.1S86.7,53.7,86.7,52.7z M87.5,52.6c0,0.8,0.2,1.6,0.6,2.1\r\n\t\tc0.4,0.5,1,0.9,1.8,0.9c0.8,0,1.4-0.3,1.8-0.8c0.4-0.5,0.6-1.2,0.6-2.1c0-0.8-0.2-1.6-0.6-2.1c-0.4-0.5-1-0.9-1.8-0.9\r\n\t\tc-0.8,0-1.4,0.3-1.8,0.8S87.5,51.8,87.5,52.6z\"/>\r\n\t<path fill=\"#97CCC2\" d=\"M101.7,56.2h-0.9l-1.7-5.7l-1.7,5.7h-0.9l-2.2-7.1h0.9l1.8,5.7l1.7-5.7h0.8l1.7,5.7l1.8-5.7h0.9L101.7,56.2\r\n\t\tz\"/>\r\n\t<path fill=\"#97CCC2\" d=\"M110.4,52.9H106c0,0.9,0.3,1.6,0.8,2.1c0.5,0.5,1.1,0.7,1.8,0.7c0.3,0,0.6,0,0.9-0.1\r\n\t\tc0.3-0.1,0.6-0.2,0.9-0.4l0,0v0.7c-0.7,0.4-1.4,0.5-2,0.5c-0.9,0-1.7-0.3-2.3-0.9s-1-1.6-1-2.9c0-1,0.2-1.9,0.7-2.6s1.2-1,2.3-1\r\n\t\tc0.7,0,1.2,0.2,1.5,0.5c0.3,0.3,0.5,0.7,0.6,1.2s0.1,1,0.1,1.4V52.9z M109.6,52.1c0-0.6-0.1-1.2-0.3-1.6c-0.2-0.4-0.6-0.7-1.3-0.7\r\n\t\tc-0.7,0-1.1,0.2-1.5,0.7c-0.3,0.4-0.5,1-0.6,1.7H109.6z\"/>\r\n\t<path fill=\"#97CCC2\" d=\"M113.7,49.1l0.2,0.7c0.5-0.6,1.1-0.9,1.8-0.9c0.3,0,0.6,0.1,1,0.2l-0.3,0.7c-0.3-0.1-0.5-0.2-0.8-0.2\r\n\t\tc-0.7,0-1.2,0.3-1.7,1v5.5h-0.8v-7.1H113.7z\"/>\r\n\t<path fill=\"#9ABF99\" d=\"M123.9,47.4c0-0.2,0.1-0.3,0.2-0.4c0.1-0.1,0.3-0.2,0.4-0.2s0.3,0.1,0.4,0.2c0.1,0.1,0.2,0.2,0.2,0.4\r\n\t\tc0,0.1-0.1,0.3-0.2,0.4c-0.1,0.1-0.3,0.2-0.4,0.2s-0.3-0.1-0.4-0.2C124,47.7,123.9,47.5,123.9,47.4z M124.1,56.2v-7.1h0.8v7.1\r\n\t\tH124.1z\"/>\r\n\t<path fill=\"#9ABF99\" d=\"M128.9,49.1l0.2,0.7c0.7-0.4,1.4-0.8,2.2-0.8c0.5,0,1.1,0.2,1.6,0.5c0.4,0.4,0.7,0.9,0.7,1.7v5h-0.8v-4.7\r\n\t\tc0-0.6-0.2-1.1-0.5-1.4s-0.7-0.4-1.1-0.4c-0.4,0-0.7,0.1-1.1,0.2c-0.4,0.2-0.7,0.4-1,0.6v5.7h-0.8v-7.1H128.9z\"/>\r\n\t<path fill=\"#9ABF99\" d=\"M143.6,55l2-5.8h0.9l-3.1,8.9c-0.2,0.5-0.5,0.9-0.8,1.1s-0.7,0.3-1.1,0.3c-0.5,0-1-0.1-1.4-0.4l0.4-0.9\r\n\t\tc0.3,0.2,0.6,0.3,0.9,0.3c0.6,0,1.1-0.3,1.3-1l0.4-1.3l-2.4-7.1h0.9L143.6,55z\"/>\r\n\t<path fill=\"#9ABF99\" d=\"M148.1,52.7c0-1,0.3-2,0.9-2.6s1.4-1.1,2.3-1.1c1,0,1.8,0.4,2.3,1.1c0.5,0.7,0.9,1.6,0.9,2.6\r\n\t\tc0,1-0.3,1.9-0.9,2.6s-1.4,1.1-2.3,1.1c-1,0-1.8-0.4-2.3-1.1S148.1,53.7,148.1,52.7z M148.9,52.6c0,0.8,0.2,1.6,0.6,2.1\r\n\t\tc0.4,0.5,1,0.9,1.8,0.9c0.8,0,1.4-0.3,1.8-0.8c0.4-0.5,0.6-1.2,0.6-2.1c0-0.8-0.2-1.6-0.6-2.1c-0.4-0.5-1-0.9-1.8-0.9\r\n\t\tc-0.8,0-1.4,0.3-1.8,0.8S148.9,51.8,148.9,52.6z\"/>\r\n\t<path fill=\"#9ABF99\" d=\"M161.9,56.2l-0.2-0.7c-0.3,0.2-0.7,0.4-1.1,0.6s-0.8,0.2-1.2,0.2c-0.5,0-1.1-0.2-1.6-0.5\r\n\t\tc-0.4-0.4-0.7-0.9-0.7-1.7v-5h0.8v4.7c0,0.6,0.2,1.1,0.5,1.4c0.3,0.3,0.7,0.4,1.1,0.4c0.4,0,0.7-0.1,1.1-0.3c0.3-0.2,0.7-0.4,1-0.6\r\n\t\tv-5.7h0.8v7.1H161.9z\"/>\r\n\t<path fill=\"#9ABF99\" d=\"M166.4,49.1l0.2,0.7c0.5-0.6,1.1-0.9,1.8-0.9c0.3,0,0.6,0.1,1,0.2l-0.3,0.7c-0.3-0.1-0.5-0.2-0.8-0.2\r\n\t\tc-0.7,0-1.2,0.3-1.7,1v5.5h-0.8v-7.1H166.4z\"/>\r\n\t<path fill=\"#9ABF99\" d=\"M177.6,46.5v3.3c0.7-0.4,1.4-0.8,2.2-0.8c0.5,0,1.1,0.2,1.6,0.5c0.4,0.4,0.7,0.9,0.7,1.7v5h-0.8v-4.7\r\n\t\tc0-0.6-0.2-1.1-0.5-1.4c-0.3-0.3-0.7-0.4-1.1-0.4c-0.4,0-0.7,0.1-1.1,0.2c-0.4,0.2-0.7,0.4-1,0.6v5.7h-0.8v-9.6L177.6,46.5\r\n\t\tL177.6,46.5z\"/>\r\n\t<path fill=\"#9ABF99\" d=\"M189.7,53.9c0,0.4,0.1,0.8,0.3,1.1s0.5,0.6,0.8,0.6l-0.4,0.7c-0.5-0.2-0.9-0.6-1.1-1.1\r\n\t\tc-0.2,0.3-0.5,0.6-0.8,0.8s-0.8,0.3-1.3,0.3c-0.5,0-1-0.1-1.5-0.4c-0.5-0.3-0.8-0.9-0.8-1.8c0-0.7,0.2-1.2,0.6-1.5s1.1-0.5,2.1-0.5\r\n\t\tc0.4,0,0.8,0,1.4,0.1v-1c0-0.5-0.2-0.9-0.5-1.2s-0.7-0.3-1.1-0.3c-0.5,0-1.3,0.2-1.9,0.5l-0.2-0.7c0.7-0.3,1.4-0.5,2.2-0.5\r\n\t\tc0.6,0,1.2,0.1,1.6,0.5c0.4,0.4,0.7,1,0.7,1.8V53.9z M188.9,52.9c-0.5-0.1-0.8-0.1-1.1-0.1c-0.4,0-1,0-1.4,0.2\r\n\t\tc-0.5,0.2-0.8,0.5-0.8,1.1c0,0.4,0.1,0.8,0.4,1c0.3,0.3,0.6,0.4,1.1,0.4c0.8,0,1.4-0.4,1.8-1.2V52.9z\"/>\r\n\t<path fill=\"#9ABF99\" d=\"M193.8,49.1l0.2,0.7c0.7-0.4,1.4-0.8,2.2-0.8c0.5,0,1.1,0.2,1.6,0.5c0.4,0.4,0.7,0.9,0.7,1.7v5h-0.8v-4.7\r\n\t\tc0-0.6-0.2-1.1-0.5-1.4s-0.7-0.4-1.1-0.4c-0.4,0-0.7,0.1-1.1,0.2c-0.4,0.2-0.7,0.4-1,0.6v5.7h-0.8v-7.1H193.8z\"/>\r\n\t<path fill=\"#9ABF99\" d=\"M206.9,56.2h-0.6l-0.2-0.6c-0.5,0.5-1.2,0.8-2,0.8c-0.9,0-1.7-0.4-2.2-1.1c-0.5-0.7-0.8-1.6-0.8-2.7\r\n\t\tc0-1,0.3-1.9,0.8-2.5s1.4-1,2.7-1c0.5,0,1,0.1,1.5,0.2v-2.6l0.7-0.1h0.1V56.2z M206.2,50.1c-0.5-0.2-1-0.4-1.5-0.4\r\n\t\tc-0.8,0-1.4,0.2-1.9,0.7s-0.8,1.2-0.8,2.2c0,0.8,0.2,1.5,0.6,2c0.4,0.5,1,0.9,1.8,0.9c0.8,0,1.4-0.3,1.9-0.9V50.1z\"/>\r\n\t<path fill=\"#9ABF99\" d=\"M209.7,55.4c0.2,0.1,0.4,0.1,0.7,0.2s0.5,0.1,0.8,0.1c0.4,0,0.9-0.1,1.3-0.3c0.4-0.2,0.7-0.5,0.7-1\r\n\t\tc0-0.5-0.4-0.8-0.9-1.1c-0.3-0.1-0.5-0.3-0.8-0.4c-0.6-0.2-1.1-0.6-1.5-1.1c-0.2-0.2-0.3-0.6-0.3-0.9c0-0.6,0.3-1.1,0.7-1.4\r\n\t\ts1-0.5,1.7-0.5c0.5,0,0.9,0.1,1.3,0.2v0.7l0,0c-0.3-0.1-0.8-0.2-1.3-0.2c-0.4,0-0.8,0.1-1,0.2c-0.3,0.2-0.4,0.4-0.4,0.8\r\n\t\tc0,0.4,0.2,0.7,0.5,0.9c0.3,0.2,0.8,0.4,1.2,0.6c0.4,0.2,0.9,0.4,1.2,0.7c0.3,0.3,0.5,0.7,0.5,1.3c0,0.7-0.3,1.3-0.9,1.6\r\n\t\tc-0.5,0.4-1.2,0.6-2,0.6c-0.5,0-1-0.1-1.5-0.3L209.7,55.4L209.7,55.4z\"/>\r\n</g>\r\n<circle fill=\"#97CCC2\" cx=\"231.8\" cy=\"31.1\" r=\"5.8\"/>\r\n</svg>\r\n";
self["pie"] = "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t viewBox=\"-461 322 100 100\" style=\"enable-background:new -461 322 100 100;\" xml:space=\"preserve\">\r\n<g>\r\n\t<g>\r\n\t\t<path d=\"M-411,420.5c-26.7,0-48.5-21.8-48.5-48.5s21.8-48.5,48.5-48.5c26.7,0,48.5,21.8,48.5,48.5\r\n\t\t\tC-362.5,398.7-384.3,420.5-411,420.5z M-411,326.5c-25.1,0-45.5,20.4-45.5,45.5s20.4,45.5,45.5,45.5s45.5-20.4,45.5-45.5\r\n\t\t\tS-385.9,326.5-411,326.5z\"/>\r\n\t</g>\r\n\t<g>\r\n\t\t<path d=\"M-378.2,406.8c-0.3,0-0.5-0.1-0.7-0.3l-33.8-33.8c-0.2-0.2-0.3-0.4-0.3-0.7v-47c0-0.6,0.4-1,1-1s1,0.4,1,1v46.6l33.5,33.5\r\n\t\t\tc0.4,0.4,0.4,1,0,1.4C-377.7,406.7-378,406.8-378.2,406.8z\"/>\r\n\t</g>\r\n\t<g>\r\n\t\t<path d=\"M-364,373h-48c-0.6,0-1-0.4-1-1s0.4-1,1-1h48c0.6,0,1,0.4,1,1S-363.4,373-364,373z\"/>\r\n\t</g>\r\n</g>\r\n</svg>\r\n";
self["readme"] = "\nIMPORTANT NOTICE:\n-----------------\n\nAll icons by Agus Purwanto from the Noun Project. Thanks a lot!\nhttps://thenounproject.com/Brexebrex/collection/chart-icons/";
self["spider"] = "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\r\n\t viewBox=\"-461 322 100 100\" style=\"enable-background:new -461 322 100 100;\" xml:space=\"preserve\">\r\n<g>\r\n\t<g>\r\n\t\t<path d=\"M-375,417.5c-0.4,0-0.9-0.2-1.2-0.5l-34.8-42.6l-34.8,42.6c-0.5,0.6-1.5,0.7-2.1,0.2c-0.6-0.5-0.7-1.5-0.2-2.1l36-44\r\n\t\t\tc0.6-0.7,1.8-0.7,2.3,0l36,44c0.5,0.6,0.4,1.6-0.2,2.1C-374.3,417.4-374.7,417.5-375,417.5z\"/>\r\n\t</g>\r\n\t<g>\r\n\t\t<path d=\"M-411.4,374c-0.2,0-0.5-0.1-0.7-0.2l-45.6-23.5c-0.7-0.4-1-1.3-0.6-2c0.4-0.7,1.3-1,2-0.6l44.9,23.2l44.7-23.2\r\n\t\t\tc0.7-0.4,1.6-0.1,2,0.6s0.1,1.6-0.6,2l-45.4,23.5C-411,374-411.2,374-411.4,374z\"/>\r\n\t</g>\r\n\t<g>\r\n\t\t<path d=\"M-411.5,374.5c-0.8,0-1.5-0.7-1.5-1.5v-49c0-0.8,0.7-1.5,1.5-1.5s1.5,0.7,1.5,1.5v49C-410,373.8-410.7,374.5-411.5,374.5z\r\n\t\t\t\"/>\r\n\t</g>\r\n\t<g>\r\n\t\t<path d=\"M-412,339.1l32,17.8l-6.8,45.1H-436l-6.4-45.1L-412,339.1 M-412,337.1c-0.3,0-0.7,0.1-1,0.3l-30.5,17.5\r\n\t\t\tc-0.7,0.4-1.1,1.2-1,2l6.4,45.1c0.1,1,1,2,2,2h49.2c1,0,1.8-1,2-1.9l6.8-44.9c0.1-0.8-0.3-1.7-1-2.1l-32-17.6\r\n\t\t\tC-411.3,337.2-411.7,337.1-412,337.1L-412,337.1z\"/>\r\n\t</g>\r\n\t<g>\r\n\t\t<path d=\"M-411.8,349.1l21.7,12.2l-4.6,30.7h-33.4l-4.4-30.7L-411.8,349.1 M-411.8,347.1c-0.3,0-0.7,0.1-1,0.3l-20.7,11.9\r\n\t\t\tc-0.7,0.4-1.1,1.2-1,2l4.4,30.7c0.1,1,1,2,2,2h33.4c1,0,1.8-1,2-1.9l4.6-30.6c0.1-0.8-0.3-1.7-1-2.1l-21.7-12\r\n\t\t\tC-411.1,347.2-411.4,347.1-411.8,347.1L-411.8,347.1z\"/>\r\n\t</g>\r\n\t<g>\r\n\t\t<path d=\"M-411.5,358.1l12.5,7.1l-2.7,17.8h-19.2l-2.5-17.8L-411.5,358.1 M-411.5,356.1c-0.3,0-0.7,0.1-1,0.3l-11.9,6.8\r\n\t\t\tc-0.7,0.4-1.1,1.2-1,2l2.5,17.8c0.1,1,1,2,2,2h19.2c1,0,1.8-1,2-1.9l2.7-17.6c0.1-0.8-0.3-1.7-1-2.1l-12.5-6.9\r\n\t\t\tC-410.9,356.2-411.2,356.1-411.5,356.1L-411.5,356.1z\"/>\r\n\t</g>\r\n</g>\r\n</svg>\r\n";
return self})();
    var virtualize = require('vdom-virtualize');
    var _ = {
        isUndefined: require('lodash.isundefined')
    };
    var that = {};
    that.get = function(id){
        if(!_.isUndefined(icons[id])){
            var logo = document.createElement('div');
            logo.innerHTML = icons[id];
            return virtualize(logo.firstChild);

        } else {
            console.log('Icon not found');
        }
    };

    module.exports = that;
})();

},{"fs":5,"lodash.isundefined":67,"vdom-virtualize":90}],134:[function(require,module,exports){
(function () {

    var _ = {
        isUndefined: require('lodash.isundefined'),
        cloneDeep: require('lodash.clonedeep'),
        forEach: require('lodash.foreach'),
        first: require('lodash.first'),
        isArray: require('lodash.isarray'),
        isString: require('lodash.isstring')
    };
    var h = require('virtual-dom/h');
    var that = {};

    that.get = function (option ,configService, indexName ) {
        if (option) {
            var localProperty = _.cloneDeep(option);
            // sometimes we will get an index name, this will be a name with an index.
            // e.g. series are arrays and have indexes : series.0.name
            localProperty.fullname = !_.isUndefined(indexName) ? indexName: option.fullname;
            return that.createProperty(localProperty, configService);
        }
    };

    that.createProperty = function (property, configService) {
        var element;
        var configValue = configService.getValue(property.fullname);

        if (!_.isUndefined(property.defaults) && !_.isArray(property.defaults)) {
            // defaults is a string
            if(_.isString(property.defaults)){
                property.defaults = property.defaults.replace(/\[|\]|\"/g, '').split(',');
            }
            if (property.defaults.length == 1) {
                property.defaults = _.first(property.defaults).trim();
                configValue = configValue ? configValue : property.defaults;
            } else if (property.defaults.length > 1) {
                if (!configValue) {

                    configValue = [];
                }
                _.forEach(property.defaults, function (defaultValue, index) {
                    configValue[index] = configValue && configValue[index] ? configValue[index] : property.defaults[index].trim();
                })
            }
        }

        if (property.hasOwnProperty('values') && property.values !== '') {
            var options = [];
            values = property.values.replace(/\[|\]|\"|\s/g, '').split(',');
            _.forEach(values, function (value) {
                var selected = value == configValue;

                var item = h('option', {
                    value: value,
                    selected: selected
                }, value === 'null' ? '' : value);
                options.push(item);
            });
            element = h('select', {
                'onchange': function (e) {
                    if(e.target.value === 'null'){
                        configService.removeValue(property.fullname);
                    } else {
                        configService.setValue(property.fullname, e.target.value);
                    }
                }
            }, options);
        }
        else {
            switch (property.returnType.toLowerCase()) {
                case 'number':
                    var defaultValue = configValue ? configValue : '';
                    element = h('input', {
                        'type': 'number',
                        'value': defaultValue,
                        'onchange': function (e) {
                            if (parseInt(property.defaults) !== parseInt(e.target.value)) {
                                configService.setValue(property.fullname, parseInt(e.target.value));
                            } else {
                                configService.removeValue(property.fullname);
                            }
                        }
                    });
                    break;

                case 'array<color>':
                    var list = [];
                    var values = !_.isUndefined(configValue) ? configValue : [];
                    _.forEach(property.defaults, function (value, index) {
                        //values.push(configValue[index]);
                        list.push(h('div', [
                            h('span', property.title + ' ' + index + ' :'),
                            h('input', {
                                'type': 'text',
                                'value': !_.isUndefined(configValue) && !_.isUndefined(configValue[index]) ? configValue[index] : property.defaults[index],
                                'onchange': function (e) {
                                    values[index] = e.target.value != '' ? e.target.value : property.defaults[index];
                                    if (_.isEqual(property.defaults, values)) {
                                        configService.removeValue(property.fullname);
                                    } else {
                                        configService.setValue(property.fullname, values);
                                    }
                                }
                            })
                        ]))
                    });
                    element = h('div', list);
                    break;

                case 'boolean':
                    property.defaults = property.defaults == 'true';
                    if(_.isString(configValue)){
                        configValue = configValue == 'true';
                    }

                    element = h('input', {
                        'type': 'checkbox',
                        'checked': configValue,
                        'onchange': function (e) {
                            if (property.defaults !== e.target.checked) {
                                configService.setValue(property.fullname, e.target.checked);
                            } else {
                                configService.removeValue(property.fullname);
                            }
                        }
                    });
                    break;

                case 'string':
                    element = h('input', {
                        'type': 'text',
                        'value': configValue,
                        'onchange': function (e) {
                            if (property.defaults !== e.target.value) {
                                configService.setValue(property.fullname, e.target.value);
                            } else {
                                configService.removeValue(property.fullname);
                            }
                        }
                    });
                    break;
                case 'function':
                    element = h('input', {
                        'type': 'text',
                        'value': configValue,
                        'onchange': function (e) {
                            if (property.defaults !== e.target.value) {
                                configService.setValue(property.fullname, eval(e.target.value));
                            } else {
                                configService.removeValue(property.fullname);
                            }
                        }
                    });
                    break;
                default:
                    element = h('input', {
                        'type': 'text',
                        'value': configValue,
                        'onchange': function (e) {
                            if (property.defaults !== e.target.value) {
                                configService.setValue(property.fullname, e.target.value);
                            } else {
                                configService.removeValue(property.fullname);
                            }
                        }
                    });
                    break;
            }
        }
        // return div > label > title + element
        return h('div',h('label',{title:property.description},[property.title,element]));
    };

    module.exports = that;
})();
},{"lodash.clonedeep":51,"lodash.first":55,"lodash.foreach":56,"lodash.isarray":58,"lodash.isstring":65,"lodash.isundefined":67,"virtual-dom/h":94}],135:[function(require,module,exports){
(function () {
    var that = {};
    var _ = {
        isUndefined: require('lodash.isundefined'),
        find: require('lodash.find'),
        map: require('lodash.map'),
        cloneDeep: require('lodash.clonedeep'),
        remove: require('lodash.remove'),
        forEach: require('lodash.foreach'),
        first: require('lodash.first'),
        union: require('lodash.union'),
        slice: require('lodash.slice'),
        drop: require('lodash.drop'),
        size: require('lodash.size'),
        isArray: require('lodash.isarray'),
        isEmpty: require('lodash.isempty'),
        merge: require('lodash.merge')
    };

    that.get = function(data, config, labels, categories, series) {
        var object = generateDataSeries(config, data);
        if(labels.categories){
            object = setCategories(object, categories);
        }
        if(labels.series){
            object = setSeries(object, series);
        }
        return object;
    };



    function setCategories (series, categorieLabels){
        _.forEach(series ,function(item, index){
            _.forEach(item.data, function (row, dataIndex) {
                series[index]['data'][dataIndex] = _.union([categorieLabels[dataIndex]], row);
            });
        });
        return series;
    }

    function setSeries (series, seriesLabels){
        seriesLabels = _.remove(seriesLabels, function(n) {
            return !_.isEmpty(n);
        });

        _.forEach(series ,function(item, index){
            if(_.isUndefined(series[index].name)){
                series[index].name = seriesLabels[index];
            }
        });

        return series;
    }

    function generateEmptySeries(series, defaultType, size){
        var array = [];
        _.forEach(series, function(item){
            if(size > 0){
                var object = {
                    data: [],
                    type: item.type
                };
                size = size - getValuesPerPoint(object.type);
                array.push(object);
            }
        });

        while(size > 0){
            var object = {
                data: []
            };
            size = size - getValuesPerPoint(defaultType);
            array.push(object);
        }
        return array;
    }

    function generateDataSeries(config, data){
        var emptySeries = generateEmptySeries(config.series, config.chart.type, _.size(_.first(data)));
        return _.map(emptySeries, function(item, index){

            var vpp = getValuesPerPoint(_.isUndefined(item.type) || item.type === null ? config.chart.type : item.type);

            _.forEach(data, function(row, index){
                item.data.push(parseDataFloat(_.slice(row,0,vpp)));
                data[index] = _.drop(data[index],vpp);
            });
            // check for series config and apply this
            if(!_.isUndefined(config.series) && !_.isUndefined(config.series[index])){
                item = _.merge(config.series[index], item);
            }
            return item;
        });

    }

    function getValuesPerPoint(type) {
        var vpp;
        switch (type) {
            case 'arearange':
            case 'areasplinerange':
            case 'columnrange':
            case 'errorbar':
            case 'scatter':
                vpp = 2;
                break;
            case 'bubble':
                vpp = 3;
                break;

            case 'boxplot':
                vpp = 5;
                break;

            default:
                vpp = 1;
                break;
        }
        return vpp;
    }

    function parseDataFloat(data) {
        var newData = [];
        _.forEach(data, function (value, index) {
            if (_.isArray(value)) {
                newData[index] = parseDataFloat(value);
            }
            else {
                newData[index] = value === '' || value === 'null' ? null : parseFloat(value);
            }
        });

        return newData;
    }

    module.exports = that;
})();

},{"lodash.clonedeep":51,"lodash.drop":53,"lodash.find":54,"lodash.first":55,"lodash.foreach":56,"lodash.isarray":58,"lodash.isempty":59,"lodash.isundefined":67,"lodash.map":70,"lodash.merge":71,"lodash.remove":73,"lodash.size":76,"lodash.slice":77,"lodash.union":81}],136:[function(require,module,exports){
(function () {
    var Delegator = require("dom-delegator");
    Delegator();
    function constructor(element){
        var router = require('./services/router.js');
        var dataService = require('./services/data');
        var confService = require('./services/config');
        var optionsService = require('./services/options');
        var mediator = require('mediatorjs');

        var mInstance = new mediator.Mediator();
        var data = new dataService(mInstance);
        var config = new confService(mInstance, data);
        var services = {
            data: data,
            config: new confService(mInstance, data),
            mediator: mInstance,
            options: new optionsService()
        };

        element.className += ' ec';
        new router(element, 'import', services);
        function setData (data){
            services.data.set(data);
        }

        function getData (){
            return services.data.get();
        }

        function setDataUrl(){

        }

        function setOptions(options){
            services.options.set(options);
        }

        function setConfig(config){
            services.config.set(config);
        }

        function getConfig(config){
            return services.config.getRaw(config);
        }

        function setConfigTemplate(configTemplate){
            services.config.setConfigTemplate(configTemplate);
        }
        return {
            setData:setData,
            getData:getData,
            setDataUrl:setDataUrl,
            setOptions:setOptions,
            setConfig:setConfig,
            getConfig:getConfig,
            setConfigTemplate: setConfigTemplate,
        }
    }

    window.ec = constructor;
})();

},{"./services/config":137,"./services/data":138,"./services/options":139,"./services/router.js":140,"dom-delegator":10,"mediatorjs":83}],137:[function(require,module,exports){
(function () {
    function constructor (mediator, data) {
        var _ = {
            isUndefined: require('lodash.isundefined'),
            find: require('lodash.find'),
            cloneDeep: require('lodash.clonedeep'),
            forEach: require('lodash.foreach'),
            merge: require('lodash.merge'),
            isEmpty: require('lodash.isempty')
        };
        var series = require('../factories/series.js');
        var templates = require('../config/templates.json');
        var that = {};
        var presetConf = {
            type: 'line',
            preset: 'dataLabels'
        };

        var configTemplate = {
            chart: {

            },
            plotOptions: {
                series: {
                    'animation': false
                }
            }
        };

        var config = _.cloneDeep(configTemplate);

        that.get = function () {
            var labels = hasLabels(data.get());
            var object = _.cloneDeep(config);
            object.series = series.get(data.getData(labels.series, labels.categories), object, labels, data.getCategories(), data.getSeries());
            return _.cloneDeep(object);
        };

        that.getRaw = function (){
            return _.cloneDeep(config);
        };

        that.set = function (_config_) {
            config = _.cloneDeep(_config_);
        };

        that.setConfigTemplate = function(newTemplate){
            configTemplate = newTemplate;
        };

        that.getConfigTemplate = function(){
            return _.cloneDeep(configTemplate);
        };

        that.reset = function (preset) {
            config = _.merge(_.cloneDeep(configTemplate), preset)
        };

        that.setValue = function (path, value) {
            ids = path.split('.');
            var step;
            var object = config;
            while (step = ids.shift()) {
                if (ids.length > 0) {
                    if (!_.isUndefined(object[step])) {
                        object = object[step];
                    } else {
                        object[step] = {};
                        object = object[step];
                    }
                } else {
                    object[step] = value;
                }
            }
            mediator.trigger('configUpdate');
            mediator.trigger('treeUpdate');
        };

        that.setValues = function (array) {
            _.forEach(array, function (row) {
                that.setValue(row[0], row[1]);
            });
            mediator.trigger('configUpdate');
            mediator.trigger('treeUpdate');
        };

        that.getValue = function (path) {
            var object = that.get();
            path = path.split('.');
            var step;
            while (step = path.shift()) {
                if (!_.isUndefined(object[step])) {
                    object = object[step];
                } else {
                    object = undefined;
                    break;
                }
            }
            return object;
        };

        that.removeValue = function (path) {
            var object = config;
            path = path.split('.');
            while (step = path.shift()) {
                if (!_.isUndefined(object[step])) {
                    if (path.length > 0) {
                        object = object[step];
                    } else {
                        delete object[step];
                    }
                }
            }
            mediator.trigger('configUpdate');
        };

        that.setPreset = function (type, preset) {
            presetConf = {
                type: type,
                preset: preset
            };
            that.reset(loadPreset(type, preset));
            mediator.trigger('configUpdate');
        };

        function loadPreset(type, preset) {
            var typeConfig = _.find(templates, {id: type});
            return _.cloneDeep(_.find(typeConfig.presets, {id: preset}).definition);
        }

        function hasLabels(data) {
            var labels = {
                categories: true,
                series: true
            };
            if (data[0]) {
                // if the first cell is empty, make the assumption that the first column are labels.
                if (_.isEmpty(data[0][0]) || data[0][0] == 'cat' || data[0][0] == 'categories') {
                    labels.categories = true;
                } else {
                    labels.categories = false;
                }
            }
            return labels;
        }

        return that;
    }

    module.exports = constructor;
})();
},{"../config/templates.json":132,"../factories/series.js":135,"lodash.clonedeep":51,"lodash.find":54,"lodash.foreach":56,"lodash.isempty":59,"lodash.isundefined":67,"lodash.merge":71}],138:[function(require,module,exports){
(function () {
    function constructor (_mediator_){
        var mediator = _mediator_;
        var _ = {
            isUndefined: require('lodash.isundefined'),
            find: require('lodash.find'),
            map: require('lodash.map'),
            cloneDeep: require('lodash.clonedeep'),
            slice: require('lodash.slice'),
            forEach: require('lodash.foreach'),
            first: require('lodash.first'),
            isEqual: require('lodash.isequal'),
            rest: require('lodash.rest'),
            isNaN: require('lodash.isnan')
        };

        var that = {};
        var dataSet = [];

        that.getSeries = function () {
            return _.cloneDeep(_.first(dataSet));
        };

        that.getCategories = function () {
            return _.cloneDeep(_.map(_.slice(dataSet, 1), function (row) {
                return _.first(row);
            }));
        };

        that.get = function () {
            return _.cloneDeep(dataSet);
        };
        that.getData = function (series, categories) {
            var data = dataSet;

            if (series) {
                data = _.slice(data, 1);
            }

            if (categories) {
                data = _.map(data, function (row) {
                    return _.rest(row);
                });
            }

            return _.cloneDeep(data);
        };

        that.set = function (newDataSet) {
            if (!_.isEqual(dataSet, newDataSet)) {
                dataSet = _.cloneDeep(newDataSet);
                mediator.trigger('dataUpdate', that.get());
                mediator.trigger('treeUpdate');
            }
        };

        that.setValue = function(row, cell, value){
            if(!_.isUndefined(dataSet[row]) && !_.isUndefined(dataSet[row][cell])){
                dataSet[row][cell] = _.isNaN(value) ? null : value;
            }
            mediator.trigger('dataValueUpdate', that.get());
        };


        return that;
    }


    module.exports = constructor;
})
();


},{"lodash.clonedeep":51,"lodash.find":54,"lodash.first":55,"lodash.foreach":56,"lodash.isequal":60,"lodash.isnan":62,"lodash.isundefined":67,"lodash.map":70,"lodash.rest":74,"lodash.slice":77}],139:[function(require,module,exports){
(function () {
    var constructor = function (services){
        var options = require('../config/options.json');
        var that = {};
        var _ = {
            cloneDeep: require('lodash.clonedeep')
        };
        that.get = function(){
            return _.cloneDeep(options);
        };

        that.set = function(_options_){
            options = _.cloneDeep(_options_);
        };

        return that;
    };

    module.exports = constructor;
})();

},{"../config/options.json":131,"lodash.clonedeep":51}],140:[function(require,module,exports){
(function () {
    var h = require('virtual-dom/h');
    var diff = require('virtual-dom/diff');
    var patch = require('virtual-dom/patch');
    var createElement = require('virtual-dom/create-element');
    var logo = require('./../templates/logo');
    var mainLoop = require("main-loop");
    function constructor(element, initState, services) {
        var states = {
            'import': {
                title: 'Import',
                dependencies: function(){
                    var that = {};
                    that.table = require('./../components/table.js')(services);
                    that.import = require('./../components/import.js')(services);
                    return that;
                },
                template: function (dependencies) {
                    return h('div', [dependencies.import.template(), dependencies.table.template()]);
                }
            },
            'templates': {
                title: 'Templates',
                dependencies: function(){
                    var that = {};
                    that.templates = require('./../components/templates.js')(services);
                    return that;
                },
                template: function (dependencies) {
                    return h('div', [dependencies.templates.template()]);
                }
            },
            'customise': {
                title: 'Customise',
                dependencies: function(){
                    var that = {};
                    that.configurate = require('./../components/configurate.js')(services);
                    return that;
                },
                template: function (dependencies) {
                    return h('div', [dependencies.configurate.template()]);
                }
            }
        };

        var currentState = initState;
        var currentDependencies = states[initState].dependencies();
        var loop = mainLoop(initState, render, {
            create: require("virtual-dom/create-element"),
            diff: require("virtual-dom/diff"),
            patch: require("virtual-dom/patch")
        });
        element.appendChild(loop.target);


        function goToSate(state) {
            currentDependencies = states[state].dependencies();
            currentState = state;
            loop.update();
        }

        function render() {
            var links = ['import', 'templates', 'customise'];
            return h('div', [
                logo,
                h('ul.navigation.navigation--steps', links.map(function (id) {
                    var className = currentState === id ? 'active' : '';
                    return h('li.navigation__item', {
                        'className': className
                    }, h('a', {
                        'href':'#' + id,
                        'ev-click': function (e) {
                            e.preventDefault();
                            goToSate(id);
                        }
                    }, states[id].title))
                })),
                h('h1', states[currentState].title),
                h('div.left', states[currentState].template(currentDependencies))
            ])
        }

        services.mediator.on('treeUpdate',function(){
            loop.update();
        });

        // chart stuff
        var chartElement;
        var chart = require('./../components/chart.js');
        chartElement = createElement(h('div.right', {id: 'chartContainer'}));
        element.appendChild(chartElement);
        chart.load(chartElement, services);
    }

    module.exports = constructor;
})();
},{"./../components/chart.js":122,"./../components/configurate.js":123,"./../components/import.js":124,"./../components/table.js":129,"./../components/templates.js":130,"./../templates/logo":141,"main-loop":82,"virtual-dom/create-element":92,"virtual-dom/diff":93,"virtual-dom/h":94,"virtual-dom/patch":95}],141:[function(require,module,exports){
(function () {
    var h = require('virtual-dom/h');
    var iconLoader = require('../factories/iconLoader');
    var logo = iconLoader.get('logo');
    logo.properties.height = '50px';
    module.exports = h('div.logo',[logo]);
})();

},{"../factories/iconLoader":133,"virtual-dom/h":94}]},{},[136])


//# sourceMappingURL=ec.js.map
