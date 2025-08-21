import { Routes, Route, Link, NavLink } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Documents from './pages/Documents.jsx';
import Forum from './pages/Forum.jsx';
import Tools from './pages/Tools.jsx';
import Admin from './pages/Admin.jsx';
import Auth from './pages/Auth.jsx';
import ChatWidget from './components/ChatWidget.jsx';

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="/logo.svg" alt="AletheiaDocs" />
          <div>
            <h1>AletheiaDocs</h1>
            <small>Mga Dokumento. Tumulong. Tumpak.</small>
          </div>
        </div>
        <nav>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/documents">Documents</NavLink>
          <NavLink to="/tools">Tools</NavLink>
          <NavLink to="/forum">Forum</NavLink>
          <NavLink to="/admin">Admin</NavLink>
          <NavLink to="/auth">Login</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/forum/*" element={<Forum />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </main>
      <ChatWidget />
      <footer className="footer">© {new Date().getFullYear()} AletheiaDocs</footer>
    </div>
  );
}

