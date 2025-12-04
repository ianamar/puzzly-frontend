import { Link } from "react-router-dom";
import "../styles/globals.css";

const categories = [
  { name: "Animales", image: "/images/animales/gato.jpg" },
  { name: "Fantasía", image: "/images/fantasia/unicornio.jpg" },
  { name: "Naturaleza", image: "/images/naturaleza/montanas.jpg" },
  { name: "Ciudades", image: "/images/ciudades/moscu.jpg" },
  { name: "Arte", image: "/images/arte/cipreses.jpg" },
  { name: "Comida", image: "/images/comida/helado.jpg" },
  { name: "Fiestas", image: "/images/fiestas/navidad.jpg" },
  { name: "Flores", image: "/images/flores/lirios.jpg" },
  { name: "Difíciles", image: "/images/dificiles/especias.jpg" },
];

export default function CategoryGrid() {
  return (
    <section className="categories-section">
      <div className="container categories-container">
        <h2 className="section-title">Categorías</h2>
        <p className="section-sub">Explora puzzles por temática</p>

        <div className="categories-grid" role="list">
          {categories.map(({ name, image, color }) => {
            //slug seguro (ej. "Fantasía" → "fantasia")
            const slug = name
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/\s+/g, "-");

            const style = image
              ? {
                  backgroundImage: `url(${image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : { backgroundColor: color };

            return (
              <Link
                key={name}
                to={`/categoria/${slug}`}
                className={`category-tile ${slug}`}
                style={style}
                role="listitem"
                aria-label={`Categoría ${name}`}
              >
                <span className="category-name">{name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
