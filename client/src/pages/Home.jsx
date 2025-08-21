export default function Home(){
  return (
    <div className="hero card">
      <div className="left">
        <span className="badge">Bagong Anunsyo</span>
        <h2>Propesyonal na dokumentasyon, para sa bawat Pilipino.</h2>
        <p className="tag-baybayin">Mabilis i-download, handa sa pag-print, at may kasangkapang kapaki-pakinabang.</p>
        <div style={{display:'flex',gap:10,marginTop:12}}>
          <a className="button" href="/documents">Tingnan ang mga Dokumento</a>
          <a className="button secondary" href="/tools">Gamitin ang mga Kasangkapan</a>
        </div>
      </div>
      <img src="/hero-art.png" alt="Filipino patterns" style={{width:'100%',borderRadius:12}} />
    </div>
  );
}

