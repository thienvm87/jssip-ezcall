import React from "react";
import JsSIP from "jssip";
import "./styles.css";

class App extends React.PureComponent {
  constructor(props) {
    super(props);
    this.phone = React.createRef();
    this.state = {
      sipUA: null,
      rtcSession: null
    };
  }
  componentDidMount() {
    const socket = new JsSIP.WebSocketInterface("wss://call.digicall.vn:4443");
    const configuration = {
      sockets: [socket],
      uri: "sip:1005@dn0002.digicall.vn",
      password: "123456789",
      session_timers: false
    };
    const sipUA = new JsSIP.UA(configuration);
    this.addSIPEventListener("sipUA", sipUA);
    this.setState({ sipUA });
    sipUA.start();
  }

  addSIPEventListener = (type, UA) => {
    Object.keys(this)
      .filter((item) => item.startsWith(type))
      .map((item) => item.replace(`${type}_`, ""))
      .forEach((item) => {
        UA.on(item, (event) => {
          this[`${type}_${item}`](event);
        });
      });
  };

  sipUA_newRTCSession = (event) => {
    const {
      session,
      session: { connection: peerconnection },
      originator
    } = event;
    this.addSIPEventListener("rtcSession", session);
    this.setState({ rtcSession: session });
    // 判断此次回话是由本地发起，还是远端发起
    if (originator === "remote") {
    }
    if (originator === "local") {
      this.addRemoteStream(peerconnection);
    }
  };

  rtcSession_peerconnection = (event) => {
    const { peerconnection } = event;
    this.addRemoteStream(peerconnection);
  };

  call = () => {
    const { sipUA } = this.state;
    console.log(sipUA);
    sipUA.call(`sip:1003@dn0002.digicall.vn`, {
      mediaConstraints: { audio: true, video: false },
      sessionTimersExpires: 120
    });
  };

  addRemoteStream = (peerconnection) => {
    const [remoteStream] = peerconnection.getRemoteStreams();
    if (remoteStream) {
      this.handleRemoteStream(remoteStream);
    }
    peerconnection.addEventListener("addstream", (e) => {
      this.handleRemoteStream(e.stream);
    });
  };

  handleRemoteStream = (stream) => {
    const { current: telAudio } = this.phone;
    // Display remote stream
    telAudio.srcObject = stream;

    stream.addEventListener("addtrack", (event) => {
      console.log('remote track "addtrack" event', event);
      const { track } = event;

      if (telAudio.srcObject !== stream) {
        return;
      }

      // Refresh remote video
      telAudio.srcObject = stream;

      track.addEventListener("ended", () => {
        console.log('remote track "ended" event [track:%o]', track);
      });
    });

    stream.addEventListener("removetrack", (event) => {
      console.log('remote track "removetrack" event', event);
      if (telAudio.srcObject !== stream) {
        return;
      }
      // Refresh remote video
      telAudio.srcObject = stream;
    });
  };

  render() {
    return (
      <div className="App">
        <h1>Hello CodeSandbox</h1>
        <h2>Start editing to see some magic happen!</h2>
        <button onClick={this.call}>Call</button>
        <audio ref={this.phone} autoPlay />
      </div>
    );
  }
}

export default App;
