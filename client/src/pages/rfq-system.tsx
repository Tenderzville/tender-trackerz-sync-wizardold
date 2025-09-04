import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Plus, 
  Clock, 
  DollarSign, 
  MapPin, 
  Calendar,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2
} from "lucide-react";

const rfqSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  location: z.string().min(1, "Location is required"),
  budget_range_min: z.number().min(1, "Minimum budget is required"),
  budget_range_max: z.number().min(1, "Maximum budget is required"),
  deadline: z.string().min(1, "Deadline is required"),
  requirements: z.array(z.string()).optional(),
});

type RfqFormData = z.infer<typeof rfqSchema>;

export default function RfqSystem() {
  const [activeTab, setActiveTab] = useState("browse");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RfqFormData>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      requirements: [],
    },
  });

  const { data: rfqs, isLoading } = useQuery({
    queryKey: ["rfqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rfqs")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: myRfqs } = useQuery({
    queryKey: ["my-rfqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rfqs")
        .select("*")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createRfqMutation = useMutation({
    mutationFn: async (data: RfqFormData) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error("Not authenticated");

      const { error } = await supabase.from("rfqs").insert({
        ...data,
        user_id: user.data.user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfqs"] });
      queryClient.invalidateQueries({ queryKey: ["my-rfqs"] });
      setIsCreateOpen(false);
      form.reset();
      toast({ title: "RFQ created successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error creating RFQ", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: RfqFormData) => {
    createRfqMutation.mutate(data);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <DesktopSidebar />
      
      <div className="flex-1 overflow-auto">
        <MobileHeader />
        
        {/* Header */}
        <section className="p-6 lg:p-8 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                <FileText className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold">RFQ Management</h1>
                  <p className="text-slate-600 dark:text-slate-300">
                    Create, manage, and respond to Request for Quotations
                  </p>
                </div>
              </div>
              
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Create RFQ</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New RFQ</DialogTitle>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="RFQ title..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Detailed description of requirements..." 
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Construction">Construction</SelectItem>
                                  <SelectItem value="IT Services">IT Services</SelectItem>
                                  <SelectItem value="Consultancy">Consultancy</SelectItem>
                                  <SelectItem value="Supplies">Supplies</SelectItem>
                                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                                  <SelectItem value="Education">Education</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input placeholder="Location..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="budget_range_min"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Min Budget (KSh)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="budget_range_max"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Budget (KSh)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="deadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deadline</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createRfqMutation.isPending}
                        >
                          {createRfqMutation.isPending ? "Creating..." : "Create RFQ"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="browse">Browse RFQs</TabsTrigger>
                <TabsTrigger value="my-rfqs">My RFQs</TabsTrigger>
                <TabsTrigger value="quotes">My Quotes</TabsTrigger>
              </TabsList>

              <TabsContent value="browse" className="mt-6">
                <div className="space-y-4">
                  {isLoading ? (
                    [...Array(3)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                        </CardContent>
                      </Card>
                    ))
                  ) : rfqs && rfqs.length > 0 ? (
                    rfqs.map((rfq: any) => (
                      <Card key={rfq.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold mb-2">{rfq.title}</h3>
                              <p className="text-slate-600 dark:text-slate-300 line-clamp-2">
                                {rfq.description}
                              </p>
                            </div>
                            <Badge className={getStatusColor(rfq.status)}>
                              {rfq.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center space-x-2 text-sm">
                              <DollarSign className="h-4 w-4 text-slate-400" />
                              <span>
                                {formatCurrency(rfq.budget_range_min)} - {formatCurrency(rfq.budget_range_max)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <MapPin className="h-4 w-4 text-slate-400" />
                              <span>{rfq.location}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              <span>{new Date(rfq.deadline).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <FileText className="h-4 w-4 text-slate-400" />
                              <span>{rfq.category}</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button size="sm">
                              Submit Quote
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No RFQs available</h3>
                        <p className="text-slate-500 dark:text-slate-400">
                          Check back later for new RFQ opportunities
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="my-rfqs" className="mt-6">
                <div className="space-y-4">
                  {myRfqs && myRfqs.length > 0 ? (
                    myRfqs.map((rfq: any) => (
                      <Card key={rfq.id}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold mb-2">{rfq.title}</h3>
                              <p className="text-slate-600 dark:text-slate-300 line-clamp-2">
                                {rfq.description}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(rfq.status)}>
                                {rfq.status}
                              </Badge>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              Created {new Date(rfq.created_at).toLocaleDateString()}
                            </div>
                            <Button variant="outline" size="sm">
                              View Quotes (0)
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No RFQs created yet</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                          Create your first RFQ to start receiving quotes
                        </p>
                        <Button onClick={() => setIsCreateOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create RFQ
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="quotes" className="mt-6">
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No quotes submitted yet</h3>
                    <p className="text-slate-500 dark:text-slate-400">
                      Submit quotes to RFQs to see them here
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        <MobileBottomNav />
      </div>
    </div>
  );
}