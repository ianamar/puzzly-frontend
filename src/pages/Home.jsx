// src/pages/Home.jsx
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import CategoryGrid from '../components/CategoryGrid';
import { useNavigate } from 'react-router-dom';
import '../styles/globals.css';

export default function Home() {
  const navigate = useNavigate();

  const handleRandomPuzzle = () => {
    const min = 2;
    const max = 82;
    const randomId = Math.floor(Math.random() * (max - min + 1)) + min;
    navigate(`/puzzle/${randomId}`);
  };

  return (
    <>
      <Navbar />
      <Hero onRandomPuzzle={handleRandomPuzzle} />
      <main>
        <CategoryGrid />
      </main>
    </>
  );
}
