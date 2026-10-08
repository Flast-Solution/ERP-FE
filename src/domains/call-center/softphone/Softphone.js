import { clearGatewayToken, gatewayApi, GW_STATE } from './gatewayApi';

/* Poll trạng thái: thưa khi rảnh, dày khi đang có cuộc gọi, giãn dần khi lỗi */
const POLL_IDLE = 3000;
const POLL_ACTIVE = 1000;
const POLL_MAX_BACKOFF = 30000;
const ACTIVE_STATES = [GW_STATE.INCOMING, GW_STATE.EARLY, GW_STATE.CONNECTED];
const CONNECT_TIMEOUT = 10000;

/* Địa chỉ media trong SDP offer (c= và a=candidate) */
const getOfferHosts = (sdp = '') => {
  const hosts = new Set();
  sdp.split(/\r?\n/).forEach(line => {
    const conn = line.match(/^c=IN IP[46] (\S+)/);
    if (conn) {
      hosts.add(conn[1]);
    }
    const cand = line.match(/^a=candidate:\S+ \d+ \S+ \d+ (\S+) (\d+)/);
    if (cand) {
      hosts.add(`${cand[1]}:${cand[2]}`);
    }
  });
  return [...hosts];
};

const AUDIO_UNAVAILABLE = 'Thiết bị audio trên máy không khả dụng';

/*
 * Trình duyệt làm máy nhánh của SBC (http_api /api/webrtc/sessions):
 * token -> tạo session (SBC tạo WebRTC + đăng ký máy nhánh, trả SDP offer)
 * -> RTCPeerConnection trả lời -> poll status để biết incoming / early / connected / ended.
 */
export default class Softphone {
  constructor({ onState, onError } = {}) {
    this.onState = onState || (() => {});
    this.onError = onError || (() => {});
    this.id = null;
    this.ext = null;
    this.pc = null;
    this.stream = null;
    this.audio = null;
    this.pollTimer = null;
    this.lastState = null;
    /* tăng mỗi lần connect/disconnect để huỷ các tác vụ cũ còn đang chạy */
    this.generation = 0;
  }

  /* true nếu kết nối này còn hiệu lực, false nếu đã bị connect/disconnect khác thay thế */
  async connect(ext) {
    /* disconnect tăng generation ngay (đồng bộ), lấy giá trị trước khi await */
    const pending = this.disconnect();
    const generation = this.generation;
    await pending;
    const isStale = () => generation !== this.generation;

    /* Xin token trước, các lệnh sau dùng Bearer token này */
    await gatewayApi.token(ext);
    if (isStale()) {
      return false;
    }
    const created = await gatewayApi.createSession();
    if (!created?.id || !created?.sdp) {
      throw new Error('Không tạo được phiên WebRTC trên SBC');
    }
    if (isStale()) {
      /* đã có connect/disconnect khác chen vào: bỏ session thừa */
      await gatewayApi.unregister(created.id).catch(() => {});
      return false;
    }
    this.id = created.id;
    this.ext = created.ext || ext;
    try {
      await this.setupPeer(created.sdp);
    } catch (error) {
      /* gỡ session đã tạo trên SBC để không treo máy nhánh */
      await this.disconnect();
      throw error;
    }
    if (isStale()) {
      return false;
    }
    this.startPolling();
    return true;
  }

  async setupPeer(offer) {

    const pc = new RTCPeerConnection();
    this.pc = pc;
    pc.ontrack = (event) => {
      if (!this.audio) {
        this.audio = document.createElement('audio');
        this.audio.autoplay = true;
        this.audio.style.display = 'none';
        document.body.appendChild(this.audio);
      }
      this.audio.srcObject = event.streams[0] || new MediaStream([event.track]);
    };

    await pc.setRemoteDescription({ type: 'offer', sdp: offer });
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      /* NotFoundError / NotAllowedError / NotReadableError, hoặc trang không chạy HTTPS */
      throw new Error(AUDIO_UNAVAILABLE);
    }
    this.stream.getTracks().forEach(track => pc.addTrack(track, this.stream));
    await pc.setLocalDescription(await pc.createAnswer());

