import React, { useEffect, useRef, useState } from "react";

const TOLERANCE = 24;
const DEFAULT_ROWS = 4;
const DEFAULT_COLS = 4;
const MAX_WIDTH = 800;
const MAX_HEIGHT = 600;

/* Este componente Puzzle crea y renderiza un rompecabezas jigsaw usando SVG de React. 
Genera piezas a partir de una imagen, permite arrastrarlas, detecta encaje (snap),
guarda estado en localStorage y lo sincroniza con el backend.*/

/* ---------------- helpers ---------------- */

//Calcula el ancho/alto por pieza a partir de las dimensiones de la imagen y el número de filas/columnas
//Genera y devuelve un array con objetos piece

function createPiecesConfig(imgWidth, imgHeight, rows, cols) {
  const pieceW = Math.floor(imgWidth / cols);
  const pieceH = Math.floor(imgHeight / rows);
  const pieces = [];
  let id = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const correctX = c * pieceW;
      const correctY = r * pieceH;
      //posición aleatoria
      const x = Math.random() * Math.max(1, imgWidth - pieceW);
      const y = imgHeight + 30 + Math.random() * 140;
      pieces.push({
        id: id++,
        row: r,
        col: c,
        correctX,
        correctY,
        width: pieceW,
        height: pieceH,
        x,
        y,
        snapped: false, //no está "encajado"
      });
    }
  }
  return pieces;
}

//Genera la orientación de las pestañas (tabs) de cada borde de cada pieza para simular la forma clásica de rompecabezas
//Devuelve un array tabs con un objeto por pieza
function generateTabs(rows, cols) {
  const verticalEdges = Array.from({ length: rows }, () =>
    new Array(cols - 1).fill(0).map(() => (Math.random() > 0.5 ? 1 : -1))
  );
  const horizontalEdges = Array.from({ length: rows - 1 }, () =>
    new Array(cols).fill(0).map(() => (Math.random() > 0.5 ? 1 : -1))
  );

  const tabs = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const top = r === 0 ? 0 : -horizontalEdges[r - 1][c];
      const bottom = r === rows - 1 ? 0 : horizontalEdges[r][c];
      const left = c === 0 ? 0 : -verticalEdges[r][c - 1];
      const right = c === cols - 1 ? 0 : verticalEdges[r][c];
      tabs.push({ top, bottom, left, right });
    }
  }
  return tabs;
}

//A partir del tamaño de una pieza y su tabs genera la cadena d (path) para dibujar la silueta SVG de la pieza en 4 lados
function pathDFromTabs(w, h, tabs, tabSize) {
  const c = (cx1, cy1, cx2, cy2, x, y) => `C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x} ${y}`;
  const line = (x, y) => `L ${x} ${y}`;
  let d = `M 0 0 `;
  const smoothness = 0.3;

  //TOP
  const topMid = w / 2;
  d += line(topMid - tabSize * 1.1, 0);
  if (tabs.top !== 0) {
    const dir = tabs.top;
    const tabSizeAdjusted = tabSize * 1.2;
    const depth = dir * tabSizeAdjusted * 2.5;
    const cp = tabSize * smoothness;
    d += c(topMid - cp, depth * 0.5, topMid + cp, depth * 0.5, topMid + tabSize * 1.1, 0);
  }
  d += line(w, 0);

  //RIGHT
  const rightMid = h / 2;
  d += line(w, rightMid - tabSize * 1.1);
  if (tabs.right !== 0) {
    const dir = tabs.right;
    const tabSizeAdjusted = tabSize * 1.2;
    const depth = dir * tabSizeAdjusted * 2.5;
    const cp = tabSize * smoothness;
    d += c(w + depth * 0.5, rightMid - cp, w + depth * 0.5, rightMid + cp, w, rightMid + tabSize * 1.1);
  }
  d += line(w, h);

  //BOTTOM
  const bottomMid = w / 2;
  d += line(bottomMid + tabSize * 1.1, h);
  if (tabs.bottom !== 0) {
    const dir = tabs.bottom;
    const tabSizeAdjusted = tabSize * 1.2;
    const depth = dir * tabSizeAdjusted * 2.5;
    const cp = tabSize * smoothness;
    d += c(bottomMid + cp, h - depth * 0.5, bottomMid - cp, h - depth * 0.5, bottomMid - tabSize * 1.1, h);
  }
  d += line(0, h);

  //LEFT
  const leftMid = h / 2;
  d += line(0, leftMid + tabSize * 1.1);
  if (tabs.left !== 0) {
    const dir = tabs.left;
    const tabSizeAdjusted = tabSize * 1.2;
    const depth = dir * tabSizeAdjusted * 2.5;
    const cp = tabSize * smoothness;
    d += c(-depth * 0.5, leftMid + cp, -depth * 0.5, leftMid - cp, 0, leftMid - tabSize * 1.1);
  }

  d += " Z";
  return d;
}

