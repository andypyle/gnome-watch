const api = window.gnome || {
  // Lets you open index.html in a normal browser for design work.
  onState: () => {},
  resize: () => {},
  resolve: (...a) => console.log('resolve', ...a),
  openEditor: (...a) => console.log('openEditor', ...a),
  toggle: () => {},
};

const SLEEP_AFTER_MS = 20 * 60 * 1000;
const STATUS_LABEL = { working: 'Working', waiting: 'Needs you', done: 'Done', idle: 'Idle', sleeping: 'Napping', ended: 'Closed' };
const BUBBLE = { waiting: '!', done: '✓', sleeping: 'z' };

// Each gnome carries its own state, so a helper inside a finished row can still be working.
function setGnomeState(container, st) {
  const svg = container && container.querySelector(':scope > .gnome-svg, :scope > .avatar > .gnome-svg, :scope > .helper-avatar > .gnome-svg, :scope > .row > .avatar > .gnome-svg');
  if (!svg) return;
  for (const c of [...svg.classList]) if (c.startsWith('st-')) svg.classList.remove(c);
  svg.classList.add(`st-${st}`);
}

const els = {
  panel: document.getElementById('panel'),
  tab: document.getElementById('tab'),
  agents: document.getElementById('agents'),
  empty: document.getElementById('empty'),
  summary: document.getElementById('summary'),
};
const rows = new Map(); // agentId -> { el, refs, cards: Map(pendingId -> el) }
const minis = new Map(); // agentId -> { el, fill, bubble }
const seenPending = new Set();
let latest = null;

document.getElementById('minimize').onclick = () => api.toggle();
els.tab.onclick = () => api.toggle();
document.getElementById('collapse').onclick = () => {
  document.body.classList.toggle('compact');
  try { localStorage.setItem('compact', document.body.classList.contains('compact') ? '1' : ''); } catch {}
};
try { if (localStorage.getItem('compact')) document.body.classList.add('compact'); } catch {}

// ---- Drawer: minimized tab <-> expanded panel ----
// The window is sized to whichever view is showing; the body adds room for the shadow.
const PAD_W = 12, PAD_H = 26;
let panelShown = false;
let transition = 0;
function measure() {
  const el = panelShown ? els.panel : els.tab;
  api.resize(el.offsetWidth + PAD_W, el.offsetHeight + PAD_H);
}
new ResizeObserver(measure).observe(els.panel);
new ResizeObserver(measure).observe(els.tab);

function setExpanded(expand) {
  if (expand === panelShown && !document.body.classList.contains('collapsing')) return;
  const t = ++transition;
  if (expand) {
    document.body.classList.remove('collapsing');
    panelShown = true;
    document.body.classList.add('show-panel');
    els.panel.classList.add('out');
    measure(); // grow the window first (it stays anchored to the right edge)...
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (t === transition) els.panel.classList.remove('out'); // ...then slide the panel out
    }));
  } else {
    document.body.classList.add('collapsing');
    els.panel.classList.add('out'); // slide the panel back in...
    setTimeout(() => {
      if (t !== transition) return;
      panelShown = false;
      document.body.classList.remove('show-panel', 'collapsing');
      measure(); // ...then shrink to the tab
    }, 230);
  }
}

function renderMiniHelpers(m, a) {
  if (!m.helperBox) {
    m.helperBox = h('div', 'mini-helpers');
    m.helperEls = new Map();
    m.el.appendChild(m.helperBox);
  }
  const ids = new Set(a.helpers.map((x) => x.id));
  for (const [id, el] of m.helperEls) if (!ids.has(id)) { el.remove(); m.helperEls.delete(id); }
  a.helpers.forEach((hp, i) => {
    let el = m.helperEls.get(hp.id);
    if (!el) {
      el = h('div', 'mini-helper');
      el.innerHTML = window.gnomeSVG(window.helperSlot(hp.type, a.slot), 22);
      m.helperEls.set(hp.id, el);
    }
    el.className = `mini-helper ${hp.status === 'done' ? 'done' : 'working'}`;
    setGnomeState(el, hp.status === 'done' ? 'done' : 'working');
    el.title = `${hp.label}: ${hp.activity}`;
    if (m.helperBox.children[i] !== el) m.helperBox.insertBefore(el, m.helperBox.children[i] || null);
  });
}

