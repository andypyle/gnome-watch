// Agent state + hook-event handling. No Electron imports, so it can be tested with plain Node.

const path = require('path');

const RELEASE_BEFORE_MS = 570 * 1000; // hand back to VS Code before Claude Code's 600s hook timeout
const REMOVE_ENDED_AFTER_MS = 4000;
const CHARACTER_COUNT = 8;

// Stable pick for a project folder: the same folder always maps to the same character.
function projectSlot(key) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return (h >>> 0) % CHARACTER_COUNT;
}
const HELPER_LINGER_MS = 4000;
const STALE_WORKING_MS = 15 * 60 * 1000; // "working" with no news for this long -> idle (e.g. you interrupted it) // a finished helper shows ✓ this long
const HELPER_STALE_MS = 15 * 60 * 1000; // hide helpers we haven't heard from in this long

// "design-agent" -> "Design agent", "general-purpose" -> "General purpose", "Explore" -> "Explore"
function helperLabel(type) {
  const t = String(type || 'helper').replace(/^.*:/, '').replace(/[-_]+/g, ' ').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function describeTool(name, input = {}) {
  const short = (s, n = 60) => {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  };
  const file = input.file_path || input.path || input.notebook_path;
  switch (name) {
    case 'Bash':
      return `Running ${short(input.description || input.command, 50)}`;
    case 'Read':
      return `Reading ${file ? path.basename(file) : 'a file'}`;
    case 'Edit':
    case 'MultiEdit':
    case 'Write':
    case 'NotebookEdit':
      return `Editing ${file ? path.basename(file) : 'a file'}`;
    case 'Grep':
    case 'Glob':
      return `Searching for ${short(input.pattern, 40)}`;
    case 'WebSearch':
      return `Searching the web: ${short(input.query, 40)}`;
    case 'WebFetch':
      return 'Reading a web page';
    case 'Task':
    case 'Agent':
      return `Sending a helper: ${short(input.description, 40)}`;
    case 'TaskCreate':
    case 'TaskUpdate':
    case 'TodoWrite':
      return 'Updating the task list';
    case 'AskUserQuestion':
      return 'Has a question for you';
    default: {
      // mcp__claude_ai_Figma__use_figma -> "Working in Figma"
      const mcp = /^mcp__(.+?)__/.exec(name || '');
      if (mcp) return `Working in ${mcp[1].replace(/^claude_ai_/, '').replace(/[_-]+/g, ' ')}`;
      return name ? `Using ${name}` : 'Working';
    }
  }
}

// "claude-opus-5-5" -> "Opus 5.5", "claude-sonnet-4-5-20250929" -> "Sonnet 4.5"
function prettyModel(id) {
  if (!id) return null;
  const raw = String(id).replace(/\[.*?\]/g, '');
  const m = /(opus|sonnet|haiku|fable|mythos)[-_ ]?(\d+)(?:[-.](\d{1,2})(?!\d))?/i.exec(raw);
  if (!m) return raw.replace(/^claude-/, '');
  const fam = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
  return `${fam} ${m[2]}${m[3] ? '.' + m[3] : ''}`;
}

// Backup: read the newest model name from the end of the session's transcript file.
function modelFromTranscript(file) {
  if (!file) return null;
  try {
    const fs = require('fs');
    const size = fs.statSync(file).size;
    const len = Math.min(size, 256 * 1024);
    const buf = Buffer.alloc(len);
    const fd = fs.openSync(file, 'r');
    fs.readSync(fd, buf, 0, len, size - len);
    fs.closeSync(fd);
    const matches = buf.toString('utf8').match(/"model"\s*:\s*"(claude-[^"]+|[a-z]+-[^"]*(?:opus|sonnet|haiku|fable|mythos)[^"]*)"/g);
    if (!matches) return null;
    return /"([^"]+)"$/.exec(matches[matches.length - 1])[1];
  } catch {
    return null;
  }
}

