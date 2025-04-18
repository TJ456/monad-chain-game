import { motion } from 'framer-motion';
import ContinuousRotatingCards from './ContinuousRotatingCards';
import { PrimaryButton, SecondaryButton } from './AnimatedButton';
import { Play } from 'lucide-react';
import './ObysStyleIntro.css';

const ObysStyleIntro = () => {

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground">
      <div className="absolute inset-0 grid-pattern" />
      <div className="card-bg-glow" />

      <div className="relative z-10 container mx-auto px-4 h-screen flex flex-col justify-center overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 w-full">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="md:w-1/2"
          >
            <motion.h1
              className="text-6xl md:text-8xl font-bold mb-6 text-glow"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <span className="shimmer-text">MONAD</span> <br />
              <span className="shimmer-text">Chain-Games</span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-gray-300 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              Experience the future of blockchain gaming with true ownership, sub-second finality, and gameplay powered by Monad.
            </motion.p>

            <div className="flex gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <PrimaryButton icon={<Play className="h-4 w-4" />} iconPosition="left" onClick={() => window.location.href = '/game'}>
                  Play Now
                </PrimaryButton>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <SecondaryButton onClick={() => window.location.href = '/marketplace'}>
                  Marketplace
                </SecondaryButton>
              </motion.div>
            </div>
          </motion.div>

          {/* Continuous Rotating Cards Component */}
          <div className="md:w-1/2 flex justify-center items-center">
            <ContinuousRotatingCards />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <div className="text-white text-sm flex flex-col items-center gap-2">
            <span>Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center"
            >
              <motion.div
                animate={{ scale: [1, 0.8, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-1 h-1 bg-white rounded-full"
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ObysStyleIntro;