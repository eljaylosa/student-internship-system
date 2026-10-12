const SUBSCRIBE_TIMEOUT_MS = 15000;

export class CallSignalingService {
  constructor({ callId, client, onSignal = () => {}, onStatus = () => {} }) {
    if (!callId) {
      throw new Error("A valid call ID is required.");
    }

    if (!client) {
      throw new Error("A Supabase client is required for call signaling.");
    }

    this.callId = callId;
    this.client = client;
    this.channel = null;
    this.connectPromise = null;
    this.onSignal = onSignal;
    this.onStatus = onStatus;
    this.disconnecting = false;
  }

  getChannelName() {
    return `call:${this.callId}`;
  }

  async connect() {
    if (this.channel && !this.disconnecting) {
      return this.channel;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.disconnecting = false;
    this.connectPromise = this._connect();

    try {
      return await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }

  async _connect() {
    const channelName = this.getChannelName();
    const channel = this.client.channel(channelName, {
      config: { private: true },
    });

    this.channel = channel;

    channel.on("broadcast", { event: "webrtc-signal" }, (event) => {
      if (!event?.payload || this.disconnecting) return;

      Promise.resolve()
        .then(() => this.onSignal(event.payload))
        .catch((error) => {
          console.error("[CallSignaling] Signal handler failed:", error);
        });
    });

    try {
      await new Promise((resolve, reject) => {
        let settled = false;

        const finish = (error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);

          if (error) reject(error);
          else resolve();
        };

        const timeoutId = setTimeout(() => {
          finish(
            new Error(
              `Timed out connecting to call signaling channel: ${channelName}`
            )
          );
        }, SUBSCRIBE_TIMEOUT_MS);

        channel.subscribe((status, error) => {
          try {
            this.onStatus(status);
          } catch (callbackError) {
            console.error(
              "[CallSignaling] Status callback failed:",
              callbackError
            );
          }

          if (status === "SUBSCRIBED") {
            console.info(`[CallSignaling] Connected to ${channelName}`);
            finish();
            return;
          }

          if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            finish(
              error instanceof Error
                ? error
                : new Error(
                    `Call signaling channel ${channelName} failed: ${status}`
                  )
            );
          }
        });
      });

      if (this.disconnecting || this.channel !== channel) {
        throw new Error("Call signaling connection was cancelled.");
      }

      return channel;
    } catch (error) {
      if (this.channel === channel) {
        this.channel = null;
      }

      try {
        await this.client.removeChannel(channel);
      } catch (removeError) {
        console.error("[CallSignaling] Failed to remove channel:", removeError);
      }

      throw error;
    }
  }

  async sendSignal(signal) {
    if (!this.channel || this.disconnecting) {
      throw new Error("Call signaling is not connected.");
    }

    const result = await this.channel.send({
      type: "broadcast",
      event: "webrtc-signal",
      payload: signal,
    });

    if (result !== "ok") {
      throw new Error(`Failed to send call signal: ${result}`);
    }
  }

  async sendOffer(offer) {
    return this.sendSignal({ type: "offer", offer });
  }

  async sendAnswer(answer) {
    return this.sendSignal({ type: "answer", answer });
  }

  async sendIceCandidate(candidate) {
    return this.sendSignal({ type: "ice-candidate", candidate });
  }

  async sendReady() {
    return this.sendSignal({ type: "ready" });
  }

  async sendEnd() {
    return this.sendSignal({ type: "end" });
  }

  async disconnect() {
    this.disconnecting = true;

    const channel = this.channel;
    this.channel = null;

    if (!channel) return;

    try {
      await this.client.removeChannel(channel);
    } catch (error) {
      console.error("[CallSignaling] Failed to disconnect channel:", error);
    }
  }
}

export default CallSignalingService;
