import { useState } from 'react';
import { useTenders, useSaveTender, useUnsaveTender, useSavedTenders } from '@/hooks/useTenders';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter,
  MapPin,
  Building2,
  Calendar,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Clock
} from 'lucide-react';
import { formatCurrency, formatDate, getDaysRemaining } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const CATEGORIES = [
  'all',
  'Construction',
  'Technology',
  'Medical',
  'Consultancy',
  'Supplies',
  'Transport',
  'Energy',
  'Agriculture',
  'Security',
  'Education',
  'Environment',
  'Water',
];

const LOCATIONS = [
  'all',
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Eldoret',
  'Kiambu',
  'Machakos',
  'Nyeri',
  'Meru',
];

export default function TendersPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [location, setLocation] = useState('all');
  const [selectedTender, setSelectedTender] = useState<any>(null);

  const { data: tenders, isLoading, error } = useTenders({ 
    search, 
    category, 
    location,
    status: 'active' 
  });
  const { data: savedTenders } = useSavedTenders(user?.id);
  const saveTender = useSaveTender();
  const unsaveTender = useUnsaveTender();

  const savedTenderIds = new Set(savedTenders?.map(s => s.tender_id) ?? []);

  const handleSave = (tenderId: number) => {
    if (!user) return;
    
    if (savedTenderIds.has(tenderId)) {
      unsaveTender.mutate({ tenderId, userId: user.id });
    } else {
      saveTender.mutate({ tenderId, userId: user.id });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Browse Tenders</h1>
        <p className="text-muted-foreground mt-1">
          Find and apply to government and private sector tenders across Kenya.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tenders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc === 'all' ? 'All Locations' : loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading tenders...</div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">
          Error loading tenders. Please try again.
        </div>
      ) : tenders?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No tenders found matching your criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tenders?.map((tender) => {
            const daysRemaining = getDaysRemaining(tender.deadline);
            const isSaved = savedTenderIds.has(tender.id);

            return (
              <Card key={tender.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 
                          className="font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                          onClick={() => setSelectedTender(tender)}
                        >
                          {tender.title}
                        </h3>
                        <Badge 
                          variant={daysRemaining <= 7 ? 'destructive' : daysRemaining <= 14 ? 'warning' : 'secondary'}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {daysRemaining} days left
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {tender.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {tender.organization}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {tender.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {formatDate(tender.deadline)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Badge variant="outline">{tender.category}</Badge>
                        {tender.tender_number && (
                          <Badge variant="outline">#{tender.tender_number}</Badge>
                        )}
                        {tender.budget_estimate && (
                          <Badge variant="default">
                            Est. {formatCurrency(tender.budget_estimate)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex lg:flex-col gap-2">
                      <Button
                        variant={isSaved ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSave(tender.id)}
                        disabled={!user}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="w-4 h-4" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </Button>
                      {tender.source_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={tender.source_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tender Details Modal */}
      <Dialog open={!!selectedTender} onOpenChange={() => setSelectedTender(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedTender && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTender.title}</DialogTitle>
                <DialogDescription>
                  {selectedTender.organization} • {selectedTender.location}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedTender.description}</p>
                </div>

                {selectedTender.requirements && selectedTender.requirements.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Requirements</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {selectedTender.requirements.map((req: string, i: number) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <p className="font-medium">{selectedTender.category}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Deadline:</span>
                    <p className="font-medium">{formatDate(selectedTender.deadline)}</p>
                  </div>
                  {selectedTender.budget_estimate && (
                    <div>
                      <span className="text-muted-foreground">Estimated Budget:</span>
                      <p className="font-medium">{formatCurrency(selectedTender.budget_estimate)}</p>
                    </div>
                  )}
                  {selectedTender.tender_number && (
                    <div>
                      <span className="text-muted-foreground">Tender Number:</span>
                      <p className="font-medium">{selectedTender.tender_number}</p>
                    </div>
                  )}
                </div>

                {selectedTender.source_url && (
                  <Button asChild className="w-full">
                    <a href={selectedTender.source_url} target="_blank" rel="noopener noreferrer">
                      View Original Source <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                )}

                <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                  <strong>⚠️ Disclaimer:</strong> Verify all information with the procuring entity 
                  before submitting your bid. TenderKenya is not responsible for any errors or 
                  omissions in tender information.
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
