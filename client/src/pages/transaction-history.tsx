import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Download, 
  Receipt, 
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Filter
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

interface PaymentReceipt {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data: {
    receipt_number?: string;
    amount?: number;
    currency?: string;
    plan?: string;
    plan_name?: string;
    payment_reference?: string;
    payment_date?: string;
    subscription_start?: string;
    subscription_end?: string;
    payment_method?: string;
    customer_email?: string;
    source?: string;
  };
}

interface SubscriptionHistoryItem {
  id: number;
  action: string;
  from_plan: string | null;
  to_plan: string | null;
  amount: number | null;
  currency: string;
  payment_reference: string | null;
  created_at: string;
  metadata: any;
}

export default function TransactionHistoryPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'receipts' | 'history'>('all');

  // Fetch payment receipts from user_alerts
  const { data: receipts, isLoading: receiptsLoading } = useQuery({
    queryKey: ['payment-receipts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'payment_receipt')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as PaymentReceipt[];
    },
    enabled: !!user?.id,
  });

  // Fetch subscription history
  const { data: subscriptionHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['subscription-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as SubscriptionHistoryItem[];
    },
    enabled: !!user?.id,
  });

  // Generate PDF receipt
  const downloadReceiptPDF = (receipt: PaymentReceipt) => {
    const receiptData = receipt.data;
    const content = `
╔══════════════════════════════════════════════════════════════╗
║                      TENDERALERT                             ║
║                    PAYMENT RECEIPT                           ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Receipt Number: ${receiptData.receipt_number || 'N/A'}
║  
║  Date: ${receiptData.payment_date ? format(new Date(receiptData.payment_date), 'PPP') : format(new Date(receipt.created_at), 'PPP')}
║  
║  ─────────────────────────────────────────────────────────── ║
║  PAYMENT DETAILS                                             ║
║  ─────────────────────────────────────────────────────────── ║
║  
║  Plan: ${receiptData.plan_name || receiptData.plan || 'N/A'}
║  Amount: ${receiptData.currency || 'KES'} ${receiptData.amount?.toLocaleString() || 'N/A'}
║  Payment Method: ${receiptData.payment_method || 'Paystack'}
║  Reference: ${receiptData.payment_reference || 'N/A'}
║  
║  ─────────────────────────────────────────────────────────── ║
║  SUBSCRIPTION PERIOD                                         ║
║  ─────────────────────────────────────────────────────────── ║
║  
║  Start Date: ${receiptData.subscription_start ? format(new Date(receiptData.subscription_start), 'PPP') : 'N/A'}
║  End Date: ${receiptData.subscription_end ? format(new Date(receiptData.subscription_end), 'PPP') : 'N/A'}
║  
║  ─────────────────────────────────────────────────────────── ║
║                                                              ║
║  Thank you for your subscription!                            ║
║  Support: support@tenderalert.co.ke                          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TenderAlert-Receipt-${receiptData.receipt_number || receipt.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (action: string) => {
    switch (action) {
      case 'subscription_activated':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Activated</Badge>;
      case 'payment_initialized':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'payment_failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const isLoading = receiptsLoading || historyLoading;
  const totalSpent = subscriptionHistory?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Receipt className="h-8 w-8 text-primary" />
            Transaction History
          </h1>
          <p className="text-muted-foreground">
            View your payment receipts and subscription history
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{receipts?.length || 0}</p>
                </div>
                <CreditCard className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">KES {totalSpent.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Since</p>
                  <p className="text-2xl font-bold">
                    {subscriptionHistory?.[subscriptionHistory.length - 1]?.created_at 
                      ? format(new Date(subscriptionHistory[subscriptionHistory.length - 1].created_at), 'MMM yyyy')
                      : 'N/A'}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="mb-6 flex items-center gap-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <Select value={filter} onValueChange={(v: 'all' | 'receipts' | 'history') => setFilter(v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="receipts">Payment Receipts</SelectItem>
              <SelectItem value="history">Subscription History</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Payment Receipts */}
            {(filter === 'all' || filter === 'receipts') && receipts && receipts.length > 0 && (
              <>
                {filter === 'all' && (
                  <h2 className="text-lg font-semibold flex items-center gap-2 mt-6 mb-4">
                    <FileText className="h-5 w-5" /> Payment Receipts
                  </h2>
                )}
                {receipts.map((receipt) => (
                  <Card key={receipt.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Receipt className="h-5 w-5 text-primary" />
                            <span className="font-semibold">
                              {receipt.data.receipt_number || `Receipt #${receipt.id}`}
                            </span>
                            <Badge variant="outline" className="text-green-600 border-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" /> Paid
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mt-3">
                            <div>
                              <p className="text-xs uppercase tracking-wide">Amount</p>
                              <p className="font-medium text-foreground">
                                {receipt.data.currency || 'KES'} {receipt.data.amount?.toLocaleString() || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide">Plan</p>
                              <p className="font-medium text-foreground capitalize">
                                {receipt.data.plan_name || receipt.data.plan || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide">Date</p>
                              <p className="font-medium text-foreground">
                                {receipt.data.payment_date 
                                  ? format(new Date(receipt.data.payment_date), 'PP')
                                  : format(new Date(receipt.created_at), 'PP')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide">Valid Until</p>
                              <p className="font-medium text-foreground">
                                {receipt.data.subscription_end 
                                  ? format(new Date(receipt.data.subscription_end), 'PP')
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadReceiptPDF(receipt)}
                          className="ml-4"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {/* Subscription History */}
            {(filter === 'all' || filter === 'history') && subscriptionHistory && subscriptionHistory.length > 0 && (
              <>
                {filter === 'all' && (
                  <h2 className="text-lg font-semibold flex items-center gap-2 mt-8 mb-4">
                    <Calendar className="h-5 w-5" /> Subscription History
                  </h2>
                )}
                {subscriptionHistory.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium capitalize">
                                {item.action.replace(/_/g, ' ')}
                              </span>
                              {getStatusBadge(item.action)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {item.from_plan && item.to_plan 
                                ? `${item.from_plan} → ${item.to_plan}`
                                : item.to_plan || 'Free'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {item.amount ? `${item.currency} ${item.amount.toLocaleString()}` : '-'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(item.created_at), 'PP')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {/* Empty State */}
            {(!receipts || receipts.length === 0) && (!subscriptionHistory || subscriptionHistory.length === 0) && (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center py-12">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No Transactions Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Your payment receipts and subscription history will appear here.
                  </p>
                  <Button variant="outline" onClick={() => window.location.href = '/subscription'}>
                    View Subscription Plans
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}