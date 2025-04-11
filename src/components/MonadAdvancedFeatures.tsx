
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { monadGameState } from '@/data/gameData';
import { ShardCommunication, GovernanceProposal, MovesBatch } from '@/types/game';
import { useToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";

// Mock data for advanced features
const mockShardCommunications: ShardCommunication[] = [
  {
    sourceShard: 1,
    targetShard: 2,
    messageType: 'ASSET_TRANSFER',
    payload: '0x7a3b...',
    gasPayment: 0.025,
    status: 'delivered'
  },
  {
    sourceShard: 3,
    targetShard: 1,
    messageType: 'BATTLE_RESULT',
    payload: '0x9c4d...',
    gasPayment: 0.018,
    status: 'pending'
  }
];

const mockGovernanceProposals: GovernanceProposal[] = [
  {
    proposalId: 'prop-1',
    title: 'Card Balance Update',
    description: 'Reduce mana cost of epic cards by 10%',
    proposer: '0xAbCd...EfGh',
    startBlock: 1420500,
    endBlock: 1425500,
    status: 'active',
    votesFor: 15420,
    votesAgainst: 8340,
    affectedGameMechanics: ['CardPricing', 'GameBalance']
  }
];

const mockBatches: MovesBatch[] = [
  {
    batchId: 'batch-1',
    moves: new Array(12).fill(null),
    stateRoot: '0x8d72...',
    zkProof: '0x9f3a...',
    verificationTime: 0.023,
    submittedInBlock: 1420497
  }
];

const MonadAdvancedFeatures: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('zkrollups');
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  
  const handleGenerateProof = () => {
    setIsGeneratingProof(true);
    
    sonnerToast.loading("Generating ZK-proof for moves batch...", {
      id: "zk-proof",
      duration: 3000,
    });
    
    setTimeout(() => {
      setIsGeneratingProof(false);
      sonnerToast.success("ZK-proof generated and verified on-chain", {
        id: "zk-proof",
        description: "12 moves verified in 0.023 seconds"
      });
      
      toast({
        title: "Batch Verification Complete",
        description: "Move batch verified with zero-knowledge proof, saving 94% in gas fees"
      });
    }, 3000);
  };
  
  const handleVote = (support: boolean) => {
    setIsVoting(true);
    
    sonnerToast.loading("Submitting vote to governance contract...", {
      id: "governance-vote",
      duration: 2000,
    });
    
    setTimeout(() => {
      setIsVoting(false);
      sonnerToast.success("Vote recorded on MONAD blockchain", {
        id: "governance-vote",
        description: `You voted ${support ? 'for' : 'against'} proposal 'Card Balance Update'`
      });
    }, 2000);
  };
  
  return (
    <Card className="glassmorphism border-emerald-500/30">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
            MONAD Advanced Features
          </span>
          <div className="ml-2 h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="zkrollups" className="data-[state=active]:bg-emerald-900/40 data-[state=active]:text-emerald-400">
              ZK-Rollups
            </TabsTrigger>
            <TabsTrigger value="sharding" className="data-[state=active]:bg-emerald-900/40 data-[state=active]:text-emerald-400">
              Sharding
            </TabsTrigger>
            <TabsTrigger value="governance" className="data-[state=active]:bg-emerald-900/40 data-[state=active]:text-emerald-400">
              Governance
            </TabsTrigger>
          </TabsList>
          
          {/* ZK-Rollups Tab */}
          <TabsContent value="zkrollups" className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-md">
              <div>
                <p className="text-sm text-emerald-400 font-medium">ZK-Rollup Efficiency</p>
                <p className="text-xs text-gray-400">Bundle multiple moves in a single proof</p>
              </div>
              <div className="text-xl font-bold text-emerald-400">94% <span className="text-xs">gas saved</span></div>
            </div>
            
            <div className="p-3 bg-black/30 rounded-md">
              <p className="text-sm text-white mb-2">Latest Verified Batch</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Batch ID:</span>
                <span className="font-mono text-emerald-400">{mockBatches[0].batchId}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Moves:</span>
                <span>{mockBatches[0].moves.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Verification Time:</span>
                <span>{mockBatches[0].verificationTime.toFixed(3)}s</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Block Height:</span>
                <span>{mockBatches[0].submittedInBlock}</span>
              </div>
            </div>
            
            <Button 
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
              onClick={handleGenerateProof}
              disabled={isGeneratingProof}
            >
              {isGeneratingProof ? "Generating Proof..." : "Generate New Batch Proof"}
            </Button>
          </TabsContent>
          
          {/* Sharding Tab */}
          <TabsContent value="sharding" className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-md">
              <div>
                <p className="text-sm text-emerald-400 font-medium">Shard Status</p>
                <p className="text-xs text-gray-400">Cross-shard communication</p>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-3 w-3 bg-emerald-500 rounded-full"></div>
                <span className="text-xs text-emerald-400">Active</span>
              </div>
            </div>
            
            <div className="p-3 bg-black/30 rounded-md max-h-40 overflow-y-auto">
              <p className="text-sm text-white mb-2">Recent Cross-Shard Messages</p>
              {mockShardCommunications.map((comm, i) => (
                <div key={i} className="p-2 bg-black/20 rounded mb-2 last:mb-0 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Shard {comm.sourceShard} → {comm.targetShard}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      comm.status === 'delivered' ? 'bg-emerald-900/40 text-emerald-400' : 
                      comm.status === 'pending' ? 'bg-amber-900/40 text-amber-400' : 
                      'bg-red-900/40 text-red-400'
                    }`}>
                      {comm.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-emerald-400">{comm.messageType}</span>
                    <span className="text-gray-400">{comm.gasPayment} MONAD</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <Button className="w-full bg-black/30 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/20 text-xs h-auto py-1.5">
                  Shard 1
                </Button>
              </div>
              <div className="col-span-1">
                <Button className="w-full bg-emerald-900/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-900/30 text-xs h-auto py-1.5">
                  Shard 2
                </Button>
              </div>
              <div className="col-span-1">
                <Button className="w-full bg-black/30 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/20 text-xs h-auto py-1.5">
                  Shard 3
                </Button>
              </div>
            </div>
          </TabsContent>
          
          {/* Governance Tab */}
          <TabsContent value="governance" className="space-y-3">
            {mockGovernanceProposals.map((proposal) => (
              <div key={proposal.proposalId} className="p-3 bg-black/30 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-white">{proposal.title}</p>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    proposal.status === 'active' ? 'bg-emerald-900/40 text-emerald-400' : 
                    proposal.status === 'passed' ? 'bg-blue-900/40 text-blue-400' : 
                    proposal.status === 'executed' ? 'bg-purple-900/40 text-purple-400' : 
                    'bg-red-900/40 text-red-400'
                  }`}>
                    {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                  </span>
                </div>
                
                <p className="text-xs text-gray-400 mb-2">{proposal.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>Proposer:</span>
                  <span className="font-mono">{proposal.proposer}</span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <span>Blocks:</span>
                  <span>{proposal.startBlock} - {proposal.endBlock}</span>
                </div>
                
                <div className="w-full bg-black/30 h-1.5 rounded-full mb-3">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
                    style={{ width: `${(proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="text-emerald-400">{proposal.votesFor.toLocaleString()} For</span>
                  <span className="text-gray-400">{((proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100).toFixed(1)}%</span>
                  <span className="text-red-400">{proposal.votesAgainst.toLocaleString()} Against</span>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    className="flex-1 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 text-xs h-auto py-1.5"
                    onClick={() => handleVote(true)}
                    disabled={isVoting}
                  >
                    Vote For
                  </Button>
                  <Button 
                    className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs h-auto py-1.5"
                    onClick={() => handleVote(false)}
                    disabled={isVoting}
                  >
                    Vote Against
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MonadAdvancedFeatures;
