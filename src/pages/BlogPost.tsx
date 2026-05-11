import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Clock, ArrowRight, ArrowLeft, GraduationCap, Tag, BookOpen, Share2 } from 'lucide-react';
import { getPostBySlug, blogPosts, BlogPost as BlogPostType } from '@/data/blogPosts';
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import DOMPurify from 'dompurify';

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostType | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostType[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!slug) { setLoading(false); return; }

    // Try static first
    const staticPost = getPostBySlug(slug);
    if (staticPost) {
      setPost(staticPost);
      setRelatedPosts(
        blogPosts.filter(p => p.id !== staticPost.id && (p.domain === staticPost.domain || p.university === staticPost.university)).slice(0, 3)
      );
      setLoading(false);
      return;
    }

    // Try DB
    const fetchDbPost = async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();

      if (data) {
        const mapped: BlogPostType = {
          id: data.id,
          slug: data.slug,
          title: data.title,
          excerpt: data.excerpt,
          content: data.content,
          category: data.category,
          university: data.university,
          domain: data.domain,
          keywords: data.keywords || [],
          publishedAt: data.published_at,
          readTime: data.read_time,
        };
        setPost(mapped);

        // Fetch related from DB
        const { data: related } = await supabase
          .from('blog_posts')
          .select('*')
          .neq('id', data.id)
          .eq('is_published', true)
          .or(`domain.eq.${data.domain},university.eq.${data.university}`)
          .limit(3);

        if (related) {
          setRelatedPosts(related.map((p: any) => ({
            id: p.id, slug: p.slug, title: p.title, excerpt: p.excerpt,
            content: p.content, category: p.category, university: p.university,
            domain: p.domain, keywords: p.keywords || [], publishedAt: p.published_at, readTime: p.read_time,
          })));
        }
      }
      setLoading(false);
    };
    fetchDbPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }
  if (!post) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <h1 className="font-display text-2xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The article you're looking for doesn't exist or has been moved.
            </p>
            <Link to="/blog">
              <Button variant="gradient">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // relatedPosts already set via useEffect

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Generate structured data for the blog post
  const structuredData = post ? {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "datePublished": post.publishedAt,
    "dateModified": post.publishedAt,
    "author": {
      "@type": "Organization",
      "name": "InternReport.in"
    },
    "publisher": {
      "@type": "Organization",
      "name": "InternReport.in",
      "logo": {
        "@type": "ImageObject",
        "url": "https://internreport.in/favicon.ico"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://internreport.in/blog/${post.slug}`
    },
    "keywords": post.keywords.join(", "),
    "articleSection": post.category,
    "wordCount": post.content.split(/\s+/).length
  } : null;

  return (
    <div className="min-h-screen hero-gradient">
      {/* SEO Meta Tags */}
      {post && (
        <Helmet>
          <title>{post.title} | InternReport.in Blog</title>
          <meta name="description" content={post.excerpt} />
          <meta name="keywords" content={post.keywords.join(", ")} />
          <link rel="canonical" href={`https://internreport.in/blog/${post.slug}`} />
          
          {/* Open Graph */}
          <meta property="og:type" content="article" />
          <meta property="og:title" content={post.title} />
          <meta property="og:description" content={post.excerpt} />
          <meta property="og:url" content={`https://internreport.in/blog/${post.slug}`} />
          <meta property="og:site_name" content="InternReport.in" />
          <meta property="article:published_time" content={post.publishedAt} />
          <meta property="article:section" content={post.category} />
          {post.keywords.map((keyword, i) => (
            <meta key={i} property="article:tag" content={keyword} />
          ))}
          
          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={post.title} />
          <meta name="twitter:description" content={post.excerpt} />
          
          {/* Structured Data */}
          <script type="application/ld+json">
            {JSON.stringify(structuredData)}
          </script>
        </Helmet>
      )}
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-effect border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">InternReport.in</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/blog">
              <Button variant="ghost">Blog</Button>
            </Link>
            <Link to="/auth?signup=true">
              <Button variant="gradient">Generate Report</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{post.title}</span>
        </div>
      </div>

      {/* Article Header */}
      <article className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="default">{post.category}</Badge>
              <Badge variant="secondary">{post.domain}</Badge>
            </div>
            
            <h1 className="font-display text-xl md:text-2xl font-bold mb-3 leading-tight">
              {post.title}
            </h1>
            
            <p className="text-sm text-muted-foreground mb-3">
              {post.excerpt}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b border-border/50 pb-6">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                <span>{post.university}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(post.publishedAt).toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{post.readTime} min read</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>
          </div>

          {/* CTA Banner - Download triggers demo */}
          <Card className="border-primary/20 bg-primary/5 mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-semibold text-lg mb-1">
                    📥 Download Sample Report for "{post.title.substring(0, 40)}..."
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    See how our AI generates professional reports instantly!
                  </p>
                </div>
                <Link to="/?demo=true">
                  <Button variant="gradient">
                    Download Sample
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Article Content */}
          <div className="prose prose-sm dark:prose-invert max-w-none mb-10">
            <div 
              className="blog-content text-sm"
              dangerouslySetInnerHTML={{ 
                __html: post.content
                  .replace(/## /g, '<h2 class="font-display text-lg font-bold mt-5 mb-2">')
                  .replace(/### /g, '<h3 class="font-display text-base font-semibold mt-3 mb-2">')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n\n/g, '</p><p class="mb-2 text-muted-foreground leading-relaxed text-sm">')
                  .replace(/^- (.*?)$/gm, '<li class="ml-4 mb-1 text-xs">$1</li>')
                  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')
              }}
            />
          </div>

          {/* Keywords */}
          <div className="border-t border-border/50 pt-6 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Related Topics:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {post.keywords.map((keyword, idx) => (
                <Link 
                  key={idx} 
                  to={`/blog?search=${encodeURIComponent(keyword)}`}
                  className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  {keyword}
                </Link>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <Card className="gradient-bg text-primary-foreground mb-10">
            <CardContent className="p-6 text-center">
              <h2 className="font-display text-xl font-bold mb-3">
                Ready to Create Your Internship Report?
              </h2>
              <p className="text-primary-foreground/80 mb-4 max-w-xl mx-auto text-sm">
                Our AI generates professional, {post.university}-compliant reports 
                for {post.domain} internships. Join 10,000+ students who trust InternReport.in.
              </p>
              <Link to="/auth?signup=true">
                <Button size="lg" variant="secondary">
                  Generate My Report Now
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <p className="text-sm text-primary-foreground/60 mt-4">
                ₹499 • 3 Reports • Instant DOCX Download
              </p>
            </CardContent>
          </Card>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mb-10">
              <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <BookOpen className="w-6 h-6" />
                Related Articles
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.id} to={`/blog/${relatedPost.slug}`}>
                    <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-soft group">
                      <CardContent className="p-5">
                        <Badge variant="secondary" className="text-xs mb-2">
                          {relatedPost.domain}
                        </Badge>
                        <h3 className="font-display font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back to Blog */}
          <div className="text-center">
            <Link to="/blog">
              <Button variant="outline" size="lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to All Articles
              </Button>
            </Link>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-xl">InternReport.in</span>
              </div>
              <p className="text-muted-foreground text-sm">
                AI-powered internship report generator for Indian university students.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
                <li><Link to="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                <li><Link to="/auth" className="hover:text-primary transition-colors">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4">Policies</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
                <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/refund" className="hover:text-primary transition-colors">Refund Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4">Contact</h4>
              <p className="text-sm text-muted-foreground">
                support@internreport.in<br />
                +91 9738959525
              </p>
            </div>
          </div>
          <div className="border-t border-border/50 mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 InternReport.in. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogPostPage;
