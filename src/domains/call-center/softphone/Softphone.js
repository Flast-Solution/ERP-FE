import { clearGatewayToken, gatewayApi, GW_STATE } from './gatewayApi';

const POLL_INTERVAL = 500;
const CONNECT_TIMEOUT = 5000;

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
  }

  async connect(ext) {
    await this.disconnect();
    /* Xin token trước, các lệnh sau dùng Bearer token này */
    await gatewayApi.token(ext);
    const created = await gatewayApi.createSession();
    if (!created?.id || !created?.sdp) {
      throw new Error('Không tạo được phiên WebRTC trên SBC');
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
    this.startPolling();
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

    const startedAt = Date.now();
    while (pc.connectionState !== 'connected' && Date.now() - startedAt < CONNECT_TIMEOUT) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (pc.connectionState !== 'connected') {
      throw new Error('Kết nối media tới SBC thất bại');
    }
  }

  startPolling() {
    this.stopPolling();
    const tick = async () => {
      if (!this.id) {
        return;
      }
      try {
        const status = await gatewayApi.status(this.id);
        const state = String(status?.state || '').toLowerCase();
        if (state && state !== this.lastState) {
          this.lastState = state;
          this.onState({ ...status, state, peer: status.caller || '' });
        }
      } catch (error) {
        /* 404: phiên không còn trên SBC, dừng poll */
        if (error.status === 404) {
          this.id = null;
          this.onState({ state: GW_STATE.ENDED, peer: '' });
          this.onError(new Error('Mất phiên WebRTC trên SBC, cần kết nối lại'));
          return;
        }
        this.onError(error);
      }
      if (this.id) {
        this.pollTimer = setTimeout(tick, POLL_INTERVAL);
      }
    };
    tick();
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
  }

  async answer() {
    this.ensureSession();
    await gatewayApi.answer(this.id);
  }

  async hangup() {
    if (!this.id) {
      return;
    }
    await gatewayApi.hangup(this.id);
  }

  async reject() {
    if (!this.id) {
      return;
    }
    await gatewayApi.reject(this.id);
  }

  async dtmf(digits) {
    this.ensureSession();
    await gatewayApi.dtmf(this.id, digits);
  }

  setMuted(muted) {
    (this.stream?.getAudioTracks() || []).forEach(track => {
      track.enabled = !muted;
    });
  }

  async disconnect() {
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
