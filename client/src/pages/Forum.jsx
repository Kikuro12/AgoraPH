import { useEffect, useRef, useState } from 'react';
import { Routes, Route, Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';

function ForumList(){
  const [posts, setPosts] = useState([]);
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  async function load(){ const { data } = await api.get('/forum/posts'); setPosts(data); }
  useEffect(()=>{ load(); }, []);
  async function create(){
    await api.post('/forum/posts', { title: titleRef.current.value, content: contentRef.current.value });
    titleRef.current.value=''; contentRef.current.value='';
    await load();
  }
  return (
    <div className="grid cols-2">
      <div className="card">
        <h3 style={{marginTop:0}}>Forum</h3>
        <div className="list">
          {posts.map(p => (
            <div className="card" key={p.id}>
              <Link to={`/forum/${p.id}`} style={{color:'white',textDecoration:'none'}}>
                <div style={{fontWeight:700}}>{p.title}</div>
                <div className="pill">{p.author || 'Guest'}</div>
              </Link>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3 style={{marginTop:0}}>Gumawa ng Post</h3>
        <input ref={titleRef} placeholder="Pamagat" style={{padding:8,borderRadius:8,border:'1px solid #334155',background:'#0b1223',color:'white',marginBottom:8}}/>
        <textarea ref={contentRef} placeholder="Nilalaman" rows={6} style={{padding:8,borderRadius:8,border:'1px solid #334155',background:'#0b1223',color:'white'}}></textarea>
        <div style={{marginTop:8}}>
          <button className="button" onClick={create}>I-publish</button>
        </div>
      </div>
    </div>
  );
}

function PostDetail(){
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const replyRef = useRef(null);
  async function load(){
    const { data } = await api.get(`/forum/posts/${id}`);
    setPost(data.post); setReplies(data.replies);
  }
  useEffect(()=>{ load(); }, [id]);
  async function reply(){
    await api.post(`/forum/posts/${id}/replies`, { content: replyRef.current.value });
    replyRef.current.value='';
    await load();
  }
  if(!post) return <div className="card">Loading...</div>;
  return (
    <div className="grid cols-1">
      <div className="card">
        <h3 style={{marginTop:0}}>{post.title}</h3>
        <div className="pill">{post.author || 'Guest'}</div>
        <p>{post.content}</p>
      </div>
      <div className="card">
        <h4>Mga Sagot</h4>
        <div className="list">
          {replies.map(r => <div key={r.id} className="card">{r.content} <div className="pill">{r.author || 'Guest'}</div></div>)}
        </div>
        <div style={{display:'flex',gap:8,marginTop:10}}>
          <input ref={replyRef} placeholder="Sumagot..." style={{flex:1,padding:8,borderRadius:8,border:'1px solid #334155',background:'#0b1223',color:'white'}} />
          <button className="button" onClick={reply}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default function Forum(){
  return (
    <Routes>
      <Route index element={<ForumList />} />
      <Route path=":id" element={<PostDetail />} />
    </Routes>
  );
}

