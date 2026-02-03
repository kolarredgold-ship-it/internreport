import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Domain to Coursera search mapping for relevant courses
const domainToCourseraSearch: Record<string, string[]> = {
  "Web Development": ["web development", "javascript", "react", "html css", "frontend development"],
  "Data Science": ["data science", "python data analysis", "machine learning", "statistics"],
  "Machine Learning": ["machine learning", "deep learning", "neural networks", "tensorflow"],
  "Digital Marketing": ["digital marketing", "seo", "social media marketing", "google ads"],
  "Graphic Design": ["graphic design", "adobe photoshop", "illustrator", "ui design"],
  "Content Writing": ["content writing", "copywriting", "technical writing", "blogging"],
  "Software Testing": ["software testing", "qa testing", "selenium", "test automation"],
  "Mobile App Development": ["mobile app development", "android development", "ios development", "flutter"],
  "Cloud Computing": ["cloud computing", "aws", "azure", "google cloud"],
  "Cyber Security": ["cyber security", "ethical hacking", "network security", "penetration testing"],
  "Artificial Intelligence": ["artificial intelligence", "ai", "deep learning", "nlp"],
  "Business Analytics": ["business analytics", "data analysis", "excel", "power bi"],
  "Human Resources": ["human resources", "hr management", "talent management", "recruitment"],
  "Finance": ["finance", "financial analysis", "accounting", "investment"],
  "Operations Management": ["operations management", "supply chain", "project management", "lean six sigma"],
  "Supply Chain Management": ["supply chain management", "logistics", "inventory management"],
  "Sales & Marketing": ["sales", "marketing", "business development", "crm"],
  "Product Management": ["product management", "agile", "scrum", "product strategy"],
  "UI/UX Design": ["ui ux design", "user experience", "figma", "user research"],
  "Accounting": ["accounting", "tally", "gst", "bookkeeping"],
  "Banking": ["banking", "financial services", "fintech"],
  "Commerce": ["commerce", "business fundamentals", "entrepreneurship"],
  "default": ["career skills", "professional development", "communication skills"]
};

