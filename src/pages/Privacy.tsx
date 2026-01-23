import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowLeft } from 'lucide-react';

const Privacy = () => {
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
            <span className="font-display font-bold text-xl">InternReport.in</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="font-display text-3xl">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p className="text-muted-foreground">Last updated: January 2024</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">1. Information We Collect</h2>
            <p>We collect the following information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Email address and password (encrypted)</li>
              <li><strong>Academic Information:</strong> Name, register number, course, college, university details</li>
              <li><strong>Internship Details:</strong> Company name, location, duration, project details</li>
              <li><strong>Payment Information:</strong> Razorpay order ID and payment ID only (no card/UPI details stored)</li>
            </ul>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">2. How We Use Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Generate customized internship reports</li>
              <li>Process payments securely</li>
              <li>Provide customer support</li>
              <li>Improve our services</li>
              <li>Send service-related communications</li>
            </ul>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">3. Data Security</h2>
            <p>We implement robust security measures:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Passwords are encrypted using industry-standard methods</li>
              <li>All data transmission uses HTTPS encryption</li>
              <li>Payment processing is handled by PCI-DSS compliant Razorpay</li>
              <li>Regular security audits and updates</li>
            </ul>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">4. Data Sharing</h2>
            <p>We do not sell your personal data. We may share data with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Razorpay for payment processing</li>
              <li>AI service providers for report generation (anonymized)</li>
              <li>Legal authorities when required by law</li>
            </ul>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">5. Data Retention</h2>
            <p>We retain your data for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account data: As long as your account is active</li>
              <li>Generated reports: 1 year for download access</li>
              <li>Payment records: As required by law (typically 7 years)</li>
            </ul>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your account</li>
              <li>Export your data</li>
            </ul>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">7. Cookies</h2>
            <p>We use essential cookies for authentication and session management. No tracking cookies are used.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">8. Contact</h2>
            <p>For privacy concerns, contact us at <a href="mailto:support@internreport.in" className="text-primary hover:underline">support@internreport.in</a></p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Privacy;
