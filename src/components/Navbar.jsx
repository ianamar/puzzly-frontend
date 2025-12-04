import '../styles/globals.css';
import { Link, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from "react";

export default function Navbar() {
  const navigate = useNavigate(); //Para navegar a /search
  const [query, setQuery] = useState(""); //Para guardar lo que escribe el usuario en la barra de busqueda

  //Estado de usuario
  const [user, setUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);

  //consultar /api/me para saber si hay sesión
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/me', {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });
        if (!mounted) return;
        if (res.ok) {
          const json = await res.json();
          setUser(json.user || null);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn('Error fetching /api/me', err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setCheckingUser(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault(); //evita recarga
    if (!query.trim()) return;

    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  async function handleLogout() {
    try {
      await fetch('/logout', {
        method: 'POST',
        credentials: 'include'
      });

     try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('puzzle_state_v1')) {
          localStorage.removeItem(key);
        }
      });
    } catch (err) {
      console.warn('Error clearing localStorage keys:', err);
    }

    //redirige a home 
    navigate('/');
    } catch (err) {
      console.warn('Logout error', err);
    } finally {
      setUser(null);
      navigate('/');
    }
  }

  return (
    <nav className="topbar">
      <div className="topbar-container" style={{ alignItems: 'center' }}>
        <div className="topbar-logo">
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            🧩 Puzzly
          </Link>
        </div>

       <form onSubmit={handleSubmit} className="search-form">
          <input
            type="search"
            placeholder="Buscar puzzles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn btn-light" >
            Buscar
          </button>
        </form>

        <ul className="topbar-links" style={{ display: 'flex', gap: 12, alignItems: 'center', marginLeft: 'auto' }}>
          

          {checkingUser ? (
            <li style={{ color: '#777' }}>…</li>
          ) : user ? (
            //usuario logueado: saludo + botón cerrar sesión + botón mis puzzles
            <>
              <li style={{ marginLeft: 12, fontWeight: 600 }}>
                Hola, <span>{user.username}</span>!
              </li>
              <li>
                <button
                  className="btn btn-warning"
                  onClick={() => navigate('/categoria/personal')}
                >
                  Mis puzzles
                </button>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="btn btn-danger"
                >
                  Cerrar sesión
                </button>
              </li>
            </>
          ) : (
            //usuario no logueado: enlace a login
            <li><Link to="/login">Iniciar sesión</Link></li>
          )}
        </ul>
      </div>
    </nav>
  );
}
