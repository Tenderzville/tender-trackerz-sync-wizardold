import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Shield, FileText, AlertTriangle, Scale, Clock, Users, CreditCard } from "lucide-react";

export default function TermsPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="container mx-auto max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => setLocation(-1 as any)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Terms & Conditions</h1>
          <p className="text-muted-foreground">
            Last updated: January 2026
          </p>
        </div>

        <div className="space-y-6">
          {/* Founding Members Program */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Founding Members Program
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="bg-primary/5 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">100 Founding Members Access</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• <strong>Verified businesses only:</strong> Company name verification required</li>
                  <li>• <strong>One free month per company:</strong> Maximum one founding member slot per registered business</li>
                  <li>• <strong>Auto-convert to paid:</strong> After 30 days, your subscription will prompt for payment to continue</li>
                  <li>• <strong>No downgrade during free month:</strong> Founding members cannot downgrade during the complimentary period</li>
                  <li>• <strong>Founding badge removed after 30 days:</strong> The Founding Member status expires after the free period</li>
                  <li>• <strong>First-come, first-served:</strong> Only the first 100 verified businesses qualify</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Platform Purpose */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Platform Purpose & Limitations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                TenderAlert Pro is a <strong>decision-support platform</strong> designed to help Kenyan businesses 
                discover and analyze public procurement opportunities. The platform aggregates publicly available 
                tender information from government portals.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Important Disclaimer</h4>
                    <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                      We make <strong>no guarantees of tender success</strong>. Bid Readiness Scores, 
                      AI analysis, and historical data are for <strong>reference purposes only</strong> and 
                      do not predict or guarantee future outcomes.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-500" />
                Subscription & Payment Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <ul className="space-y-2">
                <li><strong>Billing:</strong> Subscriptions are billed monthly or annually in Kenyan Shillings (KES)</li>
                <li><strong>Auto-renewal:</strong> Subscriptions automatically renew unless cancelled before the renewal date</li>
                <li><strong>Renewal reminders:</strong> You will receive alerts 7 days and 3 days before your subscription expires</li>
                <li><strong>Access termination:</strong> Premium features are blocked immediately upon subscription expiry</li>
                <li><strong>Downgrades:</strong> Plan downgrades require a support request and cannot be done self-service</li>
                <li><strong>Upgrades:</strong> Plan upgrades take effect immediately upon payment confirmation</li>
                <li><strong>Refunds:</strong> No refunds for partial months or unused subscription periods</li>
              </ul>
            </CardContent>
          </Card>

          {/* Historical Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                Historical Data Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Historical tender award data is sourced from public records and third-party datasets. 
                This information is provided <strong>for reference only</strong> and:
              </p>
              <ul className="space-y-1">
                <li>• May contain inaccuracies or outdated information</li>
                <li>• Does not represent predictions of future tender outcomes</li>
                <li>• Should not be the sole basis for business decisions</li>
                <li>• Has been adjusted for inflation and normalized for analysis purposes</li>
              </ul>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-orange-500" />
                User Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <ul className="space-y-2">
                <li><strong>Verification:</strong> Always verify tender details with the issuing organization before bidding</li>
                <li><strong>Compliance:</strong> Ensure compliance with all applicable Kenyan procurement laws and regulations</li>
                <li><strong>Account security:</strong> Maintain the confidentiality of your login credentials</li>
                <li><strong>Accurate information:</strong> Provide accurate company and contact information</li>
                <li><strong>Lawful use:</strong> Use the platform only for lawful business purposes</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-teal-500" />
                Data Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <ul className="space-y-2">
                <li>Your personal and business data is encrypted and stored securely</li>
                <li>We do not share your information with third parties without consent</li>
                <li>Payment information is processed securely via Paystack (PCI-DSS compliant)</li>
                <li>You may request data deletion by contacting support</li>
              </ul>
            </CardContent>
          </Card>

          {/* Liability */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <p className="text-red-700 dark:text-red-300">
                  TenderAlert Pro, its operators, and affiliates shall not be liable for any direct, 
                  indirect, incidental, or consequential damages arising from:
                </p>
                <ul className="mt-2 space-y-1 text-red-600 dark:text-red-400">
                  <li>• Failed tender applications or bids</li>
                  <li>• Inaccurate or delayed tender information</li>
                  <li>• Business decisions made based on platform data</li>
                  <li>• Service interruptions or technical issues</li>
                  <li>• Third-party actions or government policy changes</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                For questions about these terms, contact us at{" "}
                <a href="mailto:legal@tenderzville.com" className="text-primary hover:underline">
                  legal@tenderzville.com
                </a>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                By using TenderAlert Pro, you agree to these Terms & Conditions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
