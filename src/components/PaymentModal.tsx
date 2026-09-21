import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Clock, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import paymentQrCode from '@/assets/payment-qr-phonepe.jpeg.asset.json';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  reportId?: string | null;
  productId?: string | null;
  userId: string;
  onSuccess: () => void;
  paymentType?: 'report' | 'topup' | 'product';
}

const PaymentModal = ({ isOpen, onClose, amount, reportId, productId, userId, onSuccess, paymentType = 'report' }: PaymentModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'qr' | 'form' | 'submitted'>('qr');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    transactionNumber: '',
    payerName: '',
    payerMobile: '',
    payerEmail: '',
  });

  // Timer countdown
  useEffect(() => {
    if (!isOpen || step !== 'qr') return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast({
            title: 'Payment timeout',
            description: 'Please try again.',
            variant: 'destructive',
          });
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, step, onClose, toast]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('qr');
      setTimeLeft(300);
      setScreenshotFile(null);
      setFormData({
        transactionNumber: '',
        payerName: '',
        payerMobile: '',
        payerEmail: '',
      });
    }
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 5MB.',
          variant: 'destructive',
        });
        return;
      }
      setScreenshotFile(file);
    }
  };

  const handleSubmitPayment = async () => {
    // Validate form
    if (!formData.transactionNumber || !formData.payerName || !formData.payerMobile || !formData.payerEmail) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (!screenshotFile) {
      toast({
        title: 'Screenshot required',
        description: 'Please upload a payment screenshot.',
        variant: 'destructive',
      });
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.payerEmail)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    // Validate mobile (10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(formData.payerMobile)) {
      toast({
        title: 'Invalid mobile number',
        description: 'Please enter a valid 10-digit mobile number.',
        variant: 'destructive',
      });
      return;
    }

    // Check for duplicate transaction number
    const { data: existingPayments, error: checkError } = await supabase
      .from('payments')
      .select('id')
      .eq('transaction_number', formData.transactionNumber.trim())
      .limit(1);
    
    if (checkError) {
      console.error('Error checking transaction:', checkError);
    }
    
    if (existingPayments && existingPayments.length > 0) {
      toast({
        title: 'Duplicate Transaction ID',
        description: 'This transaction ID has already been used. Please enter a unique transaction ID.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Upload screenshot
      const fileExt = screenshotFile.name.split('.').pop();
      const fileName = `${userId}/${reportId || 'topup'}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, screenshotFile);

      if (uploadError) throw uploadError;

      // Store file path instead of public URL
      // Admin will generate signed URLs when viewing (private bucket)
      const screenshotPath = fileName;

      // Create payment record
      const { error: insertError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          report_id: reportId || null,
          product_id: productId || null,
          amount: amount,
          currency: 'INR',
          payment_type: paymentType,
          status: 'pending',
          transaction_number: formData.transactionNumber,
          payer_name: formData.payerName,
          payer_mobile: formData.payerMobile,
          payer_email: formData.payerEmail,
        screenshot_url: screenshotPath,
        });

      if (insertError) throw insertError;

      setStep('submitted');
      onSuccess();

      toast({
        title: 'Payment submitted!',
        description: 'Your payment is being verified. You will be notified once approved.',
      });
    } catch (error: any) {
      console.error('Payment submission error:', error);
      toast({
        title: 'Submission failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {step === 'qr' && 'Scan & Pay'}
            {step === 'form' && 'Payment Details'}
            {step === 'submitted' && 'Payment Submitted'}
          </DialogTitle>
          <DialogDescription>
            {step === 'qr' && `Pay ₹${amount} using any UPI app`}
            {step === 'form' && 'Enter your payment details for verification'}
            {step === 'submitted' && 'Your payment is being verified by our team'}
          </DialogDescription>
        </DialogHeader>

        {step === 'qr' && (
          <div className="space-y-6">
            {/* Timer */}
            <div className="flex items-center justify-center gap-2 text-lg font-semibold">
              <Clock className={`w-5 h-5 ${timeLeft < 60 ? 'text-destructive' : 'text-primary'}`} />
              <span className={timeLeft < 60 ? 'text-destructive' : ''}>
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl shadow-lg">
                <img 
                  src={paymentQrCode.url} 
                  alt="Payment QR Code" 
                  className="w-64 h-64 object-contain"
                />
              </div>
            </div>

            {/* Amount */}
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">₹{amount}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Scan with Google Pay, PhonePe, Paytm, or any UPI app
              </p>
            </div>

            <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <p className="font-semibold text-foreground">Please check the demo data before making payment.</p>
              <p className="text-destructive">The amount paid is non-refundable.</p>
              <p className="text-muted-foreground">
                By paying, you agree to our{' '}
                <a href="/?demo=true" target="_blank" rel="noreferrer" className="font-medium text-primary underline underline-offset-2">demo</a>
                {' '}and{' '}
                <a href="/terms" target="_blank" rel="noreferrer" className="font-medium text-primary underline underline-offset-2">Terms &amp; Conditions</a>.
              </p>
            </div>

            <Button 
              variant="hero" 
              className="w-full" 
              onClick={() => setStep('form')}
            >
              I've Made the Payment
            </Button>
          </div>
        )}

        {step === 'form' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transactionNumber">Transaction/UTR Number *</Label>
              <Input
                id="transactionNumber"
                name="transactionNumber"
                value={formData.transactionNumber}
                onChange={handleInputChange}
                placeholder="Enter UPI transaction ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payerName">Your Name *</Label>
              <Input
                id="payerName"
                name="payerName"
                value={formData.payerName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payerMobile">Mobile Number *</Label>
              <Input
                id="payerMobile"
                name="payerMobile"
                value={formData.payerMobile}
                onChange={handleInputChange}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payerEmail">Email ID *</Label>
              <Input
                id="payerEmail"
                name="payerEmail"
                type="email"
                value={formData.payerEmail}
                onChange={handleInputChange}
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="screenshot">Payment Screenshot *</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                <input
                  id="screenshot"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="screenshot" className="cursor-pointer">
                  {screenshotFile ? (
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{screenshotFile.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="w-8 h-8" />
                      <span>Click to upload screenshot</span>
                      <span className="text-xs">Max 5MB, JPG/PNG</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="space-y-1 text-amber-800 dark:text-amber-200">
                <p>Your report will be activated within 24 hours after payment verification.</p>
                <p className="font-semibold">Payment is non-refundable. Please check the demo data before submitting.</p>
              </div>
            </div>

            <Button 
              variant="hero" 
              className="w-full" 
              onClick={handleSubmitPayment}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Payment Details'}
            </Button>

            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={() => setStep('qr')}
            >
              Back to QR Code
            </Button>
          </div>
        )}

        {step === 'submitted' && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Payment Under Review</h3>
              <p className="text-muted-foreground text-sm">
                Your payment of ₹{amount} is being verified. You'll be notified once approved.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Status: <span className="text-amber-600">Waiting for Verification</span></p>
            </div>
            <Button variant="outline" className="w-full" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
