import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Users, UserPlus, Edit, Trash2, LogOut } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const consortiumSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(1000).optional(),
  tenderId: z.string().optional(),
  maxMembers: z.number().min(2).max(50),
  requiredSkills: z.string().max(500).optional(),
});

type ConsortiumFormData = z.infer<typeof consortiumSchema>;

interface Consortium {
  id: number;
  name: string;
  description: string | null;
  tender_id: number | null;
  created_by: string;
  status: string | null;
  max_members: number | null;
  required_skills: string[] | null;
  created_at: string | null;
}

interface ConsortiumMember {
  id: number;
  consortium_id: number;
  user_id: string;
  role: string | null;
  expertise: string | null;
  joined_at: string | null;
}

interface Tender {
  id: number;
  title: string;
  deadline: string;
}

export default function Consortiums() {
  const [activeTab, setActiveTab] = useState<string>("my-consortiums");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [selectedConsortium, setSelectedConsortium] = useState<Consortium | null>(null);
  const [joinExpertise, setJoinExpertise] = useState("");
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ConsortiumFormData>({
    resolver: zodResolver(consortiumSchema),
    defaultValues: {
      name: "",
      description: "",
      tenderId: "",
      maxMembers: 10,
      requiredSkills: "",
    },
  });

  const editForm = useForm<ConsortiumFormData>({
    resolver: zodResolver(consortiumSchema),
  });

  const { data: consortiums, isLoading } = useQuery({
    queryKey: ["consortiums"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consortiums")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return (data || []) as Consortium[];
    },
  });

  const { data: myMemberships } = useQuery({
    queryKey: ["my-consortium-memberships"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("consortium_members")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return (data || []) as ConsortiumMember[];
    },
    enabled: !!user,
  });

  const { data: tenders } = useQuery({
    queryKey: ["tenders-for-consortiums"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenders")
        .select("id, title, deadline");
      
      if (error) throw error;
      return (data || []) as Tender[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ConsortiumFormData) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("consortiums").insert({
        name: data.name,
        description: data.description || null,
        tender_id: data.tenderId ? Number(data.tenderId) : null,
        created_by: user.id,
        status: "active",
        max_members: data.maxMembers,
        required_skills: data.requiredSkills
          ? data.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
          : null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consortiums"] });
      form.reset();
      setActiveTab("my-consortiums");
      toast({ title: "Consortium created successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating consortium",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ConsortiumFormData) => {
      if (!selectedConsortium) throw new Error("No consortium selected");

      const { error } = await supabase
        .from("consortiums")
        .update({
          name: data.name,
          description: data.description || null,
          tender_id: data.tenderId ? Number(data.tenderId) : null,
          max_members: data.maxMembers,
          required_skills: data.requiredSkills
            ? data.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
            : null,
        })
        .eq("id", selectedConsortium.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consortiums"] });
      setEditDialogOpen(false);
      setSelectedConsortium(null);
      toast({ title: "Consortium updated successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating consortium",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConsortium) throw new Error("No consortium selected");

      const { error } = await supabase
        .from("consortiums")
        .delete()
        .eq("id", selectedConsortium.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consortiums"] });
      setDeleteDialogOpen(false);
      setSelectedConsortium(null);
      toast({ title: "Consortium deleted successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting consortium",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedConsortium) throw new Error("Missing data");

      const { error } = await supabase.from("consortium_members").insert({
        consortium_id: selectedConsortium.id,
        user_id: user.id,
        role: "member",
        expertise: joinExpertise || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-consortium-memberships"] });
      setJoinDialogOpen(false);
      setSelectedConsortium(null);
      setJoinExpertise("");
      toast({ title: "Successfully joined consortium!" });
    },
    onError: (error: any) => {
      toast({
        title: "Error joining consortium",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedConsortium) throw new Error("Missing data");

      const { error } = await supabase
        .from("consortium_members")
        .delete()
        .eq("consortium_id", selectedConsortium.id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-consortium-memberships"] });
      setLeaveDialogOpen(false);
      setSelectedConsortium(null);
      toast({ title: "Successfully left consortium." });
    },
    onError: (error: any) => {
      toast({
        title: "Error leaving consortium",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openEdit = (consortium: Consortium) => {
    setSelectedConsortium(consortium);
    editForm.reset({
      name: consortium.name,
      description: consortium.description || "",
      tenderId: consortium.tender_id?.toString() || "",
      maxMembers: consortium.max_members || 10,
      requiredSkills: consortium.required_skills?.join(", ") || "",
    });
    setEditDialogOpen(true);
  };

  const openDelete = (consortium: Consortium) => {
    setSelectedConsortium(consortium);
    setDeleteDialogOpen(true);
  };

  const openJoin = (consortium: Consortium) => {
    setSelectedConsortium(consortium);
    setJoinExpertise("");
    setJoinDialogOpen(true);
  };

  const openLeave = (consortium: Consortium) => {
    setSelectedConsortium(consortium);
    setLeaveDialogOpen(true);
  };

  const getTenderForConsortium = (tenderId: number | null) => {
    if (!tenderId || !tenders) return null;
    return tenders.find(t => t.id === tenderId);
  };

  const isMyConsortium = (consortium: Consortium) => {
    return user && consortium.created_by === user.id;
  };

  const isMember = (consortiumId: number) => {
    return myMemberships?.some(m => m.consortium_id === consortiumId);
  };

  const myConsortiums = consortiums?.filter(c => isMyConsortium(c) || isMember(c.id)) || [];
  const availableConsortiums = consortiums?.filter(c => c.status === "active" && !isMyConsortium(c) && !isMember(c.id)) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <section className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Users className="h-6 w-6 text-blue-500" />
            <h1 className="text-2xl lg:text-3xl font-bold">Consortiums</h1>
          </div>
          <p className="text-muted-foreground">
            Collaborate and conquer: Join or create consortiums to bid on tenders together.
          </p>
        </section>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Consortium</DialogTitle>
              <DialogDescription>Update consortium details.</DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
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
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="tenderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Tender (optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No specific tender</SelectItem>
                          {tenders?.map((tender) => (
                            <SelectItem key={tender.id} value={String(tender.id)}>
                              {tender.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="maxMembers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Members</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={2}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="requiredSkills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Required Skills</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Legal, QS" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Consortium</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedConsortium?.name}"? This will remove all members and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteMutation.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Join Dialog */}
        <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join {selectedConsortium?.name}</DialogTitle>
              <DialogDescription>Request to join this consortium.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="expertise">Your Expertise</Label>
                <Input
                  id="expertise"
                  value={joinExpertise}
                  onChange={(e) => setJoinExpertise(e.target.value)}
                  placeholder="e.g., Legal Consultant, Quantity Surveyor"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
                {joinMutation.isPending ? "Joining..." : "Join Consortium"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Leave Dialog */}
        <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Leave Consortium</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to leave "{selectedConsortium?.name}"?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => leaveMutation.mutate()}>
                {leaveMutation.isPending ? "Leaving..." : "Leave"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Content */}
        <section>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="my-consortiums">My Consortiums</TabsTrigger>
              <TabsTrigger value="find-consortium">Find Consortium</TabsTrigger>
              <TabsTrigger value="create-consortium">
                <div className="flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Create</span>
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="my-consortiums" className="space-y-4">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : myConsortiums.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myConsortiums.map((consortium) => {
                    const tender = getTenderForConsortium(consortium.tender_id);
                    const isOwner = isMyConsortium(consortium);
                    return (
                      <Card key={consortium.id} className="hover:border-primary transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold">{consortium.name}</h3>
                            <div className="flex items-center gap-1">
                              <Badge variant={consortium.status === "active" ? "default" : "secondary"}>
                                {consortium.status}
                              </Badge>
                              {isOwner && (
                                <Badge variant="outline" className="text-xs">Owner</Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {consortium.description || "No description provided"}
                          </p>
                          {consortium.required_skills && consortium.required_skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {consortium.required_skills.slice(0, 3).map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {tender && (
                            <p className="text-xs text-blue-500 mb-2">
                              Related: {tender.title}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mb-4">
                            Max Members: {consortium.max_members || 10}
                          </p>
                          
                          <div className="flex gap-2">
                            {isOwner ? (
                              <>
                                <Button size="sm" variant="outline" onClick={() => openEdit(consortium)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => openDelete(consortium)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => openLeave(consortium)}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Leave
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No consortiums yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Join or create a consortium to collaborate on tenders.
                    </p>
                    <Button variant="outline" onClick={() => setActiveTab("create-consortium")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Consortium
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="find-consortium">
              {availableConsortiums.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableConsortiums.map((consortium) => {
                    const tender = getTenderForConsortium(consortium.tender_id);
                    return (
                      <Card key={consortium.id} className="hover:border-primary transition-colors">
                        <CardContent className="p-4">
                          <h3 className="text-lg font-semibold mb-2">{consortium.name}</h3>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {consortium.description || "No description provided"}
                          </p>
                          {consortium.required_skills && consortium.required_skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {consortium.required_skills.slice(0, 3).map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {tender && (
                            <p className="text-xs text-blue-500 mb-3">
                              Related: {tender.title}
                            </p>
                          )}
                          <Button size="sm" className="w-full" onClick={() => openJoin(consortium)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Request to Join
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No consortiums available</h3>
                    <p className="text-muted-foreground mb-4">
                      Check back later or create your own.
                    </p>
                    <Button variant="outline" onClick={() => setActiveTab("create-consortium")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Consortium
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="create-consortium">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Create a Consortium</h3>
                  <p className="text-muted-foreground mb-6">
                    Start a new consortium to collaborate with others on tender opportunities.
                  </p>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Consortium Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="tenderId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Related Tender (optional)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select tender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="">No specific tender</SelectItem>
                                  {tenders?.map((tender) => (
                                    <SelectItem key={tender.id} value={String(tender.id)}>
                                      {tender.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Describe the purpose and focus of this consortium..."
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="maxMembers"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Maximum Members</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={2}
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="requiredSkills"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Required Skills (comma separated)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g., Civil Engineering, QS, Legal"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setActiveTab("my-consortiums")}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending}>
                          {createMutation.isPending ? "Creating..." : "Create Consortium"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  );
}
