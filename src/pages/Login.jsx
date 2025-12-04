import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/globals.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', 
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        navigate('/');
      } else if (res.status === 401) {
        setError('Credenciales incorrectas');
      } else {
        const text = await res.text();
        setError('Error: ' + (text || res.status));
      }
    } catch (err) {
      console.error(err);
      setError('No se ha podido conectar al servidor');
    }
  }

  return (
    <>
      <Navbar />
<main className="container login-container">
  <div className="login-inner">
    <h1 className="login-heading">Iniciar sesión</h1>

    <form onSubmit={handleSubmit} className="login-form">
      <div className="form-row">
        <label className="login-label">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          type="username"
          required
          className="login-input"
        />
      </div>

      <div className="form-row">
        <label className="login-label">Contraseña</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          className="login-input"
        />
      </div>

      {error && <div className="login-error">{error}</div>}

      <div className="form-row">
        <button type="submit" className="login-button">Iniciar sesión</button>
      </div>
    </form>
  </div>
</main>
    </>
  );
}
