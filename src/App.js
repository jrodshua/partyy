import React, { useState, useRef, useEffect } from "react";
import Peer from "simple-peer";
import { io } from "socket.io-client";
import "./App.css";

const socket = io.connect("http://localhost:1234");

function App() {
  const [me, setMe] = useState("");
  const [stream, setStream] = useState();
  const [partyInvite, setPartyInvite] = useState(false);
  const [creator, setCreator] = useState("");
  const [creatorSignal, setCreatorSignal] = useState();
  const [partyJoined, setPartyJoined] = useState(false);
  const [idToInvite, setIdToInvite] = useState("");
  const [partyEnded, setPartyEnded] = useState(false);
  const [tag, setTag] = useState("");

  const myAudio = useRef();
  const friendAudio = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: false,
      })
      .then((stream) => {
        setStream(stream);
        myAudio.current.srcObject = stream;
      });

    socket.on("me", (id) => {
      setMe(id);
    });

    socket.on("startParty", (data) => {
      setPartyInvite(true);
      setCreator(data.from);
      setTag(data.tag);
      setCreatorSignal(data.signal);
    });
  }, []);

  const startParty = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("startParty", {
        startPartyWith: id,
        signalData: data,
        from: me,
        tag: tag,
      });
    });

    peer.on("stream", (stream) => {
      friendAudio.current.srcObject = stream;
    });

    socket.on("joinedParty", (signal) => {
      setPartyJoined(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const joinParty = () => {
    setPartyJoined(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("joinParty", { signal: data, to: creator });
    });

    peer.on("stream", (stream) => {
      friendAudio.current.srcObject = stream;
    });

    peer.signal(creatorSignal);
    connectionRef.current = peer;
  };

  const leaveParty = () => {
    setPartyEnded(true);
    connectionRef.current.destroy();
  };

  return (
    <>
      <h1 style={{ textAlign: "center" }}>Partyy</h1>
      <div className="container">
        <div className="audio-container">
          <div className="audio">
            {stream && (
              <audio
                autoPlay
                controls
                muted
                ref={myAudio}
                style={{ width: "300px" }}
              />
            )}
          </div>
          <div className="audio">
            {partyJoined && !partyEnded ? (
              <audio
                autoPlay
                controls
                ref={friendAudio}
                style={{ width: "300px" }}
              />
            ) : null}
          </div>
        </div>
        <div className="myId">
          <label>
            User Tag:
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              style={{ marginBottom: "2rem" }}
            />
          </label>
          <div
            className="socket-id"
            style={{ display: "flex", marginBottom: "2rem" }}
          >
            <h3 style={{ marginRight: "1rem" }}>Give this ID to friend:</h3>
            <p>{me}</p>
          </div>
          <label>
            Friend Tag:
            <input
              type="text"
              value={idToInvite}
              onChange={(e) => setIdToInvite(e.target.value)}
              style={{ marginBottom: "1rem" }}
            />
          </label>
          <div className="invite-button">
            {partyJoined && !partyEnded ? (
              <button onClick={leaveParty}>End Party</button>
            ) : (
              <button onClick={() => startParty(idToInvite)}>
                Start Party
              </button>
            )}
            {idToInvite}
          </div>
        </div>
        <div>
          {partyInvite && !partyJoined ? (
            <div className="creator" style={{ marginLeft: "1rem" }}>
              <h2>{tag} is calling</h2>
              <button onClick={joinParty}>Join</button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

export default App;
