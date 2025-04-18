import React from 'react';
import Navigation from '@/components/Navigation';
import AnimatedButton, { 
  PrimaryButton, 
  SecondaryButton, 
  GhostButton, 
  DangerButton,
  PlayButton,
  ExternalLinkButton
} from '@/components/AnimatedButton';
import { ArrowRight, Download, ExternalLink, Mail, Play, Plus, Trash } from 'lucide-react';

const ButtonDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto pt-24 px-4 md:px-0 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Premium Button Animations</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            A showcase of elegant, premium-feel hover animations for buttons to elevate user interaction.
          </p>
        </div>
        
        {/* Individual Animation Types */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Animation Types</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-black/30 p-6 rounded-lg border border-purple-500/20 flex flex-col items-center">
              <h3 className="text-xl font-bold text-white mb-4">Slide-In Glow</h3>
              <p className="text-gray-300 mb-6 text-center">
                A soft glowing border animates from left to right on hover.
              </p>
              <AnimatedButton animation="glow">
                Hover Me
              </AnimatedButton>
            </div>
            
            <div className="bg-black/30 p-6 rounded-lg border border-purple-500/20 flex flex-col items-center">
              <h3 className="text-xl font-bold text-white mb-4">Lift on Hover</h3>
              <p className="text-gray-300 mb-6 text-center">
                Button lifts upward with a soft shadow on hover.
              </p>
              <AnimatedButton animation="lift">
                Hover Me
              </AnimatedButton>
            </div>
            
            <div className="bg-black/30 p-6 rounded-lg border border-purple-500/20 flex flex-col items-center">
              <h3 className="text-xl font-bold text-white mb-4">Gradient Sweep</h3>
              <p className="text-gray-300 mb-6 text-center">
                A gradient animation sweeps across the button on hover.
              </p>
              <AnimatedButton animation="gradient">
                Hover Me
              </AnimatedButton>
            </div>
            
            <div className="bg-black/30 p-6 rounded-lg border border-purple-500/20 flex flex-col items-center">
              <h3 className="text-xl font-bold text-white mb-4">Icon Slide</h3>
              <p className="text-gray-300 mb-6 text-center">
                Icon slides in from the side while text shifts slightly.
              </p>
              <AnimatedButton animation="icon-slide" icon={<ArrowRight className="h-4 w-4" />}>
                Hover Me
              </AnimatedButton>
            </div>
            
            <div className="bg-black/30 p-6 rounded-lg border border-purple-500/20 flex flex-col items-center">
              <h3 className="text-xl font-bold text-white mb-4">Shimmer Effect</h3>
              <p className="text-gray-300 mb-6 text-center">
                A shine or shimmer passes over the button on hover.
              </p>
              <AnimatedButton animation="shimmer">
                Hover Me
              </AnimatedButton>
            </div>
            
            <div className="bg-black/30 p-6 rounded-lg border border-purple-500/20 flex flex-col items-center">
              <h3 className="text-xl font-bold text-white mb-4">Combined Effects</h3>
              <p className="text-gray-300 mb-6 text-center">
                Multiple effects combined for maximum impact.
              </p>
              <AnimatedButton animation="cta-primary">
                Hover Me
              </AnimatedButton>
            </div>
          </div>
        </div>
        
        {/* Button Variants */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Button Variants</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-black/30 p-6 rounded-lg border border-purple-500/20">
              <h3 className="text-xl font-bold text-white mb-4 text-center">Primary Actions</h3>
              <div className="flex flex-wrap gap-4 justify-center">
                <PrimaryButton>Get Started</PrimaryButton>
                <PrimaryButton icon={<Play className="h-4 w-4" />} iconPosition="left">
                  Play Demo
                </PrimaryButton>
                <PrimaryButton icon={<Download className="h-4 w-4" />} iconPosition="left">
                  Download
                </PrimaryButton>
              </div>
            </div>
            
            <div className="bg-black/30 p-6 rounded-lg border border-purple-500/20">
              <h3 className="text-xl font-bold text-white mb-4 text-center">Secondary Actions</h3>
              <div className="flex flex-wrap gap-4 justify-center">
                <SecondaryButton>Learn More</SecondaryButton>
                <SecondaryButton icon={<ExternalLink className="h-4 w-4" />}>
                  Visit Website
                </SecondaryButton>
                <SecondaryButton icon={<Mail className="h-4 w-4" />} iconPosition="left">
                  Contact Us
                </SecondaryButton>
              </div>
            </div>
            
            <div className="bg-black/30 p-6 rounded-lg border border-purple-500/20">
              <h3 className="text-xl font-bold text-white mb-4 text-center">Ghost & Utility Buttons</h3>
              <div className="flex flex-wrap gap-4 justify-center">
                <GhostButton>Settings</GhostButton>
                <GhostButton icon={<Plus className="h-4 w-4" />} iconPosition="left">
                  Add New
                </GhostButton>
                <PlayButton>Watch Video</PlayButton>
              </div>
            </div>
            
            <div className="bg-black/30 p-6 rounded-lg border border-purple-500/20">
              <h3 className="text-xl font-bold text-white mb-4 text-center">Danger & External Actions</h3>
              <div className="flex flex-wrap gap-4 justify-center">
                <DangerButton icon={<Trash className="h-4 w-4" />} iconPosition="left">
                  Delete Account
                </DangerButton>
                <ExternalLinkButton>External Link</ExternalLinkButton>
                <AnimatedButton animation="shimmer" className="bg-emerald-600 hover:bg-emerald-700">
                  Confirm
                </AnimatedButton>
              </div>
            </div>
          </div>
        </div>
        
        {/* Call to Action Section */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold text-white mb-6">Ready to Implement?</h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            These premium button animations can be easily integrated into your existing UI to create a more engaging and polished user experience.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <PrimaryButton>Get Started</PrimaryButton>
            <SecondaryButton>Learn More</SecondaryButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ButtonDemo;
