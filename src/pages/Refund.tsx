import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowLeft } from 'lucide-react';

const Refund = () => {
  return (
    <div className="min-h-screen hero-gradient">
      <header className="sticky top-0 z-50 glass-effect border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">IPRG</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="font-display text-3xl">Refund Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p className="text-muted-foreground">Last updated: January 2024</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">1. Digital Product Nature</h2>
            <p>IPRG provides AI-generated digital content (internship project reports). Due to the nature of digital products that are delivered instantly, the following refund policy applies.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">2. No Refund After Generation</h2>
            <p>Once a report has been successfully generated and made available for download, <strong>no refund will be provided</strong>. This is because:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The service (AI processing) has been fully delivered</li>
              <li>The digital content has been created specifically for you</li>
              <li>The content cannot be "returned"</li>
            </ul>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">3. Eligible Refund Cases</h2>
            <p>Refunds may be considered only in the following cases:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Failed Generation:</strong> If the system fails to generate a report and no content is delivered</li>
              <li><strong>Technical Error:</strong> If a payment is processed but no service is provided due to technical issues</li>
              <li><strong>Duplicate Payment:</strong> If the same order is charged multiple times</li>
            </ul>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">4. Refund Request Process</h2>
            <p>To request a refund:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Submit a request within <strong>48 hours</strong> of the issue</li>
              <li>Email <a href="mailto:support@iprg.in" className="text-primary hover:underline">support@iprg.in</a> with:
                <ul className="list-disc pl-6 mt-2">
                  <li>Your registered email</li>
                  <li>Payment ID / Order ID</li>
                  <li>Description of the issue</li>
                  <li>Screenshots if applicable</li>
                </ul>
              </li>
              <li>Allow 3-5 business days for review</li>
            </ol>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">5. Refund Timeline</h2>
            <p>If a refund is approved:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Refund will be processed within 5-7 business days</li>
              <li>Amount will be credited to the original payment method</li>
              <li>Bank processing may take additional 2-3 days</li>
            </ul>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">6. Non-Refundable Cases</h2>
            <p>Refunds will NOT be provided for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Dissatisfaction with content quality (you can regenerate)</li>
              <li>Change of mind after generation</li>
              <li>Failure to read instructions or terms</li>
              <li>Reports rejected by educational institutions</li>
              <li>Requests made after 48 hours</li>
            </ul>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">7. Contact</h2>
            <p>For refund queries, contact us at <a href="mailto:support@iprg.in" className="text-primary hover:underline">support@iprg.in</a></p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Refund;
