import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Play, CheckCircle, AlertCircle, Loader } from "lucide-react";

export default function TriggerScraper() {
  const { toast } = useToast();
  
  const triggerScraperMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('manual-scraper-trigger', {});
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Scraper triggered successfully!",
        description: `Processed ${data.result?.processed || 0} tenders, saved ${data.result?.saved || 0} new ones.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error triggering scraper",
        description: error.message || "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5" />
              <span>Tender Scraper</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600 dark:text-slate-300">
-              Click the button below to trigger the tender scraper and populate the database with sample tenders.
+              Click the button below to trigger the tender scraper and pull live tenders from official government sources into Supabase.
             </p>
            
            <Button 
              onClick={() => triggerScraperMutation.mutate()}
              disabled={triggerScraperMutation.isPending}
              className="w-full"
            >
              {triggerScraperMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Scraping in progress...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Trigger Scraper
                </>
              )}
            </Button>

            {triggerScraperMutation.isSuccess && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Successfully processed tenders! Check the Browse Tenders page to see the results.
                </AlertDescription>
              </Alert>
            )}

            {triggerScraperMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Error occurred while scraping. Please check the logs and try again.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}