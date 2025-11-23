import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import Client from "../components/Client";
import Editor from "../components/Editor";
import { language, cmtheme } from "../../src/atoms";
import { useRecoilState } from "recoil";
import ACTIONS from "../actions/Actions";
import { initSocket } from "../socket";
import {
  useLocation,
  useNavigate,
  Navigate,
  useParams,
} from "react-router-dom";

const EditorPage = () => {
  const [lang, setLang] = useRecoilState(language);
  const [them, setThem] = useRecoilState(cmtheme);
  const [clients, setClients] = useState([]);

  // --- NEW FEATURES STATES ---
  const [output, setOutput] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  // ---------------------------

  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const reactNavigator = useNavigate();

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("Socket connection failed, try again later.");
        reactNavigator("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== location.state?.username) {
            toast.success(`${username} joined the room.`);
          }
          setClients(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
        }
      );

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });
    };
    init();
    return () => {
      if(socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
      }
    };
  }, []);

  async function copyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID has been copied to clipboard");
    } catch (err) {
      toast.error("Could not copy the Room ID");
    }
  }

  function leaveRoom() {
    reactNavigator("/");
  }

  // --- 1. RUN CODE FEATURE ---
  const runCode = async () => {
    setIsCompiling(true);
    try {
      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: lang === 'clike' ? 'java' : lang,
          version: "*",
          files: [{ content: codeRef.current }]
        })
      });
      const data = await response.json();
      if (data.run) {
          setOutput(data.run.output);
      } else {
          setOutput("Error: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      setOutput("Error running code: " + error.message);
    } finally {
      setIsCompiling(false);
    }
  };

  // --- 2. DOWNLOAD CODE FEATURE ---
  const downloadCode = () => {
    const element = document.createElement("a");
    const file = new Blob([codeRef.current], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    // Auto-detect extension
    const extMap = {python: '.py', javascript: '.js', java: '.java', cpp: '.cpp', go: '.go'};
    const ext = extMap[lang] || '.txt';
    element.download = `code_${roomId}${ext}`;
    document.body.appendChild(element);
    element.click();
    toast.success("Code Downloaded!");
  };

  if (!location.state) {
    return <Navigate to="/" />;
  }

  return (
    <div className="mainWrap">
      <div className="aside">
        <div className="asideInner">
          <div className="logo">
            <img className="logoImage" src="/logo.png" alt="logo" />
          </div>
          
          {/* Active Users Display */}
          <div style={{marginBottom: '20px'}}>
             <h3 style={{color: '#fff', borderBottom: '1px solid #444', paddingBottom: '10px'}}>Connected Users</h3>
             <div className="clientsList">
               {clients.map((client) => (
                 <Client key={client.socketId} username={client.username} />
               ))}
             </div>
          </div>
        </div>

        {/* --- CONTROLS SECTION --- */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            
            {/* Language Selector */}
            <div style={{display:'flex', flexDirection:'column'}}>
                <span style={{color:'#888', fontSize:'12px', marginBottom:'5px'}}>Language</span>
                <select
                value={lang}
                onChange={(e) => {
                    setLang(e.target.value);
                    window.location.reload();
                }}
                className="seLang"
                style={{marginBottom: '0px'}} // Override default css
                >
                <option value="javascript">JavaScript (Node)</option>
                <option value="python">Python 3</option>
                <option value="java">Java</option>
                <option value="go">Go Lang</option>
                <option value="cpp">C++</option>
                </select>
            </div>

            {/* Theme Selector */}
            <div style={{display:'flex', flexDirection:'column'}}>
                <span style={{color:'#888', fontSize:'12px', marginBottom:'5px'}}>Theme</span>
                <select
                    value={them}
                    onChange={(e) => setThem(e.target.value)}
                    className="seLang"
                >
                    <option value="dracula">Dracula</option>
                    <option value="monokai">Monokai</option>
                    <option value="material">Material</option>
                    <option value="solarized">Solarized</option>
                </select>
            </div>

            {/* ACTION BUTTONS (New Design) */}
            
            {/* Run Button */}
            <button className="btn" onClick={runCode} style={{background: 'linear-gradient(90deg, #1CB5E0 0%, #000851 100%)', color: 'white', fontWeight:'bold'}}>
                {isCompiling ? "Running..." : "▶ Run Code"}
            </button>

             {/* Download Button */}
             <button className="btn" onClick={downloadCode} style={{background: '#4a4a4a', color: 'white'}}>
                ⬇ Download Code
            </button>

            {/* Copy Room ID */}
            <button className="btn copyBtn" onClick={copyRoomId}>
                Copy Room ID
            </button>

            {/* Leave Button */}
            <button className="btn leaveBtn" onClick={leaveRoom}>
                Leave Room
            </button>
        </div>

        {/* OUTPUT WINDOW (Fixed at bottom) */}
        <div style={{
            marginTop: 'auto', // Pushes to bottom
            backgroundColor: '#111', 
            padding: '10px', 
            borderRadius: '8px', 
            color: '#00ff00', 
            fontFamily: 'monospace',
            height: '150px',
            overflowY: 'auto',
            fontSize: '0.85rem',
            border: '1px solid #333'
        }}>
            <strong style={{color: '#888', display:'block', marginBottom:'5px'}}>Terminal Output:</strong>
            <pre style={{margin:0, whiteSpace: 'pre-wrap'}}>{output || "Waiting for output..."}</pre>
        </div>

      </div>

      <div className="editorWrap">
        <Editor
          socketRef={socketRef}
          roomId={roomId}
          onCodeChange={(code) => {
            codeRef.current = code;
          }}
        />
      </div>
    </div>
  );
};

export default EditorPage;