// Curated free/discounted courses (these are popular free courses on Coursera)
const featuredFreeCourses = [
  {
    id: "google-it-support",
    title: "Google IT Support Professional Certificate",
    partner: "Google",
    description: "Launch your career in IT with a professional certificate from Google",
    rating: 4.8,
    enrollments: "1M+",
    duration: "6 months",
    level: "Beginner",
    isFree: true,
    discount: null,
    imageUrl: "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://coursera-course-photos.s3.amazonaws.com/83/e258e0532611e5a5072321239ff4d4/jhep-coursera-course4.png",
    affiliateUrl: "https://click.linksynergy.com/deeplink?id=YOUR_AFFILIATE_ID&mid=40328&murl=https%3A%2F%2Fwww.coursera.org%2Fprofessional-certificates%2Fgoogle-it-support"
  },
  {
    id: "learning-how-to-learn",
    title: "Learning How to Learn",
    partner: "Deep Teaching Solutions",
    description: "Powerful mental tools to help you master tough subjects",
    rating: 4.8,
    enrollments: "3M+",
    duration: "4 weeks",
    level: "Beginner",
    isFree: true,
    discount: null,
    imageUrl: "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://coursera-course-photos.s3.amazonaws.com/cb/3c4030d65011e682d8b14e2f0915fa/Learning-How-to-Learn-Logo.jpg",
    affiliateUrl: "https://click.linksynergy.com/deeplink?id=YOUR_AFFILIATE_ID&mid=40328&murl=https%3A%2F%2Fwww.coursera.org%2Flearn%2Flearning-how-to-learn"
  },
  {
    id: "python-everybody",
    title: "Python for Everybody",
    partner: "University of Michigan",
    description: "Learn to Program and Analyze Data with Python",
    rating: 4.8,
    enrollments: "2M+",
    duration: "8 months",
    level: "Beginner",
    isFree: true,
    discount: null,
    imageUrl: "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://coursera-course-photos.s3.amazonaws.com/08/33f720502a11e59e72391aa537f5c9/pythonlearn_thumbnail_1x1.png",
    affiliateUrl: "https://click.linksynergy.com/deeplink?id=YOUR_AFFILIATE_ID&mid=40328&murl=https%3A%2F%2Fwww.coursera.org%2Fspecializations%2Fpython"
  },
  {
    id: "google-data-analytics",
    title: "Google Data Analytics Certificate",
    partner: "Google",
    description: "Prepare for a career in Data Analytics with Google",
    rating: 4.8,
    enrollments: "1.5M+",
    duration: "6 months",
    level: "Beginner",
    isFree: false,
    discount: "50% OFF",
    imageUrl: "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://coursera-course-photos.s3.amazonaws.com/74/4d6df0f74811e8b1e1c30510e0d5f5/Google-Data-Analytics.jpg",
    affiliateUrl: "https://click.linksynergy.com/deeplink?id=YOUR_AFFILIATE_ID&mid=40328&murl=https%3A%2F%2Fwww.coursera.org%2Fprofessional-certificates%2Fgoogle-data-analytics"
  },
  {
    id: "ibm-data-science",
    title: "IBM Data Science Professional Certificate",
    partner: "IBM",
    description: "Kickstart your career in data science & ML",
    rating: 4.6,
    enrollments: "500K+",
    duration: "5 months",
    level: "Beginner",
    isFree: false,
    discount: "7-day Free Trial",
    imageUrl: "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://coursera-course-photos.s3.amazonaws.com/d9/6f4f30c36411e7b27cb35cb09c16e0/DS.png",
    affiliateUrl: "https://click.linksynergy.com/deeplink?id=YOUR_AFFILIATE_ID&mid=40328&murl=https%3A%2F%2Fwww.coursera.org%2Fprofessional-certificates%2Fibm-data-science"
  },
  {
    id: "meta-frontend",
    title: "Meta Front-End Developer Certificate",
    partner: "Meta",
    description: "Launch your career as a front-end developer",
    rating: 4.7,
    enrollments: "300K+",
    duration: "7 months",
    level: "Beginner",
    isFree: false,
    discount: "7-day Free Trial",
    imageUrl: "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://coursera-course-photos.s3.amazonaws.com/d3/e8f8ab41d840d4a3de3f3cde0f7991/image-18.png",
    affiliateUrl: "https://click.linksynergy.com/deeplink?id=YOUR_AFFILIATE_ID&mid=40328&murl=https%3A%2F%2Fwww.coursera.org%2Fprofessional-certificates%2Fmeta-front-end-developer"
  }
];

