import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  FileText, 
  Plus, 
  DollarSign, 
  MapPin, 
  Calendar,
  Eye,
  Edit,
  Trash2,
  Send
} from "lucide-react";

const rfqSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  category: z.string().min(1, "Category is required"),
  location: z.string().min(1, "Location is required").max(100),
  budget_range_min: z.number().min(1, "Minimum budget is required"),
  budget_range_max: z.number().min(1, "Maximum budget is required"),
  deadline: z.string().min(1, "Deadline is required"),
  document_links: z.array(z.string().url("Must be a valid URL")).optional().default([]),
});

const quoteSchema = z.object({
  quoted_amount: z.number().min(1, "Amount is required"),
  delivery_timeline: z.string().min(1, "Delivery timeline is required"),
  proposal_text: z.string().min(10, "Proposal must be at least 10 characters").max(2000),
  validity_period: z.number().min(1).max(365),
});

type RfqFormData = z.infer<typeof rfqSchema>;
type QuoteFormData = z.infer<typeof quoteSchema>;

interface RFQ {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  budget_range_min: number | null;
  budget_range_max: number | null;
  deadline: string;
  status: string | null;
  user_id: string;
  created_at: string | null;
}

interface Quote {
  id: number;
  rfq_id: number;
  supplier_id: string;
  quoted_amount: number;
  delivery_timeline: string | null;
  proposal_text: string | null;
  validity_period: number | null;
  status: string | null;
  submitted_at: string | null;
}

