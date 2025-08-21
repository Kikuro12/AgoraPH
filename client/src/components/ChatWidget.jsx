import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io();

export default function ChatWidget(){
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    function onNew(msg){ setMessages((m)=>[...m, msg]); }
    socket.on('connect', ()=>{});
    socket.on('chat:new', onNew);
    return () => { socket.off('chat:new', onNew); };
  }, []);

  function send(){
    const text = inputRef.current?.value?.trim();
    if(!text) return;
    socket.emit('chat:message', { message: text });
    inputRef.current.value = '';
  }

  return (
    <div className="chat-widget">
      {open && (
        <div className="card chat-panel">
          <h3 style={{marginTop:0}}>Suporta</h3>
          <div style={{display:'grid',gap:8}}>
            {messages.map(m => (
              <div key={m.id} className="pill">{m.message}</div>
            ))}
          </div>
          <div style={{display:'flex',gap:8,marginTop:10}}>
            <input ref={inputRef} placeholder="Magtanong dito..." style={{flex:1,padding:8,borderRadius:8,border:'1px solid #334155',background:'#0b1223',color:'white'}} />
            <button className="button" onClick={send}>Send</button>
          </div>
        </div>
      )}
      <button className="button" onClick={()=>setOpen(o=>!o)}>{open ? 'Isara Chat' : 'Buksan Chat'}</button>
    </div>
  );
}

