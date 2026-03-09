import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Shield, FileText, AlertTriangle, Scale, Clock, Users, CreditCard, Brain, Bot } from "lucide-react";

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
          <h1 className="text-3xl font-bold mb-2">Terms & Conditions and Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: March 2026
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
                discover and analyse public procurement opportunities. The platform aggregates publicly available 
                tender information from official government portals.
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

          {/* AI Disclaimer */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-500" />
                Artificial Intelligence (AI) Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Bot className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200">AI Can Make Mistakes</h4>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      TenderAlert Pro uses artificial intelligence to provide features such as Smart Matching, 
                      Win Probability Analysis, Bid Strategy Recommendations, and Tender Analysis. These AI-generated 
                      insights are <strong>estimates only</strong> and may contain errors, inaccuracies, or omissions.
                    </p>
                  </div>
                </div>
              </div>
              <ul className="space-y-2">
                <li>• <strong>Smart Matches:</strong> Match scores are based on your configured preferences (sectors, counties, keywords, budget). 
                  They represent an <em>Opportunity Alignment Index</em>, not a prediction of tender suitability or success. 
                  Results improve when you configure your preferences in Settings.</li>
                <li>• <strong>Win Probability:</strong> Calculated using historical data and statistical models. 
                  These are rough estimates and should not be relied upon as accurate predictions.</li>
                <li>• <strong>Bid Strategy:</strong> AI-generated bid ranges and recommendations are informational only. 
                  Always conduct your own independent cost analysis.</li>
                <li>• <strong>Data accuracy:</strong> AI may misinterpret, misclassify, or incompletely extract tender information 
                  from source portals. Always verify details directly with the procuring entity.</li>
                <li>• <strong>No liability:</strong> TenderAlert Pro accepts no responsibility for decisions made based on 
                  AI-generated insights. Users assume all risk when acting on AI recommendations.</li>
              </ul>
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
                <li>• Has been adjusted for inflation and normalised for analysis purposes</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                Data Collection & Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                TenderAlert Pro aggregates publicly available tender information from official Kenyan government 
                procurement portals including MyGov Kenya, e-GP Kenya, PPIP (tenders.go.ke), and PPRA. 
                This data is publicly accessible and is collected in compliance with applicable laws.
              </p>
              <ul className="space-y-1">
                <li>• We access only publicly published tender notices and award information</li>
                <li>• Information is processed and structured using automated tools and AI</li>
                <li>• We make reasonable efforts to ensure accuracy but cannot guarantee completeness</li>
                <li>• Tender details should always be verified with the issuing organisation</li>
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
                <li><strong>Verification:</strong> Always verify tender details with the issuing organisation before bidding</li>
                <li><strong>Compliance:</strong> Ensure compliance with all applicable Kenyan procurement laws and regulations</li>
                <li><strong>Account security:</strong> Maintain the confidentiality of your login credentials</li>
                <li><strong>Accurate information:</strong> Provide accurate company and contact information</li>
                <li><strong>Lawful use:</strong> Use the platform only for lawful business purposes</li>
                <li><strong>Due diligence:</strong> Perform your own independent research before making any business decisions based on platform data</li>
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
              <p><strong>What we collect:</strong></p>
              <ul className="space-y-1">
                <li>• Account information (name, email, company, phone number)</li>
                <li>• Business profile data (sectors, location, business type)</li>
                <li>• Usage data (pages visited, features used, tender preferences)</li>
                <li>• Payment information (processed securely via Paystack — we do not store card details)</li>
              </ul>
              <p className="mt-3"><strong>How we protect your data:</strong></p>
              <ul className="space-y-1">
                <li>• All data is encrypted in transit (TLS) and at rest</li>
                <li>• Row-Level Security (RLS) ensures users can only access their own data</li>
                <li>• Payment processing is PCI-DSS compliant via Paystack</li>
                <li>• Security audit logging tracks all sensitive operations</li>
                <li>• We do not sell or share your personal data with third parties without your consent</li>
              </ul>
              <p className="mt-3"><strong>Your rights:</strong></p>
              <ul className="space-y-1">
                <li>• You may request access to your personal data at any time</li>
                <li>• You may request deletion of your account and all associated data</li>
                <li>• You may update your personal information through your profile settings</li>
                <li>• Contact us at info [at] tenderzville-portal.co.ke for any privacy-related requests</li>
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
                  <li>• Inaccurate, incomplete, or delayed tender information</li>
                  <li>• Errors or inaccuracies in AI-generated insights, match scores, or recommendations</li>
                  <li>• Business decisions made based on platform data or AI analysis</li>
                  <li>• Service interruptions or technical issues</li>
                  <li>• Third-party actions or government policy changes</li>
                  <li>• Loss of revenue, contracts, or business opportunities</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                For questions about these terms or our privacy practices, contact us at{" "}
                <span className="text-primary font-medium">
                  info [at] tenderzville-portal.co.ke
                </span>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                By using TenderAlert Pro, you agree to these Terms & Conditions and Privacy Policy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
