
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import type { ServiceProvider } from "@shared/schema";

interface ServiceProviderCardProps {
  provider: ServiceProvider;
}

export function ServiceProviderCard({ provider }: ServiceProviderCardProps) {
  const renderStars = (rating: string) => {
    const numRating = parseFloat(rating);
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-3 w-3 ${
            i <= numRating ? "text-yellow-400 fill-current" : "text-slate-300"
          }`}
        />
      );
    }
    return stars;
  };

  const formatHourlyRate = (rate: number | null) => {
    if (!rate) return "Contact for pricing";
    return `Starting at KSh ${rate.toLocaleString()}`;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4 mb-4">
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
            <span className="text-lg font-semibold">
              {provider.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">{provider.name}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {provider.specialization || "Professional Services"}
            </p>
            <div className="flex items-center space-x-1 mt-1">
              <div className="flex space-x-1">
                {renderStars(provider.rating?.toString() || "0")}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({provider.rating || "0.0"})
              </span>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-3">
          {provider.description || "Professional service provider specializing in tender support and business consulting."}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-primary">
            {formatHourlyRate(provider.hourlyRate)}
          </span>
          <Button size="sm">
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
