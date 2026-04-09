/* ── INLINE COPY EDITOR ──
   Toggle edit mode to make all text editable.
   Changes saved to localStorage automatically.
   Right-click an edited field → revert to original.
   No backend needed — this is a review tool. */

(function() {
  'use strict';

  const STORAGE_KEY = 'anlp-gi-edits';
  const ORIGINALS_KEY = 'anlp-gi-originals';
  let editMode = false;
  let edits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  let originals = JSON.parse(localStorage.getItem(ORIGINALS_KEY) || '{}');

  /* ── Selectors for editable elements ── */
  const EDITABLE = [
    '.header-title',
    '.header-sub',
    '.section-heading',
    '.section-intro',
    '.section-eyebrow',
    '.insight-box p',
    '.insight-box .label',
    '.mechanism-card .mc-title',
    '.mechanism-card .mc-body',
    '.ev-body strong',
    '.ev-body span',
    '.message-card .mc-label',
    '.message-card .mc-msg',
    '.message-card .mc-why',
    '.agenda-body h3',
    '.agenda-body p',
    '.agenda-decide',
    '.stat-card .n',
    '.stat-card .l',
    '.stat-card .sub',
    '.qw-title',
    '.qw-body',
    '.qw-priority',
    '.qw-effort',
    '.tc-q',
    '.tc-value',
    '.tc-status',
    '.fs-label',
    '.fs-number',
    '.fs-note',
    '.ns-what',
    '.ns-who',
    '.ns-when',
    '.qw-owner-name',
    '.qw-tl-date'
  ].join(', ');

  /* ── Build the admin bar ── */
  function createBar() {
    const bar = document.createElement('div');
    bar.id = 'edit-bar';
    bar.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;max-width:960px;margin:0 auto">
        <span style="font-size:12px;opacity:0.5">Copy editor</span>
        <div style="display:flex;gap:8px;align-items:center">
          <span id="edit-count" style="font-size:11px;opacity:0.4"></span>
          <span id="edit-status" style="font-size:12px;opacity:0;transition:opacity 0.3s"></span>
          <button id="edit-toggle">Edit page</button>
          <button id="edit-reset" style="display:none">Reset all edits</button>
        </div>
      </div>
    `;
    document.body.appendChild(bar);

    document.getElementById('edit-toggle').addEventListener('click', toggleEdit);
    document.getElementById('edit-reset').addEventListener('click', resetEdits);
  }

  /* ── Assign data-edit-id to every editable element ── */
  function indexElements() {
    document.querySelectorAll(EDITABLE).forEach(function(el, i) {
      if (!el.dataset.editId) {
        el.dataset.editId = 'e-' + i;
      }
      /* Store original text (only first time) */
      if (!originals[el.dataset.editId]) {
        originals[el.dataset.editId] = el.textContent;
      }
      /* Restore saved edits */
      if (edits[el.dataset.editId]) {
        el.textContent = edits[el.dataset.editId];
      }
    });
    localStorage.setItem(ORIGINALS_KEY, JSON.stringify(originals));
    updateCount();
  }

  /* ── Toggle edit mode ── */
  function toggleEdit() {
    editMode = !editMode;
    const btn = document.getElementById('edit-toggle');
    const reset = document.getElementById('edit-reset');

    /* Turn off annotation mode if it's on */
    if (editMode && document.getElementById('annotate-btn') && document.getElementById('annotate-btn').classList.contains('active')) {
      document.getElementById('annotate-btn').click();
    }

    if (editMode) {
      btn.textContent = 'Stop editing';
      btn.style.background = 'white';
      btn.style.color = '#1a1814';
      reset.style.display = 'inline-block';
      enableEditing();
    } else {
      btn.textContent = 'Edit page';
      btn.style.background = 'rgba(255,255,255,0.15)';
      btn.style.color = 'white';
      reset.style.display = 'none';
      disableEditing();
      saveAll();
    }
  }

  function enableEditing() {
    document.querySelectorAll(EDITABLE).forEach(function(el) {
      el.contentEditable = 'true';
      el.classList.add('is-editable');

      /* Mark edited fields visually */
      if (edits[el.dataset.editId]) {
        el.classList.add('is-edited');
      }
    });
  }

  function disableEditing() {
    document.querySelectorAll(EDITABLE).forEach(function(el) {
      el.contentEditable = 'false';
      el.classList.remove('is-editable');
    });
    removeContextMenu();
  }

  /* ── Save changes to localStorage ── */
  function saveAll() {
    document.querySelectorAll('[data-edit-id]').forEach(function(el) {
      var id = el.dataset.editId;
      /* Only save if different from original */
      if (el.textContent !== originals[id]) {
        edits[id] = el.textContent;
      } else {
        delete edits[id];
        el.classList.remove('is-edited');
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
    updateCount();
    flash('Saved');
  }

  function resetEdits() {
    if (confirm('Reset ALL copy edits? This cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEY);
      edits = {};
      location.reload();
    }
  }

  /* ── Revert a single field ── */
  function revertField(editId) {
    var el = document.querySelector('[data-edit-id="' + editId + '"]');
    if (el && originals[editId]) {
      el.textContent = originals[editId];
      delete edits[editId];
      el.classList.remove('is-edited');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
      updateCount();
      flash('Reverted');
    }
    removeContextMenu();
  }

  /* ── Context menu for edited fields ── */
  function removeContextMenu() {
    var old = document.getElementById('edit-ctx');
    if (old) old.remove();
  }

  document.addEventListener('contextmenu', function(e) {
    if (!editMode) return;
    var el = e.target.closest('[data-edit-id]');
    if (!el) return;
    if (!edits[el.dataset.editId]) return;

    e.preventDefault();
    removeContextMenu();

    var menu = document.createElement('div');
    menu.id = 'edit-ctx';
    menu.innerHTML = `
      <button data-action="revert">↩ Revert to original</button>
      <button data-action="delete">✕ Delete this edit</button>
    `;
    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
    document.body.appendChild(menu);

    menu.querySelector('[data-action="revert"]').addEventListener('click', function() {
      revertField(el.dataset.editId);
    });
    menu.querySelector('[data-action="delete"]').addEventListener('click', function() {
      revertField(el.dataset.editId);
    });
  });

  /* Close context menu on click elsewhere */
  document.addEventListener('click', function(e) {
    if (!e.target.closest('#edit-ctx')) {
      removeContextMenu();
    }
  });

  /* ── Update edit count ── */
  function updateCount() {
    var n = Object.keys(edits).length;
    var el = document.getElementById('edit-count');
    if (el) {
      el.textContent = n > 0 ? n + ' edit' + (n !== 1 ? 's' : '') : '';
    }
  }

  function flash(msg) {
    var el = document.getElementById('edit-status');
    el.textContent = msg;
    el.style.opacity = '1';
    el.style.color = '#4ade80';
    setTimeout(function() { el.style.opacity = '0'; }, 1500);
  }

  /* ── Auto-save on blur ── */
  document.addEventListener('focusout', function(e) {
    if (editMode && e.target.dataset && e.target.dataset.editId) {
      var id = e.target.dataset.editId;
      if (e.target.textContent !== originals[id]) {
        edits[id] = e.target.textContent;
        e.target.classList.add('is-edited');
      } else {
        delete edits[id];
        e.target.classList.remove('is-edited');
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
      updateCount();
      flash('Saved');
    }
  });

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function() {
    createBar();
    indexElements();
  });

})();
