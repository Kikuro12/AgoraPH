import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';

export default function Admin(){
  const [ann, setAnn] = useState([]);
  const textRef = useRef(null);
  const iconRef = useRef(null);
  const [chat, setChat] = useState([]);

  async function load(){
    const [a, c] = await Promise.all([
      api.get('/admin/announcements'),
      api.get('/admin/chat').catch(()=>({ data: [] }))
    ]);
    setAnn(a.data);
    setChat(c.data || []);
  }
  useEffect(()=>{ load(); }, []);

  async function add(){
    await api.post('/admin/announcements', { text: textRef.current.value, icon: iconRef.current.value });
    textRef.current.value=''; iconRef.current.value='';
    await load();
  }

  async function del(id){ await api.delete(`/admin/announcements/${id}`); await load(); }
  async function delChat(id){ await api.delete(`/admin/chat/${id}`); await load(); }

  return (
    <div className="grid cols-2">
      <div className="card">
        <h3 style={{marginTop:0}}>Announcements</h3>
        <div className="list">
          {ann.map(a => (
            <div className="card" key={a.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><span className="pill">{a.icon || '📣'}</span> {a.text}</div>
              <button className="button secondary" onClick={()=>del(a.id)}>Delete</button>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gap:8,marginTop:10}}>
          <input ref={iconRef} placeholder="Icon (emoji or class)" style={{padding:8,borderRadius:8,border:'1px solid #334155',background:'#0b1223',color:'white'}}/>
          <input ref={textRef} placeholder="Announcement text" style={{padding:8,borderRadius:8,border:'1px solid #334155',background:'#0b1223',color:'white'}}/>
          <button className="button" onClick={add}>Add</button>
        </div>
      </div>
      <div className="card">
        <h3 style={{marginTop:0}}>Chat Moderation</h3>
        <div className="list">
          {chat.map(m => (
            <div key={m.id} className="card" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>{m.message}</div>
              <button className="button secondary" onClick={()=>delChat(m.id)}>Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

