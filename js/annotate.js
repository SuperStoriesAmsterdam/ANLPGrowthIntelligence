/* ── ANNOTATION / COMMENT TOOL ──
   Click the pencil icon to enter annotation mode.
   Click anywhere on the page to leave a comment.
   Comments stored in localStorage, exportable as JSON. */

(function() {
  'use strict';

  const STORAGE_KEY = 'anlp-gi-annotations';
  let annotateMode = false;
  let annotations = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

  /* ── Build the pencil button ── */
  function createButton() {
    const btn = document.createElement('button');
    btn.id = 'annotate-btn';
    btn.innerHTML = '&#9998;';
    btn.title = 'Toggle comment mode';
    btn.addEventListener('click', toggleAnnotateMode);
    document.body.appendChild(btn);
  }

  /* ── Build annotation counter + export bar ── */
  function createCounter() {
    const counter = document.createElement('div');
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
    const btn = document.getElementById('annotate-btn');

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
    /* Ignore clicks on annotation UI itself */
    if (e.target.closest('#annotate-btn, #annotate-counter, .annotation-pin, .annotation-popup, #edit-bar')) return;

    e.preventDefault();
    e.stopPropagation();

    var author = localStorage.getItem('anlp-gi-author');
    if (!author) {
      author = prompt('Your name:');
      if (!author) return;
      localStorage.setItem('anlp-gi-author', author);
    }

    var text = prompt('Comment:');
    if (!text) return;

    var rect = document.body.getBoundingClientRect();
    var annotation = {
      id: Date.now(),
      x: e.pageX,
      y: e.pageY,
      author: author,
      text: text,
      timestamp: new Date().toISOString(),
      section: getCurrentSection()
    };

    annotations.push(annotation);
    save();
    renderPin(annotation);
    updateCounter();
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
    pin.innerHTML = '<span class="pin-dot"></span>';

    /* Popup on hover */
    var popup = document.createElement('div');
    popup.className = 'annotation-popup';
    popup.innerHTML = `
      <div class="ap-author">${a.author}</div>
      <div class="ap-text">${a.text}</div>
      <div class="ap-time">${new Date(a.timestamp).toLocaleString()}</div>
      <button class="ap-delete" data-id="${a.id}">Delete</button>
    `;

    pin.appendChild(popup);
    document.body.appendChild(pin);

    pin.querySelector('.ap-delete').addEventListener('click', function(e) {
      e.stopPropagation();
      deleteAnnotation(a.id);
    });
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
  });

})();
