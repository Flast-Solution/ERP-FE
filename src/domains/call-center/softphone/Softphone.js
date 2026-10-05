import { clearGatewayToken, gatewayApi, GW_STATE, parseCode, parseCreate, parseStatus } from './gatewayApi';

const POLL_INTERVAL = 500;
const CONNECT_TIMEOUT = 5000;

/*
 * Trình duyệt làm máy nhánh của SBC (theo e2e/webrtc_gw.test.js):
 * token -> create -> nhận SDP offer -> RTCPeerConnection trả lời -> register
 * -> poll status để biết incoming / early / connected / ended.
 */
export default class Softphone {
  constructor({ onState, onError } = {}) {
    this.onState = onState || (() => {});
    this.onError = onError || (() => {});
    this.id = null;
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
    const created = parseCreate(await gatewayApi.create());
    if (!created) {
      throw new Error('Không tạo được phiên WebRTC trên SBC');
    }
    this.id = created.id;
    await this.setupPeer(created.offer);

    const code = parseCode(await gatewayApi.register(this.id, ext));
    if (code !== 0) {
      throw new Error(`Đăng ký máy nhánh thất bại (${code})`);
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
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        const status = parseStatus(await gatewayApi.status(this.id));
        if (status.state && status.state !== this.lastState) {
          this.lastState = status.state;
          this.onState(status);
        }
      } catch (error) {
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

  async command(promise) {
    const code = parseCode(await promise);
    if (code !== 0) {
      throw new Error(`SBC từ chối lệnh (${code})`);
    }
  }

  ensureSession() {
    if (!this.id) {
      throw new Error('Chưa kết nối tổng đài');
    }
  }

  async dial(number) {
    this.ensureSession();
    this.lastState = null;
    await this.command(gatewayApi.dial(this.id, number));
  }

  async answer() {
    this.ensureSession();
    await this.command(gatewayApi.answer(this.id));
  }

  async hangup() {
    if (!this.id) {
      return;
    }
    await this.command(gatewayApi.hangup(this.id));
  }

  async dtmf(digits) {
    this.ensureSession();
    await this.command(gatewayApi.dtmf(this.id, digits));
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
