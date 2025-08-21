import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { api } from '../lib/api.js';

export default function Tools(){
  const mapRef = useRef(null);
  const mapDivRef = useRef(null);
  const [weather, setWeather] = useState(null);
  const [query, setQuery] = useState('Manila,PH');

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map(mapDivRef.current).setView([14.5995, 120.9842], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapRef.current);
      const bounds = L.latLngBounds([4.6,116.9],[21.1,126.6]);
      mapRef.current.fitBounds(bounds);
    }
  }, []);

  async function fetchWeather(){
    const { data } = await api.get('/tools/weather', { params: { q: query } });
    setWeather(data);
  }

  useEffect(()=>{ fetchWeather(); }, []);

  return (
    <div className="grid cols-2">
      <div className="card">
        <h3 style={{marginTop:0}}>Mapa ng Pilipinas</h3>
        <div ref={mapDivRef} style={{height:420,borderRadius:12,overflow:'hidden'}}></div>
      </div>
      <div className="card">
        <h3 style={{marginTop:0}}>Panahon (OpenWeather)</h3>
        <div style={{display:'flex',gap:8,marginBottom:10}}>
          <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Hal: Manila,PH" style={{flex:1,padding:8,borderRadius:8,border:'1px solid #334155',background:'#0b1223',color:'white'}} />
          <button className="button" onClick={fetchWeather}>Kunin</button>
        </div>
        {weather && weather.main ? (
          <div className="grid cols-2">
            <div className="card">
              <div style={{fontWeight:700}}>{weather.name}</div>
              <div className="pill">{weather.weather?.[0]?.main}</div>
              <div>Temp: {Math.round(weather.main.temp)}°C</div>
            </div>
            <div className="card">
              <div>Humidity: {weather.main.humidity}%</div>
              <div>Wind: {weather.wind.speed} m/s</div>
            </div>
          </div>
        ) : (
          <div className="pill">Walang data</div>
        )}
      </div>
    </div>
  );
}

