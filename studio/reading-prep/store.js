/* Saves each client's birth details and reading notes in this browser only (localStorage). Nothing is sent anywhere.
   Works in the browser (window.Soulprint.store) and in Node (require), so it can be tested with a fake storage. */
(function (root, factory) {
  var store = factory();
  if (typeof module === 'object' && module.exports) module.exports = store;
  else { root.Soulprint = root.Soulprint || {}; root.Soulprint.store = store; }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var KEY = 'soulprint.studio.readingPrep.v1';

  // storage: anything with getItem / setItem (window.localStorage). Pass null when the browser blocks storage:
  // the tool still works for the visit, it just cannot remember anything (persistent is false).
  function createStore(storage, key) {
    key = key || KEY;
    var memory = null; // used only when storage is missing or full

    function empty() { return { clients: {}, lastId: null }; }

    function read() {
      if (!storage) return memory || (memory = empty());
      var raw = null;
      try { raw = storage.getItem(key); } catch (e) { return memory || (memory = empty()); }
      if (!raw) return memory && !persistent() ? memory : empty();
      try {
        var d = JSON.parse(raw);
        if (d && typeof d === 'object' && d.clients && typeof d.clients === 'object') return d;
      } catch (e) { /* fall through to the backup below */ }
      // Unreadable data: keep a copy before anything can overwrite it.
      try { storage.setItem(key + '.backup', raw); } catch (e2) { /* nothing more we can do */ }
      return empty();
    }

    var okFlag = !!storage;
    function persistent() { return okFlag; }

    function write(d) {
      memory = d;
      if (!storage) return false;
      try { storage.setItem(key, JSON.stringify(d)); okFlag = true; return true; } catch (e) { okFlag = false; return false; }
    }

    function newId() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

    return {
      get persistent() { return persistent(); },
      newId: newId,
      list: function () {
        var c = read().clients;
        return Object.keys(c).map(function (id) { return c[id]; }).sort(function (a, b) { return (b.updated || 0) - (a.updated || 0); });
      },
      get: function (id) { return read().clients[id] || null; },
      // client: { id, inputs, notes }. Always re-reads storage first so a second open tab is never overwritten wholesale.
      save: function (client) {
        var d = read();
        client.updated = Date.now();
        if (!client.created) client.created = client.updated;
        d.clients[client.id] = client;
        d.lastId = client.id;
        return write(d);
      },
      remove: function (id) {
        var d = read();
        delete d.clients[id];
        if (d.lastId === id) d.lastId = null;
        return write(d);
      },
      getLastId: function () { var d = read(); return d.lastId && d.clients[d.lastId] ? d.lastId : null; },
      setLastId: function (id) { var d = read(); d.lastId = id; return write(d); }
    };
  }

  return { KEY: KEY, createStore: createStore };
}));
