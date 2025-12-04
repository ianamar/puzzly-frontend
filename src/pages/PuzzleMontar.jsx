import React from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Puzzle from '../components/Puzzle'; 

export default function PuzzleMontar() {
  const { id } = useParams();

  return (
    <>
      <Navbar />
      <main style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 980 }}>
          <Puzzle puzzleId={id} storageKey="puzzle_state_v1" />
        </div>
      </main>
    </>
  );
}
