import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAutomation } from "@/hooks/use-automation";
import { useTenders } from "@/hooks/use-tenders";
import { Play, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function AutomationStatus() {
  const { logs, isLoading, triggerScraper, isTriggering } = useAutomation();
  const { tenders } = useTenders();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'running':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Tender Scraping Automation
            <Button
              onClick={() => triggerScraper('tenders.go.ke')}
              disabled={isTriggering}
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              {isTriggering ? 'Starting...' : 'Run Scraper'}
            </Button>
          </CardTitle>
          <CardDescription>
            Automated tender collection from government sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {tenders?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Tenders</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {logs?.filter(log => log.status === 'completed' && 
                  new Date(log.executed_at).toDateString() === new Date().toDateString()).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Today's Runs</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {logs?.filter(log => log.status === 'completed').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Successful</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest scraper execution logs</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading logs...</div>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(log.status)}
                    <div>
                      <div className="font-medium">{log.function_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(log.executed_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusColor(log.status) as any}>
                      {log.status}
                    </Badge>
                    {log.duration_ms && (
                      <span className="text-sm text-muted-foreground">
                        {log.duration_ms}ms
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No automation logs found. Run the scraper to see activity.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}