    await this.waitConnected(pc, offer);
  }

  /* Chờ ICE + DTLS tới SBC; lỗi kèm trạng thái ICE và địa chỉ media SBC đưa ra */
  waitConnected(pc, offer) {
    return new Promise((resolve, reject) => {
      const done = (error) => {
        clearTimeout(timer);
        pc.removeEventListener('connectionstatechange', onChange);
        if (error) {
          reject(error);
          return;
        }
        resolve();
      };
      const fail = () => {
        const hosts = getOfferHosts(offer);
        console.warn('[call-center] media SBC', {
          connectionState: pc.connectionState,
          iceConnectionState: pc.iceConnectionState,
          hosts,
          offer,
        });
        done(new Error(
          `Kết nối media tới SBC thất bại (ICE ${pc.iceConnectionState}, SBC ${hosts.join(', ') || '?'})`
        ));
      };
      const onChange = () => {
        if (pc.connectionState === 'connected') {
          done();
          return;
        }
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          fail();
        }
      };
      const timer = setTimeout(fail, CONNECT_TIMEOUT);
      pc.addEventListener('connectionstatechange', onChange);
      onChange();
    });
  }

  startPolling() {
    this.stopPolling();
    const generation = this.generation;
    let failures = 0;

    const tick = async () => {
      this.pollTimer = null;
      if (!this.id || generation !== this.generation) {
        return;
      }
      try {
        const status = await gatewayApi.status(this.id);
        failures = 0;
        const state = String(status?.state || '').toLowerCase();
        if (generation === this.generation && state && state !== this.lastState) {
          this.lastState = state;
          this.onState({ ...status, state, peer: status.caller || '' });
        }
      } catch (error) {
        if (generation !== this.generation) {
          return;
        }
        /* 404: phiên không còn trên SBC, dừng poll */
        if (error.status === 404) {
          this.id = null;
          this.onState({ state: GW_STATE.ENDED, peer: '' });
          this.onError(new Error('Mất phiên WebRTC trên SBC, cần kết nối lại'));
          return;
        }
        failures += 1;
        this.onError(error);
      }
      if (this.id && generation === this.generation && !this.pollTimer) {
        this.pollTimer = setTimeout(tick, this.nextPollDelay(failures));
      }
    };
    tick();
  }

  nextPollDelay(failures) {
    if (failures > 0) {
      return Math.min(POLL_IDLE * 2 ** (failures - 1), POLL_MAX_BACKOFF);
    }
    return ACTIVE_STATES.includes(this.lastState) ? POLL_ACTIVE : POLL_IDLE;
  }

  /* Gọi sau mỗi lệnh để cập nhật trạng thái ngay, không chờ hết chu kỳ */
  pollSoon() {
    if (!this.id || !this.pollTimer) {
      return;
    }
    clearTimeout(this.pollTimer);
    this.pollTimer = setTimeout(() => this.startPolling(), 200);
  }

  stopPolling() {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  ensureSession() {
    if (!this.id) {
      throw new Error('Chưa kết nối tổng đài');
    }
  }

  async dial(number, caller) {
    this.ensureSession();
    this.lastState = null;
    await gatewayApi.dial(this.id, number, caller);
    this.pollSoon();
  }

  async answer() {
    this.ensureSession();
    await gatewayApi.answer(this.id);
    this.pollSoon();
  }

  async hangup() {
    if (!this.id) {
      return;
    }
    await gatewayApi.hangup(this.id);
    this.pollSoon();
  }

  async reject() {
    if (!this.id) {
      return;
    }
    await gatewayApi.reject(this.id);
    this.pollSoon();
  }

  async dtmf(digits) {
    this.ensureSession();
    await gatewayApi.dtmf(this.id, digits);
    this.pollSoon();
  }

  setMuted(muted) {
    (this.stream?.getAudioTracks() || []).forEach(track => {
      track.enabled = !muted;
    });
  }

  async disconnect() {
    this.generation += 1;
    this.stopPolling();
    const id = this.id;
    this.id = null;
    this.lastState = null;
    if (id) {
      try {
        await gatewayApi.unregister(id);
      } catch (error) {
        /* phiên có thể đã hết hạn */
      }
    }
    (this.stream?.getTracks() || []).forEach(track => track.stop());
    this.stream = null;
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.audio) {
      this.audio.remove();
      this.audio = null;
    }
    clearGatewayToken();
  }
}

export { GW_STATE };
