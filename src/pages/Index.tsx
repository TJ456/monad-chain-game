import React, { useRef, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { useNavigate } from 'react-router-dom';
import ParallelExecutionBattles from '@/components/ParallelExecutionBattles';
import ChainReactionCards from '@/components/ChainReactionCards';
import BurnToEvolve from '@/components/BurnToEvolve';
import LiveBettingPool from '@/components/LiveBettingPool';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Shield, Zap, Repeat, Award, Sparkles } from "lucide-react";
import ObysStyleIntro from '@/components/ObysStyleIntro';
import { PrimaryButton } from '@/components/AnimatedButton';
import { motion, useInView } from 'framer-motion';
import '@/components/animations.css';
import '@/components/ButtonAnimations.css';

const Index = () => {
  const navigate = useNavigate();
  const featuresHeadingRef = useRef(null);
  const firstGridRef = useRef(null);
  const secondGridRef = useRef(null);
  const howToPlayRef = useRef(null);
  const technicalExcellenceRef = useRef(null);
  const advancedMechanicsRef = useRef(null);

  const isHeadingInView = useInView(featuresHeadingRef, { once: true, margin: "-100px 0px" });
  const isFirstGridInView = useInView(firstGridRef, { once: true, margin: "-100px 0px" });
  const isSecondGridInView = useInView(secondGridRef, { once: true, margin: "-100px 0px" });
  const isHowToPlayInView = useInView(howToPlayRef, { once: true, margin: "-100px 0px" });
  const isTechnicalExcellenceInView = useInView(technicalExcellenceRef, { once: true, margin: "-100px 0px" });
  const isAdvancedMechanicsInView = useInView(advancedMechanicsRef, { once: true, margin: "-100px 0px" });

  // Function to handle accordion open/close to trigger animations
  const handleAccordionValueChange = (value: string) => {
    if (value === "advanced-mechanics") {
      // Reset animations by removing and re-adding classes
      const boxes = document.querySelectorAll('.animate-drop');
      boxes.forEach(box => {
        box.classList.remove('opacity-0');
      });
    }

    if (value === "rewards-economy") {
      // Trigger rewards items animation
      setTimeout(() => {
        const rewardsItems = document.querySelectorAll('.rewards-item');
        rewardsItems.forEach((item, index) => {
          setTimeout(() => {
            item.classList.add('visible');
          }, index * 100);
        });
      }, 100);
    }
  };

  // Effect to trigger animations when the Advanced Mechanics section is in view
  useEffect(() => {
    if (isAdvancedMechanicsInView) {
      setTimeout(() => {
        const boxes = document.querySelectorAll('.animate-drop');
        boxes.forEach(box => {
          box.classList.remove('opacity-0');
        });
      }, 300); // Small delay to ensure the accordion is visible
    }
  }, [isAdvancedMechanicsInView]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <ObysStyleIntro />

      <div className="container mx-auto pt-24 px-4 md:px-0 pb-16">
        {/* Features Section */}
        <div ref={featuresHeadingRef} className="overflow-hidden mb-8">
          <motion.h2
            className="text-3xl font-bold text-white relative inline-block"
            initial={{ opacity: 0, x: -100 }}
            animate={isHeadingInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -100 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <span className="relative z-10">Monad-Exclusive Features</span>
            <motion.span
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500"
              initial={{ width: 0 }}
              animate={isHeadingInView ? { width: '100%' } : { width: 0 }}
              transition={{ duration: 1, ease: "easeInOut", delay: 0.4 }}
            />
          </motion.h2>
        </div>

        <div ref={firstGridRef} className="grid md:grid-cols-2 gap-8 mb-16 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={isFirstGridInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -100 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="transform-gpu"
          >
            <ParallelExecutionBattles />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={isFirstGridInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }}
            transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
            className="transform-gpu"
          >
            <ChainReactionCards />
          </motion.div>
        </div>

        <div ref={secondGridRef} className="grid md:grid-cols-2 gap-8 mb-16 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={isSecondGridInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -100 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="transform-gpu"
          >
            <BurnToEvolve />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={isSecondGridInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }}
            transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
            className="transform-gpu"
          >
            <LiveBettingPool />
          </motion.div>
        </div>

        {/* How to Play Section - NEW */}
        <div className="mb-16">
          <div ref={howToPlayRef} className="overflow-hidden mb-8">
            <motion.h2
              className="text-3xl font-bold text-white relative inline-block"
              initial={{ opacity: 0, x: -100 }}
              animate={isHowToPlayInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -100 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <span className="relative z-10">How to Play</span>
              <motion.span
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-400 to-blue-500"
                initial={{ width: 0 }}
                animate={isHowToPlayInView ? { width: '100%' } : { width: 0 }}
                transition={{ duration: 1, ease: "easeInOut", delay: 0.4 }}
              />
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={isHowToPlayInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
              className="transform-gpu"
            >
              <Card className="bg-black/40 border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 card-3d-hover h-full">
                <CardContent className="pt-6 h-full flex flex-col">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Play className="h-6 w-6 text-emerald-400 mr-2" />
                  Game Basics
                </h3>
                <ul className="space-y-3 text-gray-300 flex-grow">
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={isHowToPlayInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.8, ease: "easeInOut", delay: 0.4 }}
              className="transform-gpu"
            >
              <Card className="bg-black/40 border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 card-3d-hover h-full">
                <CardContent className="pt-6 h-full flex flex-col">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Shield className="h-6 w-6 text-emerald-400 mr-2" />
                  Card Types
                </h3>
                <ul className="space-y-3 text-gray-300 flex-grow">
                  <li className="flex items-start">
                    <span className="bg-emerald-500/20 text-emerald-400 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-1">1</span>
                    <span>Attack: Deal damage to your opponent's health</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-emerald-500/20 text-emerald-400 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-1">2</span>
                    <span>Defense: Restore your health points or create shields</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-emerald-500/20 text-emerald-400 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-1">3</span>
                    <span>Utility: Special effects that manipulate the game state</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-emerald-500/20 text-emerald-400 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-1">4</span>
                    <span>Legendary: Rare cards with powerful unique abilities</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            </motion.div>
          </div>

          <Accordion type="single" collapsible className="w-full" onValueChange={handleAccordionValueChange}>
            <AccordionItem value="advanced-mechanics" className="border-emerald-500/20">
              <AccordionTrigger className="text-xl font-bold text-white hover:text-emerald-400 hover:no-underline">
                <span className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Advanced Mechanics
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                <div ref={advancedMechanicsRef} className="grid md:grid-cols-3 gap-6 mt-4 overflow-hidden">
                  <div className="opacity-0 bg-black/30 p-4 rounded-lg border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 card-3d-hover animate-drop">

                    <h4 className="text-lg font-bold text-white mb-2 flex items-center">
                      <Repeat className="h-4 w-4 text-emerald-400 mr-2" />
                      Chain Reactions
                    </h4>
                    <p className="text-sm">
                      Some cards trigger on-chain effects that cascade into additional actions, creating powerful combos when played strategically.
                    </p>
                  </div>

                  <div className="opacity-0 bg-black/30 p-4 rounded-lg border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 card-3d-hover animate-drop animate-drop-delay-200">

                    <h4 className="text-lg font-bold text-white mb-2 flex items-center">
                      <Sparkles className="h-4 w-4 text-emerald-400 mr-2" />
                      Monad Boost
                    </h4>
                    <p className="text-sm">
                      Stake your MONAD tokens during battle to temporarily amplify your card's power, creating game-changing moments.
                    </p>
                  </div>

                  <div className="opacity-0 bg-black/30 p-4 rounded-lg border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 card-3d-hover animate-drop animate-drop-delay-400">

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
                <div className="rewards-economy-container">
                  <ul className="space-y-4 mt-4" id="rewards-list">
                    <li className="flex items-start rewards-item" style={{transitionDelay: '0.1s'}}>
                      <span className="bg-emerald-500/20 text-emerald-400 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-1 rewards-item-icon">•</span>
                      <span>Win battles to earn MONAD tokens and rare cards</span>
                    </li>
                    <li className="flex items-start rewards-item" style={{transitionDelay: '0.2s'}}>
                      <span className="bg-emerald-500/20 text-emerald-400 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-1 rewards-item-icon">•</span>
                      <span>Trade cards with other players through the marketplace</span>
                    </li>
                    <li className="flex items-start rewards-item" style={{transitionDelay: '0.3s'}}>
                      <span className="bg-emerald-500/20 text-emerald-400 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-1 rewards-item-icon">•</span>
                      <span>Bet on other players' matches to earn additional rewards</span>
                    </li>
                    <li className="flex items-start rewards-item" style={{transitionDelay: '0.4s'}}>
                      <span className="bg-emerald-500/20 text-emerald-400 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-1 rewards-item-icon">•</span>
                      <span>Participate in tournaments for exclusive prizes and recognition</span>
                    </li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Technical Showcase */}
        <div ref={technicalExcellenceRef} className="bg-black/40 border border-emerald-500/20 rounded-lg p-8 mb-16 overflow-hidden">
          <motion.h2
            className="text-3xl font-bold text-white mb-4 relative inline-block"
            initial={{ opacity: 0, y: -20 }}
            animate={isTechnicalExcellenceInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            Technical Excellence
            <motion.span
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500"
              initial={{ width: 0 }}
              animate={isTechnicalExcellenceInView ? { width: '100%' } : { width: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut", delay: 0.3 }}
            />
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8 overflow-hidden">
            <motion.div
              className="bg-black/30 p-4 rounded-lg border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 card-3d-hover"
              initial={{ opacity: 0, x: -50 }}
              animate={isTechnicalExcellenceInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
              transition={{ duration: 0.7, ease: "easeInOut", delay: 0.1 }}
            >
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Sub-Second Finality</h3>
              <p className="text-gray-400">
                Monad's high performance blockchain enables instant gameplay with on-chain transactions that finalize in milliseconds.
              </p>
            </motion.div>

            <motion.div
              className="bg-black/30 p-4 rounded-lg border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 card-3d-hover"
              initial={{ opacity: 0, y: 50 }}
              animate={isTechnicalExcellenceInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.7, ease: "easeInOut", delay: 0.2 }}
            >
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">True Ownership</h3>
              <p className="text-gray-400">
                Every card is an on-chain asset, giving players verifiable ownership and the ability to trade, evolve, and monetize.
              </p>
            </motion.div>

            <motion.div
              className="bg-black/30 p-4 rounded-lg border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 card-3d-hover"
              initial={{ opacity: 0, x: 50 }}
              animate={isTechnicalExcellenceInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
              transition={{ duration: 0.7, ease: "easeInOut", delay: 0.3 }}
            >
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Deflationary Economics</h3>
              <p className="text-gray-400">
                Our burn-to-evolve system creates a sustainable economy where cards gain value over time through built-in scarcity.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center relative cta-section overflow-hidden py-16">
          {/* Background animation elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="particles-container">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="particle"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    width: `${Math.random() * 10 + 5}px`,
                    height: `${Math.random() * 10 + 5}px`,
                    opacity: Math.random() * 0.5 + 0.3
                  }}
                />
              ))}
            </div>
            <div className="glow-circle"></div>
          </div>

          {/* Content with animations */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, margin: "-100px" }}
            className="relative z-10"
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-white mb-6 cta-heading"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              Ready to Experience <span className="text-gradient">True On-Chain Gaming?</span>
            </motion.h2>

            <motion.p
              className="text-xl text-gray-300 max-w-3xl mx-auto mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              Join thousands of players already battling on the Monad blockchain.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
              className="cta-button-container"
            >
              <PrimaryButton
                className="text-lg px-10 py-6 cta-button"
                onClick={() => navigate('/game')}
              >
                Start Playing Now
              </PrimaryButton>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Index;