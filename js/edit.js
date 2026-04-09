/* ── INLINE COPY EDITOR ──
   Toggle edit mode to make all text editable.
   Changes saved to localStorage automatically.
   No backend needed — this is a review tool. */

(function() {
  'use strict';

  const STORAGE_KEY = 'anlp-gi-edits';
  let editMode = false;
  let edits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

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
    '.stat-card .l',
    '.stat-card .sub'
  ].join(', ');

  /* ── Build the admin bar ── */
  function createBar() {
    const bar = document.createElement('div');
    bar.id = 'edit-bar';
    bar.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;max-width:960px;margin:0 auto">
        <span style="font-size:12px;opacity:0.5">Copy editor</span>
        <div style="display:flex;gap:8px;align-items:center">
          <span id="edit-status" style="font-size:12px;opacity:0"></span>
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
      /* Restore saved edits */
      if (edits[el.dataset.editId]) {
        el.textContent = edits[el.dataset.editId];
      }
    });
  }

  /* ── Toggle edit mode ── */
  function toggleEdit() {
    editMode = !editMode;
    const btn = document.getElementById('edit-toggle');
    const reset = document.getElementById('edit-reset');

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
    });
  }

  function disableEditing() {
    document.querySelectorAll(EDITABLE).forEach(function(el) {
      el.contentEditable = 'false';
      el.classList.remove('is-editable');
    });
  }

  /* ── Save changes to localStorage ── */
  function saveAll() {
    document.querySelectorAll('[data-edit-id]').forEach(function(el) {
      var id = el.dataset.editId;
      edits[id] = el.textContent;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
    flash('Saved');
  }

  function resetEdits() {
    if (confirm('Reset all copy edits? This cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEY);
      edits = {};
      location.reload();
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
      edits[e.target.dataset.editId] = e.target.textContent;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
      flash('Saved');
    }
  });

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function() {
    createBar();
    indexElements();
  });

})();
