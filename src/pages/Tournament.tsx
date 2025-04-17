import React from 'react';
import Navigation from '@/components/Navigation';
import TournamentManager from '@/components/TournamentManager';

const Tournament = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-indigo-950">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <TournamentManager />
      </div>
    </div>
  );
};

export default Tournament;