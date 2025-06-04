
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Clock, ExternalLink, Mail, Phone } from "lucide-react";
import type { ServiceProvider } from "@shared/schema";

interface ServiceProviderCardProps {
  provider: ServiceProvider;
}

export function ServiceProviderCard({ provider }: ServiceProviderCardProps) {
  const formatCurrency = (amount: number | null) => {
    if (!amount) return 0;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvailabilityColor = (availability: string | null) => {
    switch (availability) {
      case "available":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "busy":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "unavailable":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="h-4 w-4 text-slate-300 dark:text-slate-600" />
      );
    }

    return stars;
  };

  const ratingValue = parseFloat(provider.rating?.toString() || "0") || 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={provider.profileImage || undefined} alt={provider.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(provider.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg mb-1 truncate">{provider.name}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
              {provider.specialization}
            </p>
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex items-center space-x-1">
                {renderStars(ratingValue)}
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                ({provider.reviewCount || 0})
              </span>
            </div>
            <Badge className={getAvailabilityColor(provider.availability)}>
              {provider.availability || "unknown"}
            </Badge>
          </div>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-3">
          {provider.description}
        </p>

        {/* Key Details */}
        <div className="space-y-2 mb-4">
          {provider.experience && (
            <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300">
              <Clock className="h-4 w-4" />
              <span>{provider.experience} years experience</span>
            </div>
          )}
          
          {provider.hourlyRate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-300">Starting rate:</span>
              <span className="font-semibold text-primary">
                {formatCurrency(provider.hourlyRate)}/hour
              </span>
            </div>
          )}
        </div>

        {/* Certifications */}
        {provider.certifications && provider.certifications.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              Certifications:
            </p>
            <div className="flex flex-wrap gap-1">
              {provider.certifications.slice(0, 2).map((cert, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {cert}
                </Badge>
              ))}
              {provider.certifications.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{provider.certifications.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Portfolio */}
        {provider.portfolio && provider.portfolio.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              Portfolio:
            </p>
            <div className="space-y-1">
              {provider.portfolio.slice(0, 2).map((item, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button className="flex-1 flex items-center space-x-1">
            <Mail className="h-4 w-4" />
            <span>Contact</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-1">
            <ExternalLink className="h-4 w-4" />
            <span>Profile</span>
          </Button>
        </div>

        {/* Quick Contact Info */}
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-1">
              <Mail className="h-3 w-3" />
              <span className="truncate">{provider.email}</span>
            </div>
            {provider.phone && (
              <div className="flex items-center space-x-1">
                <Phone className="h-3 w-3" />
                <span>{provider.phone}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