function createCore({ onChange = () => {}, shouldHold = () => true, now = () => Date.now() } = {}) {
  const agents = new Map(); // session_id -> agent
  const pending = new Map(); // id -> { id, sessionId, kind, toolName, toolInput, message, res, createdAt, timer }
  let seq = 0;

  function agentFor(ev) {
    const sid = ev.session_id || 'unknown';
    let a = agents.get(sid);
    if (!a) {
      const base = ev.cwd ? path.basename(ev.cwd) : 'Claude';
      const same = [...agents.values()].filter((x) => x.baseName === base).length;
      // Each project folder has its own gnome. If that one is already on screen, take the next free one.
      const used = new Set([...agents.values()].map((x) => x.slot % CHARACTER_COUNT));
      let slot = projectSlot(ev.cwd || sid);
      for (let i = 0; i < CHARACTER_COUNT && used.has(slot % CHARACTER_COUNT); i++) slot++;
      if (used.size >= CHARACTER_COUNT) slot = projectSlot(ev.cwd || sid) + CHARACTER_COUNT * Math.floor(agents.size / CHARACTER_COUNT);
      else slot %= CHARACTER_COUNT;
      a = {
        id: sid,
        slot,
        baseName: base,
        name: same ? `${base} #${same + 1}` : base,
        cwd: ev.cwd || '',
        status: 'idle',
        activity: 'Ready',
        model: null,
        modelCheckedAt: 0,
        tasks: new Map(),
        subagents: new Map(),
        startedAt: now(),
        lastEvent: now(),
        endedAt: null,
      };
      agents.set(sid, a);
    }
    if (ev.cwd && !a.cwd) a.cwd = ev.cwd;
    a.lastEvent = now();
    return a;
  }

  function updateModel(a, ev) {
    if (ev.to_model) a.model = ev.to_model; // PostModelSwitch / PreModelSwitch
    else if (ev.model && !ev.agent_id) a.model = typeof ev.model === 'string' ? ev.model : ev.model.id || a.model;
    // Fall back to the transcript, but don't read it more than every 15s.
    const checkpoints = ['SessionStart', 'UserPromptSubmit', 'Stop', 'PostToolUse'];
    if (checkpoints.includes(ev.hook_event_name) && ev.transcript_path && now() - a.modelCheckedAt > 15000) {
      a.modelCheckedAt = now();
      const found = modelFromTranscript(ev.transcript_path);
      if (found && !(ev.hook_event_name === 'SessionStart' && a.model)) a.model = found;
    }
  }

  function helperFor(a, ev) {
    let h = a.subagents.get(ev.agent_id);
    if (!h) {
      h = { id: ev.agent_id, type: ev.agent_type || 'helper', status: 'working', activity: 'Working', startedAt: now() };
      a.subagents.set(ev.agent_id, h);
    }
    if (ev.agent_type && (!h.type || h.type === 'helper')) h.type = ev.agent_type;
    h.lastEvent = now();
    return h;
  }

  function hasPending(sessionId) {
    for (const p of pending.values()) if (p.sessionId === sessionId) return true;
    return false;
  }

  function setWorking(a, activity) {
    if (!hasPending(a.id)) a.status = 'working';
    if (activity) a.activity = activity;
  }

  // Returns the response body string for the hook, or null if the request is being held.
  function handleEvent(ev, res) {
    const name = ev.hook_event_name;
    const a = agentFor(ev);
    updateModel(a, ev);
    if (ev._claude_pid) a.pid = ev._claude_pid;
    // Events from inside a helper (subagent) update that helper, not the main agent's line.
    const sub = ev.agent_id && name !== 'SubagentStop' ? helperFor(a, ev) : null;
    let reply = '';
    if (sub && (name === 'PreToolUse' || name === 'PostToolUse') && ev.tool_name !== 'AskUserQuestion') {
      if (name === 'PreToolUse') sub.activity = describeTool(ev.tool_name, ev.tool_input);
      else trackTasksFromTool(a, ev);
      // A helper working in the background doesn't mean the main agent is: leave its status alone.
      onChange();
      return reply;
    }

    switch (name) {
      case 'SessionStart':
        a.status = 'idle';
        a.activity = 'Ready';
        a.endedAt = null;
        break;

      case 'UserPromptSubmit':
        // Fresh request: if the last batch of tasks was all done, clear it so the bar restarts.
        if (a.tasks.size && [...a.tasks.values()].every((t) => t.done)) a.tasks.clear();
        setWorking(a, 'Thinking…');
        break;

      case 'PreToolUse':
        if (ev.tool_name === 'AskUserQuestion' && shouldHold(a)) {
          return hold(a, 'question', ev, res);
        }
        if (ev.tool_name === 'AskUserQuestion') {
          a.status = 'waiting';
          a.activity = 'Has a question for you (in VS Code)';
        } else {
          setWorking(a, describeTool(ev.tool_name, ev.tool_input));
        }
        break;

      case 'PostToolUse':
        trackTasksFromTool(a, ev);
        setWorking(a);
        if (ev.tool_name === 'AskUserQuestion' && !hasPending(a.id)) a.activity = 'Got your answer';
        break;

      case 'PermissionRequest':
        if (shouldHold(a)) return hold(a, 'permission', ev, res);
        a.status = 'waiting';
        a.activity = `Needs permission: ${ev.tool_name || 'a tool'} (in VS Code)`;
        break;

      case 'Notification': {
        const t = ev.notification_type;
        if (t === 'idle_prompt') {
          if (!hasPending(a.id)) {
            a.status = 'done';
            a.activity = 'Waiting for your next message';
          }
        } else if (['permission_prompt', 'agent_needs_input', 'elicitation_dialog', 'elicitation_url_dialog'].includes(t)) {
          if (!hasPending(a.id)) {
            a.status = 'waiting';
            a.activity = ev.message || 'Needs you in VS Code';
          }
        }
        break;
      }

      case 'Stop':
        if (!hasPending(a.id)) {
          a.status = 'done';
          a.activity = 'Finished. Your turn!';
        }
        // Helpers can keep running in the background after a turn ends; drop only quiet ones.
        for (const [id, h] of a.subagents) if (now() - h.lastEvent > 2 * 60 * 1000) a.subagents.delete(id);
        break;

      case 'SubagentStart': {
        const h = helperFor(a, ev);
        h.activity = 'Getting started';
        setWorking(a, `Sent ${helperLabel(h.type)} off to work`);
        break;
      }

      case 'SubagentStop': {
        const h = a.subagents.get(ev.agent_id);
        if (h) {
          h.status = 'done';
          h.activity = 'Done';
          // Let it show a ✓ for a moment, then leave.
          setTimeout(() => {
            if (a.subagents.get(ev.agent_id) === h) {
              a.subagents.delete(ev.agent_id);
              onChange();
            }
          }, HELPER_LINGER_MS);
        }
        if (!hasPending(a.id) && a.status === 'working') a.activity = `${helperLabel(ev.agent_type || (h && h.type))} finished`;
        break;
      }

      case 'TaskCreated':
        if (ev.task_id) a.tasks.set(String(ev.task_id), { subject: ev.task_subject || 'Task', done: false });
        break;

      case 'TaskCompleted':
        if (ev.task_id) {
          const t = a.tasks.get(String(ev.task_id)) || { subject: ev.task_subject || 'Task' };
          t.done = true;
          a.tasks.set(String(ev.task_id), t);
        }
        break;

      case 'SessionEnd':
        a.status = 'ended';
        a.activity = 'Session closed';
        a.endedAt = now();
        releaseSession(a.id);
        setTimeout(() => {
          const cur = agents.get(a.id);
          if (cur && cur.status === 'ended') {
            agents.delete(a.id);
            onChange();
          }
        }, REMOVE_ENDED_AFTER_MS);
        break;
    }

    onChange();
    return reply;
  }

  // Backup task tracking from the tools themselves, for setups where the
  // TaskCreated/TaskCompleted events don't fire (e.g. older Claude Code using TodoWrite).
  function trackTasksFromTool(a, ev) {
    const input = ev.tool_input || {};
    if (ev.tool_name === 'TodoWrite' && Array.isArray(input.todos)) {
      a.tasks.clear();
      input.todos.forEach((t, i) =>
        a.tasks.set(`todo-${i}`, { subject: t.content || t.subject || 'Task', done: t.status === 'completed' })
      );
    } else if (ev.tool_name === 'TaskUpdate' && input.taskId != null) {
      const id = String(input.taskId);
      if (input.status === 'deleted') a.tasks.delete(id);
      else if (input.status === 'completed' && a.tasks.has(id)) a.tasks.get(id).done = true;
    }
  }

  function hold(a, kind, ev, res) {
    const id = `p${++seq}`;
    const p = {
      id,
      sessionId: a.id,
      kind,
      toolName: ev.tool_name,
      toolInput: ev.tool_input || {},
      createdAt: now(),
      res,
      timer: setTimeout(() => release(id), RELEASE_BEFORE_MS),
    };
    pending.set(id, p);
    a.status = 'waiting';
    a.activity = kind === 'question' ? 'Has a question for you' : `Wants to use ${ev.tool_name}`;
    if (res && res.on) {
      // Claude Code gave up on the hook (interrupt, timeout): forget the prompt.
      res.on('close', () => {
        if (pending.has(id) && !res.writableEnded) drop(id, 'Prompt cancelled');
      });
    }
    onChange();
    return null;
  }

  function finish(id, body) {
    const p = pending.get(id);
    if (!p) return false;
    clearTimeout(p.timer);
    pending.delete(id);
    if (p.res && !p.res.writableEnded) {
      p.res.writeHead(200, { 'content-type': 'application/json' });
      p.res.end(body);
    }
    const a = agents.get(p.sessionId);
    if (a && !hasPending(a.id)) {
      a.status = 'working';
    }
    return p;
  }

  function drop(id, activity) {
    const p = pending.get(id);
    if (!p) return;
    clearTimeout(p.timer);
    pending.delete(id);
    const a = agents.get(p.sessionId);
    if (a && !hasPending(a.id) && a.status === 'waiting') {
      a.status = 'idle';
      a.activity = activity;
    }
    onChange();
  }

  // Hand the prompt back to Claude Code's own dialog in VS Code.
  function release(id) {
    const p = finish(id, '');
    if (!p) return;
    const a = agents.get(p.sessionId);
    if (a) {
      a.status = 'waiting';
      a.activity = p.kind === 'question' ? 'Question is waiting in VS Code' : 'Permission prompt is waiting in VS Code';
    }
    onChange();
  }

  function releaseSession(sessionId) {
    for (const p of [...pending.values()]) if (p.sessionId === sessionId) release(p.id);
  }

  function releaseAll() {
    for (const id of [...pending.keys()]) release(id);
  }

  function resolve(id, action, answers) {
    const p = pending.get(id);
    if (!p) return false;
    const a = agents.get(p.sessionId);
    if (action === 'vscode') {
      release(id);
      return true;
    }
    let body;
    if (p.kind === 'permission') {
      const decision =
        action === 'allow'
          ? { behavior: 'allow' }
          : { behavior: 'deny', message: 'The user denied this from Gnome Watch.' };
      body = { hookSpecificOutput: { hookEventName: 'PermissionRequest', decision } };
      if (a) a.activity = action === 'allow' ? 'Permission granted, back to work' : 'Permission denied';
    } else {
      body = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'allow',
          updatedInput: { ...p.toolInput, answers: answers || {} },
        },
      };
      if (a) a.activity = 'Got your answer';
    }
    finish(id, JSON.stringify(body));
    onChange();
    return true;
  }

  function snapshot() {
    const list = [...agents.values()].map((a) => {
      const tasks = [...a.tasks.values()];
      return {
        id: a.id,
        name: a.name,
        slot: a.slot,
        model: prettyModel(a.model),
        modelId: a.model,
        cwd: a.cwd,
        status: a.status,
        activity: (() => {
          const out = [...a.subagents.values()].filter((h) => h.status !== 'done' && now() - h.lastEvent < HELPER_STALE_MS).length;
          if (out && (a.status === 'done' || a.status === 'idle'))
            return `${a.activity.replace(/[.!]$/, '')} · ${out} helper${out > 1 ? 's' : ''} still working`;
          return a.activity;
        })(),
        tasksTotal: tasks.length,
        tasksDone: tasks.filter((t) => t.done).length,
        currentTask: (tasks.find((t) => !t.done) || {}).subject || null,
        helpers: [...a.subagents.values()]
          .filter((h) => h.status === 'done' || now() - h.lastEvent < HELPER_STALE_MS)
          .map((h) => ({ id: h.id, type: h.type, label: helperLabel(h.type), status: h.status, activity: h.activity })),
        startedAt: a.startedAt,
        lastEvent: a.lastEvent,
        pending: [...pending.values()]
          .filter((p) => p.sessionId === a.id)
          .map(({ id, kind, toolName, toolInput, createdAt }) => ({ id, kind, toolName, toolInput, createdAt })),
      };
    });
    list.sort((x, y) => x.startedAt - y.startedAt);
    return { agents: list, pendingCount: pending.size };
  }

  // Called every so often by the app. Removes agents whose Claude Code process has exited
  // (closed window, killed terminal) and settles agents that went quiet mid-task (e.g. interrupted).
  function sweep(isAlive) {
    let changed = false;
    for (const a of [...agents.values()]) {
      if (a.pid && !isAlive(a.pid)) {
        releaseSession(a.id);
        agents.delete(a.id);
        changed = true;
        continue;
      }
      if (a.status === 'working' && !hasPending(a.id) && now() - a.lastEvent > STALE_WORKING_MS) {
        a.status = 'idle';
        a.activity = 'Quiet for a while';
        changed = true;
      }
      for (const [id, h] of a.subagents) {
        if (h.status !== 'done' && now() - h.lastEvent > HELPER_STALE_MS) {
          a.subagents.delete(id);
          changed = true;
        }
      }
    }
    if (changed) onChange();
  }

  // Save/restore agents so restarting the widget doesn't lose sessions that are still open.
  function serialize() {
    return [...agents.values()]
      .filter((a) => a.status !== 'ended')
      .map(({ tasks, subagents, modelCheckedAt, ...rest }) => ({ ...rest, tasks: [...tasks.entries()] }));
  }

  function restore(list, maxAgeMs = 3 * 60 * 60 * 1000) {
    for (const s of list || []) {
      if (!s || !s.id || agents.has(s.id) || now() - (s.lastEvent || 0) > maxAgeMs) continue;
      const a = { ...s, tasks: new Map(s.tasks || []), subagents: new Map(), modelCheckedAt: 0 };
      // Anything mid-flight when we stopped is stale; the next hook event will correct it.
      if (a.status === 'working' || a.status === 'waiting') {
        a.activity = a.status === 'waiting' ? 'May be waiting for you in VS Code' : 'Checking in…';
        a.status = 'idle';
      }
      agents.set(a.id, a);
    }
    onChange();
  }

  return { handleEvent, resolve, release, releaseAll, snapshot, serialize, restore, sweep, agents, pending };
}

module.exports = { createCore, describeTool, prettyModel, helperLabel, projectSlot };
