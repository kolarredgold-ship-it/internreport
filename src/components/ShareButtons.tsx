import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MessageCircle, Send, Copy, Share2, Check } from 'lucide-react';

interface ShareButtonsProps {
  variant?: 'default' | 'compact' | 'inline';
  className?: string;
}

const ShareButtons = ({ variant = 'default', className = '' }: ShareButtonsProps) => {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = 'https://internreport.in';
  const shareText = `🎓 I found free internship reports & student resources on InternReport.in – very useful for college students!

✅ AI-generated internship reports
✅ University-compliant format
✅ Instant download
✅ Trusted by 10,000+ students

Check it out: ${shareUrl}`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          <Button size="sm" className="bg-[#25D366] hover:bg-[#20BD5C] text-white">
            <MessageCircle className="w-4 h-4" />
          </Button>
        </a>
        <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
          <Button size="sm" className="bg-[#0088CC] hover:bg-[#0077B5] text-white">
            <Send className="w-4 h-4" />
          </Button>
        </a>
        <Button size="sm" variant="outline" onClick={handleCopyLink}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          <Button size="sm" className="bg-[#25D366] hover:bg-[#20BD5C] text-white gap-1">
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </Button>
        </a>
        <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
          <Button size="sm" className="bg-[#0088CC] hover:bg-[#0077B5] text-white gap-1">
            <Send className="w-4 h-4" />
            Telegram
          </Button>
        </a>
        <Button size="sm" variant="outline" onClick={handleCopyLink} className="gap-1">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          Copy
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 ${className}`}>
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
        <Button className="w-full bg-[#25D366] hover:bg-[#20BD5C] text-white gap-2 h-10">
          <MessageCircle className="w-5 h-5 flex-shrink-0" />
          <span>Share on WhatsApp</span>
        </Button>
      </a>
      <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
        <Button className="w-full bg-[#0088CC] hover:bg-[#0077B5] text-white gap-2 h-10">
          <Send className="w-5 h-5 flex-shrink-0" />
          <span>Share on Telegram</span>
        </Button>
      </a>
      <Button variant="outline" onClick={handleCopyLink} className="w-full sm:w-auto gap-2 h-10">
        {copied ? <Check className="w-5 h-5 flex-shrink-0" /> : <Copy className="w-5 h-5 flex-shrink-0" />}
        <span>{copied ? 'Copied!' : 'Copy Link'}</span>
      </Button>
    </div>
  );
};

export default ShareButtons;
