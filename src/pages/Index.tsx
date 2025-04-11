
import React from 'react';
import Navigation from '@/components/Navigation';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import ParallelExecutionBattles from '@/components/ParallelExecutionBattles';
import MonadBoostMechanic from '@/components/MonadBoostMechanic';
import ChainReactionCards from '@/components/ChainReactionCards';
import BurnToEvolve from '@/components/BurnToEvolve';
import LiveBettingPool from '@/components/LiveBettingPool';
import { currentPlayer } from '@/data/gameData';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Shield, Zap, Repeat, Award, Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto pt-24 px-4 md:px-0 pb-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
              MONDO
            </span>
            <span className="text-white">Chain Games</span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Experience the future of blockchain gaming with true ownership, 
            sub-second finality, and gameplay powered by Monad.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-lg px-8 py-6"
              onClick={() => navigate('/game')}
            >
              Play Now
            </Button>
            
            <Button 
              variant="outline" 
              className="border-emerald-500/50 text-emerald-400 text-lg px-8 py-6"
              onClick={() => navigate('/marketplace')}
            >
              Marketplace
            </Button>
          </div>
        </div>
        
        {/* Features Section */}
        <h2 className="text-3xl font-bold text-white mb-8">
          Monad-Exclusive Features
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <ParallelExecutionBattles />
          <ChainReactionCards />
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <MonadBoostMechanic playerMonad={currentPlayer.monad} />
          <BurnToEvolve />
          <LiveBettingPool />
        </div>
        
        {/* How to Play Section - NEW */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">
            How to Play
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card className="bg-black/40 border border-emerald-500/20">
              <CardContent className="pt-6">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Play className="h-6 w-6 text-emerald-400 mr-2" />
                  Game Basics
                </h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="bg-emerald-500/20 text-emerald-400 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-1">1</span>
                    <span>Choose cards from your collection to build a deck</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-emerald-500/20 text-emerald-400 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-1">2</span>
                    <span>Each player starts with 20 health points and 10 mana</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-emerald-500/20 text-emerald-400 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-1">3</span>
                    <span>Play cards by spending mana during your turn</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-emerald-500/20 text-emerald-400 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-1">4</span>
                    <span>Reduce your opponent's health to zero to win</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-black/40 border border-emerald-500/20">
              <CardContent className="pt-6">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Shield className="h-6 w-6 text-emerald-400 mr-2" />
                  Card Types
                </h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="bg-emerald-500/20 text-emerald-400 rounded-full px-2 py-0.5 text-xs mr-2">Attack</span>
                    <span>Deal damage to your opponent's health</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-emerald-500/20 text-emerald-400 rounded-full px-2 py-0.5 text-xs mr-2">Defense</span>
                    <span>Restore your health points or create shields</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-emerald-500/20 text-emerald-400 rounded-full px-2 py-0.5 text-xs mr-2">Utility</span>
                    <span>Special effects that manipulate the game state</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="advanced-mechanics" className="border-emerald-500/20">
              <AccordionTrigger className="text-xl font-bold text-white hover:text-emerald-400 hover:no-underline">
                <span className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Advanced Mechanics
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                <div className="grid md:grid-cols-3 gap-6 mt-4">
                  <div className="bg-black/30 p-4 rounded-lg border border-emerald-500/10">
                    <h4 className="text-lg font-bold text-white mb-2 flex items-center">
                      <Repeat className="h-4 w-4 text-emerald-400 mr-2" />
                      Chain Reactions
                    </h4>
                    <p className="text-sm">
                      Some cards trigger on-chain effects that cascade into additional actions, creating powerful combos when played strategically.
                    </p>
                  </div>
                  
                  <div className="bg-black/30 p-4 rounded-lg border border-emerald-500/10">
                    <h4 className="text-lg font-bold text-white mb-2 flex items-center">
                      <Sparkles className="h-4 w-4 text-emerald-400 mr-2" />
                      Monad Boost
                    </h4>
                    <p className="text-sm">
                      Stake your MONAD tokens during battle to temporarily amplify your card's power, creating game-changing moments.
                    </p>
                  </div>
                  
                  <div className="bg-black/30 p-4 rounded-lg border border-emerald-500/10">
                    <h4 className="text-lg font-bold text-white mb-2 flex items-center">
                      <Award className="h-4 w-4 text-emerald-400 mr-2" />
                      Card Evolution
                    </h4>
                    <p className="text-sm">
                      Burn two cards of the same rarity to evolve them into a more powerful card with enhanced abilities and value.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="rewards-economy" className="border-emerald-500/20">
              <AccordionTrigger className="text-xl font-bold text-white hover:text-emerald-400 hover:no-underline">
                <span className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Rewards & Economy
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                <ul className="space-y-3 mt-4">
                  <li className="flex items-start">
                    <span className="bg-emerald-500/20 text-emerald-400 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-1">•</span>
                    <span>Win battles to earn MONAD tokens and rare cards</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-emerald-500/20 text-emerald-400 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-1">•</span>
                    <span>Trade cards with other players through the marketplace</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-emerald-500/20 text-emerald-400 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-1">•</span>
                    <span>Bet on other players' matches to earn additional rewards</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-emerald-500/20 text-emerald-400 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-1">•</span>
                    <span>Participate in tournaments for exclusive prizes and recognition</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        {/* Technical Showcase */}
        <div className="bg-black/40 border border-emerald-500/20 rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Technical Excellence</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-black/30 p-4 rounded-lg border border-emerald-500/20">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Sub-Second Finality</h3>
              <p className="text-gray-400">
                Monad's high performance blockchain enables instant gameplay with on-chain transactions that finalize in milliseconds.
              </p>
            </div>
            
            <div className="bg-black/30 p-4 rounded-lg border border-emerald-500/20">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">True Ownership</h3>
              <p className="text-gray-400">
                Every card is an on-chain asset, giving players verifiable ownership and the ability to trade, evolve, and monetize.
              </p>
            </div>
            
            <div className="bg-black/30 p-4 rounded-lg border border-emerald-500/20">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Deflationary Economics</h3>
              <p className="text-gray-400">
                Our burn-to-evolve system creates a sustainable economy where cards gain value over time through built-in scarcity.
              </p>
            </div>
          </div>
        </div>
        
        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Experience True On-Chain Gaming?</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Join thousands of players already battling on the Monad blockchain.
          </p>
          
          <Button 
            className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-lg px-8 py-6"
            onClick={() => navigate('/game')}
          >
            Start Playing Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