let placeholder = null;
function renderTab(agents) {
  // With no agents, show a single napping gnome so you know the widget is running.
  if (!agents.length) {
    if (!placeholder) {
      placeholder = h('div', 'mini sleeping placeholder');
      placeholder.innerHTML = window.gnomeSVG(0, 34);
      const b = h('span', 'bubble', 'z');
      placeholder.appendChild(b);
      placeholder.title = 'No Claude Code agents running';
      setGnomeState(placeholder, 'sleeping');
    }
    if (!placeholder.isConnected) els.tab.appendChild(placeholder);
  } else if (placeholder && placeholder.isConnected) {
    placeholder.remove();
  }
  const live = new Set(agents.map((a) => a.id));
  for (const [id, m] of minis) if (!live.has(id)) { m.el.remove(); minis.delete(id); }
  agents.forEach((a, i) => {
    let m = minis.get(a.id);
    if (!m) {
      const who = window.gnomeCharacter(a.slot);
      const el = h('div', 'mini');
      el.style.setProperty('--gnome', who.hat);
      el.innerHTML = window.gnomeSVG(a.slot, 34);
      const bubble = h('span', 'bubble');
      const bar = h('div', 'minibar');
      const fill = h('div', 'fill');
      bar.appendChild(fill);
      el.append(bubble, bar);
      m = { el, fill, bubble, who };
      minis.set(a.id, m);
    }
    const st = displayStatus(a);
    m.el.className = `mini ${st}`;
    setGnomeState(m.el, st);
    m.el.title = `${a.name} · ${m.who.name}: ${a.activity}`;
    m.bubble.textContent = BUBBLE[st] || '';
    m.fill.style.width = a.tasksTotal ? `${Math.round((a.tasksDone / a.tasksTotal) * 100)}%` : st === 'done' ? '100%' : '0%';
    m.el.classList.toggle('indeterminate', !a.tasksTotal && st === 'working');
    renderMiniHelpers(m, a);
    if (els.tab.children[i] !== m.el) els.tab.insertBefore(m.el, els.tab.children[i] || null);
  });
}

