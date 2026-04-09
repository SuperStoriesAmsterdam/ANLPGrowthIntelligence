/* ── ANNOTATION / COMMENT TOOL ──
   Team name picker (no auth). Click pencil to comment.
   Comments stored in localStorage, exportable as JSON. */

(function() {
  'use strict';

  const STORAGE_KEY = 'anlp-gi-annotations';
  const AUTHOR_KEY = 'anlp-gi-author';

  const TEAM = [
    { name: 'Peter',    role: 'Strategy',           color: '#2d5a3d' },
    { name: 'Connirae', role: 'ANLP',               color: '#854F0B' },
    { name: 'Mark',     role: 'ANLP',               color: '#993C1D' },
    { name: 'Tamara',   role: 'ANLP',               color: '#185FA5' },
    { name: 'Zach',     role: 'ANLP',               color: '#6B4C9A' },
    { name: 'Duff',     role: 'ANLP — Email',       color: '#4a4840' },
    { name: 'Petrolene',role: 'ANLP',               color: '#8B6914' },
    { name: 'Lavinia',  role: 'ANLP',               color: '#9B4D6A' },
    { name: 'Team I&Y', role: 'GHL build',          color: '#d4622a' },
  ];

  let annotateMode = false;
  let annotations = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

  /* ── Get current author or show picker ── */
  function getAuthor() {
    return localStorage.getItem(AUTHOR_KEY);
  }

  function getAuthorColor() {
    var name = getAuthor();
    var member = TEAM.find(function(m) { return m.name === name; });
    return member ? member.color : '#4a4840';
  }

  /* ── Name picker overlay ── */
  function showNamePicker(callback) {
    var existing = document.getElementById('name-picker');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'name-picker';
    overlay.innerHTML = `
      <div class="np-box">
        <div class="np-title">Who are you?</div>
        <div class="np-subtitle">Pick your name to comment and edit</div>
        <div class="np-list">
          ${TEAM.map(function(m) {
            return '<button class="np-member" data-name="' + m.name + '" style="--member-color:' + m.color + '">' +
              '<span class="np-avatar" style="background:' + m.color + '">' + m.name.charAt(0) + '</span>' +
              '<span class="np-info"><strong>' + m.name + '</strong><span>' + m.role + '</span></span>' +
            '</button>';
          }).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.np-member').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var name = btn.dataset.name;
        localStorage.setItem(AUTHOR_KEY, name);
        overlay.remove();
        updateAuthorDisplay();
        if (callback) callback(name);
      });
    });

    /* Close on overlay click */
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.remove();
    });
  }

  /* ── Build the pencil button + author chip ── */
  function createButton() {
    var wrap = document.createElement('div');
    wrap.id = 'annotate-wrap';
    wrap.innerHTML = `
      <div id="annotate-author-chip"></div>
      <button id="annotate-btn" title="Toggle comment mode">&#9998;</button>
    `;
    document.body.appendChild(wrap);

    document.getElementById('annotate-btn').addEventListener('click', function() {
      if (!getAuthor()) {
        showNamePicker(function() { toggleAnnotateMode(); });
      } else {
        toggleAnnotateMode();
      }
    });

    updateAuthorDisplay();
  }

  function updateAuthorDisplay() {
    var chip = document.getElementById('annotate-author-chip');
    var name = getAuthor();
    if (name) {
      var color = getAuthorColor();
      chip.innerHTML = '<span class="ac-avatar" style="background:' + color + '">' + name.charAt(0) + '</span>' +
        '<span class="ac-name">' + name + '</span>' +
        '<button class="ac-switch" title="Switch user">↻</button>';
      chip.style.display = 'flex';
      chip.querySelector('.ac-switch').addEventListener('click', function(e) {
        e.stopPropagation();
        showNamePicker();
      });
    } else {
      chip.style.display = 'none';
    }
  }

  /* ── Build annotation counter + export bar ── */
  function createCounter() {
    var counter = document.createElement('div');
    counter.id = 'annotate-counter';
    counter.innerHTML = `
      <span id="annotate-count"></span>
      <button id="annotate-export" title="Export as JSON">Export</button>
      <button id="annotate-clear" title="Clear all">Clear</button>
    `;
    document.body.appendChild(counter);

    document.getElementById('annotate-export').addEventListener('click', exportAnnotations);
    document.getElementById('annotate-clear').addEventListener('click', clearAnnotations);
    updateCounter();
  }

  /* ── Toggle annotation mode ── */
  function toggleAnnotateMode() {
    annotateMode = !annotateMode;
    var btn = document.getElementById('annotate-btn');

    if (annotateMode) {
      btn.classList.add('active');
      document.body.style.cursor = 'crosshair';
      document.addEventListener('click', handleAnnotationClick, true);
    } else {
      btn.classList.remove('active');
      document.body.style.cursor = '';
      document.removeEventListener('click', handleAnnotationClick, true);
    }
  }

  /* ── Handle click in annotation mode ── */
  function handleAnnotationClick(e) {
    if (e.target.closest('#annotate-btn, #annotate-wrap, #annotate-counter, .annotation-pin, .annotation-popup, #edit-bar, #name-picker, #edit-ctx')) return;
    /* Don't annotate while editing text */
    if (e.target.closest('.is-editable') || e.target.contentEditable === 'true') return;

    e.preventDefault();
    e.stopPropagation();

    var author = getAuthor();
    if (!author) {
      showNamePicker(function() { /* they'll need to click again */ });
      return;
    }

    var clickX = e.pageX;
    var clickY = e.pageY;
    var color = getAuthorColor();

    /* Create inline writing field at click position */
    var field = document.createElement('div');
    field.className = 'annotation-write';
    field.style.left = clickX + 'px';
    field.style.top = clickY + 'px';
    field.innerHTML = `
      <div class="aw-header">
        <span class="aw-avatar" style="background:${color}">${author.charAt(0)}</span>
        <span class="aw-name">${author}</span>
      </div>
      <textarea class="aw-input" placeholder="Write your note..." rows="3" autofocus></textarea>
      <div class="aw-actions">
        <button class="aw-cancel">Cancel</button>
        <button class="aw-save" style="background:${color}">Save</button>
      </div>
    `;
    document.body.appendChild(field);

    var textarea = field.querySelector('.aw-input');
    setTimeout(function() { textarea.focus(); }, 10);

    function saveNote() {
      var text = textarea.value.trim();
      if (!text) { field.remove(); return; }

      var annotation = {
        id: Date.now(),
        x: clickX,
        y: clickY,
        author: author,
        color: color,
        text: text,
        timestamp: new Date().toISOString(),
        section: getCurrentSection()
      };

      annotations.push(annotation);
      save();
      renderPin(annotation);
      updateCounter();
      field.remove();
    }

    function cancelNote() {
      field.remove();
    }

    field.querySelector('.aw-save').addEventListener('click', function(e) {
      e.stopPropagation();
      saveNote();
    });
    field.querySelector('.aw-cancel').addEventListener('click', function(e) {
      e.stopPropagation();
      cancelNote();
    });

    /* Cmd/Ctrl+Enter to save, Escape to cancel */
    textarea.addEventListener('keydown', function(ev) {
      if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) {
        ev.preventDefault();
        saveNote();
      }
      if (ev.key === 'Escape') {
        cancelNote();
      }
    });

    /* Prevent annotation mode from catching clicks inside the field */
    field.addEventListener('click', function(ev) { ev.stopPropagation(); });
  }

  /* ── Detect which section the click is in ── */
  function getCurrentSection() {
    var active = document.querySelector('.section.active');
    return active ? active.id : 'header';
  }

  /* ── Render a pin on the page ── */
  function renderPin(a) {
    var pin = document.createElement('div');
    pin.className = 'annotation-pin';
    pin.style.left = a.x + 'px';
    pin.style.top = a.y + 'px';
    pin.dataset.id = a.id;
    pin.innerHTML = '<span class="pin-dot" style="background:' + (a.color || '#d4622a') + '"></span>';

    var popup = document.createElement('div');
    popup.className = 'annotation-popup';
    popup.innerHTML = `
      <div class="ap-author" style="color:${a.color || '#d4622a'}">${a.author}</div>
      <div class="ap-text">${a.text}</div>
      <div class="ap-time">${timeAgo(a.timestamp)}</div>
      <button class="ap-delete" data-id="${a.id}">Delete</button>
    `;

    pin.appendChild(popup);
    document.body.appendChild(pin);

    pin.querySelector('.ap-delete').addEventListener('click', function(e) {
      e.stopPropagation();
      deleteAnnotation(a.id);
    });
  }

  function timeAgo(ts) {
    var diff = Date.now() - new Date(ts).getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    var days = Math.floor(hrs / 24);
    return days + 'd ago';
  }

  /* ── Render all saved pins ── */
  function renderAllPins() {
    document.querySelectorAll('.annotation-pin').forEach(function(p) { p.remove(); });
    annotations.forEach(renderPin);
  }

  /* ── Delete annotation ── */
  function deleteAnnotation(id) {
    annotations = annotations.filter(function(a) { return a.id !== id; });
    save();
    renderAllPins();
    updateCounter();
  }

  /* ── Save to localStorage ── */
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(annotations));
  }

  /* ── Update counter ── */
  function updateCounter() {
    var el = document.getElementById('annotate-count');
    var n = annotations.length;
    el.textContent = n + ' comment' + (n !== 1 ? 's' : '');
    document.getElementById('annotate-counter').style.display = n > 0 ? 'flex' : 'none';
  }

  /* ── Export as JSON ── */
  function exportAnnotations() {
    var blob = new Blob([JSON.stringify(annotations, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'annotations-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ── Clear all ── */
  function clearAnnotations() {
    if (confirm('Delete all comments? This cannot be undone.')) {
      annotations = [];
      save();
      renderAllPins();
      updateCounter();
    }
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function() {
    createButton();
    createCounter();
    renderAllPins();

    /* If no author set, show picker on first visit */
    if (!getAuthor()) {
      setTimeout(function() { showNamePicker(); }, 500);
    }
  });

  /* Expose for edit.js to use */
  window.anlpGetAuthor = getAuthor;
  window.anlpGetAuthorColor = getAuthorColor;
  window.anlpShowNamePicker = showNamePicker;

})();
