import { useState } from 'react';
import { useServiceProviders } from '@/hooks/useServiceProviders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Star,
  MapPin,
  Mail,
  Phone,
  Globe,
  Linkedin,
  Briefcase
} from 'lucide-react';

const SPECIALIZATIONS = [
  'all',
  'Construction',
  'IT Services',
  'Consulting',
  'Legal',
  'Accounting',
  'Engineering',
  'Marketing',
  'Logistics',
  'Healthcare',
];

const AVAILABILITY = [
  'all',
  'available',
  'busy',
  'unavailable',
];

export default function ProvidersPage() {
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('all');
  const [availability, setAvailability] = useState('all');

  const { data: providers, isLoading, error } = useServiceProviders({
    search,
    specialization,
    availability,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Service Providers</h1>
        <p className="text-muted-foreground mt-1">
          Find qualified service providers to partner with on tender bids.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search providers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={specialization} onValueChange={setSpecialization}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Specialization" />
              </SelectTrigger>
              <SelectContent>
                {SPECIALIZATIONS.map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {spec === 'all' ? 'All Specializations' : spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={availability} onValueChange={setAvailability}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABILITY.map((avail) => (
                  <SelectItem key={avail} value={avail}>
                    {avail === 'all' ? 'All Availability' : avail.charAt(0).toUpperCase() + avail.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading providers...</div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">
          Error loading providers. Please try again.
        </div>
      ) : providers?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No Service Providers Found</p>
            <p className="text-muted-foreground mt-1">
              Be the first to register as a service provider!
            </p>
            <Button className="mt-4">Register as Provider</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers?.map((provider) => (
            <Card key={provider.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{provider.name}</h3>
                    <p className="text-sm text-muted-foreground">{provider.specialization}</p>
                    
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-4 h-4 text-warning fill-warning" />
                      <span className="text-sm font-medium">
                        {provider.rating?.toFixed(1) || '0.0'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({provider.review_count || 0} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                {provider.description && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                    {provider.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge 
                    variant={provider.availability === 'available' ? 'success' : 'secondary'}
                  >
                    {provider.availability || 'Available'}
                  </Badge>
                  {provider.experience && (
                    <Badge variant="outline">{provider.experience}+ years</Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {provider.email && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`mailto:${provider.email}`}>
                        <Mail className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                  {provider.phone && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`tel:${provider.phone}`}>
                        <Phone className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                  {provider.website && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={provider.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                  {provider.linkedin && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={provider.linkedin} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
