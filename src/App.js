import React from 'react'
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import CreateRoom from './routes/createroom';
import Room from './routes/room'
const App = () => {
  return (
    <>
    <Router>
    {/* <JoinRoom/> */}
      <Routes>
        <Route path="/" element={<CreateRoom />} />
        <Route path="/room/:roomID" element={<Room />} />
      </Routes>
    </Router>
    </>
  )
}
export default App