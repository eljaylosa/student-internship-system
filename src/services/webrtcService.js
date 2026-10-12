const ICE_SERVERS = [
  {
    urls: "stun:stun.l.google.com:19302",
  },
];

export class WebRTCService {
  constructor({
    onRemoteStream = () => {},
    onIceCandidate = () => {},
    onConnectionStateChange = () => {},
    onTrackEnded = () => {},
    onIceConnectionStateChange = () => {},
  } = {}) {
    this.onRemoteStream = onRemoteStream;
    this.onIceCandidate = onIceCandidate;
    this.onConnectionStateChange = onConnectionStateChange;
    this.onTrackEnded = onTrackEnded;
    this.onIceConnectionStateChange = onIceConnectionStateChange;

    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;

    this.isAudioEnabled = true;
    this.isVideoEnabled = true;
    this.isClosed = false;
  }

  // =========================================================
  // CREATE PEER CONNECTION
  // =========================================================

  createPeerConnection() {
    if (this.peerConnection) {
      return this.peerConnection;
    }

    if (this.isClosed) {
      throw new Error("This WebRTC connection has already been closed.");
    }

    if (typeof RTCPeerConnection === "undefined") {
      throw new Error("WebRTC is not supported by this browser.");
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });

    this.peerConnection = peerConnection;

    // -------------------------------------------------------
    // REMOTE TRACKS
    // -------------------------------------------------------

    peerConnection.ontrack = (event) => {
      if (this.isClosed || this.peerConnection !== peerConnection) {
        return;
      }

      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }

      const incomingStream = event.streams?.[0];

      if (incomingStream) {
        incomingStream.getTracks().forEach((track) => {
          this.addRemoteTrack(track);
        });
      } else if (event.track) {
        this.addRemoteTrack(event.track);
      }

      this.notify(() => this.onRemoteStream(this.remoteStream));

