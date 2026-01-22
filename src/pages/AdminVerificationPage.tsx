import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Shield, CheckCircle, XCircle, Clock, FileText, 
  Building2, User, Calendar, ExternalLink, Search,
  AlertTriangle
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface VerificationRequest {
  id: string;
  user_id: string;
  company_name: string;
  registration_number: string | null;
  document_url: string;
  document_type: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
}

export default function AdminVerificationPage() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Check admin role
  const { data: hasAdminRole, isLoading: checkingRole } = useQuery({
    queryKey: ['admin-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      return !!data;
    },
    enabled: !!user?.id,
  });

  // Fetch verification requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['verification-requests', statusFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('verification_requests')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.ilike('company_name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as VerificationRequest[];
    },
    enabled: !!hasAdminRole,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const request = requests?.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');

      // Update verification request
      const { error: updateError } = await supabase
        .from('verification_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          company_verified: true,
          verified_at: new Date().toISOString(),
          company: request.company_name,
        })
        .eq('id', request.user_id);

      if (profileError) throw profileError;

      // Notify user
      await supabase.from('user_alerts').insert({
        user_id: request.user_id,
        type: 'verification_approved',
        title: '✅ Company Verified!',
        message: `Congratulations! Your company "${request.company_name}" has been verified. You now have access to verified company features.`,
        is_read: false,
      });
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Company verification approved!' });
      queryClient.invalidateQueries({ queryKey: ['verification-requests'] });
      setSelectedRequest(null);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const request = requests?.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');

      const { error } = await supabase
        .from('verification_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          rejection_reason: reason,
        })
        .eq('id', requestId);

      if (error) throw error;

      // Notify user
      await supabase.from('user_alerts').insert({
        user_id: request.user_id,
        type: 'verification_rejected',
        title: '❌ Verification Rejected',
        message: `Your company verification for "${request.company_name}" was not approved. Reason: ${reason}. Please resubmit with correct documents.`,
        is_read: false,
      });
    },
    onSuccess: () => {
      toast({ title: 'Rejected', description: 'Company verification rejected' });
      queryClient.invalidateQueries({ queryKey: ['verification-requests'] });
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason('');
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  if (checkingRole) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!hasAdminRole) {
    return <Navigate to="/" replace />;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-7 h-7 text-primary" />
          Company Verification
        </h1>
        <p className="text-muted-foreground mt-1">
          Review and approve company verification requests
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['pending', 'approved', 'rejected', 'all'].map((status) => (
          <Card 
            key={status}
            className={`cursor-pointer transition-all ${statusFilter === status ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
            onClick={() => setStatusFilter(status)}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm capitalize text-muted-foreground">{status}</span>
                {status === 'pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                {status === 'approved' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {status === 'rejected' && <XCircle className="w-4 h-4 text-red-500" />}
                {status === 'all' && <FileText className="w-4 h-4 text-muted-foreground" />}
              </div>
              <p className="text-2xl font-bold mt-1">
                {requests?.filter(r => status === 'all' || r.status === status).length || 0}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by company name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : requests?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No verification requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests?.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-lg">{request.company_name}</h3>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>User: {request.user_id.slice(0, 8)}...</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>{request.document_type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Submitted: {formatDate(request.submitted_at)}</span>
                      </div>
                      {request.registration_number && (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          <span>Reg: {request.registration_number}</span>
                        </div>
                      )}
                    </div>

                    {request.rejection_reason && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5" />
                        <span>{request.rejection_reason}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(request.document_url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View Doc
                    </Button>
                    
                    {request.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => approveMutation.mutate(request.id)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRejectDialog(true);
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Verification Request</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Please provide a reason for rejecting the verification request for <strong>{selectedRequest?.company_name}</strong>.
            </p>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedRequest && rejectionReason) {
                  rejectMutation.mutate({ requestId: selectedRequest.id, reason: rejectionReason });
                }
              }}
              disabled={!rejectionReason || rejectMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
