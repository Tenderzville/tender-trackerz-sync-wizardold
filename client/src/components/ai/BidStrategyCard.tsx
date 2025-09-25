import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  Target, 
  TrendingUp, 
  DollarSign, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Shield,
  Lightbulb
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BidStrategyCardProps {
  tenderId: number;
}

interface BidStrategy {
  optimal_bid_amount: number;
  win_probability: number;
  profit_margin: number;
  risk_assessment: string;
  key_differentiators: string[];
  pricing_strategy: string;
  execution_timeline: string[];
  competitive_advantages: string[];
  potential_risks: string[];
  mitigation_strategies: string[];
}

export function BidStrategyCard({ tenderId }: BidStrategyCardProps) {
  const { toast } = useToast();
  const [strategy, setStrategy] = useState<BidStrategy | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [capabilities, setCapabilities] = useState('');
  const [historicalWinRate, setHistoricalWinRate] = useState(70);
  const [targetProfitMargin, setTargetProfitMargin] = useState(15);

  const generateStrategy = async () => {
    setIsGenerating(true);
    try {
      const capabilityList = capabilities.split(',').map(c => c.trim()).filter(Boolean);
      
      const { data, error } = await supabase.functions.invoke('bid-strategy-optimizer', {
        body: { 
          tenderId, 
          companyCapabilities: capabilityList,
          historicalWinRate,
          targetProfitMargin
        }
      });

      if (error) throw error;

      setStrategy(data);
      toast({
        title: "Strategy Generated",
        description: "Bid strategy has been optimized successfully.",
      });
    } catch (error) {
      console.error('Error generating strategy:', error);
      toast({
        title: "Strategy Failed",
        description: error instanceof Error ? error.message : "Failed to generate strategy",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low risk': return 'text-green-600';
      case 'medium risk': return 'text-yellow-600';
      case 'high risk': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Bid Strategy Optimizer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!strategy ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="capabilities">Company Capabilities (comma-separated)</Label>
              <Textarea
                id="capabilities"
                placeholder="e.g., technical expertise, local presence, ISO certification, sustainability, innovation"
                value={capabilities}
                onChange={(e) => setCapabilities(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="winRate">Historical Win Rate (%)</Label>
                <Input
                  id="winRate"
                  type="number"
                  min="0"
                  max="100"
                  value={historicalWinRate}
                  onChange={(e) => setHistoricalWinRate(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profitMargin">Target Profit Margin (%)</Label>
                <Input
                  id="profitMargin"
                  type="number"
                  min="0"
                  max="50"
                  value={targetProfitMargin}
                  onChange={(e) => setTargetProfitMargin(Number(e.target.value))}
                />
              </div>
            </div>

            <Button onClick={generateStrategy} disabled={isGenerating} className="w-full">
              {isGenerating ? 'Generating Strategy...' : 'Generate Bid Strategy'}
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="execution">Execution</TabsTrigger>
              <TabsTrigger value="risks">Risks</TabsTrigger>
              <TabsTrigger value="competitive">Competitive</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Optimal Bid</span>
                    </div>
                    <div className="text-xl font-bold text-green-600">
                      {formatCurrency(strategy.optimal_bid_amount)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Win Probability</span>
                    </div>
                    <div className="text-xl font-bold text-blue-600">
                      {strategy.win_probability}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Profit Margin</span>
                    </div>
                    <div className="text-xl font-bold text-purple-600">
                      {strategy.profit_margin}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <h4 className="font-medium">Risk Assessment</h4>
                  </div>
                  <Badge className={getRiskColor(strategy.risk_assessment)}>
                    {strategy.risk_assessment}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Pricing Strategy</h4>
                  <p className="text-sm text-muted-foreground">{strategy.pricing_strategy}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Key Differentiators</h4>
                  <div className="space-y-2">
                    {strategy.key_differentiators.map((diff, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <span className="text-sm">{diff}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => setStrategy(null)} 
                variant="outline" 
                className="w-full"
              >
                Generate New Strategy
              </Button>
            </TabsContent>

            <TabsContent value="execution" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Execution Timeline</h4>
              </div>
              
              <div className="space-y-3">
                {strategy.execution_timeline.map((phase, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <p className="text-sm flex-1">{phase}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="risks" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h4 className="font-medium">Potential Risks</h4>
                  </div>
                  <div className="space-y-2">
                    {strategy.potential_risks.map((risk, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                        <span className="text-sm">{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium">Mitigation Strategies</h4>
                  </div>
                  <div className="space-y-2">
                    {strategy.mitigation_strategies.map((mitigation, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                        <span className="text-sm">{mitigation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="competitive" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Competitive Advantages</h4>
              </div>
              
              <div className="space-y-3">
                {strategy.competitive_advantages.map((advantage, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <p className="text-sm flex-1">{advantage}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}