import { supabaseStudent } from "../supabaseClient";

export class CallSignalingService {
  constructor({ callId, onSignal = () => {}, onStatus = () => {} }) {
    if (!callId) {
      throw new Error("A valid call ID is required.");
    }

    this.callId = callId;
    this.channel = null;

    this.onSignal = onSignal;
    this.onStatus = onStatus;
  }

  // =========================================================
  // CHANNEL NAME
  // =========================================================

  getChannelName() {
    return `call:${this.callId}`;
  }

  // =========================================================
  // CONNECT
  // =========================================================

  async connect() {
    if (this.channel) {
      return this.channel;
    }

    const channelName = this.getChannelName();

    this.channel = supabaseStudent.channel(channelName, {
      config: {
        private: true,
      },
    });

    this.channel.on(
      "broadcast",
      {
        event: "webrtc-signal",
      },
      (payload) => {
        if (!payload?.payload) {
          return;
        }

        this.onSignal(payload.payload);
      }
    );

    const status = await this.channel.subscribe(async (status) => {
      this.onStatus(status);
    });

    if (status !== "SUBSCRIBED") {
      throw new Error(`Unable to connect to call signaling channel: ${status}`);
    }

    return this.channel;
  }

  // =========================================================
  // SEND SIGNAL
  // =========================================================

  async sendSignal(signal) {
    if (!this.channel) {
      throw new Error("Call signaling channel is not connected.");
    }

    if (!signal || typeof signal !== "object") {
      throw new Error("Invalid WebRTC signal.");
    }

    const result = await this.channel.send({
      type: "broadcast",
      event: "webrtc-signal",
      payload: signal,
    });

    if (result !== "ok") {
      throw new Error(`Failed to send WebRTC signal: ${result}`);
    }
  }

  // =========================================================
  // SEND OFFER
  // =========================================================

  async sendOffer(offer) {
    if (!offer) {
      throw new Error("A valid WebRTC offer is required.");
    }

    await this.sendSignal({
      type: "offer",
      offer,
    });
  }

  // =========================================================
  // SEND ANSWER
  // =========================================================

  async sendAnswer(answer) {
    if (!answer) {
      throw new Error("A valid WebRTC answer is required.");
    }

    await this.sendSignal({
      type: "answer",
      answer,
    });
  }

  // =========================================================
  // SEND ICE CANDIDATE
  // =========================================================

  async sendIceCandidate(candidate) {
    if (!candidate) {
      return;
    }

    await this.sendSignal({
      type: "ice-candidate",
      candidate,
    });
  }

  // =========================================================
  // SEND CALL READY
  // =========================================================

  async sendReady() {
    await this.sendSignal({
      type: "ready",
    });
  }

  // =========================================================
  // SEND CALL END
  // =========================================================

  async sendEnd() {
    await this.sendSignal({
      type: "end",
    });
  }

  // =========================================================
  // DISCONNECT
  // =========================================================

  async disconnect() {
    if (!this.channel) {
      return;
    }

    await supabaseStudent.removeChannel(this.channel);

    this.channel = null;
  }
}

export default CallSignalingService;
