import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";
import './web.css';

// Environment fix for simple-peer
window.process = {
    env: {
        NODE_ENV: 'production'
    },
    nextTick: function (callback) {
        setTimeout(callback, 0);
    }
};

// Styled Components
const Container = styled.div`
    padding: 20px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100%;
    margin: auto;
    background-color: #f0f0f0;
`;

const VideoContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background-color: #f0f0f0;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    margin: 10px;
`;

const StyledVideo = styled.video`
    flex: 1 1 calc(33.333% - 20px);
    margin: 10px;
    max-width: 300px;
    height: auto;
    border: 2px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

    @media (max-width: 1200px) {
        flex: 1 1 calc(50% - 20px);
    }

    @media (max-width: 768px) {
        flex: 1 1 calc(100% - 20px);
    }
`;

// Modal Component
const Modal = ({ isOpen, onClose, videoRef }) => {
    if (!isOpen) return null;

    return (
        <div className="modal">
            <div className="modal-content">
                <button className="close-button" onClick={onClose}>×</button>
                <video ref={videoRef} autoPlay controls />
            </div>
        </div>
    );
};

// Video Component
const Video = ({ peer }) => {
    const ref = useRef();

    useEffect(() => {
        peer.on("stream", stream => {
            ref.current.srcObject = stream;
        });
    }, [peer]);

    return (
        <VideoContainer className="video-wrapper">
            <StyledVideo playsInline autoPlay ref={ref} />
        </VideoContainer>
    );
};

const Room = () => {
    const [peers, setPeers] = useState([]);
    const videoRefs = useRef([useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)]);
    const [streams, setStreams] = useState([]);
    const socketRef = useRef();
    const peersRef = useRef([]);
    const { roomID } = useParams();
    const [modalOpen, setModalOpen] = useState(false);
    const [currentVideoRef, setCurrentVideoRef] = useState(null);

    useEffect(() => {
        // Get existing socket ID from sessionStorage, if available
        const existingSocketID = sessionStorage.getItem("socketID");

        socketRef.current = io("https://robo-war-3f7f.vercel.app/", {
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            auth: { socketID: existingSocketID } // Pass the existing socket ID as part of the auth options
        });

        // Store the socket ID in sessionStorage when the connection is established
        socketRef.current.on("connect", () => {
            sessionStorage.setItem("socketID", socketRef.current.id);
        }); 

        const getDevicesAndStreams = async () => {
            try {
                const deviceInfos = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = deviceInfos.filter(device => device.kind === 'videoinput');
                

                const newStreams = await Promise.all(
                    videoDevices.slice(0, 5).map(device =>
                        navigator.mediaDevices.getUserMedia({ video: { deviceId: device.deviceId } })
                    )
                );

                setStreams(newStreams);
                newStreams.forEach((stream, index) => {
                    if (videoRefs.current[index].current) {
                        videoRefs.current[index].current.srcObject = stream;
                    }
                });

                socketRef.current.emit("join room", roomID);

                socketRef.current.on("all users", users => {
                    const peers = users.map(userID => {
                        const peer = createPeer(userID, socketRef.current.id, newStreams[1]);
                        peersRef.current.push({ peerID: userID, peer });
                        return peer;
                    });
                    setPeers(peers);
                });

                socketRef.current.on("user joined", payload => {
                    const peer = addPeer(payload.signal, payload.callerID, newStreams[1]);
                    peersRef.current.push({ peerID: payload.callerID, peer });
                    setPeers(prevPeers => [...prevPeers, peer]);
                });

                socketRef.current.on("receiving returned signal", payload => {
                    const item = peersRef.current.find(p => p.peerID === payload.id);
                    item.peer.signal(payload.signal);
                });

            } catch (err) {
                console.error(err);
            }
        };

        getDevicesAndStreams();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            streams.forEach(stream => {
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
            });
            peersRef.current.forEach(({ peer }) => peer.destroy());
        };
    }, [roomID]);

    const createPeer = (userToSignal, callerID, stream) => {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socketRef.current.emit("sending signal", { userToSignal, callerID, signal });
        });

        return peer;
    };

    const addPeer = (incomingSignal, callerID, stream) => {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socketRef.current.emit("returning signal", { signal, callerID });
        });

        peer.signal(incomingSignal);

        return peer;
    };

    const handleVideoClick = (index) => {
        setCurrentVideoRef(videoRefs.current[index]);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setCurrentVideoRef(null);
    };
    const copyRoomIDToClipboard = () => {
        navigator.clipboard.writeText(roomID);
    };

    return (
        <Container>
            <div className="five-webcam-container">
                {videoRefs.current.map((ref, index) => (
                    <div key={index} className="video-wrapper" onClick={() => handleVideoClick(index)}>
                        <h2>DATA {index + 1}</h2>
                        <StyledVideo ref={ref} autoPlay />
                    </div>
                ))}
            </div>
            <Modal isOpen={modalOpen} onClose={handleCloseModal} videoRef={currentVideoRef} />
            {peers.map((peer, index) => (
                <Video key={index} peer={peer} />
            ))}
            <label>Room ID ;</label>
            <input 
                type="text" 
                value={roomID} 
                readOnly 
                style={{ width: '290px', padding: '10px', border: '1px solid #ccc', marginRight: '10px', fontSize: '16px'}} 
            />
            <button onClick={copyRoomIDToClipboard}>Copy</button>
        </Container>
    );
};

export default Room;
