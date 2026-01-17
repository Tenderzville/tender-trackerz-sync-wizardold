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
import { useToast } from '@/hooks/use-toast';
import { Handshake, Plus, Users, UserPlus, LogOut } from 'lucide-react';

export default function ConsortiumsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    required_skills: [] as string[],
  });
  const [newSkill, setNewSkill] = useState('');

  // Fetch all consortiums
  const { data: consortiums, isLoading } = useQuery({
    queryKey: ['consortiums'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consortiums')
        .select(`
          *,
          consortium_members(
            id,
            user_id,
            role,
            expertise
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch user's consortiums
  const { data: myConsortiums } = useQuery({
    queryKey: ['my-consortiums', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('consortium_members')
        .select(`
          consortium_id,
          role,
          consortiums(*)
        `)
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Create consortium mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Create consortium
      const { data: consortium, error } = await supabase
        .from('consortiums')
        .insert({
          name: data.name,
          description: data.description,
          created_by: user.id,
          required_skills: data.required_skills,
          status: 'active',
        })
        .select()
        .single();
      
      if (error) throw error;

      // Add creator as leader
      const { error: memberError } = await supabase
        .from('consortium_members')
        .insert({
          consortium_id: consortium.id,
          user_id: user.id,
          role: 'leader',
        });
      
      if (memberError) throw memberError;
      
      return consortium;
    },
    onSuccess: () => {
      toast({ title: 'Consortium created successfully!' });
      queryClient.invalidateQueries({ queryKey: ['consortiums'] });
      queryClient.invalidateQueries({ queryKey: ['my-consortiums'] });
      setCreateOpen(false);
      setFormData({ name: '', description: '', required_skills: [] });
    },
    onError: (error: any) => {
      toast({ title: 'Error creating consortium', description: error.message, variant: 'destructive' });
    },
  });

  // Join consortium mutation
  const joinMutation = useMutation({
    mutationFn: async (consortiumId: number) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('consortium_members')
        .insert({
          consortium_id: consortiumId,
          user_id: user.id,
          role: 'member',
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Joined consortium successfully!' });
      queryClient.invalidateQueries({ queryKey: ['consortiums'] });
      queryClient.invalidateQueries({ queryKey: ['my-consortiums'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error joining consortium', description: error.message, variant: 'destructive' });
    },
  });

  // Leave consortium mutation
  const leaveMutation = useMutation({
    mutationFn: async (consortiumId: number) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('consortium_members')
        .delete()
        .eq('consortium_id', consortiumId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Left consortium successfully' });
      queryClient.invalidateQueries({ queryKey: ['consortiums'] });
      queryClient.invalidateQueries({ queryKey: ['my-consortiums'] });
    },
  });

  const addSkill = () => {
    if (newSkill && !formData.required_skills.includes(newSkill)) {
      setFormData(prev => ({
        ...prev,
        required_skills: [...prev.required_skills, newSkill]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills.filter(s => s !== skill)
    }));
  };

  const isUserMember = (consortiumId: number) => {
    return myConsortiums?.some((m: any) => m.consortium_id === consortiumId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            <Handshake className="w-7 h-7" />
            Consortiums
          </h1>
          <p className="text-muted-foreground mt-1">
            Team up with other suppliers to bid on larger tenders
          </p>
        </div>
        
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Consortium
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Consortium</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Consortium Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Nairobi IT Alliance"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose and focus of this consortium..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Required Skills</Label>
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <Button type="button" variant="outline" onClick={addSkill}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.required_skills.map(skill => (
                      <Badge key={skill} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(skill)}>
                        {skill} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => createMutation.mutate(formData)}
                disabled={!formData.name}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Consortiums</TabsTrigger>
          <TabsTrigger value="my">My Consortiums ({myConsortiums?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : consortiums?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Handshake className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No consortiums yet</h3>
                <p className="text-muted-foreground">Be the first to create a consortium!</p>
              </CardContent>
            </Card>
          ) : (
            consortiums?.map((consortium: any) => (
              <Card key={consortium.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="default">{consortium.status}</Badge>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          {consortium.consortium_members?.length || 0} / {consortium.max_members || 10} members
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-2">{consortium.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{consortium.description}</p>
                      
                      {consortium.required_skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {consortium.required_skills.map((skill: string) => (
                            <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      {isUserMember(consortium.id) ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => leaveMutation.mutate(consortium.id)}
                        >
                          <LogOut className="w-4 h-4 mr-1" />
                          Leave
                        </Button>
                      ) : (
                        <Button 
                          size="sm"
                          onClick={() => joinMutation.mutate(consortium.id)}
                          disabled={(consortium.consortium_members?.length || 0) >= (consortium.max_members || 10)}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Join
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="my" className="mt-4 space-y-4">
          {myConsortiums?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Handshake className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Not a member of any consortium</h3>
                <p className="text-muted-foreground">Join or create a consortium to collaborate with others</p>
              </CardContent>
            </Card>
          ) : (
            myConsortiums?.map((membership: any) => (
              <Card key={membership.consortium_id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={membership.role === 'leader' ? 'default' : 'secondary'}>
                          {membership.role}
                        </Badge>
                      </div>
                      <h3 className="font-semibold">{membership.consortiums?.name}</h3>
                      <p className="text-sm text-muted-foreground">{membership.consortiums?.description}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
