/* ── SERVER SYNC LAYER ──
   Shared state between all browsers via /api/state.
   localStorage is a cache — server is the source of truth.
   edit.js and annotate.js call sync functions. */

(function() {
  'use strict';

  const SYNC_DEBOUNCE = 500;
  let syncTimer = null;
  let serverState = null;

  /* ── Load state from server ── */
  async function loadFromServer() {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) throw new Error('Server error');
      serverState = await res.json();

      /* Update localStorage from server (server wins) */
      localStorage.setItem('anlp-gi-edits', JSON.stringify(serverState.edits || {}));
      localStorage.setItem('anlp-gi-annotations', JSON.stringify(serverState.annotations || {}));
      localStorage.setItem('anlp-gi-deleted', JSON.stringify(serverState.deleted || []));

      return serverState;
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
        const payload = {
          edits: JSON.parse(localStorage.getItem('anlp-gi-edits') || '{}'),
          annotations: JSON.parse(localStorage.getItem('anlp-gi-annotations') || '{}'),
          deleted: JSON.parse(localStorage.getItem('anlp-gi-deleted') || '[]')
        };
        const res = await fetch('/api/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Save failed');
      } catch (err) {
        console.warn('Failed to save to server:', err);
      }
    }, SYNC_DEBOUNCE);
  }

  /* ── Save on page unload (synchronous fallback) ── */
  window.addEventListener('beforeunload', function() {
    try {
      const payload = {
        edits: JSON.parse(localStorage.getItem('anlp-gi-edits') || '{}'),
        annotations: JSON.parse(localStorage.getItem('anlp-gi-annotations') || '{}'),
        deleted: JSON.parse(localStorage.getItem('anlp-gi-deleted') || '[]')
      };
      navigator.sendBeacon('/api/state', new Blob(
        [JSON.stringify(payload)],
        { type: 'application/json' }
      ));
    } catch (err) { /* best effort */ }
  });

  /* ── Expose globally ── */
  window.anlpSync = {
    load: loadFromServer,
    save: saveToServer
  };

  /* ── Auto-load on startup ── */
  document.addEventListener('DOMContentLoaded', function() {
    loadFromServer().then(function(state) {
      if (state) {
        /* Trigger a re-render if edit.js and annotate.js are already initialized */
        window.dispatchEvent(new Event('anlp-sync-loaded'));
      }
    });
  });

})();