function h(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function displayStatus(a) {
  if ((a.status === 'idle' || a.status === 'done') && Date.now() - a.lastEvent > SLEEP_AFTER_MS) return 'sleeping';
  return a.status;
}

function makeRow(a) {
  const el = h('div', 'agent');
  const row = h('div', 'row');
  const avatar = h('div', 'avatar');
  const who = window.gnomeCharacter(a.slot);
  avatar.innerHTML = window.gnomeSVG(a.slot);
  const bubble = h('span', 'bubble');
  avatar.appendChild(bubble);
  avatar.title = `${who.name} ${who.role}. Click to open in VS Code`;
  el.style.setProperty('--gnome', who.hat);
  avatar.style.cursor = 'pointer';
  avatar.onclick = () => api.openEditor(a.id);

  const info = h('div', 'info');
  const line1 = h('div', 'line1');
  const name = h('span', 'name');
  const gname = h('span', 'gname', who.name);
  const status = h('span', 'status');
  line1.append(name, gname, status);
  const line2 = h('div', 'line2');
  const activity = h('div', 'activity');
  const model = h('span', 'model');
  line2.append(activity, model);
  const bar = h('div', 'bar');
  const fill = h('div', 'fill');
  bar.appendChild(fill);
  const barlabel = h('div', 'barlabel');
  const task = h('span', 'task');
  const count = h('span', 'count');
  barlabel.append(task, count);
  const helpers = h('div', 'helpers');
  info.append(line1, line2, bar, barlabel, helpers);
  row.append(avatar, info);

  const prompts = h('div', 'prompts');
  el.append(row, prompts);
  return { el, refs: { bubble, name, status, activity, model, bar, fill, task, count, helpers, prompts }, cards: new Map() };
}

function updateRow(r, a) {
  const st = displayStatus(a);
  r.el.className = `agent ${st}`;
  setGnomeState(r.el, st);
  const { refs } = r;
  refs.name.textContent = a.name;
  refs.name.title = a.cwd;
  refs.status.textContent = STATUS_LABEL[st] || st;
  refs.activity.textContent = a.activity;
  refs.activity.title = a.activity;
  refs.bubble.textContent = BUBBLE[st] || '';
  refs.model.textContent = a.model || '';
  refs.model.title = a.modelId || '';
  refs.model.hidden = !a.model;

  if (a.tasksTotal > 0) {
    refs.bar.classList.remove('indeterminate');
    refs.fill.style.width = `${Math.round((a.tasksDone / a.tasksTotal) * 100)}%`;
    refs.task.textContent = a.tasksDone === a.tasksTotal ? 'All tasks done' : a.currentTask || '';
    refs.count.textContent = `${a.tasksDone}/${a.tasksTotal} tasks`;
  } else {
    refs.bar.classList.toggle('indeterminate', st === 'working');
    refs.fill.style.width = st === 'done' ? '100%' : '0%';
    refs.task.textContent = st === 'working' ? 'No task list yet' : '';
    refs.count.textContent = '';
  }

  renderHelperRows(r, a);

  // Prompt cards: add new, remove resolved, leave the rest alone so typing isn't lost.
  const ids = new Set(a.pending.map((p) => p.id));
  for (const [id, card] of r.cards) if (!ids.has(id)) { card.remove(); r.cards.delete(id); }
  for (const p of a.pending) {
    if (!r.cards.has(p.id)) {
      const card = p.kind === 'question' ? questionCard(a, p) : permissionCard(a, p);
      r.cards.set(p.id, card);
      refs.prompts.appendChild(card);
    }
  }
}

// Each helper gets a small row of its own under the agent that sent it.
function renderHelperRows(r, a) {
  r.helperEls = r.helperEls || new Map();
  const ids = new Set(a.helpers.map((x) => x.id));
  for (const [id, el] of r.helperEls) if (!ids.has(id)) { el.remove(); r.helperEls.delete(id); }
  a.helpers.forEach((hp, i) => {
    let item = r.helperEls.get(hp.id);
    if (!item) {
      const slot = window.helperSlot(hp.type, a.slot);
      const el = h('div', 'helper-row');
      el.style.setProperty('--gnome', window.gnomeCharacter(slot).hat);
      const av = h('div', 'helper-avatar');
      av.innerHTML = window.gnomeSVG(slot, 22);
      const text = h('div', 'helper-text');
      const label = h('span', 'helper-label');
      const act = h('span', 'helper-activity');
      text.append(label, act);
      el.append(av, text);
      item = el;
      item._refs = { label, act };
      r.helperEls.set(hp.id, item);
    }
    item.className = `helper-row ${hp.status === 'done' ? 'done' : 'working'}`;
    setGnomeState(item, hp.status === 'done' ? 'done' : 'working');
    item._refs.label.textContent = hp.label;
    item._refs.act.textContent = hp.status === 'done' ? '✓ Done' : hp.activity;
    item.title = `${hp.label}: ${hp.activity}`;
    if (r.refs.helpers.children[i] !== item) r.refs.helpers.insertBefore(item, r.refs.helpers.children[i] || null);
  });
}

function previewFor(p) {
  const i = p.toolInput || {};
  if (p.toolName === 'Bash') return i.command || '';
  if (i.file_path) {
    const extra = i.new_string || i.content || '';
    return i.file_path + (extra ? `\n\n${String(extra).slice(0, 600)}` : '');
  }
  if (i.url) return i.url;
  const s = JSON.stringify(i, null, 1);
  return s.length > 700 ? s.slice(0, 700) + '…' : s;
}

function permissionCard(a, p) {
  const card = h('div', 'card');
  card.append(h('div', 'chip', 'Permission'));
  card.append(h('h4', null, `${a.name} wants to use ${p.toolName}`));
  if (p.toolInput && p.toolInput.description) card.append(h('div', null, p.toolInput.description));
  card.append(h('div', 'preview', previewFor(p)));
  const actions = h('div', 'actions');
  const allow = h('button', 'btn', 'Allow');
  const deny = h('button', 'btn secondary', 'Deny');
  const vs = h('button', 'btn link', 'Use VS Code');
  allow.onclick = () => api.resolve(p.id, 'allow');
  deny.onclick = () => api.resolve(p.id, 'deny');
  vs.onclick = () => api.openEditor(a.id);
  actions.append(allow, deny, vs);
  card.append(actions);
  return card;
}

function questionCard(a, p) {
  const questions = (p.toolInput && p.toolInput.questions) || [];
  const answers = {}; // question text -> Set of labels | string
  const multi = questions.length > 1;
  const card = h('div', 'card');
  card.append(h('div', 'chip', `${a.name} asks`));

  const answered = (q) => {
    const v = answers[q.question];
    return !!(v && (typeof v === 'string' ? v.trim() : v.size));
  };
  const ready = () => questions.every(answered);

  // One question at a time: tabs on top, questions side by side in a sliding track.
  const tabs = h('div', questions.length > 2 ? 'q-tabs many' : 'q-tabs');
  const viewport = h('div', 'q-viewport');
  const track = h('div', 'q-track');
  viewport.append(track);
  const panes = [];
  const tabEls = [];
  let current = 0;

  const submit = h('button', 'btn', multi ? 'Send answers' : 'Send answer');
  const next = h('button', 'btn secondary', 'Next →');

  function go(i) {
    current = Math.max(0, Math.min(questions.length - 1, i));
    track.style.transform = `translateX(-${current * 100}%)`; // forward slides right-to-left
    tabEls.forEach((t, j) => t.classList.toggle('active', j === current));
    panes.forEach((pn, j) => pn.setAttribute('aria-hidden', j === current ? 'false' : 'true'));
    viewport.style.height = `${panes[current].offsetHeight}px`;
    refresh();
  }

  function refresh() {
    tabEls.forEach((t, j) => t.classList.toggle('done', answered(questions[j])));
    submit.disabled = !ready();
    // Show "Next" until the last question, then "Send"
    const onLast = current === questions.length - 1;
    next.hidden = !multi || onLast;
    submit.hidden = multi && !onLast && !ready();
  }

  function advance() {
    if (current < questions.length - 1) setTimeout(() => go(current + 1), 260);
  }

  questions.forEach((q, i) => {
    if (multi) {
      // Tab = number + label. With 3+ questions, only the current tab shows its label.
      const t = h('button', 'q-tab');
      t.append(h('span', 'q-num', String(i + 1)), h('span', 'q-label', q.header || `Question ${i + 1}`));
      t.title = q.header ? `${q.header}: ${q.question}` : q.question;
      t.onclick = () => go(i);
      tabEls.push(t);
      tabs.append(t);
    }
    const pane = h('div', 'q-pane');
    if (!multi && q.header) pane.append(h('div', 'chip', q.header));
    pane.append(h('div', 'qtext', q.question));
    const opts = h('div', 'opts');
    const buttons = [];
    const other = h('input', 'other');
    other.placeholder = 'Something else…';
    (q.options || []).forEach((o) => {
      const b = h('button', 'opt', o.label);
      if (o.description) b.append(h('small', null, o.description));
      b.onclick = () => {
        other.value = '';
        let cur = answers[q.question];
        if (q.multiSelect) {
          if (!(cur instanceof Set)) cur = answers[q.question] = new Set();
          cur.has(o.label) ? cur.delete(o.label) : cur.add(o.label);
          b.classList.toggle('selected', cur.has(o.label));
        } else {
          answers[q.question] = new Set([o.label]);
          buttons.forEach((x) => x.classList.toggle('selected', x === b));
          advance(); // picking one answer moves on to the next question
        }
        refresh();
      };
      buttons.push(b);
      opts.append(b);
    });
    if (q.multiSelect) opts.prepend(h('div', 'q-hint', 'Pick any that apply'));
    other.oninput = () => {
      buttons.forEach((x) => x.classList.remove('selected'));
      answers[q.question] = other.value;
      refresh();
    };
    other.onkeydown = (e) => {
      if (e.key !== 'Enter' || !answered(q)) return;
      if (current < questions.length - 1) go(current + 1);
      else if (ready()) submit.click();
    };
    opts.append(other);
    pane.append(opts);
    panes.push(pane);
    track.append(pane);
  });

  if (multi) card.append(tabs);
  card.append(viewport);

  next.onclick = () => go(current + 1);
  submit.onclick = () => {
    const out = {};
    for (const q of questions) {
      const v = answers[q.question];
      out[q.question] = typeof v === 'string' ? v.trim() : [...v].join(', ');
    }
    api.resolve(p.id, 'answer', out);
  };
  const vs = h('button', 'btn link', 'Use VS Code');
  vs.onclick = () => api.openEditor(a.id);
  const actions = h('div', 'actions');
  actions.append(next, submit, vs);
  card.append(actions);

  // Size the viewport to the current question once the card is on screen.
  requestAnimationFrame(() => go(0));
  new ResizeObserver(() => (viewport.style.height = `${panes[current].offsetHeight}px`)).observe(track);
  return card;
}

let audioCtx = null;
function chime() {
  try {
    audioCtx = audioCtx || new AudioContext();
    const t = audioCtx.currentTime;
    [660, 880].forEach((f, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.12, t + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.35);
      o.connect(g).connect(audioCtx.destination);
      o.start(t + i * 0.12);
      o.stop(t + i * 0.12 + 0.4);
    });
  } catch {}
}

