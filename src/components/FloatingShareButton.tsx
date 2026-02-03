import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, X, MessageCircle, Send, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const FloatingShareButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = 'https://internreport.in';
  const shareText = `🎓 I found free internship reports & student resources on InternReport.in – very useful for college students!

Check it out: ${shareUrl}`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Share options */}
      <div className={`absolute bottom-16 right-0 flex flex-col gap-2 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          <Button size="icon" className="w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#20BD5C] text-white shadow-lg">
            <MessageCircle className="w-5 h-5" />
          </Button>
        </a>
        <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
          <Button size="icon" className="w-12 h-12 rounded-full bg-[#0088CC] hover:bg-[#0077B5] text-white shadow-lg">
            <Send className="w-5 h-5" />
          </Button>
        </a>
        <Button 
          size="icon" 
          className="w-12 h-12 rounded-full bg-gray-600 hover:bg-gray-700 text-white shadow-lg"
          onClick={handleCopyLink}
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
        </Button>
      </div>

      {/* Main toggle button */}
      <Button 
        size="icon"
        className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${isOpen ? 'bg-red-500 hover:bg-red-600 rotate-90' : 'gradient-bg hover:shadow-xl'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Share2 className="w-6 h-6" />}
      </Button>
    </div>
  );
};

export default FloatingShareButton;
