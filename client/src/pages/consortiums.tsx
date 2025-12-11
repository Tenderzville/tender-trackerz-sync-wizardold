import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, UserPlus } from "lucide-react";

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

interface Tender {
  id: number;
  title: string;
  deadline: string;
}

export default function Consortiums() {
  const [selectedConsortium, setSelectedConsortium] = useState<Consortium | null>(null);

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

  const getTenderForConsortium = (tenderId: number | null) => {
    if (!tenderId || !tenders) return null;
    return tenders.find(t => t.id === tenderId);
  };

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

        {/* Content */}
        <section>
          <Tabs defaultValue="my-consortiums" className="space-y-4">
            <TabsList>
              <TabsTrigger value="my-consortiums">My Consortiums</TabsTrigger>
              <TabsTrigger value="find-consortium">Find Consortium</TabsTrigger>
              <TabsTrigger value="create-consortium">
                <div className="flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Create Consortium</span>
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
              ) : consortiums && consortiums.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {consortiums.map((consortium) => {
                    const tender = getTenderForConsortium(consortium.tender_id);
                    return (
                      <Card 
                        key={consortium.id} 
                        className="cursor-pointer hover:border-primary transition-colors" 
                        onClick={() => setSelectedConsortium(consortium)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold">{consortium.name}</h3>
                            <Badge variant={consortium.status === "active" ? "default" : "secondary"}>
                              {consortium.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
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
                            <p className="text-xs text-blue-500 mt-2">
                              Related Tender: {tender.title}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Max Members: {consortium.max_members || 10}
                          </p>
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
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Consortium
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="find-consortium">
              {consortiums && consortiums.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {consortiums.filter(c => c.status === "active").map((consortium) => {
                    const tender = getTenderForConsortium(consortium.tender_id);
                    return (
                      <Card key={consortium.id} className="hover:border-primary transition-colors">
                        <CardContent className="p-4">
                          <h3 className="text-lg font-semibold mb-2">{consortium.name}</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {consortium.description || "No description provided"}
                          </p>
                          {tender && (
                            <p className="text-xs text-blue-500 mb-3">
                              Related Tender: {tender.title}
                            </p>
                          )}
                          <Button size="sm" className="w-full">
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
                    <h3 className="text-lg font-semibold mb-2">No consortiums available to join</h3>
                    <p className="text-muted-foreground mb-4">
                      Check back later for available consortiums or create your own.
                    </p>
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Consortium
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="create-consortium">
              <Card>
                <CardContent className="p-6 text-center">
                  <UserPlus className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Create a Consortium</h3>
                  <p className="text-muted-foreground mb-4">
                    Start a new consortium to collaborate with others on tender opportunities.
                  </p>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Consortium
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Selected consortium details */}
          {selectedConsortium && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{selectedConsortium.name}</h4>
                <Button variant="ghost" size="sm" onClick={() => setSelectedConsortium(null)}>
                  Close
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {selectedConsortium.description || "No description provided"}
              </p>
              {selectedConsortium.tender_id && (
                <div className="mt-2">
                  <h5 className="text-sm font-medium mb-1">Related Tender</h5>
                  {getTenderForConsortium(selectedConsortium.tender_id) && (
                    <>
                      <p className="text-sm">
                        {getTenderForConsortium(selectedConsortium.tender_id)?.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Deadline: {new Date(getTenderForConsortium(selectedConsortium.tender_id)?.deadline || "").toLocaleDateString()}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