// Domain-specific course recommendations
const domainCourses: Record<string, typeof featuredFreeCourses> = {
  "Web Development": [
    {
      id: "meta-frontend",
      title: "Meta Front-End Developer",
      partner: "Meta",
      description: "Build job-ready skills for an in-demand career as a front-end developer",
      rating: 4.7,
      enrollments: "300K+",
      duration: "7 months",
      level: "Beginner",
      isFree: false,
      discount: "Free Trial",
      imageUrl: "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://coursera-course-photos.s3.amazonaws.com/d3/e8f8ab41d840d4a3de3f3cde0f7991/image-18.png",
      affiliateUrl: "https://click.linksynergy.com/deeplink?id=YOUR_AFFILIATE_ID&mid=40328&murl=https%3A%2F%2Fwww.coursera.org%2Fprofessional-certificates%2Fmeta-front-end-developer"
    },
    {
      id: "html-css-js",
      title: "HTML, CSS, and Javascript",
      partner: "Johns Hopkins University",
      description: "Learn the basics of web development",
      rating: 4.7,
      enrollments: "500K+",
      duration: "4 weeks",
      level: "Beginner",
      isFree: true,
      discount: null,
      imageUrl: "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://coursera-course-photos.s3.amazonaws.com/83/e258e0532611e5a5072321239ff4d4/jhep-coursera-course4.png",
      affiliateUrl: "https://click.linksynergy.com/deeplink?id=YOUR_AFFILIATE_ID&mid=40328&murl=https%3A%2F%2Fwww.coursera.org%2Flearn%2Fhtml-css-javascript-for-web-developers"
    }
  ],
  "Data Science": [
    {
      id: "google-data-analytics",
      title: "Google Data Analytics",
      partner: "Google",
      description: "Prepare for a career in Data Analytics",
      rating: 4.8,
      enrollments: "1.5M+",
      duration: "6 months",
      level: "Beginner",
      isFree: false,
      discount: "50% OFF",
      imageUrl: "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://coursera-course-photos.s3.amazonaws.com/74/4d6df0f74811e8b1e1c30510e0d5f5/Google-Data-Analytics.jpg",
      affiliateUrl: "https://click.linksynergy.com/deeplink?id=YOUR_AFFILIATE_ID&mid=40328&murl=https%3A%2F%2Fwww.coursera.org%2Fprofessional-certificates%2Fgoogle-data-analytics"
    }
  ],
  "Digital Marketing": [
    {
      id: "google-digital-marketing",
      title: "Google Digital Marketing & E-commerce",
      partner: "Google",
      description: "Get on the fast track to a career in digital marketing",
      rating: 4.8,
      enrollments: "400K+",
      duration: "6 months",
      level: "Beginner",
      isFree: false,
      discount: "Free Trial",
      imageUrl: "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://coursera-course-photos.s3.amazonaws.com/75/99e7e0b37111ec915e1b9e3457f89e/Marketing-1-.png",
      affiliateUrl: "https://click.linksynergy.com/deeplink?id=YOUR_AFFILIATE_ID&mid=40328&murl=https%3A%2F%2Fwww.coursera.org%2Fprofessional-certificates%2Fgoogle-digital-marketing-ecommerce"
    }
  ],
  "Finance": [
    {
      id: "finance-accounting",
      title: "Financial Accounting Fundamentals",
      partner: "University of Virginia",
      description: "Master the technical skills needed to analyze financial statements",
      rating: 4.7,
      enrollments: "200K+",
      duration: "4 weeks",
      level: "Beginner",
      isFree: true,
      discount: null,
      imageUrl: "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://coursera-course-photos.s3.amazonaws.com/67/2ddd00e99511e5a7e5b9b81b35ec47/accounting_financialaccounting.jpg",
      affiliateUrl: "https://click.linksynergy.com/deeplink?id=YOUR_AFFILIATE_ID&mid=40328&murl=https%3A%2F%2Fwww.coursera.org%2Flearn%2Fuva-darden-financial-accounting"
    }
  ],
  "Human Resources": [
    {
      id: "hrci-hr",
      title: "HRCI Human Resource Associate",
      partner: "HRCI",
      description: "Build in-demand HR skills and earn a credential",
      rating: 4.6,
      enrollments: "100K+",
      duration: "4 months",
      level: "Beginner",
      isFree: false,
      discount: "Free Trial",
      imageUrl: "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://coursera-course-photos.s3.amazonaws.com/36/f8f1b0d29311e8b1e1c30510e0d5f5/HRCI.jpg",
      affiliateUrl: "https://click.linksynergy.com/deeplink?id=YOUR_AFFILIATE_ID&mid=40328&murl=https%3A%2F%2Fwww.coursera.org%2Fprofessional-certificates%2Fhrci-human-resource-associate"
    }
  ]
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const ACCOUNT_SID = Deno.env.get('COURSERA_ACCOUNT_SID');
    const AUTH_TOKEN = Deno.env.get('COURSERA_AUTH_TOKEN');

    if (!ACCOUNT_SID || !AUTH_TOKEN) {
      console.error('Missing Coursera API credentials');
      // Return curated courses even without API
      return new Response(JSON.stringify({
        success: true,
        featuredCourses: featuredFreeCourses,
        recommendedCourses: []
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { domain, university } = await req.json().catch(() => ({}));

    console.log(`Fetching courses for domain: ${domain}, university: ${university}`);

    // Get domain-specific courses
    const recommended = domainCourses[domain] || [];
    
    // Update affiliate URLs with actual SID
    const updateAffiliateUrl = (course: typeof featuredFreeCourses[0]) => ({
      ...course,
      affiliateUrl: course.affiliateUrl.replace('YOUR_AFFILIATE_ID', ACCOUNT_SID)
    });

    const featuredWithAffiliate = featuredFreeCourses.map(updateAffiliateUrl);
    const recommendedWithAffiliate = recommended.map(updateAffiliateUrl);

    return new Response(JSON.stringify({
      success: true,
      featuredCourses: featuredWithAffiliate,
      recommendedCourses: recommendedWithAffiliate,
      searchTerms: domainToCourseraSearch[domain] || domainToCourseraSearch["default"]
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error fetching Coursera courses:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      featuredCourses: featuredFreeCourses,
      recommendedCourses: []
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
