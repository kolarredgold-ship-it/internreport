import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Search, Calendar, Clock, ArrowRight, BookOpen, GraduationCap, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { blogPosts, getAllCategories, getAllUniversities, getAllDomains, searchPosts } from '@/data/blogPosts';
import { Helmet } from 'react-helmet-async';

const POSTS_PER_PAGE = 12;

const Blog = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUniversity, setSelectedUniversity] = useState<string>('all');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const categories = getAllCategories();
  const universities = getAllUniversities();
  const domains = getAllDomains();

  const filteredPosts = useMemo(() => {
    let posts = searchQuery ? searchPosts(searchQuery) : blogPosts;
    
    if (selectedCategory !== 'all') {
      posts = posts.filter(post => post.category === selectedCategory);
    }
    if (selectedUniversity !== 'all') {
      posts = posts.filter(post => post.university === selectedUniversity);
    }
    if (selectedDomain !== 'all') {
      posts = posts.filter(post => post.domain === selectedDomain);
    }
    
    return posts;
  }, [searchQuery, selectedCategory, selectedUniversity, selectedDomain]);

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedUniversity('all');
    setSelectedDomain('all');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen hero-gradient">
      <Helmet>
        <title>Internship Report Blog - 500+ Guides for Indian Students | InternReport.in</title>
        <meta name="description" content="Browse 500+ articles on internship report writing, formatting guides, and tips for Indian university students. Find resources for your specific university and domain." />
        <meta name="keywords" content="internship report blog, internship report guide, university internship format, engineering project report, AI internship report" />
        <link rel="canonical" href="https://internreport.in/blog" />
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Internship Report Blog - 500+ Guides | InternReport.in" />
        <meta property="og:description" content="Browse 500+ articles on internship report writing for Indian university students." />
        <meta property="og:url" content="https://internreport.in/blog" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Internship Report Blog | InternReport.in" />
        <meta name="twitter:description" content="500+ guides for writing internship reports tailored for Indian universities." />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "InternReport.in Blog",
            "description": "500+ articles on internship report writing for Indian university students",
            "url": "https://internreport.in/blog",
            "publisher": {
              "@type": "Organization",
              "name": "InternReport.in"
            },
            "blogPost": paginatedPosts.slice(0, 10).map(post => ({
              "@type": "BlogPosting",
              "headline": post.title,
              "description": post.excerpt,
              "url": `https://internreport.in/blog/${post.slug}`,
              "datePublished": post.publishedAt
            }))
          })}
        </script>
      </Helmet>
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
            <Link to="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Link to="/auth?signup=true">
              <Button variant="gradient">Generate Report</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-medium">500+ Articles for Indian University Students</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Internship Report <span className="gradient-text">Blog & Guides</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Expert guides, tips, and templates for writing internship reports. 
            Tailored for Bengaluru North University, Bangalore University, and universities across India.
          </p>
          
          {/* CTA Banner */}
          <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl p-6 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <h3 className="font-display font-semibold text-xl mb-2">
                  Skip the Writing. Download Your Report Now!
                </h3>
                <p className="text-muted-foreground">
                  Our AI generates university-compliant internship reports in minutes
                </p>
              </div>
              <Link to="/auth?signup=true">
                <Button variant="hero" size="lg">
                  Generate AI Report
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="container mx-auto px-4 pb-8">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold">Filter Articles</h3>
            </div>
            <div className="grid md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setCurrentPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedUniversity} onValueChange={(v) => { setSelectedUniversity(v); setCurrentPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="University" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Universities</SelectItem>
                  {universities.map(uni => (
                    <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedDomain} onValueChange={(v) => { setSelectedDomain(v); setCurrentPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  {domains.map(dom => (
                    <SelectItem key={dom} value={dom}>{dom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(searchQuery || selectedCategory !== 'all' || selectedUniversity !== 'all' || selectedDomain !== 'all') && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredPosts.length} of {blogPosts.length} articles
                </p>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Blog Posts Grid */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedPosts.map((post) => (
            <Link key={post.id} to={`/blog/${post.slug}`}>
              <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-soft group">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {post.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {post.domain}
                    </Badge>
                  </div>
                  <CardTitle className="font-display text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      <span className="truncate max-w-[120px]">{post.university}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(post.publishedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{post.readTime} min</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {[...Array(Math.min(5, totalPages))].map((_, idx) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = idx + 1;
              } else if (currentPage <= 3) {
                pageNum = idx + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + idx;
              } else {
                pageNum = currentPage - 2 + idx;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="icon"
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="px-2">...</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        <p className="text-center text-sm text-muted-foreground mt-4">
          Page {currentPage} of {totalPages}
        </p>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 gradient-bg text-primary-foreground overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="font-display text-3xl font-bold mb-4">
                Stop Reading. Start Generating!
              </h2>
              <p className="text-primary-foreground/80 mb-6 max-w-2xl mx-auto">
                Why spend hours writing when our AI can create a university-compliant 
                internship report in minutes? Trusted by 10,000+ students across India.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth?signup=true">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Generate Report Now
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-primary-foreground/60 mt-4">
                ₹499 for 3 Reports • Instant Download • University Approved Format
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50">
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
                <li><a href="/Terms_of_Use.pdf" download className="hover:text-primary transition-colors">Download Terms (PDF)</a></li>
                <li><a href="/Privacy_Policy.pdf" download className="hover:text-primary transition-colors">Download Privacy (PDF)</a></li>
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

export default Blog;
