import { useEffect, useRef } from 'react';
import { api } from '../lib/api.js';
import { getToken, saveToken } from '../lib/auth.js';
import { setAuthToken } from '../lib/api.js';

export default function Auth(){
  const emailRef = useRef(null);
  const passRef = useRef(null);
  const nameRef = useRef(null);

  useEffect(() => {
    const token = getToken();
    if (token) setAuthToken(token);
  }, []);

  async function login(){
    const { data } = await api.post('/auth/login', { email: emailRef.current.value, password: passRef.current.value });
    saveToken(data.token); setAuthToken(data.token); alert('Logged in');
  }

  async function register(){
    const { data } = await api.post('/auth/register', { email: emailRef.current.value, password: passRef.current.value, displayName: nameRef.current.value });
    saveToken(data.token); setAuthToken(data.token); alert('Registered');
  }

  return (
    <div className="card" style={{maxWidth:520,margin:'0 auto'}}>
      <h3 style={{marginTop:0}}>Login o Magrehistro</h3>
      <input ref={nameRef} placeholder="Pangalan (para sa rehistro)" style={{padding:8,borderRadius:8,border:'1px solid #334155',background:'#0b1223',color:'white',marginBottom:8}}/>
      <input ref={emailRef} placeholder="Email" style={{padding:8,borderRadius:8,border:'1px solid #334155',background:'#0b1223',color:'white',marginBottom:8}}/>
      <input ref={passRef} placeholder="Password" type="password" style={{padding:8,borderRadius:8,border:'1px solid #334155',background:'#0b1223',color:'white'}}/>
      <div style={{display:'flex',gap:8,marginTop:10}}>
        <button className="button" onClick={login}>Login</button>
        <button className="button secondary" onClick={register}>Register</button>
      </div>
    </div>
  );
}

