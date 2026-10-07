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
  } = {}) {
    this.onRemoteStream = onRemoteStream;
    this.onIceCandidate = onIceCandidate;
    this.onConnectionStateChange = onConnectionStateChange;
    this.onTrackEnded = onTrackEnded;

    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;

    this.isAudioEnabled = true;
    this.isVideoEnabled = true;
  }

  // =========================================================
  // CREATE PEER CONNECTION
  // =========================================================

  createPeerConnection() {
    if (this.peerConnection) {
      return this.peerConnection;
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });

    this.peerConnection = peerConnection;

    // -------------------------------------------------------
    // REMOTE TRACK
    // -------------------------------------------------------

    peerConnection.ontrack = (event) => {
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }

      const incomingStream = event.streams?.[0];

      if (incomingStream) {
        incomingStream.getTracks().forEach((track) => {
          const alreadyExists = this.remoteStream
            .getTracks()
            .some((existingTrack) => existingTrack.id === track.id);

          if (!alreadyExists) {
            this.remoteStream.addTrack(track);
          }
        });
      } else {
        const alreadyExists = this.remoteStream
          .getTracks()
          .some((track) => track.id === event.track.id);

        if (!alreadyExists) {
          this.remoteStream.addTrack(event.track);
        }
      }

      this.onRemoteStream(this.remoteStream);

      event.track.onended = () => {
        this.onTrackEnded(event.track);
      };
    };

    // -------------------------------------------------------
    // ICE CANDIDATES
    // -------------------------------------------------------

    peerConnection.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }

      this.onIceCandidate(event.candidate);
    };

    // -------------------------------------------------------
    // CONNECTION STATE
    // -------------------------------------------------------

    peerConnection.onconnectionstatechange = () => {
      this.onConnectionStateChange(peerConnection.connectionState);
    };

    return peerConnection;
  }

  // =========================================================
  // GET LOCAL MEDIA
  // =========================================================

  async getLocalStream({ audio = true, video = true } = {}) {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "Your browser does not support microphone or camera access."
      );
    }

    if (this.localStream) {
      return this.localStream;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio,
      video,
    });

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
    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await this.peerConnection.setLocalDescription(offer);

    return offer;
  }

  // =========================================================
  // SET REMOTE DESCRIPTION
  // =========================================================

  async setRemoteDescription(description) {
    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(description)
    );
  }

  // =========================================================
  // CREATE ANSWER
  // =========================================================

  async createAnswer() {
    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    const answer = await this.peerConnection.createAnswer();

    await this.peerConnection.setLocalDescription(answer);

    return answer;
  }

  // =========================================================
  // ADD ICE CANDIDATE
  // =========================================================

  async addIceCandidate(candidate) {
    if (!candidate) {
      return;
    }

    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  // =========================================================
  // TOGGLE MICROPHONE
  // =========================================================

  toggleAudio() {
    if (!this.localStream) {
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
    if (!this.localStream) {
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
  // CONNECTION STATE
  // =========================================================

  getConnectionState() {
    return this.peerConnection?.connectionState || "new";
  }

  // =========================================================
  // CLOSE CONNECTION
  // =========================================================

  close() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });

      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => {
        track.stop();
      });

      this.remoteStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.ontrack = null;
      this.peerConnection.onicecandidate = null;
      this.peerConnection.onconnectionstatechange = null;

      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}

export default WebRTCService;
