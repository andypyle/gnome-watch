// End-to-end test: starts the real server, pipes fake Claude Code events through the
// real hook script, and checks the state and the decisions printed back.
// Uses a temporary HOME so it never touches your real settings.
const assert = require('assert');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'gw-'));
process.env.HOME = tmpHome;
process.env.USERPROFILE = tmpHome;
os.homedir = () => tmpHome;

const { createCore } = require('../src/core');
const { startServer } = require('../src/server');
const HOOK = path.join(__dirname, '..', 'hook', 'gnome-hook.js');

function runHook(ev) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [HOOK], { env: { ...process.env, HOME: tmpHome, USERPROFILE: tmpHome } });
    let out = '';
    p.stdout.on('data', (d) => (out += d));
    p.on('exit', (code) => resolve({ code, out }));
    p.stdin.end(JSON.stringify(ev));
  });
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  let hold = true;
  const core = createCore({ shouldHold: () => hold });
  const { server } = await startServer(core);
  const S = { session_id: 's1', cwd: '/Users/andy/projects/website' };
  const agent = () => core.snapshot().agents.find((a) => a.id === 's1');

  await runHook({ ...S, hook_event_name: 'SessionStart' });
  assert.equal(agent().name, 'website');
  assert.equal(agent().status, 'idle');

  await runHook({ ...S, hook_event_name: 'UserPromptSubmit', prompt: 'hi' });
  assert.equal(agent().status, 'working');

  for (const [id, subject] of [['1', 'Write tests'], ['2', 'Fix bug'], ['3', 'Update docs']])
    await runHook({ ...S, hook_event_name: 'TaskCreated', task_id: id, task_subject: subject });
  await runHook({ ...S, hook_event_name: 'TaskCompleted', task_id: '1', task_subject: 'Write tests' });
  assert.equal(agent().tasksTotal, 3);
  assert.equal(agent().tasksDone, 1);
  assert.equal(agent().currentTask, 'Fix bug');

  const r = await runHook({ ...S, hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'npm test', description: 'Run the test suite' } });
  assert.equal(r.out, '');
  assert.match(agent().activity, /Running Run the test suite/);

  // Permission prompt held, then allowed from the widget
  const permP = runHook({ ...S, hook_event_name: 'PermissionRequest', tool_name: 'Bash', tool_input: { command: 'rm -rf dist' } });
  await wait(300);
  assert.equal(agent().status, 'waiting');
  assert.equal(agent().pending.length, 1);
  core.resolve(agent().pending[0].id, 'allow');
  const perm = await permP;
  assert.deepEqual(JSON.parse(perm.out), { hookSpecificOutput: { hookEventName: 'PermissionRequest', decision: { behavior: 'allow' } } });
  assert.equal(agent().status, 'working');

  // AskUserQuestion answered from the widget
  const questions = [{ question: 'Which framework?', header: 'Framework', multiSelect: false, options: [{ label: 'React' }, { label: 'Vue' }] }];
  const qP = runHook({ ...S, hook_event_name: 'PreToolUse', tool_name: 'AskUserQuestion', tool_input: { questions } });
  await wait(300);
  assert.equal(agent().pending[0].kind, 'question');
  core.resolve(agent().pending[0].id, 'answer', { 'Which framework?': 'React' });
  const q = JSON.parse((await qP).out);
  assert.equal(q.hookSpecificOutput.permissionDecision, 'allow');
  assert.deepEqual(q.hookSpecificOutput.updatedInput.answers, { 'Which framework?': 'React' });
  assert.deepEqual(q.hookSpecificOutput.updatedInput.questions, questions);

  // Held prompt handed back to VS Code (empty output = Claude Code shows its own dialog)
  const relP = runHook({ ...S, hook_event_name: 'PermissionRequest', tool_name: 'Write', tool_input: { file_path: '/x/a.txt' } });
  await wait(300);
  core.releaseAll();
  assert.equal((await relP).out, '');

  // When you're in VS Code, nothing is held
  hold = false;
  const t0 = Date.now();
  const nh = await runHook({ ...S, hook_event_name: 'PermissionRequest', tool_name: 'Bash', tool_input: { command: 'ls' } });
  assert.equal(nh.out, '');
  assert.ok(Date.now() - t0 < 1500);
  assert.equal(agent().status, 'waiting');

  // Subagents, a second session with the same folder name, stop
  await runHook({ ...S, hook_event_name: 'SubagentStart', agent_id: 'a1', agent_type: 'design-agent' });
  assert.equal(agent().helpers.length, 1);
  assert.equal(agent().helpers[0].label, 'Design agent');
  const before = agent().activity;
  await runHook({ ...S, hook_event_name: 'PreToolUse', agent_id: 'a1', agent_type: 'design-agent', tool_name: 'Read', tool_input: { file_path: '/p/Button.tsx' } });
  assert.equal(agent().helpers[0].activity, 'Reading Button.tsx'); // helper's own line
  assert.equal(agent().activity, before); // parent line unchanged
  // A helper we never saw start (e.g. widget restarted) still shows up
  await runHook({ ...S, hook_event_name: 'PreToolUse', agent_id: 'a2', agent_type: 'frontend-agent', tool_name: 'Bash', tool_input: { command: 'npm run build' } });
  assert.deepEqual(agent().helpers.map((h) => h.label), ['Design agent', 'Frontend agent']);
  await runHook({ ...S, hook_event_name: 'SubagentStop', agent_id: 'a1', agent_type: 'design-agent' });
  assert.equal(agent().helpers[0].status, 'done');
  await runHook({ ...S, hook_event_name: 'Stop' });
  assert.equal(agent().status, 'done');
  assert.equal(agent().helpers.length, 2); // recent helpers survive the parent's turn ending
  await runHook({ session_id: 's2', cwd: '/other/website', hook_event_name: 'SessionStart' });
  assert.equal(core.snapshot().agents[1].name, 'website #2');

  // Wrong token is rejected
  const bad = await fetch(`http://127.0.0.1:${JSON.parse(fs.readFileSync(path.join(tmpHome, '.gnome-watch', 'server.json'))).port}/event`, {
    method: 'POST',
    headers: { 'x-gnome-token': 'nope' },
    body: '{}',
  });
  assert.equal(bad.status, 404);

  server.close();
  // Hook exits quietly when the app isn't running
  fs.unlinkSync(path.join(tmpHome, '.gnome-watch', 'server.json'));
  const off = await runHook({ ...S, hook_event_name: 'PreToolUse', tool_name: 'Bash' });
  assert.equal(off.code, 0);
  assert.equal(off.out, '');

  // Model: pretty names
  const { prettyModel } = require('../src/core');
  assert.equal(prettyModel('claude-opus-5-5'), 'Opus 5.5');
  assert.equal(prettyModel('claude-sonnet-4-5-20250929'), 'Sonnet 4.5');
  assert.equal(prettyModel('claude-haiku-5-5[1m]'), 'Haiku 5.5');
  assert.equal(prettyModel('claude-opus-4-20250514'), 'Opus 4');
  assert.equal(prettyModel('claude-fable-5-2'), 'Fable 5.2');

  // Model: from SessionStart, then PostModelSwitch, then the transcript fallback
  const core2 = createCore();
  const ev = (o) => core2.handleEvent({ session_id: 'm1', cwd: '/x/proj', ...o }, null);
  const m = () => core2.snapshot().agents[0];
  ev({ hook_event_name: 'SessionStart', model: 'claude-opus-5-5' });
  assert.equal(m().model, 'Opus 5.5');
  ev({ hook_event_name: 'PostModelSwitch', from_model: 'claude-opus-5-5', to_model: 'claude-sonnet-5-5' });
  assert.equal(m().model, 'Sonnet 5.5');
  const tr = path.join(tmpHome, 't.jsonl');
  fs.writeFileSync(tr, [
    JSON.stringify({ type: 'user', message: { role: 'user', content: 'hi' } }),
    JSON.stringify({ type: 'assistant', message: { model: 'claude-sonnet-5-5', role: 'assistant' } }),
    JSON.stringify({ type: 'assistant', message: { model: 'claude-haiku-5-5', role: 'assistant' } }),
  ].join('\n') + '\n');
  core2.handleEvent({ session_id: 'm2', cwd: '/x/other', hook_event_name: 'Stop', transcript_path: tr }, null);
  assert.equal(core2.snapshot().agents[1].model, 'Haiku 5.5');

  // Save/restore across restarts
  const saved = JSON.parse(JSON.stringify(core2.serialize()));
  const core3 = createCore();
  core3.restore(saved);
  const r1 = core3.snapshot().agents;
  assert.equal(r1.length, 2);
  assert.equal(r1[0].model, 'Sonnet 5.5');
  assert.equal(r1[0].slot, saved[0].slot); // keeps its gnome across restarts
  core3.restore([{ id: 'old', slot: 5, name: 'old', status: 'idle', lastEvent: Date.now() - 5 * 3600e3, tasks: [] }]);
  assert.equal(core3.snapshot().agents.length, 2); // too old, skipped
  core3.handleEvent({ session_id: 'm3', cwd: '/y/new', hook_event_name: 'SessionStart' }, null);
  const slots3 = core3.snapshot().agents.map((x) => x.slot);
  assert.equal(new Set(slots3).size, 3); // never two of the same gnome on screen

  // Same project -> same gnome, every time
  const { projectSlot } = require('../src/core');
  const c4 = createCore();
  c4.handleEvent({ session_id: 'p1', cwd: '/Users/andy/code/apps/eventory', hook_event_name: 'SessionStart' }, null);
  assert.equal(c4.snapshot().agents[0].slot, projectSlot('/Users/andy/code/apps/eventory'));
  // A second session in the same folder gets a different gnome
  c4.handleEvent({ session_id: 'p2', cwd: '/Users/andy/code/apps/eventory', hook_event_name: 'SessionStart' }, null);
  const [x1, x2] = c4.snapshot().agents.map((x) => x.slot);
  assert.notEqual(x1, x2);
  // Fill all 8 and one more: still works
  for (let i = 3; i <= 9; i++) c4.handleEvent({ session_id: 'p' + i, cwd: '/proj/' + i, hook_event_name: 'SessionStart' }, null);
  const all = c4.snapshot().agents.map((x) => x.slot);
  assert.equal(all.length, 9);
  assert.equal(new Set(all.slice(0, 8).map((v) => v % 8)).size, 8);

  console.log('All tests passed');
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