/* ---------------- componente ---------------- */

export default function Puzzle({
  puzzleId = null,
  imageSrc: initialImageSrc = undefined, 
  rows: initialRows = DEFAULT_ROWS,
  cols: initialCols = DEFAULT_COLS,
  storageKey = "puzzle_state_v1",
}) {
  const [apiLoaded, setApiLoaded] = useState(false);
  const [imgSize, setImgSize] = useState(null);
  const [pieces, setPieces] = useState(null);
  const [scale, setScale] = useState(1);
  const [dragLayer, setDragLayer] = useState(null);
  const [imageSrc, setImageSrc] = useState(null); 
  const [rows, setRows] = useState(initialRows);
  const [cols, setCols] = useState(initialCols);
  const [puzzleIdState, setPuzzleIdState] = useState(puzzleId);

  const svgRef = useRef(null);
  const fetchControllerRef = useRef(null);
  const saveTimerRef = useRef(null);
  const isMountedRef = useRef(true);
  const remoteStateRef = useRef(null);

  /* Limpieza al desmontar */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (fetchControllerRef.current) fetchControllerRef.current.abort();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  /* ---------- Reset al cambiar puzzleId ---------- */
  useEffect(() => {
    //limpiamos estados viejos para evitar ver puzzle anterior
    setImgSize(null);
    setPieces(null);
    setImageSrc(null);
    setScale(1);
    setDragLayer(null);
    remoteStateRef.current = null;

    if (!puzzleId) {
      //si no hay puzzleId pero tenemos imagen pasada manualmente (ej. subir imagen)
      if (initialImageSrc) setImageSrc(initialImageSrc);
      setApiLoaded(true);
      return;
    }

    //abortar peticiones previas
    if (fetchControllerRef.current) fetchControllerRef.current.abort();
    const ac = new AbortController();
    fetchControllerRef.current = ac;

    // Crear petición para obtener metadata del puzzle desde el backend
    (async () => {
      try {
        const res = await fetch(`/api/puzzle/${puzzleId}`, { signal: ac.signal });
        if (!res.ok) {
          console.error(`Fetch /api/puzzle/${puzzleId} failed: ${res.status}`);
          setApiLoaded(true);
          return;
        }
        const json = await res.json();
        if (ac.signal.aborted) return;

        // aplicar metadata
        if (json.imageUrl) setImageSrc(json.imageUrl);
        else if (json.imagePath) setImageSrc("/" + json.imagePath.replace(/^\/+/, ""));
        if (json.num_rows) setRows(json.num_rows);
        if (json.num_cols) setCols(json.num_cols);
        setPuzzleIdState(json.id ?? puzzleId);
        setApiLoaded(true);

        if (json.state && Array.isArray(json.state) && json.state.length === (json.num_rows || rows) * (json.num_cols || cols)) {
          try {
            localStorage.setItem(storageKey + `_${json.id}`, JSON.stringify(json.state));
          } catch {}
          remoteStateRef.current = json.state;
        }
      } catch (err) {
        if (err.name !== "AbortError") console.error("Error fetching puzzle metadata:", err);
        setApiLoaded(true);
      } finally {
        if (fetchControllerRef.current === ac) fetchControllerRef.current = null;
      }
    })();

    return () => {
      if (fetchControllerRef.current) fetchControllerRef.current.abort();
    };
  }, [puzzleId, storageKey, initialImageSrc]);

  // Carga la imagen para obtener dimensiones reales (w,h).
  useEffect(() => {
    if (!imageSrc) return; 
    let mounted = true;
    const img = new window.Image();
    img.src = imageSrc;

    img.onload = () => mounted && setImgSize({ w: img.width, h: img.height });
    img.onerror = () => mounted && console.warn("Error loading image:", imageSrc);

    return () => {
      mounted = false;
      img.onload = null;
      img.onerror = null;
    };
  }, [imageSrc]);

  //Genera piezas nuevas o restaura estado anterior del puzzle (localStorage o API)
  //También calcula el factor de escala para ajustar la imagen al tamaño máximo
  useEffect(() => {
    if (!imgSize) return;
    const iw = imgSize.w, ih = imgSize.h;
    const s = Math.min(MAX_WIDTH / iw, MAX_HEIGHT / ih, 1);
    setScale(s);

    try {
      const pending = remoteStateRef.current;
      if (pending && Array.isArray(pending) && pending.length === rows * cols) {
        setPieces(pending);
        remoteStateRef.current = null;
        return;
      }
    } catch {}

    let restored = null;
    try {
      const key = storageKey + (puzzleIdState ? `_${puzzleIdState}` : "");
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === rows * cols) restored = parsed;
      }
    } catch {}

    if (restored) {
      setPieces(restored);
      return;
    }

    const base = createPiecesConfig(iw, ih, rows, cols);
    const tabs = generateTabs(rows, cols);
    const scaled = base.map((p, i) => ({
      ...p,
      x: p.x * s,
      y: p.y * s,
      width: p.width * s,
      height: p.height * s,
      correctX: p.correctX * s,
      correctY: p.correctY * s,
      tabs: tabs[i],
      snapped: false,
    }));
    setPieces(scaled);
  }, [imgSize, rows, cols, storageKey, puzzleIdState]);

 //Guarda el estado actual del puzzle en localStorage
  useEffect(() => {
    if (!pieces) return;
    try {
      const key = storageKey + (puzzleIdState ? `_${puzzleIdState}` : "");
      localStorage.setItem(key, JSON.stringify(pieces));
    } catch {}
    if (!puzzleIdState) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch(`/api/puzzle/${puzzleIdState}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: pieces }),
      }).catch((err) => console.warn("Error saving puzzle:", err));
    }, 1000);
    return () => clearTimeout(saveTimerRef.current);
  }, [pieces, storageKey, puzzleIdState]);

  //Mostrar mensaje de carga hasta tener imagen, piezas y metadata inicial preparada.
  if (!imgSize || !pieces || !imageSrc) return <div>Cargando puzzle...</div>; 

  const svgWidth = imgSize.w * scale;
  const svgHeight = imgSize.h * scale;
  const allSnapped = pieces.every((p) => p.snapped);

  //Convierte coordenadas del puntero (mouse/touch) a coordenadas del SVG
  const clientToSvgPoint = (clientX, clientY) => {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

//Inicia el arrastre de una pieza (calcula offset y la pasa a dragLayer).
  const handlePointerDown = (e, piece) => {
    if (piece.snapped) return;
    e.preventDefault();
    const sp = clientToSvgPoint(e.clientX, e.clientY);
    setDragLayer({ ...piece, offsetX: sp.x - piece.x, offsetY: sp.y - piece.y });
    setPieces((prev) => prev.filter((p) => p.id !== piece.id));
  };

  //Actualiza la posición de la pieza mientras se arrastra.
  const handlePointerMove = (e) => {
    if (!dragLayer) return;
    const sp = clientToSvgPoint(e.clientX, e.clientY);
    setDragLayer((p) => ({ ...p, x: sp.x - p.offsetX, y: sp.y - p.offsetY }));
  };

 //Finaliza arrastre y decide si la pieza encaja (snap) según la tolerancia.
  const handlePointerUp = () => {
    if (!dragLayer) return;
    const dx = Math.abs(dragLayer.x - dragLayer.correctX);
    const dy = Math.abs(dragLayer.y - dragLayer.correctY);
    const snapped = dx <= TOLERANCE && dy <= TOLERANCE;
    setPieces((prev) => [
      ...prev,
      { ...dragLayer, x: snapped ? dragLayer.correctX : dragLayer.x, y: snapped ? dragLayer.correctY : dragLayer.y, snapped },
    ]);
    setDragLayer(null);
  };

 //Reinicia el puzzle con posiciones aleatorias
  const resetPuzzle = () => {
    const base = createPiecesConfig(imgSize.w, imgSize.h, rows, cols);
    const tabs = generateTabs(rows, cols);
    const scaled = base.map((p, i) => ({
      ...p,
      x: p.x * scale,
      y: p.y * scale,
      width: p.width * scale,
      height: p.height * scale,
      correctX: p.correctX * scale,
      correctY: p.correctY * scale,
      tabs: tabs[i],
      snapped: false,
    }));
    setPieces(scaled);
    setDragLayer(null);
    try {
      const key = storageKey + (puzzleIdState ? `_${puzzleIdState}` : "");
      localStorage.removeItem(key);
    } catch {}
    if (puzzleIdState)
      fetch(`/api/puzzle/${puzzleIdState}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: scaled }),
      }).catch(() => {});
  };