export default function RfqSystem() {
  const [activeTab, setActiveTab] = useState("browse");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [newDocumentLink, setNewDocumentLink] = useState("");

  const form = useForm<RfqFormData>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      location: "",
      budget_range_min: 0,
      document_links: [],
      budget_range_max: 0,
      deadline: "",
    },
  });

  const editForm = useForm<RfqFormData>({
    resolver: zodResolver(rfqSchema),
  });

  const quoteForm = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      quoted_amount: 0,
      delivery_timeline: "",
      proposal_text: "",
      validity_period: 30,
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
      return (data || []) as RFQ[];
    },
  });

  const { data: myRfqs } = useQuery({
    queryKey: ["my-rfqs"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("rfqs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return (data || []) as RFQ[];
    },
    enabled: !!user,
  });

  const { data: myQuotes } = useQuery({
    queryKey: ["my-quotes"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("rfq_quotes")
        .select("*")
        .eq("supplier_id", user.id)
        .order("submitted_at", { ascending: false });
      
      if (error) throw error;
      return (data || []) as Quote[];
    },
    enabled: !!user,
  });

  const { data: quotesForRfq } = useQuery({
    queryKey: ["quotes-for-rfq", selectedRfq?.id],
    queryFn: async () => {
      if (!selectedRfq) return [];
      const { data, error } = await supabase
        .from("rfq_quotes")
        .select("*")
        .eq("rfq_id", selectedRfq.id);
      
      if (error) throw error;
      return (data || []) as Quote[];
    },
    enabled: !!selectedRfq && isViewOpen,
  });

  const createRfqMutation = useMutation({
    mutationFn: async (data: RfqFormData) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("rfqs").insert({
        ...data,
        user_id: user.id,
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

  const updateRfqMutation = useMutation({
    mutationFn: async (data: RfqFormData) => {
      if (!selectedRfq) throw new Error("No RFQ selected");

      const { error } = await supabase
        .from("rfqs")
        .update(data)
        .eq("id", selectedRfq.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfqs"] });
      queryClient.invalidateQueries({ queryKey: ["my-rfqs"] });
      setIsEditOpen(false);
      setSelectedRfq(null);
      toast({ title: "RFQ updated successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error updating RFQ", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteRfqMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRfq) throw new Error("No RFQ selected");

      const { error } = await supabase
        .from("rfqs")
        .delete()
        .eq("id", selectedRfq.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfqs"] });
      queryClient.invalidateQueries({ queryKey: ["my-rfqs"] });
      setIsDeleteOpen(false);
      setSelectedRfq(null);
      toast({ title: "RFQ deleted successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deleting RFQ", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const submitQuoteMutation = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      if (!user) throw new Error("Not authenticated");
      if (!selectedRfq) throw new Error("No RFQ selected");

      const { error } = await supabase.from("rfq_quotes").insert({
        rfq_id: selectedRfq.id,
        supplier_id: user.id,
        quoted_amount: data.quoted_amount,
        delivery_timeline: data.delivery_timeline,
        proposal_text: data.proposal_text,
        validity_period: data.validity_period,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-quotes"] });
      setIsQuoteOpen(false);
      setSelectedRfq(null);
      quoteForm.reset();
      toast({ title: "Quote submitted successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error submitting quote", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const openEdit = (rfq: RFQ) => {
    setSelectedRfq(rfq);
    editForm.reset({
      title: rfq.title,
      description: rfq.description,
      category: rfq.category,
      location: rfq.location,
      budget_range_min: rfq.budget_range_min || 0,
      budget_range_max: rfq.budget_range_max || 0,
      deadline: rfq.deadline,
    });
    setIsEditOpen(true);
  };

  const openDelete = (rfq: RFQ) => {
    setSelectedRfq(rfq);
    setIsDeleteOpen(true);
  };

  const openQuote = (rfq: RFQ) => {
    setSelectedRfq(rfq);
    quoteForm.reset();
    setIsQuoteOpen(true);
  };

  const openView = (rfq: RFQ) => {
    setSelectedRfq(rfq);
    setIsViewOpen(true);
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    }
  };

  const categories = ["Construction", "IT Services", "Consultancy", "Supplies", "Healthcare", "Education"];

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
                    <DialogDescription>Fill in the details to create a new Request for Quotation.</DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => createRfqMutation.mutate(data))} className="space-y-4">
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
                                  {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                  ))}
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

                      {/* Document Links Section */}
                      <FormField
                        control={form.control}
                        name="document_links"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Document Links (Optional)</FormLabel>
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  placeholder="https://example.com/document.pdf"
                                  value={newDocumentLink}
                                  onChange={(e) => setNewDocumentLink(e.target.value)}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    if (newDocumentLink && newDocumentLink.startsWith('http')) {
                                      field.onChange([...(field.value || []), newDocumentLink]);
                                      setNewDocumentLink("");
                                    }
                                  }}
                                >
                                  Add
                                </Button>
                              </div>
                              {field.value && field.value.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {field.value.map((link, index) => (
                                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                      <a href={link} target="_blank" rel="noopener noreferrer" className="truncate max-w-[200px]">
                                        {new URL(link).hostname}
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newLinks = field.value?.filter((_, i) => i !== index) || [];
                                          field.onChange(newLinks);
                                        }}
                                        className="ml-1 text-muted-foreground hover:text-foreground"
                                      >
                                        ×
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createRfqMutation.isPending}>
                          {createRfqMutation.isPending ? "Creating..." : "Create RFQ"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit RFQ</DialogTitle>
              <DialogDescription>Update the RFQ details.</DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit((data) => updateRfqMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="budget_range_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Budget (KSh)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="budget_range_max"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Budget (KSh)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
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
                  control={editForm.control}
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

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateRfqMutation.isPending}>
                    {updateRfqMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete RFQ</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedRfq?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteRfqMutation.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteRfqMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Submit Quote Dialog */}
        <Dialog open={isQuoteOpen} onOpenChange={setIsQuoteOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Submit Quote</DialogTitle>
              <DialogDescription>Submit your quotation for: {selectedRfq?.title}</DialogDescription>
            </DialogHeader>
            
            <Form {...quoteForm}>
              <form onSubmit={quoteForm.handleSubmit((data) => submitQuoteMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={quoteForm.control}
                  name="quoted_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quote Amount (KSh)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={quoteForm.control}
                  name="delivery_timeline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Timeline</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2 weeks, 30 days" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={quoteForm.control}
                  name="validity_period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quote Validity (days)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={quoteForm.control}
                  name="proposal_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proposal Details</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your proposal, approach, and why you're the best fit..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsQuoteOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitQuoteMutation.isPending}>
                    <Send className="h-4 w-4 mr-2" />
                    {submitQuoteMutation.isPending ? "Submitting..." : "Submit Quote"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* View RFQ Details Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedRfq?.title}</DialogTitle>
              <DialogDescription>RFQ Details and Quotes</DialogDescription>
            </DialogHeader>
            
            {selectedRfq && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <p className="font-medium">{selectedRfq.category}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <p className="font-medium">{selectedRfq.location}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Budget Range:</span>
                    <p className="font-medium">{formatCurrency(selectedRfq.budget_range_min)} - {formatCurrency(selectedRfq.budget_range_max)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Deadline:</span>
                    <p className="font-medium">{new Date(selectedRfq.deadline).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground text-sm">Description:</span>
                  <p className="mt-1">{selectedRfq.description}</p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Quotes Received ({quotesForRfq?.length || 0})</h4>
                  {quotesForRfq && quotesForRfq.length > 0 ? (
                    <div className="space-y-2">
                      {quotesForRfq.map((quote) => (
                        <Card key={quote.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{formatCurrency(quote.quoted_amount)}</p>
                                <p className="text-sm text-muted-foreground">
                                  Delivery: {quote.delivery_timeline || "N/A"}
                                </p>
                              </div>
                              <Badge>{quote.status}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No quotes received yet.</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Content */}
        <section className="p-6 lg:p-8 pb-24 lg:pb-8">
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
                    rfqs.map((rfq) => (
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
                            <Button variant="outline" size="sm" onClick={() => openView(rfq)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button size="sm" onClick={() => openQuote(rfq)}>
                              <Send className="h-4 w-4 mr-2" />
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
                    myRfqs.map((rfq) => (
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
                              <Button variant="outline" size="sm" onClick={() => openEdit(rfq)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => openDelete(rfq)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              Created {rfq.created_at ? new Date(rfq.created_at).toLocaleDateString() : "N/A"}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => openView(rfq)}>
                              View Quotes
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
                {myQuotes && myQuotes.length > 0 ? (
                  <div className="space-y-4">
                    {myQuotes.map((quote) => (
                      <Card key={quote.id}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">Quote #{quote.id}</p>
                              <p className="text-lg font-semibold text-primary">
                                {formatCurrency(quote.quoted_amount)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Delivery: {quote.delivery_timeline || "N/A"}
                              </p>
                            </div>
                            <Badge>{quote.status}</Badge>
                          </div>
                          <p className="text-sm mt-2 text-muted-foreground">
                            Submitted: {quote.submitted_at ? new Date(quote.submitted_at).toLocaleDateString() : "N/A"}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No quotes submitted yet</h3>
                      <p className="text-slate-500 dark:text-slate-400">
                        Submit quotes to RFQs to see them here
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>

        <MobileBottomNav />
      </div>
    </div>
  );
}
