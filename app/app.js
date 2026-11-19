'use strict';
/* Leonida Trophy Guide — tracker logic.
   Loads data/trophies.json, renders the checklist, roadmap and progress,
   saves earned trophies + the spoiler setting in localStorage, and offers
   export / import of that progress. No network requests besides the local
   data file. Demo states (?demo=checklist|guide|roadmap|spoiler) pre-fill
   the page for screenshots and are never saved. */

var STORE_KEY = 'gta6-trophy-guide-v1';
var KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  crime: 'Crime',
  exploration: 'Exploration',
  completion: 'Completion',
  online: 'Online'
};
var KIND_FILTERS = ['all', 'story', 'missable', 'collectibles', 'activities', 'crime', 'exploration', 'completion', 'online'];

var data = null;
var earned = new Set();
var spoilerOn = false;
var kindFilter = 'all';
var earnedFilter = 'all';
var gradeFilter = '';
var query = '';
var openId = null;
var demoMode = false;

function $(id) { return document.getElementById(id); }

function loadState() {
  try {
    var raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    var saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) earned = new Set(saved.earned.filter(function (n) { return typeof n === 'number'; }));
    spoilerOn = saved.spoiler === true;
  } catch (err) { /* corrupt state: start clean */ }
}

function saveState() {
  if (demoMode) return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      earned: Array.from(earned).sort(function (a, b) { return a - b; }),
      spoiler: spoilerOn
    }));
  } catch (err) { /* storage unavailable: progress lives for this visit only */ }
}

function applyDemo() {
  var params = new URLSearchParams(window.location.search);
  var demo = params.get('demo');
  if (!demo) return;
  demoMode = true;
  if (demo === 'checklist') {
    earned = new Set([2, 3, 4, 15, 16, 20, 21, 28, 35, 53]);
  } else if (demo === 'guide') {
    earned = new Set([2, 3, 4, 5, 15, 16, 20, 21, 28, 35, 53, 54]);
    openId = 28;
  } else if (demo === 'roadmap') {
    earned = new Set([2, 3, 4, 15, 16, 20, 21]);
  } else if (demo === 'spoiler') {
    spoilerOn = true;
    earned = new Set([15, 16, 20, 21, 35, 53]);
  }
  window.__demo = demo;
}

