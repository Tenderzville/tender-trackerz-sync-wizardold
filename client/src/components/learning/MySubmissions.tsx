import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, FileText, GraduationCap, Clock, CheckCircle, XCircle, CreditCard, AlertCircle } from 'lucide-react';
import { usePaystack } from '@/hooks/use-paystack';

interface Submission {
  id: number;
  title: string;
  description: string | null;
  category?: string;
  level?: string;
  format?: string;
  payment_status: string;
  amount: number;
  is_approved: boolean;
  is_published: boolean;
  created_at: string;
  type: 'guide' | 'template' | 'course';
}

export function MySubmissions() {
  const { user } = useAuth();
  const { initializePayment, isLoading: payLoading } = usePaystack();

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['my-learning-submissions', user?.id],
    queryFn: async (): Promise<Submission[]> => {
      if (!user?.id) return [];

      const [guides, templates, courses] = await Promise.all([
        supabase.from('learning_guides').select('id, title, description, category, payment_status, amount, is_approved, is_published, created_at').eq('user_id', user.id),
        supabase.from('learning_templates').select('id, title, description, format, category, payment_status, amount, is_approved, is_published, created_at').eq('user_id', user.id),
        supabase.from('learning_courses').select('id, title, description, level, payment_status, amount, is_approved, is_published, created_at').eq('user_id', user.id),
      ]);

      return [
        ...(guides.data || []).map((g: any) => ({ ...g, type: 'guide' as const })),
        ...(templates.data || []).map((t: any) => ({ ...t, type: 'template' as const })),
        ...(courses.data || []).map((c: any) => ({ ...c, type: 'course' as const })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!user?.id,
  });

  const handlePay = async (item: Submission) => {
    if (!user?.email || !user?.id) return;
    await initializePayment(
      `learning_${item.type}_${item.id}`,
      user.email,
      user.id
    );
  };

  const getStatusBadge = (item: Submission) => {
    if (item.payment_status === 'rejected') {
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
    }
    if (item.is_published && item.is_approved) {
      return <Badge className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="h-3 w-3" /> Published</Badge>;
    }
    if (item.is_approved && item.payment_status !== 'paid') {
      return <Badge variant="secondary" className="gap-1"><CreditCard className="h-3 w-3" /> Payment Required</Badge>;
    }
    if (item.payment_status === 'paid' && !item.is_approved) {
      return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Paid — Under Review</Badge>;
    }
    if (item.payment_status === 'paid' && item.is_approved) {
      return <Badge className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="h-3 w-3" /> Active</Badge>;
    }
    return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pending Payment</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'guide': return <BookOpen className="h-5 w-5 text-primary" />;
      case 'template': return <FileText className="h-5 w-5 text-primary" />;
      case 'course': return <GraduationCap className="h-5 w-5 text-primary" />;
      default: return null;
    }
  };

  if (!user) {
    return (
      <Card><CardContent className="p-8 text-center text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="font-medium">Sign in to view your submissions</p>
        <p className="text-sm mt-1">You need to be logged in to track your submitted content.</p>
      </CardContent></Card>
    );
  }

  if (isLoading) {
    return <div className="grid gap-4">{[1,2].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>;
  }

  if (submissions.length === 0) {
    return (
      <Card><CardContent className="p-8 text-center text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No submissions yet</p>
        <p className="text-sm mt-1">Click "Submit Content" to share your guides, templates, or courses with the community.</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Flow explanation */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>How it works:</strong> Submit content → Pay listing fee via Paystack (M-Pesa/Card) → Admin reviews → Content published on the Learning Hub.
          </p>
        </CardContent>
      </Card>

      {submissions.map((item) => (
        <Card key={`${item.type}-${item.id}`}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="mt-0.5">{getTypeIcon(item.type)}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant="outline" className="text-xs capitalize">{item.type}</Badge>
                    {item.category && <Badge variant="secondary" className="text-xs">{item.category}</Badge>}
                    {item.level && <Badge variant="secondary" className="text-xs">{item.level}</Badge>}
                    {item.format && <Badge variant="secondary" className="text-xs">{item.format}</Badge>}
                  </div>
                  <h3 className="font-medium truncate">{item.title}</h3>
                  {item.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{item.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>KSh {item.amount.toLocaleString()}</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                {getStatusBadge(item)}
                {item.payment_status === 'pending' && (
                  <Button size="sm" onClick={() => handlePay(item)} disabled={payLoading} className="gap-1">
                    <CreditCard className="h-3.5 w-3.5" />
                    Pay KSh {item.amount.toLocaleString()}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
