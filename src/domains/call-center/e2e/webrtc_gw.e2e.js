// Trình duyệt làm máy nhánh của SBC (webrtc_gw sbc_interface): token, gọi vào qua DID, gọi ra qua SBC, PIN bằng DTMF.
const { chromium } = require('playwright'); const dgram = require('dgram');
const { spawn, execSync } = require('child_process'); const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
function di(cmd) { return new Promise(r => { const s = dgram.createSocket('udp4'); s.on('message', m => { s.close(); r(m.toString().replace(/\0/g, '').trim()); }); s.send(cmd + '\n', 5040, '127.0.0.1'); }); }
const mysql = q => execSync(`mysql -N -e "${q}"`).toString().trim();
function caller(did, mode, secs) { return new Promise(r => { let out = ''; const p = spawn('python3', ['-W', 'ignore', 'caller.py', did, mode, String(secs)]); p.stdout.on('data', d => out += d); p.on('close', () => r(out.trim())); }); }
async function waitState(id, st, ms = 8000) { const t = Date.now(); let s; while (Date.now() - t < ms) { s = await di(`DI webrtc_gw status ${id}`); if (s.includes(`'${st}'`)) return s; await sleep(150); } return 'TIMEOUT ' + s; }
const trunkLog = () => fs.readFileSync('trunk.log', 'utf8');
let pass = 0, total = 0;
function check(name, got, want) { total++; const ok = JSON.stringify(got) === JSON.stringify(want); if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); }
async function token(ext) { const r = await fetch(`http://127.0.0.1:8090/api/webrtc/token?ext=${ext}`, { method: 'POST', headers: { Authorization: 'Bearer testtoken' } }); return [r.status, await r.json()]; }

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); await p.goto('http://localhost:8124/');
  async function connect(p) {
    const c = await di('DI webrtc_gw create 127.0.0.1 9000'); const m = c.match(/^\[0, '([^']+)', '([\s\S]*)'\]$/);
    await p.evaluate(async (offer) => { if (window.pc) window.pc.close(); const pc = new RTCPeerConnection(); window.pc = pc;
      pc.ontrack = (ev) => { const a = document.createElement('audio'); a.autoplay = true; a.srcObject = ev.streams[0] || new MediaStream([ev.track]); document.body.appendChild(a); };
      await pc.setRemoteDescription({ type: 'offer', sdp: offer }); const st = await navigator.mediaDevices.getUserMedia({ audio: true }); st.getTracks().forEach(t => pc.addTrack(t, st));
      await pc.setLocalDescription(await pc.createAnswer()); for (let i = 0; i < 50 && pc.connectionState !== 'connected'; i++) await new Promise(r => setTimeout(r, 100)); }, m[2]);
    return m[1];
  }
  const energy = () => p.evaluate(async () => { let e = 0; (await pc.getStats()).forEach(s => { if (s.type === 'inbound-rtp') e = s.totalAudioEnergy; }); return e; });
  const id = await connect(p);

  // W1 token + đăng ký
  const code = s => parseInt((s.match(/^\[(\d+)/) || [])[1]);
  check('W1 register không token -> 401', code(await di(`DI webrtc_gw register ${id} acme_1001`)), 401);
  check('W1b token giả -> 403', code(await di(`DI webrtc_gw register ${id} acme_1001 acme_1001.9999999999.00ff`)), 403);
  const [s2, t2] = await token('acme_1002');
  check('W1c token của acme_1002 dùng cho acme_1001 -> 403', code(await di(`DI webrtc_gw register ${id} acme_1001 ${t2.token}`)), 403);
  check('W1d token cho máy nhánh lạ -> 404', (await token('acme_9999'))[0], 404);
  const [s1, t1] = await token('acme_1001');
  check('W1e POST /api/webrtc/token -> 200', [s1, typeof t1.token, t1.expires > Date.now() / 1000], [200, 'string', true]);
  const t_reg = Date.now();
  check('W1f register bằng token -> 0', code(await di(`DI webrtc_gw register ${id} acme_1001 ${t1.token}`)), 0);
  check('W1g binding trong ext_bindings trỏ về cổng nội bộ 5070',
    mysql("SELECT CONCAT(src_ip,':',src_port), contact LIKE '%;rtc=%' FROM sems.ext_bindings WHERE ext='acme_1001'"), '127.0.0.1:5070\t1');

  // W2 trunk gọi DID của công ty -> SBC -> trình duyệt
  let cp = caller('02873001234', 'talk', 4);
  const inc = await waitState(id, 'incoming');
  check('W2 DID 02873001234 -> trình duyệt đổ chuông, số gọi đến 0987654321', inc.includes("'incoming'") && inc.includes('0987654321'), true);
  const e0 = await energy();
  await di(`DI webrtc_gw answer ${id}`);
  const out = await cp; const e1 = await energy();
  const rms = parseInt((out.match(/rx_rms=(\d+)/) || [])[1] || 0);
  check('W2b khách nhận 200 và nghe tiếng trình duyệt', [/final=200/.test(out), rms > 100], [true, true]);
  const early = parseInt((out.match(/early_pkts=(\d+)/) || [])[1] || 0);
  check('W2r khách nghe tiếng chuông của SBC (183 + RTP) trước khi trình duyệt nghe', [/183/.test(out), early > 20], [true, true]);
  check('W2c trình duyệt nghe tiếng khách', e1 - e0 > 0.01, true);
  console.log('      ' + out.split('\n').pop() + ` browser_energy=${(e1 - e0).toFixed(3)}`);
  await waitState(id, 'ended');

  // W3 trình duyệt gọi ra qua SBC: From = số công ty, đi nhà mạng theo SBC
  let n0 = trunkLog().split('\n').length;
  check('W3 dial 0901234567 -> 0', code(await di(`DI webrtc_gw dial ${id} 0901234567`)), 0);
  check('W3b connected', (await waitState(id, 'connected')).includes("'connected'"), true);
  await sleep(2500);
  const lines = trunkLog().split('\n').slice(n0 - 1).join('\n');
  check('W3c nhà mạng nhận INVITE 0901234567 (qua SBC)', /TRUNK INVITE sip:0901234567@/.test(lines), true);
  await di(`DI webrtc_gw hangup ${id}`); await waitState(id, 'ended');
  check('W3d CDR: gọi ra của acme_1001', mysql("SELECT COUNT(*) FROM sems.cdr WHERE src_ext='acme_1001' AND callee='0901234567' AND direction='out'") >= '1', true);

  // W4 PIN của công ty: nhập bằng DTMF từ trình duyệt (SIP INFO)
  n0 = trunkLog().split('\n').length;
  await di(`DI webrtc_gw dial ${id} 0012345678`);
  check('W4 số cần PIN: early media (lời nhắc)', (await waitState(id, 'early')).includes("'early'"), true);
  await sleep(500);
  check('W4b dtmf 1234# -> 0', code(await di(`DI webrtc_gw dtmf ${id} 1234#`)), 0);
  check('W4c PIN đúng -> nhà mạng nhận INVITE, connected', [(await waitState(id, 'connected')).includes("'connected'"),
    /TRUNK INVITE sip:0012345678@/.test(trunkLog().split('\n').slice(n0 - 1).join('\n'))], [true, true]);
  await di(`DI webrtc_gw hangup ${id}`); await waitState(id, 'ended');

  // W5 trình duyệt chưa đăng ký không gọi ra được
  const p2 = await b.newPage(); await p2.goto('http://localhost:8124/');   // trình duyệt thứ hai, không đăng ký
  const id2 = await connect(p2);
  check('W5 rtc chưa register gọi ra -> 403', code(await di(`DI webrtc_gw dial ${id2} 0901234567`)), 403);

  // W6 binding được gia hạn (bind_ttl=30, mỗi 10 s) và bị xoá khi trình duyệt đóng
  const wait = 36000 - (Date.now() - t_reg);
  if (wait > 0) await sleep(wait);   // quá bind_ttl (30 s): binding chỉ còn nếu đã được gia hạn
  const exp = parseInt(mysql("SELECT expires - UNIX_TIMESTAMP() FROM sems.ext_bindings WHERE ext='acme_1001'") || '0');
  check('W6 binding còn hạn sau > 30 s (được gia hạn)', exp > 5, true);
  await di(`DI webrtc_gw unregister ${id}`);
  check('W6b unregister -> xoá binding', mysql("SELECT COUNT(*) FROM sems.ext_bindings WHERE ext='acme_1001'"), '0');
  const out6 = await caller('02873001234', 'wait', 1);
  check('W6c DID khi trình duyệt không còn đăng ký -> 480', /final=480/.test(out6), true);

  await b.close();
  console.log(`\n${pass}/${total} PASS`);
  process.exit(pass === total ? 0 : 1);
})();
