import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Users, UserPlus, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Consortium {
  id: number;
  name: string;
  description: string;
  tenderId: number;
  createdBy: string;
  status: string;
  maxMembers: number;
  requiredSkills: string[];
  createdAt: string;
  updatedAt: string;
  tender?: any; // Assuming you have a Tender type
}

export default function Consortiums() {
  const [selectedConsortium, setSelectedConsortium] = useState<Consortium | null>(null);

  const { data: consortiums, isLoading } = useQuery<Consortium[]>({
    queryKey: ["/api/consortiums"],
  });

  // Mock function to fetch tender details (replace with actual API call)
  const fetchTenderDetails = async (tenderId: number) => {
    const tender = await apiRequest("GET", `/api/tenders/${tenderId}`);
    return tender;
  };

  // Fetch tender details for each consortium
  useQuery({
    queryKey: ["consortiumTenders", consortiums?.map(c => c.id)],
    queryFn: async () => {
      if (consortiums) {
        for (const consortium of consortiums) {
          if (consortium.tenderId) {
            try {
              const tender = await fetchTenderDetails(consortium.tenderId);
              consortium.tender = tender;
            } catch (error) {
              console.error(`Failed to fetch tender details for consortium ${consortium.id}:`, error);
            }
          }
        }
      }
    },
    enabled: !!consortiums,
  });

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <DesktopSidebar />
      
      <div className="flex-1 overflow-auto">
        <MobileHeader />
        
        {/* Header */}
        <section className="p-6 lg:p-8 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-3 mb-2">
              <Users className="h-6 w-6 text-blue-500" />
              <h1 className="text-2xl lg:text-3xl font-bold">Consortiums</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Collaborate and conquer: Join or create consortiums to bid on tenders together.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
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
                  <p>Loading consortiums...</p>
                ) : consortiums && consortiums.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {consortiums.map((consortium) => (
                      <Card key={consortium.id} className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => setSelectedConsortium(consortium)}>
                        <CardContent className="p-4">
                          <h3 className="text-lg font-semibold mb-2">{consortium.name}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {consortium.description}
                          </p>
                          {consortium.tender && (
                            <p className="text-xs text-blue-500 mt-2">
                              Related Tender: {consortium.tender.title}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Users className="h-10 w-10 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No consortiums yet</h3>
                      <p className="text-slate-500 dark:text-slate-400 mb-4">
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
                <Card>
                  <CardContent className="p-6 text-center">
                    <Users className="h-10 w-10 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No consortiums available to join</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">
                      Check back later for available consortiums or create your own.
                    </p>
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Consortium
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="create-consortium">
                <Card>
                  <CardContent className="p-6 text-center">
                    <UserPlus className="h-10 w-10 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Create a Consortium</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">
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
            
            {/* Update the tender deadline display */}
            {selectedConsortium?.tender && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <h4 className="font-semibold mb-2">Related Tender</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {selectedConsortium.tender.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Deadline: {selectedConsortium.tender.deadline ? 
                    new Date(selectedConsortium.tender.deadline).toLocaleDateString() : 
                    'Not specified'
                  }
                </p>
              </div>
            )}
          </div>
        </section>

        <MobileBottomNav />
      </div>
    </div>
  );
}