function gradeWord(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function isSpoilerHidden(trophy) {
  return spoilerOn && trophy.kinds.indexOf('story') !== -1 && !earned.has(trophy.id);
}

function trophyMatches(trophy) {
  if (kindFilter === 'online') return false; /* no online trophies exist */
  if (kindFilter === 'missable') {
    if (!trophy.missable) return false;
  } else if (kindFilter !== 'all') {
    if (trophy.kinds.indexOf(kindFilter) === -1) return false;
  }
  if (gradeFilter && trophy.grade !== gradeFilter) return false;
  if (earnedFilter === 'earned' && !earned.has(trophy.id)) return false;
  if (earnedFilter === 'remaining' && earned.has(trophy.id)) return false;
  if (query) {
    var hay = (trophy.name + ' ' + trophy.description + ' ' + trophy.guide).toLowerCase();
    if (hay.indexOf(query) === -1) return false;
  }
  return true;
}

function el(tag, cls, text) {
  var node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function renderFacts() {
  var m = data.meta;
  $('facts-line').textContent =
    m.total + ' trophies · ' + m.grades.platinum + ' platinum · ' + m.grades.gold + ' gold · ' +
    m.grades.silver + ' silver · ' + m.grades.bronze + ' bronze · ' + m.hidden + ' hidden · ' +
    '0 online · difficulty ' + m.difficulty + ' · ' + m.time + ' for the platinum';
}

function renderProgress() {
  var total = data.trophies.length;
  var done = earned.size;
  var pct = total ? Math.round((done / total) * 100) : 0;
  $('progress-text').textContent = done + ' of ' + total + ' earned';
  $('progress-pct').textContent = pct + '%';
  $('progress-fill').style.width = pct + '%';
  var byGrade = {};
  data.trophies.forEach(function (t) {
    byGrade[t.grade] = byGrade[t.grade] || { done: 0, total: 0 };
    byGrade[t.grade].total += 1;
    if (earned.has(t.id)) byGrade[t.grade].done += 1;
  });
  $('grade-counts').textContent = ['platinum', 'gold', 'silver', 'bronze'].map(function (g) {
    return gradeWord(g) + ' ' + byGrade[g].done + '/' + byGrade[g].total;
  }).join(' · ') + (done === total ? ' — platinum earned. Leonida Legend!' : '');
}

function renderRoadmap() {
  var list = $('roadmap-list');
  list.textContent = '';
  data.roadmap.forEach(function (stage) {
    var li = el('li');
    li.appendChild(el('h3', null, 'Stage ' + stage.stage + ' — ' + stage.title));
    li.appendChild(el('p', null, stage.text));
    var names = data.trophies
      .filter(function (t) { return t.roadmap === stage.stage; })
      .map(function (t) { return t.name; });
    if (names.length) {
      li.appendChild(el('p', 'stage-trophies', 'Trophies here: ' + names.join(' · ')));
    }
    list.appendChild(li);
  });
}

function renderFilters() {
  var wrap = $('filters');
  wrap.textContent = '';
  KIND_FILTERS.forEach(function (kind) {
    var btn = el('button', 'chip', kind === 'all' ? 'All trophies' : KIND_LABELS[kind]);
    btn.type = 'button';
    btn.setAttribute('aria-pressed', kindFilter === kind ? 'true' : 'false');
    btn.addEventListener('click', function () {
      kindFilter = kind;
      renderFilters();
      renderList();
    });
    wrap.appendChild(btn);
  });
}

function trophyCard(trophy) {
  var li = el('li', 'trophy' + (earned.has(trophy.id) ? ' earned' : ''));
  li.id = 'trophy-' + trophy.id;

  var head = el('div', 'trophy-head');
  var box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(trophy.id);
  box.setAttribute('aria-label', 'Earned: ' + trophy.name);
  box.addEventListener('change', function () {
    if (box.checked) earned.add(trophy.id); else earned.delete(trophy.id);
    saveState();
    renderProgress();
    renderList();
  });
  head.appendChild(box);

  var main = el('div', 'trophy-main');
  var hidden = isSpoilerHidden(trophy);
  var name = el('p', 'trophy-name');
  name.appendChild(el('span', 'num', '#' + trophy.id));
  name.appendChild(document.createTextNode(hidden ? 'Hidden story trophy' : trophy.name));
  main.appendChild(name);

  var desc = el('p', 'trophy-desc' + (hidden ? ' hidden-text' : ''));
  desc.textContent = hidden
    ? 'Hidden until earned — tick the box when you earn it to reveal the name and description.'
    : trophy.description;
  main.appendChild(desc);

  var tags = el('div', 'tags');
  tags.appendChild(el('span', 'tag grade-' + trophy.grade, gradeWord(trophy.grade)));
  trophy.kinds.forEach(function (k) {
    if (k === 'missable') return;
    tags.appendChild(el('span', 'tag kind-' + k, KIND_LABELS[k] || k));
  });
  if (trophy.hidden) tags.appendChild(el('span', 'tag hidden-tag', 'Hidden on PSN'));
  if (trophy.missable) tags.appendChild(el('span', 'tag missable', '⚠ Potentially missable'));
  main.appendChild(tags);

  if (!hidden) {
    var details = document.createElement('details');
    if (openId === trophy.id) details.open = true;
    var summary = el('summary', null, 'Guide & sources');
    details.appendChild(summary);
    var guide = el('p', 'guide-text');
    var unconfirmed = trophy.guide.indexOf('No confirmed trigger yet') !== -1;
    if (unconfirmed) guide.classList.add('unconfirmed');
    guide.textContent = (unconfirmed ? 'Unconfirmed at launch — ' : '') + trophy.guide;
    details.appendChild(guide);
    if (trophy.sources && trophy.sources.length) {
      var srcTitle = el('p', 'sources', 'Sources: ');
      var srcList = document.createElement('ul');
      srcList.className = 'sources';
      trophy.sources.forEach(function (s) {
        var item = document.createElement('li');
        if (s.url) {
          var a = document.createElement('a');
          a.href = s.url;
          a.target = '_blank';
          a.rel = 'noopener';
          a.textContent = s.name;
          item.appendChild(a);
        } else {
          item.textContent = s.name;
        }
        srcList.appendChild(item);
      });
      details.appendChild(srcTitle);
      details.appendChild(srcList);
    }
    main.appendChild(details);
  }
  head.appendChild(main);
  li.appendChild(head);
  return li;
}

function renderList() {
  var list = $('trophy-list');
  list.textContent = '';
  var shown = data.trophies.filter(trophyMatches);
  shown.forEach(function (t) { list.appendChild(trophyCard(t)); });
  var empty = $('empty-msg');
  if (shown.length === 0) {
    empty.hidden = false;
    empty.textContent = kindFilter === 'online'
      ? 'No online trophies — all 55 are single-player (Output Lag / PowerPyx). Nothing to track here.'
      : 'No trophies match these filters. Try clearing the search or choosing another filter.';
  } else {
    empty.hidden = true;
  }
  $('list-note').textContent = 'Showing ' + shown.length + ' of ' + data.trophies.length +
    ' trophies' + (kindFilter !== 'all' ? ' · filter: ' + KIND_LABELS[kindFilter] : '') +
    (spoilerOn ? ' · story spoilers hidden until earned' : '');
  $('list-heading').textContent = 'Checklist — ' + data.trophies.length + ' trophies';
}

function exportProgress() {
  var payload = {
    app: 'gta6-trophy-guide-01',
    exportedAt: new Date().toISOString(),
    earned: Array.from(earned).sort(function (a, b) { return a - b; })
  };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

function importProgress(file) {
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var parsed = JSON.parse(String(reader.result));
      var ids = parsed.earned || parsed;
      if (!Array.isArray(ids)) throw new Error('no earned list');
      var valid = new Set(data.trophies.map(function (t) { return t.id; }));
      var next = new Set();
      ids.forEach(function (n) { if (valid.has(n)) next.add(n); });
      earned = next;
      saveState();
      renderProgress();
      renderList();
      $('saved-note').textContent = 'Imported ' + next.size + ' earned trophies.';
    } catch (err) {
      $('saved-note').textContent = 'That file could not be imported — it is not a progress export from this guide.';
    }
  };
  reader.readAsText(file);
}

function bindControls() {
  $('search').addEventListener('input', function (e) {
    query = e.target.value.trim().toLowerCase();
    renderList();
  });
  $('grade-filter').addEventListener('change', function (e) {
    gradeFilter = e.target.value;
    renderList();
  });
  $('earned-filter').addEventListener('change', function (e) {
    earnedFilter = e.target.value;
    renderList();
  });
  $('spoiler-toggle').addEventListener('change', function (e) {
    spoilerOn = e.target.checked;
    saveState();
    renderList();
  });
  $('export-btn').addEventListener('click', exportProgress);
  $('import-btn').addEventListener('click', function () { $('import-file').click(); });
  $('import-file').addEventListener('change', function (e) {
    if (e.target.files && e.target.files[0]) importProgress(e.target.files[0]);
    e.target.value = '';
  });
  $('reset-btn').addEventListener('click', function () {
    if (window.confirm('Clear every tick on this checklist?')) {
      earned = new Set();
      saveState();
      renderProgress();
      renderList();
    }
  });
}

function scrollToDemoTarget() {
  var demo = window.__demo;
  if (!demo) return;
  var target = null;
  if (demo === 'guide' && openId) target = $('trophy-' + openId);
  if (demo === 'roadmap') target = $('roadmap');
  if (target) target.scrollIntoView({ block: 'start' });
}

fetch('data/trophies.json')
  .then(function (res) {
    if (!res.ok) throw new Error('trophies.json: HTTP ' + res.status);
    return res.json();
  })
  .then(function (json) {
    data = json;
    loadState();
    applyDemo();
    $('spoiler-toggle').checked = spoilerOn;
    bindControls();
    renderFacts();
    renderProgress();
    renderRoadmap();
    renderFilters();
    renderList();
    scrollToDemoTarget();
  })
  .catch(function (err) {
    var list = $('trophy-list');
    list.textContent = '';
    var msg = el('li', 'trophy', 'Could not load the trophy data (' + err.message + '). Serve app/ from a static server and reload.');
    list.appendChild(msg);
  });
