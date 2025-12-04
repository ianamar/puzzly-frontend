import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/globals.css';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const q = (searchParams.get('q') || '').trim();

  const [loading, setLoading] = useState(false);
  const [puzzles, setPuzzles] = useState([]);
  const [error, setError] = useState(null);

  //controla si mostramos el mensaje "No se han encontrado puzzles"
  const [showNoResults, setShowNoResults] = useState(false);

  //ref para el timeout que retrasa el mensaje "no results"
  const timerRef = useRef(null);

  //request controller ref por si hay que abortar
  const controllerRef = useRef(null);

  useEffect(() => {
    //limpiar estado si la query está vacía
    if (!q) {
      //abortar petición previa
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
      setPuzzles([]);
      setError(null);
      setLoading(false);
      setShowNoResults(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    //inicio de búsqueda
    setLoading(true);
    setError(null);
    setShowNoResults(false); //ocultamos el mensaje hasta que pasen 400ms sin resultados

    //abort controller para esta petición
    const controller = new AbortController();
    controllerRef.current = controller;

    fetch(`/api/puzzles/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setPuzzles(list);

        //Si no hay resultados, esperamos 400ms antes de mostrar el mensaje.
        //si dentro de esos 400ms llegan resultados (o la query cambia), cancelamos el timeout.
        if (list.length === 0) {
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            setShowNoResults(true);
            timerRef.current = null;
          }, 400); 
        } else {
          //hay resultados: aseguramos que no se muestre "no results"
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          setShowNoResults(false);
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          return;
        }
        console.error('Search error', err);
        setError('Error al buscar puzzles.');
        //si hay error, cancelamos el timeout y mostramos mensaje de error en su lugar
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setShowNoResults(false);
        setPuzzles([]);
      })
      .finally(() => {
        setLoading(false);
        controllerRef.current = null;
      });

    //cleanup: si q cambia o el componente se desmonta, abortamos la petición y limpiamos timeout
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [q]);

  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: '2rem 1rem' }}>
        <h1>Resultados para: <em>{q}</em></h1>

        {loading && <p>Cargando resultados…</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {!loading && !error && showNoResults && puzzles.length === 0 && (
          <p>No se han encontrado puzzles.</p>
        )}

        <section className="puzzle-grid" style={{ marginTop: 16 }}>
          {puzzles.map(p => (
            <article className="puzzle-tile" key={p.id}>
              <Link to={`/puzzle/${p.id}`} className="puzzle-thumb-link" aria-label={`Abrir puzzle ${p.name}`}>
                <div
                  className="puzzle-thumb-img"
                  style={{
                    backgroundImage: p.imagePath ? `url('/${p.imagePath.replace(/^\/+/, '')}')` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
              </Link>
              <div className="puzzle-caption">
                <div className="puzzle-name">{p.name}</div>
                <div className="puzzle-meta">{(p.num_rows && p.num_cols) ? `${p.num_rows * p.num_cols} piezas` : ''}</div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
