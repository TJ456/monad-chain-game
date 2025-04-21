import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ManaMeter from "@/components/ui/mana-meter";
import ManaCost from "@/components/ui/mana-cost";
import { X, Info, Zap, ArrowRight } from 'lucide-react';

interface ManaGuideProps {
  onClose: () => void;
}

const ManaGuide: React.FC<ManaGuideProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-blue-500/40 p-6 shadow-xl relative overflow-hidden max-w-md mx-auto">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Mana System Guide</h3>
          <p className="text-gray-300 text-sm">Understanding how mana works in the game</p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-between mb-6">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 mx-0.5 rounded-full ${i < step ? 'bg-blue-500' : 'bg-gray-700'}`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="mb-6">
        {step === 1 && (
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-blue-400">What is Mana?</h4>
            <p className="text-gray-300">
              Mana is the energy resource you use to play cards during your turn. Each card costs a specific amount of mana to play.
            </p>
            <div className="bg-black/30 p-4 rounded-lg border border-blue-500/20">
              <ManaMeter currentMana={7} maxMana={10} variant="tech" playerType="player" />
              <p className="text-sm text-gray-400 mt-2">
                This is your mana meter. It shows how much mana you currently have available.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-blue-400">Card Mana Costs</h4>
            <p className="text-gray-300">
              Each card has a mana cost shown in the top corner. You must have enough mana to play a card.
            </p>
            <div className="flex justify-center space-x-6 my-4">
              <div className="text-center">
                <ManaCost cost={2} size="lg" className="mx-auto mb-2" />
                <Badge className="bg-green-600">Affordable</Badge>
              </div>
              <div className="text-center">
                <ManaCost cost={8} size="lg" isAffordable={false} className="mx-auto mb-2" />
                <Badge className="bg-red-600">Too Expensive</Badge>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              Cards with blue mana crystals can be played. Gray mana crystals mean you don't have enough mana.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-blue-400">Mana Regeneration</h4>
            <p className="text-gray-300">
              You start each game with 10 mana. Your mana refreshes at the beginning of each turn.
            </p>
            <div className="bg-black/30 p-4 rounded-lg border border-blue-500/20 space-y-3">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-gray-300">Turn Start: </span>
                <span className="ml-auto text-blue-400 font-bold">10/10 Mana</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-gray-300">After Playing Cards: </span>
                <span className="ml-auto text-blue-400 font-bold">2/10 Mana</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-gray-300">Next Turn: </span>
                <span className="ml-auto text-blue-400 font-bold">10/10 Mana</span>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-blue-400">Strategic Tips</h4>
            <p className="text-gray-300">
              Managing your mana efficiently is key to winning. Here are some tips:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start">
                <ArrowRight className="h-4 w-4 text-blue-400 mt-1 mr-2 flex-shrink-0" />
                <span>Balance your deck with cards of different mana costs</span>
              </li>
              <li className="flex items-start">
                <ArrowRight className="h-4 w-4 text-blue-400 mt-1 mr-2 flex-shrink-0" />
                <span>Consider saving mana for powerful cards or combinations</span>
              </li>
              <li className="flex items-start">
                <ArrowRight className="h-4 w-4 text-blue-400 mt-1 mr-2 flex-shrink-0" />
                <span>Some cards can give you extra mana or reduce costs</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={prevStep}
          disabled={step === 1}
          className="border-blue-500/30 text-blue-400 hover:bg-blue-950/30"
        >
          Previous
        </Button>

        <div className="text-sm text-gray-400">
          {step} of {totalSteps}
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={nextStep}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
        >
          {step === totalSteps ? 'Finish' : 'Next'}
        </Button>
      </div>
    </Card>
  );
};

export default ManaGuide;
