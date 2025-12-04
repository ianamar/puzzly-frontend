import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Upload() {
  const [name, setName] = useState('');
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  function onFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

async function handleSubmit(e) {
  e.preventDefault();
  setError(null);
  if (!file) return setError('Selecciona una imagen.');

  const fd = new FormData();
  fd.append('image', file);
  fd.append('name', name);
  fd.append('rows', rows);
  fd.append('cols', cols);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });

    //intentamos parsear JSON (si hay)
    let body = null;
    try { body = await res.json(); } catch (e) { /* no JSON */ }

    if (res.ok) {
      const puzzleId = body?.puzzleId ?? null;
      console.log('Upload OK', body);
      if (puzzleId) navigate(`/puzzle/${puzzleId}`);
      else navigate('/');
      return;
    }

    //mostrar detalle si la subida ha fallado
    console.error('Upload failed', res.status, body);
    if (body && body.error) {
      setError(body.error);
    } else if (res.status === 401) {
      setError('No autorizado. Por favor inicia sesión.');
      navigate('/login');
    } else {
      setError('Error al subir. Código: ' + res.status + (body ? ' — ' + JSON.stringify(body) : ''));
    }
  } catch (err) {
    console.error('Fetch error', err);
    setError('Error de conexión.');
  }
}


  return (
    <>
      <Navbar />
     <main className="container upload-container">
  <div className="upload-inner">
    <h1 className="upload-heading">Subir puzzle</h1>

    <form onSubmit={handleSubmit} className="upload-form">

      <div className="form-row">
        <label className="upload-label">Nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="upload-input"
        />
      </div>

      <div className="form-row">
        <label className="upload-label">Filas</label>
        <input
          type="number"
          min="1"
          max="30"
          value={rows}
          onChange={(e) => setRows(e.target.value)}
          className="upload-input"
        />
      </div>

      <div className="form-row">
        <label className="upload-label">Columnas</label>
        <input
          type="number"
          min="1"
          max="30"
          value={cols}
          onChange={(e) => setCols(e.target.value)}
          className="upload-input"
        />
      </div>

      <div className="form-row">
        <label className="upload-label">Imagen</label>
        <input
          type="file"
          accept="image/*"
          onChange={onFile}
          className="upload-input"
        />
      </div>

      {preview && (
        <div className="upload-preview">
          <img src={preview} alt="preview" />
        </div>
      )}

      {error && <div className="upload-error">{error}</div>}

      <button type="submit" className="btn btn-primary w-100 mt-3">
        Crear puzzle
      </button>
    </form>
  </div>
</main>
    </>
  );
}
