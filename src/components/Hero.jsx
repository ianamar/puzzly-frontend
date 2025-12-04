import '../styles/globals.css';
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Hero({ onRandomPuzzle }) {
  const navigate = useNavigate();

  //comprobar si hay sesión activa en el backend y según eso llevar al usuario a la página de subida o al login
  async function handleUploadClick() {
    try {
      const res = await fetch('/api/me', {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        //si la petición falla se manda al login por seguridad
        navigate('/login');
        return;
      }

      const json = await res.json();

      const loggedIn =
        (typeof json.loggedIn === 'boolean' && json.loggedIn) ||
        !!json.user ||
        !!json.username;

      if (loggedIn) {
        navigate('/subir');
      } else {
        navigate('/login');
      }
    } catch (err) {
      console.warn('Error comprobando sesión:', err);
      navigate('/login');
    }
  }

  return (
    <section className="hero">
      <h1>Tus puzzles a tu manera: juega o crea</h1>
      <p>Sube tus fotos o elige una categoría para empezar a jugar</p>
      <div className="hero-buttons">
        <button
          className="btn-primary random-btn"
          //la función para un puzzle random que está definida en Home.jsx
          onClick={() => {
            if (typeof onRandomPuzzle === 'function') onRandomPuzzle();
          }}
        >
          Puzzle aleatorio
        </button>

        <button className="btn-secondary subir-btn" onClick={handleUploadClick}>
          Subir imagen
        </button>
      </div>
    </section>
  );
}
