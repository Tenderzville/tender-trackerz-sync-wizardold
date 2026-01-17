import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, DollarSign, MapPin, Calendar, Eye, Link, X } from 'lucide-react';

const CATEGORIES = [
  'Construction', 'IT & Technology', 'Medical & Healthcare', 'Consultancy',
  'Supplies & Equipment', 'Transport & Logistics', 'Energy', 'Agriculture',
  'Security', 'Education', 'Environment', 'Water & Sanitation', 'Legal Services'
];

const KENYAN_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Kiambu', 'Machakos',
  'Nyeri', 'Meru', 'Kakamega', 'Kilifi', 'Uasin Gishu', 'Bungoma', 'Kisii'
];

export default function RFQPage() {
  const { user, userType } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewRfq, setViewRfq] = useState<any>(null);
  const [newDocLink, setNewDocLink] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    budget_range_min: '',
    budget_range_max: '',
    deadline: '',
    document_links: [] as string[],
  });

  // Fetch RFQs
  const { data: rfqs, isLoading } = useQuery({
    queryKey: ['rfqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rfqs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch user's RFQs
  const { data: myRfqs } = useQuery({
    queryKey: ['my-rfqs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('rfqs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Create RFQ mutation
  const createRfqMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('rfqs')
        .insert({
          user_id: user.id,
          title: data.title,
          description: data.description,
          category: data.category,
          location: data.location,
          budget_range_min: parseInt(data.budget_range_min) || 0,
          budget_range_max: parseInt(data.budget_range_max) || 0,
          deadline: data.deadline,
          document_links: data.document_links,
          status: 'active',
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'RFQ created successfully!' });
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['my-rfqs'] });
      setCreateOpen(false);
      setFormData({
        title: '', description: '', category: '', location: '',
        budget_range_min: '', budget_range_max: '', deadline: '', document_links: [],
      });
    },
    onError: (error: any) => {
      toast({ title: 'Error creating RFQ', description: error.message, variant: 'destructive' });
    },
  });

  const addDocLink = () => {
    if (newDocLink && !formData.document_links.includes(newDocLink)) {
      try {
        new URL(newDocLink);
        setFormData(prev => ({
          ...prev,
          document_links: [...prev.document_links, newDocLink]
        }));
        setNewDocLink('');
      } catch {
        toast({ title: 'Invalid URL', variant: 'destructive' });
      }
    }
  };

  const removeDocLink = (link: string) => {
    setFormData(prev => ({
      ...prev,
      document_links: prev.document_links.filter(l => l !== link)
    }));
  };

  const formatBudget = (amount: number | null) => {
    if (!amount) return 'Not specified';
    return `KSh ${amount.toLocaleString()}`;
  };

  const isBuyer = userType === 'buyer';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-7 h-7" />
            {isBuyer ? 'Request for Quotations' : 'Available RFQs'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isBuyer ? 'Post and manage your procurement requests' : 'Find and bid on buyer requests'}
          </p>
        </div>
        
        {isBuyer && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Post RFQ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New RFQ</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief title for your request"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of what you need..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Location *</Label>
                    <Select
                      value={formData.location}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Select county" /></SelectTrigger>
                      <SelectContent>
                        {KENYAN_COUNTIES.map(county => (
                          <SelectItem key={county} value={county}>{county}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min Budget (KSh)</Label>
                    <Input
                      type="number"
                      value={formData.budget_range_min}
                      onChange={(e) => setFormData(prev => ({ ...prev, budget_range_min: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Budget (KSh)</Label>
                    <Input
                      type="number"
                      value={formData.budget_range_max}
                      onChange={(e) => setFormData(prev => ({ ...prev, budget_range_max: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Deadline *</Label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>

                {/* Document Links */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Link className="w-4 h-4" />
                    Document Links
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Add links to specifications, requirements, or other documents
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={newDocLink}
                      onChange={(e) => setNewDocLink(e.target.value)}
                      placeholder="https://example.com/document.pdf"
                    />
                    <Button type="button" variant="outline" onClick={addDocLink}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.document_links.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.document_links.map((link, i) => (
                        <Badge key={i} variant="secondary" className="flex items-center gap-1">
                          <a href={link} target="_blank" rel="noopener noreferrer" className="max-w-[200px] truncate">
                            {link}
                          </a>
                          <button onClick={() => removeDocLink(link)} className="ml-1">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button 
                  onClick={() => createRfqMutation.mutate(formData)}
                  disabled={!formData.title || !formData.description || !formData.category || !formData.location || !formData.deadline}
                >
                  Create RFQ
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue={isBuyer ? 'my-rfqs' : 'all'}>
        <TabsList>
          <TabsTrigger value="all">All RFQs</TabsTrigger>
          {isBuyer && <TabsTrigger value="my-rfqs">My RFQs ({myRfqs?.length || 0})</TabsTrigger>}
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : rfqs?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No RFQs available</h3>
                <p className="text-muted-foreground">Check back later for new requests</p>
              </CardContent>
            </Card>
          ) : (
            rfqs?.map((rfq) => (
              <Card key={rfq.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={rfq.status === 'active' ? 'default' : 'secondary'}>
                          {rfq.status}
                        </Badge>
                        <Badge variant="outline">{rfq.category}</Badge>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-2">{rfq.title}</h3>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {rfq.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Deadline: {new Date(rfq.deadline).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {formatBudget(rfq.budget_range_min)} - {formatBudget(rfq.budget_range_max)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">{rfq.description}</p>
                      
                      {rfq.document_links?.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <Link className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {rfq.document_links.length} document(s) attached
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <Button variant="outline" size="sm" onClick={() => setViewRfq(rfq)}>
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {isBuyer && (
          <TabsContent value="my-rfqs" className="mt-4 space-y-4">
            {myRfqs?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No RFQs posted yet</h3>
                  <p className="text-muted-foreground">Post your first RFQ to get started</p>
                </CardContent>
              </Card>
            ) : (
              myRfqs?.map((rfq) => (
                <Card key={rfq.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant={rfq.status === 'active' ? 'default' : 'secondary'} className="mb-2">
                          {rfq.status}
                        </Badge>
                        <h3 className="font-semibold">{rfq.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Posted {new Date(rfq.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* View RFQ Dialog */}
      <Dialog open={!!viewRfq} onOpenChange={() => setViewRfq(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewRfq?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-wrap gap-2">
              <Badge>{viewRfq?.category}</Badge>
              <Badge variant="outline">{viewRfq?.location}</Badge>
              <Badge variant="secondary">{viewRfq?.status}</Badge>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-muted-foreground">{viewRfq?.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-1">Budget Range</h4>
                <p className="text-muted-foreground">
                  {formatBudget(viewRfq?.budget_range_min)} - {formatBudget(viewRfq?.budget_range_max)}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Deadline</h4>
                <p className="text-muted-foreground">
                  {viewRfq?.deadline && new Date(viewRfq.deadline).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {viewRfq?.document_links?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Documents</h4>
                <div className="space-y-2">
                  {viewRfq.document_links.map((link: string, i: number) => (
                    <a 
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Link className="w-4 h-4" />
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRfq(null)}>Close</Button>
            {!isBuyer && (
              <Button>Submit Quote</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
