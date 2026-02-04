import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowLeft } from 'lucide-react';

const Terms = () => {
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
            <CardTitle className="font-display text-3xl">Terms of Use</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p className="text-muted-foreground">Last updated: March 2024</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">PART A: GENERAL TERMS AND CONDITIONS</h2>
            <p>This document/agreement/understanding is a computer-generated electronic record published in terms of Rule 3 of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 (amended from time to time) read with Information Technology Act, 2000 (amended from time to time) and does not require any physical or digital signatures.</p>

            <p>These Terms and Conditions ("Terms") constitute a legal agreement between You and Razorpay Software Private Limited ("Razorpay" or "us", or "we" or "our"). The Terms, constituted of Part A: General Terms and Conditions and Part B: Specific Terms and Conditions, govern Your access to and use of Razorpay services, including payments, technology, software, analytics or any other services, tools or products offered or made available by Razorpay and/or its Affiliates, and/or their Facility Providers, ("Services"). The Services may be offered or made available to You via our website, mobile applications, software, APIs, social media, or other access channels ("Platform"). "You", "Yours", "Yourself" or "Merchant" refers to customers, who may be a non-registered individual or corporate body, who register for, use, or access the Platform or Services. The Services provided by Razorpay through the Platform are available and are appropriate only for use in India.</p>

            <p>Please read these Terms carefully before accessing the Platform or using the Services. By accessing the Platform or using the Services, You agree to be bound by these Terms, including our Privacy Policy and any other policy applicable to the Services received via the Platform. If You do not agree to these Terms or do not wish to be bound by these Terms, You must immediately terminate the use of the Services. Razorpay reserves the right to amend or otherwise modify the Terms at any time by posting an updated version on the website. The updated Terms shall take effect immediately upon posting. It is Your responsibility to review these Terms periodically for updates/amendments. Your continued access of the Platform or use of the Services signifies Your assent/ratification of the updated or modified Terms.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">1. PROPRIETARY RIGHTS</h2>
            <p>You acknowledge and agree that Razorpay owns all legal rights, title and interest in and to the Services, including any intellectual property rights which subsist in the Services (whether those rights happen to be registered or not, and wherever in the world those rights may exist).</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">2. YOUR ACCOUNT</h2>
            <p>To use our Services, You are required to create an account on the Platform. You may be required to provide certain information to register and create Your Account. You represent and warrant that all required registration information You submit is truthful and accurate and You will maintain the accuracy of such information.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are responsible for maintaining the confidentiality of Your account credentials</li>
              <li>You shall not share Your password or other account access credentials with any third party</li>
              <li>You are responsible for all activities that occur under Your account</li>
              <li>You shall immediately notify Razorpay of any unauthorized use of Your account</li>
            </ul>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">3. ACCEPTABLE USE</h2>
            <p>You agree to use the Services only for purposes that are permitted by:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The Terms and any applicable law, regulation or generally accepted practices or guidelines in the relevant jurisdictions</li>
              <li>Any applicable policies or guidelines made available to You by Razorpay</li>
            </ul>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">4. PROHIBITED ACTIVITIES</h2>
            <p>You shall not:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Services for any unlawful purpose</li>
              <li>Interfere with the security of the Platform</li>
              <li>Transmit any viruses, worms, or other malicious code</li>
              <li>Attempt to gain unauthorized access to any systems or networks</li>
              <li>Engage in any activity that disrupts or diminishes the quality of the Services</li>
            </ul>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">5. INTELLECTUAL PROPERTY</h2>
            <p>All content, trademarks, service marks, trade names, logos, and icons are proprietary to Razorpay. Nothing contained on the Platform should be construed as granting any license or right to use any trademark without written permission.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">6. DISCLAIMER OF WARRANTIES</h2>
            <p>THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND. RAZORPAY DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">7. LIMITATION OF LIABILITY</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, RAZORPAY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">8. INDEMNIFICATION</h2>
            <p>You agree to indemnify and hold harmless Razorpay and its officers, directors, employees, agents, and affiliates from any claims, damages, losses, liabilities, and expenses arising out of Your use of the Services or violation of these Terms.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">9. TERMINATION</h2>
            <p>Razorpay may terminate or suspend Your access to the Services at any time, with or without cause, with or without notice. Upon termination, Your right to use the Services will immediately cease.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">10. GOVERNING LAW</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts in Bengaluru, India.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">11. MODIFICATIONS</h2>
            <p>Razorpay reserves the right to modify these Terms at any time. We will notify You of any changes by posting the new Terms on the Platform. Your continued use of the Services after such modifications constitutes acceptance of the modified Terms.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">12. CONTACT INFORMATION</h2>
            <p>For questions regarding these Terms, contact us at:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email: <a href="mailto:support@internreport.in" className="text-primary hover:underline">support@internreport.in</a></li>
              <li>Phone: +91 9738959525</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Terms;
