/* ── BLOCK-LEVEL COMMENTS ──
   Comment icon on each content block.
   Click → write inline → stays attached to that block.
   Stored in localStorage by block ID. */

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

  /* Selectors for commentable blocks */
  const COMMENTABLE = [
    '.insight-box',
    '.qw-card',
    '.mechanism-card',
    '.message-card',
    '.agenda-item',
    '.stat-card',
    '.tried-card',
    '.funnel-step',
    '.ns-item',
    '.evidence-row'
  ].join(', ');

  let comments = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

  function getAuthor() { return localStorage.getItem(AUTHOR_KEY); }
  function getAuthorColor() {
    var name = getAuthor();
    var m = TEAM.find(function(t) { return t.name === name; });
    return m ? m.color : '#4a4840';
  }

  /* ── Name picker ── */
  function showNamePicker(callback) {
    var existing = document.getElementById('name-picker');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'name-picker';
    overlay.innerHTML = '<div class="np-box">' +
      '<div class="np-title">Who are you?</div>' +
      '<div class="np-subtitle">Pick your name to comment and edit</div>' +
      '<div class="np-list">' +
      TEAM.map(function(m) {
        return '<button class="np-member" data-name="' + m.name + '">' +
          '<span class="np-avatar" style="background:' + m.color + '">' + m.name.charAt(0) + '</span>' +
          '<span class="np-info"><strong>' + m.name + '</strong><span>' + m.role + '</span></span>' +
        '</button>';
      }).join('') +
      '</div></div>';
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.np-member').forEach(function(btn) {
      btn.addEventListener('click', function() {
        localStorage.setItem(AUTHOR_KEY, btn.dataset.name);
        overlay.remove();
        updateAuthorChip();
        if (callback) callback(btn.dataset.name);
      });
    });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.remove();
    });
  }

  /* ── Author chip (bottom right) ── */
  function createAuthorChip() {
    var chip = document.createElement('div');
    chip.id = 'author-chip';
    document.body.appendChild(chip);
    updateAuthorChip();
  }

  function updateAuthorChip() {
    var chip = document.getElementById('author-chip');
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

  /* ── Attach comment buttons to all blocks ── */
  function attachCommentButtons() {
    document.querySelectorAll(COMMENTABLE).forEach(function(block, i) {
      if (block.dataset.commentId) return; /* already done */

      var id = 'block-' + i;
      block.dataset.commentId = id;
      block.style.position = 'relative';

      /* Comment trigger button */
      var btn = document.createElement('button');
      btn.className = 'block-comment-btn';
      btn.title = 'Add a comment';
      btn.innerHTML = '💬';
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (!getAuthor()) {
          showNamePicker(function() { openCommentThread(block, id); });
        } else {
          openCommentThread(block, id);
        }
      });
      block.appendChild(btn);

      /* Badge if there are existing comments */
      updateBadge(block, id);
    });
  }

  /* ── Show/hide comment thread for a block ── */
  function openCommentThread(block, id) {
    /* Close any other open thread */
    document.querySelectorAll('.comment-thread').forEach(function(t) { t.remove(); });

    var thread = document.createElement('div');
    thread.className = 'comment-thread';

    var blockComments = comments[id] || [];

    thread.innerHTML =
      '<div class="ct-header">' +
        '<span class="ct-title">' + blockComments.length + ' comment' + (blockComments.length !== 1 ? 's' : '') + '</span>' +
        '<button class="ct-close">✕</button>' +
      '</div>' +
      '<div class="ct-list" id="ct-list-' + id + '"></div>' +
      '<div class="ct-write">' +
        '<div class="ct-write-header">' +
          '<span class="aw-avatar" style="background:' + getAuthorColor() + '">' + (getAuthor() || '?').charAt(0) + '</span>' +
          '<span class="aw-name">' + (getAuthor() || '') + '</span>' +
        '</div>' +
        '<textarea class="ct-input" placeholder="Write a comment..." rows="2"></textarea>' +
        '<div class="ct-actions">' +
          '<button class="ct-save" style="background:' + getAuthorColor() + '">Post</button>' +
        '</div>' +
      '</div>';

    block.appendChild(thread);
    renderComments(id);

    var textarea = thread.querySelector('.ct-input');
    setTimeout(function() { textarea.focus(); }, 10);

    thread.querySelector('.ct-close').addEventListener('click', function(e) {
      e.stopPropagation();
      thread.remove();
    });

    thread.querySelector('.ct-save').addEventListener('click', function(e) {
      e.stopPropagation();
      postComment(id, textarea, block);
    });

    textarea.addEventListener('keydown', function(ev) {
      if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) {
        ev.preventDefault();
        postComment(id, textarea, block);
      }
      if (ev.key === 'Escape') { thread.remove(); }
    });

    thread.addEventListener('click', function(e) { e.stopPropagation(); });
  }

  function postComment(blockId, textarea, block) {
    var text = textarea.value.trim();
    if (!text) return;

    if (!comments[blockId]) comments[blockId] = [];
    comments[blockId].push({
      author: getAuthor(),
      color: getAuthorColor(),
      text: text,
      timestamp: new Date().toISOString()
    });
    save();
    textarea.value = '';
    renderComments(blockId);
    updateBadge(block, blockId);

    /* Update header count */
    var header = block.querySelector('.ct-title');
    if (header) {
      var n = comments[blockId].length;
      header.textContent = n + ' comment' + (n !== 1 ? 's' : '');
    }
  }

  function renderComments(blockId) {
    var list = document.getElementById('ct-list-' + blockId);
    if (!list) return;
    var blockComments = comments[blockId] || [];

    list.innerHTML = blockComments.map(function(c, i) {
      return '<div class="ct-comment">' +
        '<div class="ct-comment-header">' +
          '<span class="aw-avatar" style="background:' + c.color + ';width:20px;height:20px;font-size:10px">' + c.author.charAt(0) + '</span>' +
          '<span class="ct-comment-author">' + c.author + '</span>' +
          '<span class="ct-comment-time">' + timeAgo(c.timestamp) + '</span>' +
          '<button class="ct-comment-delete" data-block="' + blockId + '" data-index="' + i + '">✕</button>' +
        '</div>' +
        '<div class="ct-comment-text">' + c.text + '</div>' +
      '</div>';
    }).join('');

    list.querySelectorAll('.ct-comment-delete').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var bi = parseInt(btn.dataset.index);
        var bid = btn.dataset.block;
        comments[bid].splice(bi, 1);
        if (comments[bid].length === 0) delete comments[bid];
        save();
        renderComments(bid);
        var block = document.querySelector('[data-comment-id="' + bid + '"]');
        if (block) updateBadge(block, bid);
        /* Update header */
        var header = block ? block.querySelector('.ct-title') : null;
        if (header) {
          var n = (comments[bid] || []).length;
          header.textContent = n + ' comment' + (n !== 1 ? 's' : '');
        }
      });
    });
  }

  /* ── Badge showing comment count ── */
  function updateBadge(block, id) {
    var existing = block.querySelector('.block-comment-badge');
    if (existing) existing.remove();

    var n = (comments[id] || []).length;
    if (n > 0) {
      var badge = document.createElement('span');
      badge.className = 'block-comment-badge';
      badge.textContent = n;
      var btn = block.querySelector('.block-comment-btn');
      if (btn) btn.appendChild(badge);
    }
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

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
    updateExportBar();
  }

  /* ── Export bar ── */
  function createExportBar() {
    var bar = document.createElement('div');
    bar.id = 'annotate-counter';
    bar.innerHTML = '<span id="annotate-count"></span>' +
      '<button id="annotate-export">Export</button>' +
      '<button id="annotate-clear">Clear all</button>';
    document.body.appendChild(bar);

    document.getElementById('annotate-export').addEventListener('click', function() {
      var blob = new Blob([JSON.stringify(comments, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'comments-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById('annotate-clear').addEventListener('click', function() {
      if (confirm('Delete all comments? This cannot be undone.')) {
        comments = {};
        save();
        document.querySelectorAll('.block-comment-badge').forEach(function(b) { b.remove(); });
        document.querySelectorAll('.comment-thread').forEach(function(t) { t.remove(); });
      }
    });

    updateExportBar();
  }

  function updateExportBar() {
    var total = 0;
    Object.keys(comments).forEach(function(k) { total += comments[k].length; });
    var el = document.getElementById('annotate-count');
    if (el) el.textContent = total + ' comment' + (total !== 1 ? 's' : '');
    var bar = document.getElementById('annotate-counter');
    if (bar) bar.style.display = total > 0 ? 'flex' : 'none';
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function() {
    createAuthorChip();
    createExportBar();
    attachCommentButtons();

    if (!getAuthor()) {
      setTimeout(function() { showNamePicker(); }, 500);
    }

    /* Re-attach after section changes */
    var origShow = window.showSection;
    window.showSection = function(id, btn) {
      origShow(id, btn);
      setTimeout(attachCommentButtons, 50);
    };
  });

  window.anlpGetAuthor = getAuthor;
  window.anlpGetAuthorColor = getAuthorColor;
  window.anlpShowNamePicker = showNamePicker;

})();