      if (event.track) {
        event.track.onended = () => {
          if (!this.isClosed) {
            this.notify(() => this.onTrackEnded(event.track));
          }
        };
      }
    };

    // -------------------------------------------------------
    // ICE CANDIDATES
    // -------------------------------------------------------

    peerConnection.onicecandidate = (event) => {
      if (
        this.isClosed ||
        this.peerConnection !== peerConnection ||
        !event.candidate
      ) {
        return;
      }

      this.notify(() => this.onIceCandidate(event.candidate));
    };

    // -------------------------------------------------------
    // PEER CONNECTION STATE
    // -------------------------------------------------------

    peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection !== peerConnection) {
        return;
      }

      const state = peerConnection.connectionState;

      console.log("[WebRTC] Peer connection state:", state);

      if (!this.isClosed) {
        this.notify(() => this.onConnectionStateChange(state));
      }
    };

    // -------------------------------------------------------
    // ICE CONNECTION STATE
    // -------------------------------------------------------

    peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection !== peerConnection) {
        return;
      }

      const state = peerConnection.iceConnectionState;

      console.log("[WebRTC] ICE connection state:", state);

      if (!this.isClosed) {
        this.notify(() => this.onIceConnectionStateChange(state));
      }
    };

    // -------------------------------------------------------
    // ICE GATHERING STATE
    // -------------------------------------------------------

    peerConnection.onicegatheringstatechange = () => {
      if (this.peerConnection !== peerConnection) {
        return;
      }

      console.log(
        "[WebRTC] ICE gathering state:",
        peerConnection.iceGatheringState
      );
    };

    return peerConnection;
  }

  // =========================================================
  // CALLBACK SAFETY
  // =========================================================

  notify(callback) {
    try {
      Promise.resolve(callback()).catch((error) => {
        console.error("[WebRTC] Callback failed:", error);
      });
    } catch (error) {
      console.error("[WebRTC] Callback failed:", error);
    }
  }

  // =========================================================
  // ADD REMOTE TRACK
  // =========================================================

  addRemoteTrack(track) {
    if (!track || !this.remoteStream || this.isClosed) {
      return;
    }

    const alreadyExists = this.remoteStream
      .getTracks()
      .some((existingTrack) => existingTrack.id === track.id);

    if (!alreadyExists) {
      this.remoteStream.addTrack(track);
    }
  }

  // =========================================================
  // GET LOCAL MEDIA
  // =========================================================

  async getLocalStream({ audio = true, video = false } = {}) {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "Microphone and camera access require a supported browser and a secure context (HTTPS or localhost)."
      );
    }

    if (this.isClosed) {
      throw new Error("This WebRTC connection has already been closed.");
    }

    if (this.localStream) {
      const hasAudio = this.localStream.getAudioTracks().length > 0;
      const hasVideo = this.localStream.getVideoTracks().length > 0;

      if ((audio && !hasAudio) || (video && !hasVideo)) {
        throw new Error(
          "The existing media stream does not match the requested call type."
        );
      }

      return this.localStream;
    }

    let stream;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio,
        video,
      });
    } catch (error) {
      if (
        error?.name === "NotAllowedError" ||
        error?.name === "PermissionDeniedError"
      ) {
        throw new Error(
          "Microphone or camera permission was denied. Allow access in your browser settings and try again."
        );
      }

      if (
        error?.name === "NotFoundError" ||
        error?.name === "DevicesNotFoundError"
      ) {
        throw new Error(
          "No suitable microphone or camera was found for this call."
        );
      }

      if (
        error?.name === "NotReadableError" ||
        error?.name === "TrackStartError"
      ) {
        throw new Error(
          "Your microphone or camera may already be in use by another application."
        );
      }

      throw error;
    }

    // If cleanup happened while the permission prompt was open,
    // immediately stop any media acquired afterward.
    if (this.isClosed) {
      stream.getTracks().forEach((track) => track.stop());

      throw new Error("The call was cancelled while requesting media.");
    }

    this.localStream = stream;
    this.isAudioEnabled = audio;
    this.isVideoEnabled = video;

    return stream;
  }

  // =========================================================
  // ADD LOCAL TRACKS
  // =========================================================

  addLocalTracks() {
    if (!this.peerConnection) {
      throw new Error("Peer connection has not been created.");
    }

    if (!this.localStream) {
      throw new Error("Local media stream is not available.");
    }

    const existingSenders = this.peerConnection
      .getSenders()
      .map((sender) => sender.track?.id)
      .filter(Boolean);

    this.localStream.getTracks().forEach((track) => {
      if (existingSenders.includes(track.id)) {
        return;
      }

      this.peerConnection.addTrack(track, this.localStream);
    });
  }

  // =========================================================
  // CREATE OFFER
  // =========================================================

  async createOffer() {
    if (this.isClosed) {
      throw new Error("Cannot create an offer after the call has closed.");
    }

    const peerConnection = this.peerConnection || this.createPeerConnection();

    // Match the offer to the local media tracks.
    // Audio-only calls won't request a video receiving transceiver.
    const hasLocalAudio = this.localStream?.getAudioTracks().length > 0;

    const hasLocalVideo = this.localStream?.getVideoTracks().length > 0;

    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: hasLocalAudio,
      offerToReceiveVideo: hasLocalVideo,
    });

    if (this.isClosed || this.peerConnection !== peerConnection) {
      throw new Error("The call closed while creating the offer.");
    }

    await peerConnection.setLocalDescription(offer);

    return peerConnection.localDescription;
  }

  // =========================================================
  // SET REMOTE DESCRIPTION
  // =========================================================

  async setRemoteDescription(description) {
    if (!description) {
      throw new Error("A valid remote session description is required.");
    }

    if (this.isClosed) {
      throw new Error("Cannot set a remote description after call cleanup.");
    }

    const peerConnection = this.peerConnection || this.createPeerConnection();

    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(description)
    );
  }

  // =========================================================
  // CREATE ANSWER
  // =========================================================

  async createAnswer() {
    if (this.isClosed) {
      throw new Error("Cannot create an answer after the call has closed.");
    }

    const peerConnection = this.peerConnection || this.createPeerConnection();

    if (!peerConnection.remoteDescription) {
      throw new Error(
        "Cannot create an answer before receiving the caller's offer."
      );
    }

    const answer = await peerConnection.createAnswer();

    if (this.isClosed || this.peerConnection !== peerConnection) {
      throw new Error("The call closed while creating the answer.");
    }

    await peerConnection.setLocalDescription(answer);

    return peerConnection.localDescription;
  }

  // =========================================================
  // ADD ICE CANDIDATE
  // =========================================================

  async addIceCandidate(candidate) {
    if (!candidate) {
      return;
    }

    if (this.isClosed) {
      throw new Error("Cannot add an ICE candidate after call cleanup.");
    }

    const peerConnection = this.peerConnection || this.createPeerConnection();

    if (!peerConnection.remoteDescription) {
      throw new Error(
        "Cannot add an ICE candidate before setting the remote description."
      );
    }

    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  // =========================================================
  // TOGGLE MICROPHONE
  // =========================================================

  toggleAudio() {
    if (this.isClosed || !this.localStream) {
      return false;
    }

    const audioTracks = this.localStream.getAudioTracks();

    if (audioTracks.length === 0) {
      return false;
    }

    const enabled = !audioTracks[0].enabled;

    audioTracks.forEach((track) => {
      track.enabled = enabled;
    });

    this.isAudioEnabled = enabled;

    return enabled;
  }

  // =========================================================
  // TOGGLE CAMERA
  // =========================================================

  toggleVideo() {
    if (this.isClosed || !this.localStream) {
      return false;
    }

    const videoTracks = this.localStream.getVideoTracks();

    if (videoTracks.length === 0) {
      return false;
    }

    const enabled = !videoTracks[0].enabled;

    videoTracks.forEach((track) => {
      track.enabled = enabled;
    });

    this.isVideoEnabled = enabled;

    return enabled;
  }

  // =========================================================
  // GET LOCAL STREAM
  // =========================================================

  getLocalMediaStream() {
    return this.localStream;
  }

  // =========================================================
  // GET REMOTE STREAM
  // =========================================================

  getRemoteMediaStream() {
    return this.remoteStream;
  }

  // =========================================================
  // GET PEER CONNECTION STATE
  // =========================================================

  getConnectionState() {
    return this.peerConnection?.connectionState || "new";
  }

  // =========================================================
  // GET ICE CONNECTION STATE
  // =========================================================

  getIceConnectionState() {
    return this.peerConnection?.iceConnectionState || "new";
  }

  // =========================================================
  // CLOSE CONNECTION AND MEDIA
  // =========================================================

  close() {
    if (this.isClosed) {
      return;
    }

    this.isClosed = true;

    const peerConnection = this.peerConnection;
    this.peerConnection = null;

    if (peerConnection) {
      peerConnection.ontrack = null;
      peerConnection.onicecandidate = null;
      peerConnection.onconnectionstatechange = null;
      peerConnection.oniceconnectionstatechange = null;
      peerConnection.onicegatheringstatechange = null;

      try {
        peerConnection.close();
      } catch (error) {
        console.warn("[WebRTC] Failed to close peer connection:", error);
      }
    }

    const localStream = this.localStream;
    this.localStream = null;

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
      });
    }

    const remoteStream = this.remoteStream;
    this.remoteStream = null;

    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
      });
    }

    this.isAudioEnabled = false;
    this.isVideoEnabled = false;

    console.log("[WebRTC] Connection and media cleaned up.");
  }
}

export default WebRTCService;
