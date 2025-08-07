import { AutomationStatus } from "@/components/automation/AutomationStatus";

export default function AutomationPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Automation Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and control automated tender scraping
        </p>
      </div>
      
      <AutomationStatus />
    </div>
  );
}