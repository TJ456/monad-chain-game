import React from 'react';
import Navigation from '@/components/Navigation';
import HorizontalCardLayout from '@/components/HorizontalCardLayout';

const CardLayoutDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto pt-24 px-4 md:px-0 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">3D Card Layout</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            A horizontal 3-card UI layout with sleek 3D rotation animations.
          </p>
        </div>
        
        <HorizontalCardLayout />
        
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Features</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-black/30 p-6 rounded-lg border border-purple-500/20">
              <h3 className="text-xl font-bold text-white mb-2">3D Perspective</h3>
              <p className="text-gray-300">
                Cards are arranged with a light 3D perspective to give the layout depth.
              </p>
            </div>
            <div className="bg-black/30 p-6 rounded-lg border border-purple-500/20">
              <h3 className="text-xl font-bold text-white mb-2">Smooth Animations</h3>
              <p className="text-gray-300">
                Each card rotates individually on hover with a smooth, elastic animation.
              </p>
            </div>
            <div className="bg-black/30 p-6 rounded-lg border border-purple-500/20">
              <h3 className="text-xl font-bold text-white mb-2">Responsive Design</h3>
              <p className="text-gray-300">
                The layout adapts to different screen sizes while maintaining the 3D effect.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardLayoutDemo;
