/* ── SERVER SYNC LAYER ──
   Shared state between all browsers via /api/state.
   localStorage is a cache — server is the source of truth.
   edit.js and annotate.js call sync functions. */

(function() {
  'use strict';

  const STATE_VERSION = 'v2';
  const EDITS_KEY = 'anlp-gi-edits-' + STATE_VERSION;
  const ANNOTATIONS_KEY = 'anlp-gi-annotations';
  const DELETED_KEY = 'anlp-gi-deleted-' + STATE_VERSION;

  const SYNC_DEBOUNCE = 500;
  let syncTimer = null;

  /* ── Load state from server ── */
  async function loadFromServer() {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) throw new Error('Server error');
      var state = await res.json();

      localStorage.setItem(EDITS_KEY, JSON.stringify(state.edits || {}));
      localStorage.setItem(ANNOTATIONS_KEY, JSON.stringify(state.annotations || {}));
      localStorage.setItem(DELETED_KEY, JSON.stringify(state.deleted || []));

      return state;
    } catch (err) {
      console.warn('Failed to load from server, using localStorage:', err);
      return null;
    }
  }

  /* ── Save state to server (debounced) ── */
  function saveToServer() {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(async function() {
      try {
        var payload = {
          edits: JSON.parse(localStorage.getItem(EDITS_KEY) || '{}'),
          annotations: JSON.parse(localStorage.getItem(ANNOTATIONS_KEY) || '{}'),
          deleted: JSON.parse(localStorage.getItem(DELETED_KEY) || '[]')
        };
        await fetch('/api/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn('Failed to save to server:', err);
      }
    }, SYNC_DEBOUNCE);
  }

  /* ── Save on page unload ── */
  window.addEventListener('beforeunload', function() {
    try {
      var payload = {
        edits: JSON.parse(localStorage.getItem(EDITS_KEY) || '{}'),
        annotations: JSON.parse(localStorage.getItem(ANNOTATIONS_KEY) || '{}'),
        deleted: JSON.parse(localStorage.getItem(DELETED_KEY) || '[]')
      };
      navigator.sendBeacon('/api/state', new Blob(
        [JSON.stringify(payload)],
        { type: 'application/json' }
      ));
    } catch (err) { /* best effort */ }
  });

  window.anlpSync = {
    load: loadFromServer,
    save: saveToServer
  };

  document.addEventListener('DOMContentLoaded', function() {
    loadFromServer().then(function(state) {
      if (state) {
        window.dispatchEvent(new Event('anlp-sync-loaded'));
      }
    });
  });

})();
