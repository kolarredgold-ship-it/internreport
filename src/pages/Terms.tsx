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
          <CardContent className="prose prose-gray max-w-none space-y-6">
            <p className="text-muted-foreground">Last updated: February 2025</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">PART A: GENERAL TERMS AND CONDITIONS</h2>
            <p>This document/agreement/understanding is a computer-generated electronic record published in terms of Rule 3 of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 (amended from time to time) read with Information Technology Act, 2000 (amended from time to time) and does not require any physical or digital signatures.</p>

            <p>These Terms and Conditions ("Terms") constitute a legal agreement between You and Razorpay Software Private Limited ("Razorpay" or "us", or "we" or "our"). The Terms, constituted of Part A: General Terms and Conditions and Part B: Specific Terms and Conditions, govern Your access to and use of Razorpay services, including payments, technology, software, analytics or any other services, tools or products offered or made available by Razorpay and/or its Affiliates, and/or their Facility Providers, ("Services"). The Services may be offered or made available to You via our website, mobile applications, software, APIs, social media, or other access channels ("Platform"). "You", "Yours", "Yourself" or "Merchant" refers to customers, who may be a non-registered individual or corporate body, who register for, use, or access the Platform or Services. The Services provided by Razorpay through the Platform are available and are appropriate only for use in India.</p>

            <p>Please read these Terms carefully before accessing the Platform or using the Services. By accessing the Platform or using the Services, You agree to be bound by these Terms, including our Privacy Policy and any other policy applicable to the Services received via the Platform. If You do not agree to these Terms or do not wish to be bound by these Terms, You must immediately terminate the use of the Services. Razorpay reserves the right to amend or otherwise modify the Terms at any time by posting an updated version on the website. The updated Terms shall take effect immediately upon posting. It is Your responsibility to review these Terms periodically for updates/amendments. Your continued access of the Platform or use of the Services signifies Your assent/ratification of the updated or modified Terms. If You object to these Terms or any subsequent modifications to these Terms in any way, Your only recourse is to immediately terminate the use of the Services.</p>

            <p>We may require You to agree to additional terms in connection with specific Services, provided either by Razorpay or its Affiliates, that You may avail from time to time. You agree to be bound by supplemental terms of any specific Service that You access or use via our Platform and/or are available by hyperlink on our Platform.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">1. PROPRIETARY RIGHTS</h2>
            <h3 className="font-display text-lg font-semibold mt-4 mb-2">1.1</h3>
            <p>We (and our licensors, as applicable) remain the sole owner of all right, title and interest in the Services, including the Platform and the website www.razorpay.com ("website"), including any intellectual property rights which subsist in the Services (whether registered or not). Razorpay grants You a personal, non-exclusive, non-transferable, limited right to access the Platform and make personal use of the website and the Services. You shall not remove, obscure, or alter any proprietary rights notices (including trademark and copyright notices), which may be affixed to or contained within the Services.</p>

            <h3 className="font-display text-lg font-semibold mt-4 mb-2">1.2</h3>
            <p>You grant a royalty-free, non-exclusive, irrevocable, transferable and sub-licensable license to Razorpay, its Affiliates and third party service providers, to use Your data, Your customer's data, information, content, trademarks, logos and any other materials/information You upload or make available to us or on the Platform ("Your materials"). You agree that Razorpay may use Your materials to operate and improve the Platform, provide the Services, and fulfil Razorpay's rights and discharge its obligations under the Terms.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">2. USAGE OF THE WEBSITE AND USE OF SERVICES BY THE USER</h2>
            <h3 className="font-display text-lg font-semibold mt-4 mb-2">2.1</h3>
            <p>You shall register to become a user of the Website only if You are of the age of 18 or above and can enter into binding contracts as per Applicable Laws. You are responsible for maintaining the secrecy of Your passwords, login and account information. You are responsible for maintaining the confidentiality of any login information and secure access credentials associated with Your Razorpay account.</p>

            <h3 className="font-display text-lg font-semibold mt-4 mb-2">2.2</h3>
            <p>You agree to provide true, accurate, current and complete information about Yourself as and when prompted by the Platform. If You provide any information that is untrue, inaccurate, not updated or incomplete, Razorpay shall have the right to immediately suspend or terminate Your account and/or refuse any and all current or future use of the Platform or Services.</p>

            <h3 className="font-display text-lg font-semibold mt-4 mb-2">2.3</h3>
            <p>By using the Services and providing your contact information, you consent to receiving information about, and offers for, various products and services from Razorpay, its Affiliates or third parties. These communications may occur through various channels, including but not limited to telephone, SMS, email, WhatsApp, other messaging services, or any other physical, electronic, or digital means.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">3. INTELLECTUAL PROPERTY</h2>
            <p>You acknowledge and agree that Razorpay owns all legal rights, title and interest in and to the Services, including any intellectual property rights which subsist in the Services (whether those rights happen to be registered or not, and wherever in the world those rights may exist).</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">4. PROHIBITED ACTIVITIES</h2>
            <p>You agree not to use the Platform and/or Services for any purpose that is unlawful, illegal or forbidden by these Terms, or any local laws that might apply to You. We may, at our sole discretion, at any time and without advance notice or liability, suspend, terminate or restrict Your access to all or any component of the Platform and/or Services.</p>

            <p>You are prohibited from posting or transmitting to or through this Platform:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Any unlawful, threatening, libellous, defamatory, obscene, pornographic or other material or content that would violate rights of publicity and/or privacy or that would violate any law</li>
              <li>Any commercial material or content (including, but not limited to, solicitation of funds, advertising, or marketing of any good or services)</li>
              <li>Any material or content that infringes, misappropriates or violates any copyright, trademark, patent right or other proprietary right of any third party</li>
              <li>Contains software viruses or any other computer code designed to interrupt, destroy or limit the functionality of any computer resource</li>
              <li>Threatens the unity, integrity, defense, security or sovereignty of India</li>
            </ul>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">5. DISCLAIMER OF WARRANTIES</h2>
            <p>THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND. RAZORPAY DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">6. LIMITATION OF LIABILITY</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, RAZORPAY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">7. INDEMNIFICATION</h2>
            <p>You agree to indemnify and hold harmless Razorpay and its officers, directors, employees, agents, and affiliates from any claims, damages, losses, liabilities, and expenses arising out of Your use of the Services or violation of these Terms.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">8. TERMINATION</h2>
            <p>Razorpay may terminate or suspend Your access to the Services at any time, with or without cause, with or without notice. Upon termination, Your right to use the Services will immediately cease.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">9. GOVERNING LAW</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts in Bengaluru, India.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">PART B: SPECIFIC TERMS AND CONDITIONS</h2>
            <h3 className="font-display text-lg font-semibold mt-4 mb-2">PART I - SPECIFIC TERMS FOR ONLINE PAYMENT AGGREGATION SERVICES</h3>
            
            <h4 className="font-semibold mt-4 mb-2">1. Payment Processing</h4>
            <p>Subject to Part A: General Terms and Conditions in conjunction with Part I: Specific Terms for Online Payment Aggregation Services, Razorpay shall facilitate collection of online payments for products/services sold by You.</p>

            <h4 className="font-semibold mt-4 mb-2">2. Chargebacks</h4>
            <p>If a Facility Provider communicates to Razorpay the receipt of a Chargeback Request, You will be notified of the Chargeback. You agree that liability for Chargeback, whether domestic or international, under the Terms solely rests with You.</p>

            <h4 className="font-semibold mt-4 mb-2">3. Refunds</h4>
            <p>You agree and acknowledge that subject to availability of funds received in the Escrow Account, You are entitled to effect Refunds at Your sole discretion. All Refunds initiated by You shall be routed to the same payment method through which the Transaction was processed.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">10. DEFINITIONS</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>"AD-1 Bank"</strong> means a scheduled commercial bank in India which is authorized under the relevant legislation to undertake all current and capital account transactions according to the directions issued by the RBI from time to time.</li>
              <li><strong>"Affiliate"</strong> shall mean any entity that directly or indirectly controls, is controlled by, or is under common control with Razorpay.</li>
              <li><strong>"Applicable Laws"</strong> shall mean any law, statute, rule, regulation, order, circular, decree, directive, judgment, decision or other similar mandate of any applicable central, national, state or local governmental/regulatory authority having competent jurisdiction.</li>
              <li><strong>"Chargeback"</strong> shall mean the reversal of the debit of the Transaction Amount that was charged by You.</li>
              <li><strong>"Transaction Amount"</strong> means the amount paid by the Customer in connection with Transaction.</li>
              <li><strong>"RBI"</strong> shall mean the Reserve Bank of India.</li>
            </ul>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">11. CONTACT INFORMATION</h2>
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
