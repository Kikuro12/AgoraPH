import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';

export default function Documents(){
  const [docs, setDocs] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const fileRef = useRef(null);
  const titleRef = useRef(null);
  const categoryRef = useRef(null);

  async function load(){
    const { data } = await api.get('/documents', { params: { q, category } });
    setDocs(data);
  }
  useEffect(()=>{ load(); }, []);

  async function upload(){
    const file = fileRef.current.files[0];
    if(!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('title', titleRef.current.value);
    form.append('category', categoryRef.current.value);
    await api.post('/documents', form);
    fileRef.current.value = '';
    titleRef.current.value = '';
    categoryRef.current.value = '';
    await load();
  }

  return (
    <div className="grid cols-2">
      <div className="card">
        <h3 style={{marginTop:0}}>Document Center</h3>
        <div style={{display:'flex',gap:8,marginBottom:10}}>
          <input placeholder="Search" value={q} onChange={(e)=>setQ(e.target.value)} style={{flex:1,padding:8,borderRadius:8,border:'1px solid #334155',background:'#0b1223',color:'white'}}/>
          <input placeholder="Category" value={category} onChange={(e)=>setCategory(e.target.value)} style={{width:160,padding:8,borderRadius:8,border:'1px solid #334155',background:'#0b1223',color:'white'}}/>
          <button className="button" onClick={load}>Search</button>
        </div>
        <div className="list">
          {docs.map(d => (
            <div key={d.id} className="doc-item card">
              <div>
                <div style={{fontWeight:700}}>{d.title}</div>
                <div className="pill">{d.category}</div>
              </div>
              <div className="doc-actions">
                <a className="button" href={`/api/documents/${d.id}/download`}>Download PDF</a>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3 style={{marginTop:0}}>Upload (Admin)</h3>
        <div style={{display:'grid',gap:8}}>
          <input ref={titleRef} placeholder="Title" style={{padding:8,borderRadius:8,border:'1px solid #334155',background:'#0b1223',color:'white'}}/>
          <input ref={categoryRef} placeholder="Category" style={{padding:8,borderRadius:8,border:'1px solid #334155',background:'#0b1223',color:'white'}}/>
          <input ref={fileRef} type="file" accept="application/pdf" style={{padding:8,borderRadius:8,border:'1px solid #334155',background:'#0b1223',color:'white'}}/>
          <button className="button" onClick={upload}>Upload PDF</button>
        </div>
      </div>
    </div>
  );
}

