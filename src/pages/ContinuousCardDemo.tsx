import React from 'react';
import Navigation from '@/components/Navigation';
import ContinuousRotatingCards from '@/components/ContinuousRotatingCards';

const ContinuousCardDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto pt-24 px-4 md:px-0 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Continuous 3D Rotating Cards</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Cards that continuously rotate in 3D space, similar to the reference video.
          </p>
        </div>
        
        <ContinuousRotatingCards />
        
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Features</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-black/30 p-6 rounded-lg border border-purple-500/20">
              <h3 className="text-xl font-bold text-white mb-2">Continuous Rotation</h3>
              <p className="text-gray-300">
                Cards rotate automatically in a circular 3D path with smooth transitions.
              </p>
            </div>
            <div className="bg-black/30 p-6 rounded-lg border border-purple-500/20">
              <h3 className="text-xl font-bold text-white mb-2">Pause on Hover</h3>
              <p className="text-gray-300">
                Hover over any card to pause its rotation and examine its details.
              </p>
            </div>
            <div className="bg-black/30 p-6 rounded-lg border border-purple-500/20">
              <h3 className="text-xl font-bold text-white mb-2">3D Perspective</h3>
              <p className="text-gray-300">
                True 3D rotation with proper perspective and z-index management.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContinuousCardDemo;