//Dibuja una pieza recortando la imagen con un clipPath que usa la forma jigsaw
  const renderPiece = (p) => {
    const tabSize = Math.max(8, Math.min(p.width, p.height) * 0.17);
    const d = pathDFromTabs(p.width, p.height, p.tabs, tabSize);
    const clipId = `clip-${p.id}`;
    return (
      <g key={p.id} transform={`translate(${p.x},${p.y})`}>
        <defs>
          <clipPath id={clipId}>
            <path d={d} />
          </clipPath>
        </defs>
        <image
          href={imageSrc}
          x={-p.correctX}
          y={-p.correctY}
          width={svgWidth}
          height={svgHeight}
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMinYMin slice"
          pointerEvents="none"
        />
        <path d={d} fill="transparent" stroke="#333" strokeWidth={0.5} />
      </g>
    );
  };

//Render del SVG completo: marco, piezas, pieza arrastrada y zonas de interacción
  return (
    <div className="puzzle-wrapper">

  <div className="puzzle-topbar">
    <button className="btn btn-success" onClick={resetPuzzle}>
      Reiniciar
    </button>

    <span className="puzzle-status">
      {allSnapped && !dragLayer
        ? <strong>¡Completado! 🎉</strong>
        : "Arrastra las piezas para encajarlas."}
    </span>
  </div>

  <div className="puzzle-canvas-container">
    <div className="puzzle-canvas">
      <svg
        ref={svgRef}
        width={svgWidth}
        height={svgHeight + 220}
        style={{ background: "#fafafa", touchAction: "none" }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <rect x={0} y={0} width={svgWidth} height={svgHeight} fill="none" stroke="#111" strokeWidth={2} />
        {pieces.map(renderPiece)}
        {dragLayer && renderPiece(dragLayer)}
        {pieces.concat(dragLayer ? [dragLayer] : []).map((p) =>
          !p.snapped ? (
            <rect
              key={`rect-${p.id}`}
              x={p.x}
              y={p.y}
              width={p.width}
              height={p.height}
              fill="transparent"
              pointerEvents="all"
              style={{ cursor: "grab" }}
              onPointerDown={(e) => !dragLayer && handlePointerDown(e, p)}
            />
          ) : null
        )}
      </svg>
    </div>
  </div>

</div>
  );
}