let currentPack = null;
function render(state) {
  // Switching packs redraws everything from scratch (main sends the state again on reload).
  const wantPack = state.pack || 'gnomes';
  if (currentPack === null) {
    currentPack = wantPack;
    window.setCharacterPack(wantPack);
  } else if (wantPack !== currentPack) {
    location.reload();
    return;
  }
  latest = state;
  // Cap the list by the screen, never by the window itself (that would shrink in a loop).
  if (state.maxListHeight) els.agents.style.maxHeight = `${state.maxListHeight}px`;
  const { agents } = state;
  const live = new Set(agents.map((a) => a.id));
  for (const [id, r] of rows) if (!live.has(id)) { r.el.remove(); rows.delete(id); }

  let newPending = false;
  agents.forEach((a, i) => {
    let r = rows.get(a.id);
    if (!r) { r = makeRow(a); rows.set(a.id, r); }
    updateRow(r, a);
    if (els.agents.children[i] !== r.el) els.agents.insertBefore(r.el, els.agents.children[i] || null);
    for (const p of a.pending) if (!seenPending.has(p.id)) { seenPending.add(p.id); newPending = true; }
  });
  if (newPending && state.sound) chime();

  renderTab(agents);
  if (typeof state.expanded === 'boolean') setExpanded(state.expanded);

  els.empty.hidden = agents.length > 0;
  const working = agents.filter((a) => a.status === 'working').length;
  const waiting = agents.filter((a) => a.status === 'waiting').length;
  els.summary.textContent = [working && `${working} working`, waiting && `${waiting} need${waiting === 1 ? 's' : ''} you`]
    .filter(Boolean)
    .join(' · ');
}

api.onState(render);
// Keep "napping" status fresh even with no new events.
setInterval(() => latest && render(latest), 60 * 1000);
window.__render = render; // used by the design preview
