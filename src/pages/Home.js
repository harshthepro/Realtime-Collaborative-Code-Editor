import React, { useState } from 'react';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');

    const createNewRoom = (e) => {
        e.preventDefault();
        const id = uuidV4();
        setRoomId(id);
        toast.success('Created a new secure session');
    };

    const joinRoom = () => {
        if (!roomId || !username) {
            toast.error('ROOM ID & Username is required');
            return;
        }

        // Redirect
        navigate(`/editor/${roomId}`, {
            state: {
                username,
            },
        });
    };

    const handleInputEnter = (e) => {
        if (e.code === 'Enter') {
            joinRoom();
        }
    };

    return (
        <div className="homePageWrapper">
            <div className="formWrapper">
                {/* PROFESSIONAL BRANDING - No Image, just Text */}
                <div style={{textAlign: 'center', marginBottom: '30px'}}>
                   <h1 style={{color: '#4aed88', fontWeight: 'bold', fontSize: '2.5rem', margin: 0, lineHeight: '1'}}>
                       Dev<span style={{color: '#fff'}}>Flow</span>
                   </h1>
                   <p style={{color: '#666', marginTop: '8px', fontSize: '0.9rem', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 'bold'}}>
                       Realtime Collaboration Suite
                   </p>
                </div>

                <h4 className="mainLabel">Paste invitation ROOM ID</h4>
                <div className="inputGroup">
                    <input
                        type="text"
                        className="inputBox"
                        placeholder="ROOM ID"
                        onChange={(e) => setRoomId(e.target.value)}
                        value={roomId}
                        onKeyUp={handleInputEnter}
                    />
                    <input
                        type="text"
                        className="inputBox"
                        placeholder="USERNAME"
                        onChange={(e) => setUsername(e.target.value)}
                        value={username}
                        onKeyUp={handleInputEnter}
                    />
                    <button className="btn joinBtn" onClick={joinRoom}>
                        Join Room
                    </button>
                    <span className="createInfo">
                        If you don't have an invite then &nbsp;
                        <a onClick={createNewRoom} href="" className="createNewBtn">
                            create new room
                        </a>
                    </span>
                </div>
            </div>
            {/* FOOTER IS REMOVED */}
        </div>
    );
};

export default Home;
