import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
`;

const Input = styled.input`
    padding: 10px;
    margin: 10px 0;
    font-size: 16px;
`;

const Button = styled.button`
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
`;

const JoinRoom = () => {
    const [roomID, setRoomID] = useState("");
    const navigate = useNavigate();

    const handleJoinRoom = () => {
        if (roomID.trim()) {
            navigate(`/room/${roomID}`);
        }
    };

    return (
        <Container>
            <h1>Join a Room</h1>
            <Input 
                type="text" 
                value={roomID} 
                onChange={(e) => setRoomID(e.target.value)} 
                placeholder="Enter Room ID"
            />
            <Button onClick={handleJoinRoom}>Join Room</Button>
        </Container>
    );
};

export default JoinRoom;
