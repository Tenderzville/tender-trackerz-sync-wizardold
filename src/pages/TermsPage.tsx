import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileText, AlertTriangle, Scale } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="text-center pt-6">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Scale className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground">Terms & Conditions</h1>
        <p className="text-muted-foreground mt-2">Last updated: January 2026</p>
      </div>

      {/* Introduction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            1. Nature of the Platform
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            The Platform provides <strong>information services only</strong> and functions as a 
            decision-support and marketplace intelligence tool for suppliers and other users 
            participating in procurement processes.
          </p>
          <p>
            The Platform does not participate in tender evaluations, does not influence procuring 
            entities, and does not determine or affect tender outcomes.
          </p>
        </CardContent>
      </Card>

      {/* No Guarantees */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            2. No Guarantees or Predictions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>The Platform does not guarantee, represent, or warrant:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Tender success or award</li>
            <li>Shortlisting or evaluation outcomes</li>
            <li>Accuracy, completeness, or suitability of any insight for a particular purpose</li>
            <li>That any supplier will be awarded a contract</li>
          </ul>
          <p className="mt-4">
            Any references to scores, indices, insights, benchmarks, ranges, or trends are 
            <strong> informational only</strong> and must not be interpreted as predictions or 
            probabilities of success.
          </p>
        </CardContent>
      </Card>

      {/* Historical Data */}
      <Card>
        <CardHeader>
          <CardTitle>3. Use of Historical Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            The Platform may display historical, aggregated, or anonymized data derived from 
            past tenders, submissions, or marketplace activity.
          </p>
          <p>Users acknowledge and agree that:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Historical data reflects past observations only</li>
            <li>Past patterns do not guarantee future outcomes</li>
            <li>Historical references are provided solely for contextual understanding</li>
            <li>Procuring entities retain full discretion in tender evaluations</li>
          </ul>
          <p className="mt-4 font-medium">
            The Platform makes no representations that historical trends will apply to any 
            current or future tender.
          </p>
        </CardContent>
      </Card>

      {/* Informational Scores */}
      <Card>
        <CardHeader>
          <CardTitle>4. Informational Scores and Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Any scores, indices, or insights displayed on the Platform (including but not limited 
            to "Bid Readiness Score", "Tender Fit Index", "Historical Alignment Index", or similar):
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Are not predictions</li>
            <li>Are not professional advice</li>
            <li>Are not recommendations</li>
            <li>Are based on non-exhaustive information, including user-submitted data and aggregated marketplace signals</li>
          </ul>
          <p className="mt-4">
            These outputs are intended to assist users in understanding alignment and context, 
            not to determine bidding decisions.
          </p>
        </CardContent>
      </Card>

      {/* User Submitted Data */}
      <Card>
        <CardHeader>
          <CardTitle>5. User-Submitted Information & Sentiment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Users may voluntarily submit information, declarations, or sentiment inputs 
            (e.g. confidence levels, experience indicators).
          </p>
          <p>Users acknowledge that:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Such inputs are self-reported</li>
            <li>The Platform does not independently verify all user-submitted information</li>
            <li>Aggregated sentiment data is anonymized and used for contextual insights only</li>
          </ul>
          <p className="mt-4">
            The Platform is not responsible for decisions made based on self-reported or 
            third-party data.
          </p>
        </CardContent>
      </Card>

      {/* No Professional Advice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            6. No Professional Advice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Nothing on the Platform constitutes or should be construed as:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Legal advice</li>
            <li>Financial advice</li>
            <li>Procurement advice</li>
            <li>Investment advice</li>
            <li>Business or strategic advice</li>
          </ul>
          <p className="mt-4 font-medium">
            Users are solely responsible for seeking independent professional advice before 
            participating in any tender or procurement activity.
          </p>
        </CardContent>
      </Card>

      {/* Limitation of Reliance */}
      <Card>
        <CardHeader>
          <CardTitle>7. Limitation of Reliance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>By using the Platform, users expressly acknowledge and agree that:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>They do not rely on the Platform for tender outcomes</li>
            <li>They assume full responsibility for bidding decisions</li>
            <li>They understand that tender awards are made exclusively by procuring entities</li>
          </ul>
          <p className="mt-4">
            The Platform shall not be liable for any loss, damage, cost, or expense arising 
            from reliance on informational insights provided.
          </p>
        </CardContent>
      </Card>

      {/* Limitation of Liability */}
      <Card>
        <CardHeader>
          <CardTitle>8. Limitation of Liability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            To the maximum extent permitted by law, the Platform, its owners, affiliates, 
            directors, employees, and agents shall not be liable for:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Loss of profits</li>
            <li>Loss of opportunity</li>
            <li>Failed tender submissions</li>
            <li>Rejected bids</li>
            <li>Business interruption</li>
            <li>Indirect or consequential damages</li>
          </ul>
          <p className="mt-4">
            This applies regardless of whether such loss arises from the use of insights, 
            historical data, or marketplace information.
          </p>
        </CardContent>
      </Card>

      {/* AI Disclosure */}
      <Card>
        <CardHeader>
          <CardTitle>9. AI & Automated Systems Disclosure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            The Platform may use automated systems, algorithms, or artificial intelligence 
            to generate informational insights.
          </p>
          <p>Users acknowledge that:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Automated outputs are based on defined methodologies</li>
            <li>Such systems do not possess foresight or decision-making authority</li>
            <li>Outputs may change as data inputs or methodologies evolve</li>
          </ul>
          <p className="mt-4 font-medium">
            No automated output constitutes a factual determination or outcome forecast.
          </p>
        </CardContent>
      </Card>

      {/* Methodology Changes */}
      <Card>
        <CardHeader>
          <CardTitle>10. Methodology Changes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>The Platform reserves the right to:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Modify scoring methodologies</li>
            <li>Update data sources</li>
            <li>Improve or remove insight features</li>
          </ul>
          <p className="mt-4">
            Such changes do not create any obligation to maintain prior outputs or interpretations.
          </p>
        </CardContent>
      </Card>

      {/* Acceptance of Risk */}
      <Card>
        <CardHeader>
          <CardTitle>11. Acceptance of Risk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Use of the Platform is at the user's sole risk.</p>
          <p>Users accept that:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Procurement processes involve uncertainty</li>
            <li>External factors beyond the Platform's control influence outcomes</li>
            <li>The Platform is a support tool, not a decision maker</li>
          </ul>
        </CardContent>
      </Card>

      {/* Governing Law */}
      <Card>
        <CardHeader>
          <CardTitle>12. Governing Law & Jurisdiction</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            These Terms shall be governed by and construed in accordance with the laws of 
            the Republic of Kenya, without regard to conflict of law principles. Any disputes 
            arising from these Terms shall be subject to the exclusive jurisdiction of the 
            courts of Kenya.
          </p>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Questions about these terms? Contact us at{' '}
            <a href="mailto:legal@tenderalerts.co.ke" className="text-primary hover:underline">
              legal@tenderalerts.co.ke
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
