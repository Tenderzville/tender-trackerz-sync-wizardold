
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Brain, TrendingUp, AlertCircle, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AiEstimateProps {
  tenderId: number;
  showExpanded?: boolean;
}

interface AiAnalysis {
  estimated_value_min: number | null;
  estimated_value_max: number | null;
  win_probability: number | null;
  confidence_score: number | null;
  recommendations: string[] | null;
}

export function AiEstimate({ tenderId, showExpanded = false }: AiEstimateProps) {
  const { data: analysis, isLoading } = useQuery<AiAnalysis | null>({
    queryKey: ["ai-analysis", tenderId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<AiAnalysis>("ai-tender-analysis", {
        body: { tenderId },
      });

      if (error) {
        throw error;
      }

      return data || null;
    },
  });

  if (isLoading) {
    return (
      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700 animate-pulse">
        <div className="h-4 bg-purple-200 dark:bg-purple-800 rounded mb-2"></div>
        <div className="h-3 bg-purple-200 dark:bg-purple-800 rounded w-3/4"></div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getWinProbabilityColor = (probability: number | null) => {
    if (!probability) return "text-gray-500";
    if (probability >= 70) return "text-green-600 dark:text-green-400";
    if (probability >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getConfidenceLevel = (score: number | null) => {
    if (!score) return { label: "Unknown", color: "text-gray-600" };
    if (score >= 90) return { label: "Very High", color: "text-green-600" };
    if (score >= 70) return { label: "High", color: "text-blue-600" };
    if (score >= 50) return { label: "Medium", color: "text-yellow-600" };
    return { label: "Low", color: "text-red-600" };
  };

  const confidence = getConfidenceLevel(analysis.confidence_score);

  if (!showExpanded) {
    return (
      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
        <div className="flex items-center space-x-2 mb-1">
          <Brain className="h-4 w-4 text-purple-500" />
          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
            AI Estimate
          </span>
          <Badge variant="outline" className="text-xs border-purple-300 text-purple-600">
            {confidence.label} confidence
          </Badge>
        </div>
        <p className="text-sm text-purple-700 dark:text-purple-300">
          Estimated winning bid: 
          <span className="font-semibold ml-1">
             {formatCurrency(analysis.estimated_value_min)} - {formatCurrency(analysis.estimated_value_max)}
          </span>
          <span className="mx-2">•</span>
          Win probability: 
           <span className={`font-semibold ml-1 ${getWinProbabilityColor(analysis.win_probability)}`}>
             {analysis.win_probability || 0}%
          </span>
        </p>
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                AI Analysis
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Based on historical tender data
              </p>
            </div>
          </div>
          <Badge className={`${confidence.color} bg-white dark:bg-slate-800`}>
            {confidence.label} Confidence
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Estimated Range</span>
            </div>
            <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
              {formatCurrency(analysis.estimated_value_min)} - {formatCurrency(analysis.estimated_value_max)}
            </p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Win Probability</span>
            </div>
             <p className={`text-lg font-bold ${getWinProbabilityColor(analysis.win_probability)}`}>
               {analysis.win_probability || 0}%
            </p>
          </div>
        </div>

        {/* Recommendations */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">AI Recommendations</span>
            </div>
            <div className="space-y-2">
              {analysis.recommendations.slice(0, 3).map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" className="text-purple-600 border-purple-300">
            View Full Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
