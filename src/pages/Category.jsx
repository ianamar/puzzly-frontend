import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom'; //lee parametros de la URL
import Navbar from '../components/Navbar';
import '../styles/globals.css';

//componente de página que muestra todos los puzzles de una categoría
export default function Category() {
  const { slug } = useParams(); // p.ej. "animales"
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //fetch al backend cuado se cambia de categoria
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/category/${encodeURIComponent(slug)}/puzzles`)
      .then(res => {
        if (!res.ok) throw new Error('Error fetching');
        return res.json();
      })
      .then(data => {
        setPuzzles(data);
      })
      .catch(err => {
        console.error(err);
        setError('Error cargando puzzles.');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: '2rem 1rem' }}>
        <header className="category-header">
          <h1 style={{ textTransform: 'capitalize' }}>{slug}</h1>
          <p className="category-sub">Explora los puzzles disponibles en la categoría.</p>
        </header>

        {loading && <p>Cargando puzzles...</p>}
        {error && <p>{error}</p>}

        {!loading && !error && puzzles.length === 0 && (
          <p>No hay puzzles en esta categoría todavía.</p>
        )}

        {!loading && !error && puzzles.length > 0 && (
          <section className="puzzle-grid">
            {puzzles.map(p => {
              const numRows = Number(p.num_rows ?? p.numRows ?? p.rows ?? 0);
              const numCols = Number(p.num_cols ?? p.numCols ?? p.cols ?? 0);
              const pieces = (numRows > 0 && numCols > 0) ? (numRows * numCols) : (p.piecesCount ?? p.pieces ?? null);

              // safePath: prioriza imageUrl si existe, sino image_path u otros
              const raw = p.imageUrl ?? p.image_path ?? p.imagePath ?? p.image ?? '';
              const safeBackground = raw ? `url('${raw}')` : 'none';

              return (
                <article className="puzzle-tile" key={p.id}>
                  <Link to={`/puzzle/${p.id}`} className="puzzle-thumb-link" aria-label={`Abrir puzzle ${p.name}`}>
                    <div
                      className="puzzle-thumb-img"
                      style={{
                        backgroundImage: safeBackground,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                  </Link>

                  <div className="puzzle-caption">
                    <div className="puzzle-name">{p.name}</div>
                    <div className="puzzle-meta">{pieces ? `${pieces} piezas` : 'Piezas: —'}</div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </>
  );
}
