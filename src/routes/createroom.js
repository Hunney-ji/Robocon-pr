import React from "react";
import { v1 as uuid } from "uuid";
import { useNavigate } from 'react-router-dom';
import JoinRoom from "./joinroom";


const CreateRoom = (props) => {
    const navigate=useNavigate();
    function create() {
        const id = uuid();
        navigate(`/room/${id}`);
    }

    return (
        <div style={{display:"flex" ,justifyContent:"center"}}>
        <JoinRoom/>
        <button style={{alignSelf:"center"}} onClick={create}>Create room</button>
        </div>
    );
};

export default CreateRoom;