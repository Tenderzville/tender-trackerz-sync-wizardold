import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Store, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ServiceProvider {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  specialization: string;
  description: string | null;
  experience: number | null;
  hourly_rate: number | null;
  certifications: string[] | null;
  rating: number | null;
  review_count: number | null;
  availability: string | null;
}

interface CreateProviderForm {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  description: string;
  experience: number;
  hourlyRate: number;
  certifications: string;
}

export default function ServiceProviders() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [formData, setFormData] = useState<CreateProviderForm>({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    description: "",
    experience: 0,
    hourlyRate: 0,
    certifications: "",
  });

  const { data: providers, isLoading } = useQuery({
    queryKey: ["service-providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_providers")
        .select("*")
        .order("rating", { ascending: false });
      
      if (error) throw error;
      return (data || []) as ServiceProvider[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateProviderForm) => {
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("service_providers")
        .insert({
          user_id: user.id,
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          specialization: data.specialization,
          description: data.description || null,
          experience: data.experience || null,
          hourly_rate: data.hourlyRate || null,
          certifications: data.certifications.split(',').map(s => s.trim()).filter(Boolean),
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-providers"] });
      setCreateDialogOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        specialization: "",
        description: "",
        experience: 0,
        hourlyRate: 0,
        certifications: "",
      });
      toast({
        title: "Provider profile created",
        description: "Your service provider profile has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create service provider profile.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const filteredProviders = providers ? providers.filter(provider => {
    const matchesSearch = !searchTerm || 
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecialization = !selectedSpecialization || 
      provider.specialization === selectedSpecialization;
    
    return matchesSearch && matchesSpecialization;
  }) : [];

  const specializations = [
    "Legal & Compliance Consultant",
    "Technical Writing Specialist", 
    "Quantity Surveying & Estimation",
    "Project Management",
    "Engineering Consultant",
    "Financial Advisory",
    "Environmental Consultant",
    "IT & Technology",
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3 mb-4 sm:mb-0">
              <Store className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">Service Providers</h1>
                <p className="text-muted-foreground">
                  Professional services to enhance your tender success
                </p>
              </div>
            </div>
            
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Register as Provider</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Register as Service Provider</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="specialization">Specialization</Label>
                      <Select value={formData.specialization} onValueChange={(value) => setFormData({ ...formData, specialization: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select specialization" />
                        </SelectTrigger>
                        <SelectContent>
                          {specializations.map((spec) => (
                            <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your services and expertise..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Input
                        id="experience"
                        type="number"
                        min="0"
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hourlyRate">Hourly Rate (KSh)</Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        min="0"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="certifications">Certifications (comma-separated)</Label>
                    <Input
                      id="certifications"
                      value={formData.certifications}
                      onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                      placeholder="e.g., LSK Advocate, PMP, ISO 27001"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Creating..." : "Register"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search providers by name, specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12"
              />
            </div>
            
            <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
              <SelectTrigger className="w-full lg:w-[280px]">
                <SelectValue placeholder="All Specializations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Specializations</SelectItem>
                {specializations.map((spec) => (
                  <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Results */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Service Providers</h2>
            <span className="text-sm text-muted-foreground">
              {filteredProviders.length} {filteredProviders.length === 1 ? 'provider' : 'providers'}
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded mb-4"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProviders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProviders.map((provider) => (
                <Card key={provider.id} className="hover:border-primary transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{provider.name}</h3>
                        <Badge variant="secondary" className="mt-1">{provider.specialization}</Badge>
                      </div>
                      {provider.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{provider.rating}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {provider.description || "No description provided"}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {provider.experience ? `${provider.experience} years exp.` : "Experience N/A"}
                      </span>
                      <span className="font-medium">
                        {provider.hourly_rate ? formatCurrency(provider.hourly_rate) + "/hr" : "Rate N/A"}
                      </span>
                    </div>
                    
                    <Button className="w-full mt-4" variant="outline">
                      Contact Provider
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No service providers found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || selectedSpecialization
                    ? "Try adjusting your search criteria"
                    : "No service providers available yet"}
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Register as Provider
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
