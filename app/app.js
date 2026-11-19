/* Leonida Trophy Atlas — offline tracker. Fetches data/trophies.json at run time.
   Progress lives only in this browser's localStorage. No network requests. */
(function () {
  'use strict';

  var STORAGE_KEY = 'leonida-trophy-atlas-v1';
  var SPOILER_KEY = 'leonida-trophy-atlas-spoiler';
  var POINTS = { platinum: 300, gold: 90, silver: 30, bronze: 15 };
  var GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
  var KIND_LABELS = { story: 'Story', collectibles: 'Collectibles', activities: 'Activities', online: 'Online' };

  var trophies = [];
  var earned = new Set();
  var spoilerOn = true;
  var state = { kind: 'all', grade: 'all', stage: 'all', sort: 'official', query: '' };
  var openGuideId = null;

  var listEl = document.getElementById('trophyList');
  var emptyNote = document.getElementById('emptyNote');
  var resultCount = document.getElementById('resultCount');
  var searchInput = document.getElementById('searchInput');
  var gradeSelect = document.getElementById('gradeSelect');
  var stageSelect = document.getElementById('stageSelect');
  var sortSelect = document.getElementById('sortSelect');
  var spoilerToggle = document.getElementById('spoilerToggle');

  function loadStored() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (data && Array.isArray(data.earned)) {
          data.earned.forEach(function (id) { earned.add(Number(id)); });
        }
      }
      var sp = localStorage.getItem(SPOILER_KEY);
      if (sp !== null) spoilerOn = sp === '1';
    } catch (e) { /* private mode or corrupt storage: continue in-memory */ }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ earned: Array.from(earned).sort(function (a, b) { return a - b; }) }));
      localStorage.setItem(SPOILER_KEY, spoilerOn ? '1' : '0');
    } catch (e) { /* storage unavailable: progress is session-only */ }
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function isHidden(t) {
    return spoilerOn && t.hidden && !earned.has(t.id);
  }

  function renderProgress() {
    var total = trophies.length;
    var done = trophies.filter(function (t) { return earned.has(t.id); }).length;
    var pts = trophies.reduce(function (sum, t) { return earned.has(t.id) ? sum + (POINTS[t.grade] || 0) : sum; }, 0);
    var maxPts = trophies.reduce(function (sum, t) { return sum + (POINTS[t.grade] || 0); }, 0);
    document.getElementById('progressText').textContent = done + ' / ' + total + ' trophies earned';
    document.getElementById('pointsText').textContent = pts.toLocaleString('en-US') + ' / ' + maxPts.toLocaleString('en-US') + ' points';
    document.getElementById('progressFill').style.width = (total ? (done / total * 100) : 0) + '%';
    var grades = ['platinum', 'gold', 'silver', 'bronze'].map(function (g) {
      var of = trophies.filter(function (t) { return t.grade === g; }).length;
      var got = trophies.filter(function (t) { return t.grade === g && earned.has(t.id); }).length;
      return got + '/' + of + ' ' + g;
    }).join('  ·  ');
    document.getElementById('progressGrades').textContent = grades;

    [1, 2, 3].forEach(function (stage) {
      var el = document.querySelector('[data-stage="' + stage + '"]');
      if (!el) return;
      var inStage = trophies.filter(function (t) { return t.roadmapStage === stage; });
      var gotStage = inStage.filter(function (t) { return earned.has(t.id); }).length;
      el.innerHTML = '<b>' + gotStage + ' of ' + inStage.length + ' trophies in this stage earned.</b>';
    });
  }

  function filtered() {
    var q = state.query.trim().toLowerCase();
    var list = trophies.filter(function (t) {
      if (state.kind === 'missable') { if (!t.missable) return false; }
      else if (state.kind === 'online') { if (t.kind !== 'online') return false; }
      else if (state.kind !== 'all') { if (t.kind !== state.kind) return false; }
      if (state.grade !== 'all' && t.grade !== state.grade) return false;
      if (state.stage !== 'all' && String(t.roadmapStage) !== state.stage) return false;
      if (q) {
        var hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    if (state.sort === 'grade') {
      list.sort(function (a, b) { return GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.id - b.id; });
    } else if (state.sort === 'stage') {
      list.sort(function (a, b) { return a.roadmapStage - b.roadmapStage || a.id - b.id; });
    } else if (state.sort === 'name') {
      list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    } else {
      list.sort(function (a, b) { return a.id - b.id; });
    }
    return list;
  }

  function renderList() {
    var list = filtered();
    resultCount.textContent = 'Showing ' + list.length + ' of ' + trophies.length + ' trophies';

    if (state.kind === 'online') {
      emptyNote.hidden = false;
      emptyNote.textContent = 'No online trophies: all 55 trophies unlock in single player. ' +
        'There are no online, difficulty or co-op trophies in GTA VI (PowerPyx, GTABase).';
    } else if (list.length === 0) {
      emptyNote.hidden = false;
      emptyNote.textContent = 'No trophies match these filters. Try clearing the search or choosing "All".';
    } else {
      emptyNote.hidden = true;
    }

    listEl.innerHTML = list.map(function (t) {
      var hidden = isHidden(t);
      var got = earned.has(t.id);
      var name = hidden ? '<span class="spoiler-hidden">Hidden story trophy — spoiler mode on</span>' : escapeHtml(t.name);
      var desc = hidden ? 'Hidden until earned. Turn spoiler mode off to reveal it.' : escapeHtml(t.description);
      var badges = '<span class="badge ' + escapeHtml(t.grade) + '">' + escapeHtml(t.grade) + '</span>' +
        '<span class="badge kind">' + escapeHtml(KIND_LABELS[t.kind] || t.kind) + '</span>' +
        '<span class="badge stage">Stage ' + t.roadmapStage + '</span>' +
        (t.missable ? '<span class="badge missable">Missable</span>' : '') +
        (got ? '<span class="badge earned-badge">Earned</span>' : '');
      var guideBody;
      if (hidden) {
        guideBody = '<p class="spoiler-hidden">Guide hidden while spoiler mode is on. Turn it off, or mark this trophy earned, to read the guide.</p>';
      } else {
        var srcList = (t.sources || []).map(function (s) {
          return '<li><a href="' + escapeHtml(s.url) + '" rel="noopener" target="_blank">' + escapeHtml(s.name) + '</a></li>';
        }).join('');
        guideBody = '<p>' + escapeHtml(t.guide) + '</p>' +
          (srcList ? '<ul class="guide-sources">' + srcList + '</ul>' : '');
      }
      var open = openGuideId === t.id;
      return '<article class="trophy-card' + (got ? ' earned' : '') + '" data-id="' + t.id + '" id="trophy-' + t.id + '">' +
        '<div class="trophy-head">' +
          '<input type="checkbox" data-earned="' + t.id + '"' + (got ? ' checked' : '') + ' aria-label="Mark ' + escapeHtml(hidden ? 'hidden trophy' : t.name) + ' as earned">' +
          '<div class="trophy-main">' +
            '<h3 class="trophy-name">' + name + '</h3>' +
            '<p class="trophy-desc">“' + desc + '”</p>' +
            '<div class="badge-row">' + badges + '</div>' +
            '<button class="guide-toggle" type="button" data-toggle="' + t.id + '" aria-expanded="' + (open ? 'true' : 'false') + '">' +
              (open ? 'Hide guide ▲' : 'Show guide ▼') + '</button>' +
            '<div class="guide-body' + (open ? ' open' : '') + '">' + guideBody + '</div>' +
          '</div>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  function render() {
    renderProgress();
    renderList();
  }

  function applyParams() {
    var params = new URLSearchParams(window.location.search);
    var filter = params.get('filter');
    if (filter && ['story', 'missable', 'collectibles', 'activities', 'online'].indexOf(filter) !== -1) {
      state.kind = filter;
      document.querySelectorAll('.chip').forEach(function (c) {
        c.classList.toggle('active', c.getAttribute('data-kind') === filter);
      });
    }
    if (params.get('spoiler') === 'on') {
      spoilerOn = true;
      spoilerToggle.checked = true;
    } else if (params.get('spoiler') === 'off') {
      spoilerOn = false;
      spoilerToggle.checked = false;
    }
    var earnedParam = params.get('earned');
    if (earnedParam) {
      earnedParam.split(',').forEach(function (part) {
        var id = Number(part.trim());
        if (id >= 1 && id <= 55) earned.add(id);
      });
      save();
    }
    var trophyParam = params.get('trophy');
    if (trophyParam) {
      var tid = Number(trophyParam);
      if (tid >= 1 && tid <= 55) openGuideId = tid;
    }
    render();
    if (trophyParam) {
      var el = document.getElementById('trophy-' + Number(trophyParam));
      if (el) el.scrollIntoView({ behavior: 'auto', block: 'center' });
    } else if (params.get('view') === 'roadmap') {
      document.getElementById('roadmap').scrollIntoView({ behavior: 'auto' });
    } else if (params.get('view') === 'tracker') {
      document.getElementById('trackerHeading').scrollIntoView({ behavior: 'auto' });
    }
  }

  // Events
  document.querySelectorAll('.chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      state.kind = chip.getAttribute('data-kind');
      document.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      renderList();
    });
  });
  searchInput.addEventListener('input', function () { state.query = searchInput.value; renderList(); });
  gradeSelect.addEventListener('change', function () { state.grade = gradeSelect.value; renderList(); });
  stageSelect.addEventListener('change', function () { state.stage = stageSelect.value; renderList(); });
  sortSelect.addEventListener('change', function () { state.sort = sortSelect.value; renderList(); });
  spoilerToggle.addEventListener('change', function () {
    spoilerOn = spoilerToggle.checked;
    save();
    renderList();
  });

  listEl.addEventListener('change', function (e) {
    var cb = e.target.closest('input[data-earned]');
    if (!cb) return;
    var id = Number(cb.getAttribute('data-earned'));
    if (cb.checked) earned.add(id); else earned.delete(id);
    save();
    render();
  });
  listEl.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-toggle]');
    if (!btn) return;
    var id = Number(btn.getAttribute('data-toggle'));
    openGuideId = openGuideId === id ? null : id;
    renderList();
  });

  document.getElementById('exportBtn').addEventListener('click', function () {
    var payload = {
      app: 'leonida-trophy-atlas',
      exportedAt: new Date().toISOString(),
      earned: Array.from(earned).sort(function (a, b) { return a - b; })
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gta6-trophy-progress.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });

  document.getElementById('importInput').addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        var ids = Array.isArray(data) ? data : data.earned;
        if (!Array.isArray(ids)) throw new Error('no earned list');
        var valid = ids.map(Number).filter(function (id) { return id >= 1 && id <= 55; });
        earned = new Set(valid);
        save();
        render();
        resultCount.textContent = 'Imported ' + valid.length + ' earned trophies.';
      } catch (err) {
        resultCount.textContent = 'Import failed: that file is not a valid progress export.';
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  });

  document.getElementById('resetBtn').addEventListener('click', function () {
    if (!window.confirm('Clear all earned trophies? This cannot be undone.')) return;
    earned.clear();
    save();
    render();
  });

  loadStored();
  spoilerToggle.checked = spoilerOn;
  fetch('data/trophies.json')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      trophies = Array.isArray(data) ? data : data.trophies;
      applyParams();
    })
    .catch(function (err) {
      listEl.innerHTML = '<p class="empty-note">Could not load the trophy data (' + escapeHtml(err.message) + '). ' +
        'Serve this folder over HTTP (for example: python3 -m http.server) and open it through the server — ' +
        'browsers block data fetches from file:// pages.</p>';
    });
})();
