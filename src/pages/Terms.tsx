import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowLeft } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen hero-gradient">
      <Helmet>
        <title>Terms & Conditions | InternReport.in</title>
        <meta name="description" content="Read the terms and conditions for using InternReport.in's AI-powered internship report generator." />
        <link rel="canonical" href="https://internreport.in/terms" />
      </Helmet>
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
            <CardTitle className="font-display text-3xl">Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none space-y-4">
            <p className="text-muted-foreground">Last updated: September 21, 2026</p>

            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <h2 className="font-display text-xl font-semibold mb-2">IMPORTANT PAYMENT TERMS</h2>
              <p>Before making any payment, you must review the demo data and confirm that the service meets your requirements. All amounts paid to InternReport.in are non-refundable.</p>
            </div>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">PART A: GENERAL TERMS AND CONDITIONS</h2>
            <p>This document/agreement/understanding is a computer-generated electronic record published in terms of Rule 3 of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 (amended from time to time) read with Information Technology Act, 2000 (amended from time to time) and does not require any physical or digital signatures.</p>

            <p>These Terms and Conditions ("Terms") constitute a legal agreement between You and Razorpay Software Private Limited ("Razorpay" or "us", or "we" or "our"). The Terms, constituted of Part A: General Terms and Conditions and Part B: Specific Terms and Conditions, govern Your access to and use of Razorpay services, including payments, technology, software, analytics or any other services, tools or products offered or made available by Razorpay and/or its Affiliates, and/or their Facility Providers, ("Services"). The Services may be offered or made available to You via our website, mobile applications, software, APIs, social media, or other access channels ("Platform"). "You", "Yours", "Yourself" or "Merchant" refers to customers, who may be a non-registered individual or corporate body, who register for, use, or access the Platform or Services. The Services provided by Razorpay through the Platform are available and are appropriate only for use in India.</p>

            <p>Please read these Terms carefully before accessing the Platform or using the Services. By accessing the Platform or using the Services, You agree to be bound by these Terms, including our Privacy Policy and any other policy applicable to the Services received via the Platform. If You do not agree to these Terms or do not wish to be bound by these Terms, You must immediately terminate the use of the Services. Razorpay reserves the right to amend or otherwise modify the Terms at any time by posting an updated version on the website.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">1. PROPRIETARY RIGHTS</h2>
            <h3 className="font-display text-lg font-semibold mt-4 mb-2">1.1</h3>
            <p>We (and our licensors, as applicable) remain the sole owner of all right, title and interest in the Services, including the Platform and the website www.razorpay.com ("website"), including any intellectual property rights which subsist in the Services (whether registered or not). Razorpay grants You a personal, non-exclusive, non-transferable, limited right to access the Platform and make personal use of the website and the Services. You shall not remove, obscure, or alter any proprietary rights notices (including trademark and copyright notices), which may be affixed to or contained within the Services. We reserve all rights not granted under the Terms.</p>

            <h3 className="font-display text-lg font-semibold mt-4 mb-2">1.2</h3>
            <p>You grant a royalty-free, non-exclusive, irrevocable, transferable and sub-licensable license to Razorpay, its Affiliates and third party service providers, to use Your data, Your customer's data, information, content, trademarks, logos and any other materials/information You upload or make available to us or on the Platform ("Your materials"). You agree that Razorpay may use Your materials to operate and improve the Platform, provide the Services, and fulfil Razorpay's rights and discharge its obligations under the Terms.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">2. USAGE OF THE WEBSITE AND USE OF SERVICES BY THE USER</h2>
            <h3 className="font-display text-lg font-semibold mt-4 mb-2">2.1</h3>
            <p>You shall register to become a user of the Website only if You are of the age of 18 or above and can enter into binding contracts as per Applicable Laws. You are responsible for maintaining the secrecy of Your passwords, login and account information.</p>

            <h3 className="font-display text-lg font-semibold mt-4 mb-2">2.2</h3>
            <p>You agree to provide true, accurate, current and complete information about Yourself as and when prompted by the Platform. If You provide any information that is untrue, inaccurate, not updated or incomplete, Razorpay shall have the right to immediately suspend or terminate Your account.</p>

            <h3 className="font-display text-lg font-semibold mt-4 mb-2">2.3</h3>
            <p>By using the Services and providing your contact information, you consent to receiving information about, and offers for, various products and services from Razorpay, its Affiliates or third parties through telephone, SMS, email, WhatsApp, or other messaging services.</p>

            <h3 className="font-display text-lg font-semibold mt-4 mb-2">2.4 - 2.11</h3>
            <p>You agree and authorize Razorpay to share your information with its partner banks, financial institutions, group companies, Affiliates, vendors, service providers, and other third parties as necessary. You acknowledge and agree that for undertaking any payment and/or financial transaction through the Platform, Razorpay may undertake due diligence measures and seek information required for KYC purposes.</p>

            <h3 className="font-display text-lg font-semibold mt-4 mb-2">2.12 - 2.13</h3>
            <p>You agree not to use the Platform and/or Services for any purpose that is unlawful, illegal or forbidden by these Terms. You are prohibited from posting or transmitting any unlawful, threatening, libellous, defamatory, obscene, pornographic or other harmful material or content.</p>

            <h3 className="font-display text-lg font-semibold mt-4 mb-2">2.14</h3>
            <p>You represent and warrant that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are duly incorporated or established under the laws of Your jurisdiction</li>
              <li>You have the full legal capacity and power to enter into these Terms</li>
              <li>The execution has been authorized by all necessary corporate actions</li>
              <li>You have duly accepted these Terms which form a legal, valid and binding obligation</li>
              <li>You do not engage in any activity related to virtual currency, cryptocurrency and other crypto products</li>
            </ul>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">3. PAYMENT</h2>
            <h3 className="font-display text-lg font-semibold mt-4 mb-2">Pre-payment review and non-refundable amount</h3>
            <p>You must check the available demo data before making payment. By completing payment, you confirm that you have reviewed the demo and accepted the nature and expected format of the digital service. Every amount paid is final and non-refundable, including payments for report generation, generation credits, top-ups, and digital products.</p>

            <h3 className="font-display text-lg font-semibold mt-4 mb-2">3.1</h3>
            <p>Applicable fees for the provision of Services shall be levied by Razorpay from time to time. You agree that the fees shall be charged according to the manner, rates and frequency determined by Razorpay.</p>

            <h3 className="font-display text-lg font-semibold mt-4 mb-2">3.2</h3>
            <p>Fees are exclusive of applicable taxes and Razorpay will charge such applicable taxes on the fees from time to time.</p>

            <h3 className="font-display text-lg font-semibold mt-4 mb-2">3.3</h3>
            <p>We will raise monthly invoices in respect of fees charged for Services provided during such month. Any dispute in respect of an invoice must be communicated within ten (10) days from the date of the invoice.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">4. PRIVACY POLICY</h2>
            <p>By using the website, You hereby consent to the use of Your information as we have outlined in our Privacy Policy.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">5. THIRD PARTY LINKS / OFFERS</h2>
            <p>The Platform contains links to other websites over which we have no control. We encourage You to review the terms and privacy policies of those other websites. Razorpay is not responsible for the terms and conditions, privacy policies or practices of other websites.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">6. OUR PARTNERS</h2>
            <p>This Platform also offers You access to information primarily about certain financial products/services including loan facility, credit cards facility, investment services such as current accounts offered by our lending partners.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">7. DISCLAIMER OF WARRANTY</h2>
            <p>To the maximum extent permitted by Applicable Laws, the Platform and the Services are provided on an "as is" basis. You acknowledge that Razorpay does not warrant that the Service(s) will be uninterrupted or error free or fit for Your specific business purposes.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">8. LIMITATION OF LIABILITY</h2>
            <h3 className="font-display text-lg font-semibold mt-4 mb-2">8.1</h3>
            <p>Razorpay (including its officers, directors, employees, representatives, affiliates, and providers) will not be responsible or liable for any injury, death, loss, claim, act of God, accident, delay, or any direct, special, exemplary, punitive, indirect, incidental or consequential damages of any kind.</p>

            <h3 className="font-display text-lg font-semibold mt-4 mb-2">8.2</h3>
            <p>Notwithstanding anything under these Terms, Razorpay's aggregate liability and that of its affiliates, officers, employees and agents relating to the Service(s), will not exceed an amount equal to one (1) month fees paid by You for the specific Service(s) giving rise to the liability.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">9. INDEMNITY</h2>
            <p>You agree to indemnify and hold Razorpay (and its officers, affiliates, group company, directors, agents and employees) harmless from any and against all claims, causes of action, demands, recoveries, losses, damages, fines, penalties or other costs or expenses arising out of or related to Your breach of these Terms, Your violation of any Applicable Laws or the rights of a third party, or Your use of the Platform.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">10. CARD ASSOCIATION RULES</h2>
            <p>"Card Payment Network Rules" refer to the written rules, regulations, releases, guidelines, processes, interpretations and other requirements imposed and adopted by the card payment networks. The card payment networks require You to comply with all applicable guidelines, rules, and regulations formulated by them.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">11. WAIVER</h2>
            <p>Razorpay shall not be deemed to have waived any right or provision of this Agreement unless such waiver is made in writing. A waiver of any term or condition of this Agreement shall not be deemed a waiver of any other term or condition.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">12. FORCE MAJEURE</h2>
            <p>If performance of Services/Platform by Razorpay is prevented, restricted, delayed or interfered with by reason of labour disputes, strikes, acts of God, epidemic, pandemic, floods, lightning, severe weather, shortages of materials, earthquakes, war, revolution, acts of terrorism, civil commotion, or any other act beyond the reasonable control of Razorpay, then Razorpay shall be excused from such performance.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">13. ANTI BRIBERY AND SANCTIONS LAWS</h2>
            <p>You shall comply with all applicable anti-bribery and anti-corruption laws. You shall not offer, promise, give, or authorize the giving of any money or anything of value to any person for the purpose of influencing any act or decision.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">14. CONFIDENTIALITY</h2>
            <p>You agree to protect Razorpay's Confidential Information from unauthorized dissemination and use the same degree of care that You use to protect Your own like information, but in no event less than a reasonable degree of care.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">15. GOVERNING LAWS AND DISPUTE RESOLUTION</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts in Bengaluru, India.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">16. TERMINATION</h2>
            <p>Razorpay may terminate or suspend Your access to the Services at any time, with or without cause, with or without notice. Upon termination, Your right to use the Services will immediately cease.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">17. PROHIBITED PRODUCTS AND SERVICES</h2>
            <p>The following products and services are prohibited:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Adult goods and services</li>
              <li>Alcohol and tobacco</li>
              <li>Body parts and related goods</li>
              <li>Bulk marketing tools and mailing lists</li>
              <li>Cable descramblers and black boxes</li>
              <li>Counterfeit and unauthorized goods</li>
              <li>Drug paraphernalia and controlled substances</li>
              <li>Firearms, weapons and ammunition</li>
              <li>Gambling and lottery services</li>
              <li>Government IDs and licenses</li>
              <li>Hacking and cracking materials</li>
              <li>Illegal goods and services</li>
              <li>Miracle cures and unsubstantiated remedies</li>
              <li>Offensive and hate materials</li>
              <li>Pyrotechnic devices and hazardous materials</li>
              <li>Securities and government bonds</li>
              <li>Virtual currency and cryptocurrency</li>
              <li>Money laundering services</li>
              <li>Multi-level marketing schemes</li>
              <li>Any product or service not in compliance with applicable laws</li>
            </ul>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">18. DEFINITIONS</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>"AD-1 Bank"</strong> means a scheduled commercial bank in India authorized under relevant legislation to undertake all current and capital account transactions.</li>
              <li><strong>"Affiliate"</strong> means any entity that directly or indirectly controls, is controlled by, or is under common control with Razorpay.</li>
              <li><strong>"Applicable Laws"</strong> means any law, statute, rule, regulation, order, circular, decree, directive, judgment, decision or other similar mandate of any applicable governmental/regulatory authority.</li>
              <li><strong>"Chargeback"</strong> means the reversal of the debit of the Transaction Amount that was charged by You.</li>
              <li><strong>"Customer"</strong> means the Merchant's customer who will be making payments.</li>
              <li><strong>"Escrow Account"</strong> is an account held by Razorpay for receiving the Transaction Amount and effecting settlements.</li>
              <li><strong>"Facility Providers"</strong> means banks, financial institutions, NPCI, technology service providers facilitating the Services.</li>
              <li><strong>"KYC Guidelines"</strong> means KYC norms as set out in the Master Direction - Know Your Customer, 2016 by RBI.</li>
              <li><strong>"NPCI"</strong> means the National Payments Corporation of India.</li>
              <li><strong>"Payment Instrument"</strong> includes credit card, debit card, bank account, prepaid payment instrument.</li>
              <li><strong>"RBI"</strong> means the Reserve Bank of India.</li>
              <li><strong>"Transaction"</strong> means an order or request placed by the customer for purchasing goods/services.</li>
              <li><strong>"Transaction Amount"</strong> means the amount paid by the Customer in connection with Transaction.</li>
            </ul>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">PART B: SPECIFIC TERMS AND CONDITIONS</h2>
            <h3 className="font-display text-lg font-semibold mt-4 mb-2">PART I - SPECIFIC TERMS FOR ONLINE PAYMENT AGGREGATION SERVICES</h3>
            
            <h4 className="font-semibold mt-4 mb-2">1. Payment Processing</h4>
            <p>Subject to Part A: General Terms and Conditions, Razorpay shall facilitate collection of online payments for products/services sold by You. Razorpay shall settle the Transaction Amount (net of Permissible Deductions) into your account as per agreed timelines in compliance with the PA/PG guidelines.</p>

            <h4 className="font-semibold mt-4 mb-2">2. Chargebacks</h4>
            <p>If a Facility Provider communicates to Razorpay the receipt of a Chargeback Request, You will be notified of the Chargeback. You agree that liability for Chargeback, whether domestic or international, under the Terms solely rests with You. You shall furnish the Chargeback Documents within three (3) calendar days of receiving notification.</p>

            <h4 className="font-semibold mt-4 mb-2">3. Refunds</h4>
            <p>Payments made to InternReport.in are final and non-refundable. Customers must review the demo data before payment and ensure the selected service or digital product meets their requirements.</p>

            <h4 className="font-semibold mt-4 mb-2">4. Fraudulent Transactions</h4>
            <p>If Razorpay is intimated by a Facility Provider that a customer has reported an unauthorised debit of the customer's Payment Instrument ("Fraudulent Transaction"), Razorpay shall be entitled to suspend settlements to You during the pendency of inquiries and investigations.</p>

            <h2 className="font-display text-xl font-semibold mt-6 mb-3">CONTACT INFORMATION</h2>
            <p>For questions regarding these Terms, contact us at:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Email:</strong> <a href="mailto:support@internreport.in" className="text-primary hover:underline">support@internreport.in</a></li>
              <li><strong>Phone:</strong> +91 9738959525</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Terms;