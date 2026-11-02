import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building, 
  MapPin, 
  Calendar, 
  FileText, 
  Users, 
  ExternalLink, 
  Phone, 
  Mail,
  AlertTriangle,
  TrendingUp,
  Target,
  Loader2,
  Brain,
  ChevronRight,
  Shield,
  Clock,
  DollarSign
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BidReadinessPanel } from "./bid-readiness";

interface TenderDetailsModalProps {
  tenderId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AiAnalysis {
  recommendations: string[];
  reasoning: string;
  bidStrategy?: {
    timingAdvice?: string;
    keySuccessFactors?: string[];
  };
}

export function TenderDetailsModal({ tenderId, open, onOpenChange }: TenderDetailsModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch tender details
  const { data: tender, isLoading: tenderLoading } = useQuery({
    queryKey: ["tender-details", tenderId],
    queryFn: async () => {
      if (!tenderId) return null;
      const { data, error } = await supabase
        .from("tenders")
        .select("*")
        .eq("id", tenderId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!tenderId && open,
  });

  // Fetch or generate AI analysis
  const { data: aiAnalysis, isLoading: analysisLoading, refetch: refetchAnalysis } = useQuery({
    queryKey: ["tender-ai-analysis", tenderId],
    queryFn: async () => {
      if (!tenderId || !tender) return null;
      
      setIsAnalyzing(true);
      try {
        // Call the AI analysis edge function
        const { data, error } = await supabase.functions.invoke('ai-tender-intelligence', {
          body: { 
            tender: {
              id: tender.id,
              title: tender.title,
              description: tender.description,
              organization: tender.organization,
              category: tender.category,
              location: tender.location,
              budgetEstimate: tender.budget_estimate,
              deadline: tender.deadline,
              requirements: tender.requirements,
            }
          }
        });
        
        if (error) throw error;
        return data as AiAnalysis;
      } finally {
        setIsAnalyzing(false);
      }
    },
    enabled: !!tenderId && !!tender && open,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDaysLeft = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (!tenderId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {tenderLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : tender ? (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="outline">{tender.category}</Badge>
                    <Badge className={tender.status === 'active' 
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                      : "bg-gray-100 text-gray-800"}>
                      {tender.status}
                    </Badge>
                    {tender.scraped_from !== 'synthetic-kenya-gov' && (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        Verified Source
                      </Badge>
                    )}
                  </div>
                  <DialogTitle className="text-xl leading-relaxed">
                    {tender.title}
                  </DialogTitle>
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="ai-analysis">
                  <Brain className="h-4 w-4 mr-1" />
                  AI Analysis
                </TabsTrigger>
                <TabsTrigger value="apply">Apply</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                        <DollarSign className="h-4 w-4" />
                        <span>Budget</span>
                      </div>
                      <p className="text-lg font-bold text-primary">
                        {tender.budget_estimate ? formatCurrency(tender.budget_estimate) : 'Not specified'}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        <span>Deadline</span>
                      </div>
                      <p className="text-lg font-bold">
                        {getDaysLeft(tender.deadline)} days
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                        <Building className="h-4 w-4" />
                        <span>Entity</span>
                      </div>
                      <p className="text-sm font-medium truncate" title={tender.organization}>
                        {tender.organization}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                        <MapPin className="h-4 w-4" />
                        <span>Location</span>
                      </div>
                      <p className="text-sm font-medium">{tender.location}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {tender.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Requirements */}
                {tender.requirements && tender.requirements.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Requirements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {tender.requirements.map((req: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <ChevronRight className="h-4 w-4 mt-0.5 text-primary" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Contact Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {tender.contact_email && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${tender.contact_email}`} className="text-primary hover:underline">
                            {tender.contact_email}
                          </a>
                        </div>
                        {/^[^@]+@(gmail|yahoo|hotmail|outlook|live)\./i.test(tender.contact_email) && (
                          <p className="text-xs text-muted-foreground">
                            This is the personal contact listed by the buyer on the source portal. Always use the
                            official address inside the tender document when submitting or asking questions.
                          </p>
                        )}
                      </div>
                    )}
                    {tender.contact_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${tender.contact_phone}`} className="text-primary hover:underline">
                          {tender.contact_phone}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Deadline: {formatDate(tender.deadline)}</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai-analysis" className="space-y-4 mt-4">
                {analysisLoading || isAnalyzing ? (
                  <Card>
                    <CardContent className="py-8">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <div className="text-center">
                          <p className="font-medium">Analyzing tender with AI...</p>
                          <p className="text-sm text-muted-foreground">
                            Preparing guidance for this tender
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : aiAnalysis ? (
                  <>
                    {/* Bid Readiness: fit with the supplier's own preferences + time to prepare */}
                    <BidReadinessPanel tender={tender} />

                    {/* Only the budget the procuring entity actually published */}
                    {tender?.budget_estimate ? (
                      <Card>
                        <CardContent className="py-4 flex items-center justify-between">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Published budget
                          </span>
                          <span className="text-lg font-bold">{formatCurrency(Number(tender.budget_estimate))}</span>
                        </CardContent>
                      </Card>
                    ) : null}

                    {/* AI Reasoning */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          AI Guidance
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Written by AI from this tender's text only. It does not use award history or bidder data.
                        </p>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {aiAnalysis.reasoning}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Recommendations */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {aiAnalysis.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <Shield className="h-4 w-4 mt-0.5 text-green-600" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {aiAnalysis.bidStrategy?.keySuccessFactors && aiAnalysis.bidStrategy.keySuccessFactors.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Key success factors</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {aiAnalysis.bidStrategy.keySuccessFactors.map((factor, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <Target className="h-4 w-4 mt-0.5 text-primary" />
                                <span>{factor}</span>
                              </li>
                            ))}
                          </ul>
                          {aiAnalysis.bidStrategy.timingAdvice && (
                            <p className="text-sm text-muted-foreground mt-3">{aiAnalysis.bidStrategy.timingAdvice}</p>
                          )}
                        </CardContent>
                      </Card>
                    )}


                    <Button 
                      onClick={() => refetchAnalysis()} 
                      variant="outline" 
                      className="w-full"
                      disabled={isAnalyzing}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Regenerate Analysis
                    </Button>
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <AlertTriangle className="h-8 w-8 mx-auto text-yellow-500 mb-4" />
                      <p className="font-medium">Unable to generate analysis</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Click below to try again
                      </p>
                      <Button onClick={() => refetchAnalysis()}>
                        <Brain className="h-4 w-4 mr-2" />
                        Generate AI Analysis
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="apply" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Apply for this Tender</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button className="w-full" size="lg">
                        <FileText className="h-4 w-4 mr-2" />
                        Download Tender Documents
                      </Button>
                      <Button variant="outline" className="w-full" size="lg" asChild>
                        <a 
                          href={
                            tender.source_url && !['https://tenders.go.ke/', 'https://tenders.go.ke'].includes(tender.source_url)
                              ? tender.source_url
                              : tender.tender_number
                                ? `https://tenders.go.ke/website/tender/search?keyword=${encodeURIComponent(tender.tender_number)}`
                                : 'https://tenders.go.ke/'
                          } 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View on Source Website
                        </a>
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium mb-2">Need Help?</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Connect with service providers to help you prepare a winning bid
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm">
                          Tender Writers
                        </Button>
                        <Button variant="secondary" size="sm">
                          Legal Advisors
                        </Button>
                        <Button variant="secondary" size="sm">
                          Financial Experts
                        </Button>
                        <Button variant="secondary" size="sm">
                          Technical Consultants
                        </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Form a Consortium
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Partner with other suppliers to increase your chances of winning
                      </p>
                      <Button variant="outline" className="w-full">
                        <Users className="h-4 w-4 mr-2" />
                        Create or Join Consortium
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 mx-auto text-yellow-500 mb-4" />
            <p>Tender not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
