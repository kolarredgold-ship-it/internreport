// This script generates the blog sitemap
// Run with: npx ts-node scripts/generate-blog-sitemap.ts

const universities = [
  "Bengaluru North University",
  "Bangalore University", 
  "Visvesvaraya Technological University",
  "Mysore University",
  "Mangalore University",
  "JNTU Hyderabad",
  "Osmania University",
  "Anna University",
  "Mumbai University",
  "Pune University",
  "Gujarat University",
  "Delhi University",
  "Calcutta University",
  "Madras University",
  "Kerala University",
  "Andhra University",
  "Rajasthan University",
  "Punjab University",
  "Lucknow University",
  "Patna University"
];

const domains = [
  "Web Development",
  "Data Science",
  "Machine Learning",
  "Digital Marketing",
  "Graphic Design",
  "Content Writing",
  "Software Testing",
  "Mobile App Development",
  "Cloud Computing",
  "Cyber Security",
  "Artificial Intelligence",
  "Business Analytics",
  "Human Resources",
  "Finance",
  "Operations Management",
  "Supply Chain Management",
  "Sales & Marketing",
  "Product Management",
  "UI/UX Design",
  "Full Stack Development",
  "Python Development",
  "Java Development",
  "React Development",
  "Node.js Development",
  "Database Administration",
  "DevOps Engineering",
  "Network Administration",
  "IT Support",
  "E-commerce",
  "Social Media Marketing"
];

const blogTemplates = [
  "Complete Guide to {domain} Internship Report for {university} Students",
  "How to Write {domain} Internship Report - {university} Format 2024",
  "{domain} Internship Project Report Sample for {university}",
  "Download {domain} Internship Report Template - {university} Guidelines",
  "{university} {domain} Internship Report Writing Tips",
  "Best Practices for {domain} Internship Documentation at {university}",
  "{domain} Summer Internship Report Format for {university}",
  "AI Internship Report Generator for {domain} - {university} Approved",
  "{domain} Industrial Training Report for {university} Students",
  "Step-by-Step {domain} Internship Report Guide - {university}",
  "{university} {domain} Project Report Format & Structure",
  "Top Tips for {domain} Internship Success at {university}",
  "{domain} Internship Certificate & Report Requirements - {university}",
  "How Students at {university} Can Excel in {domain} Internships",
  "{domain} Work Experience Report Template for {university}",
  "Complete {domain} Internship Documentation Guide for Indian Universities",
  "{university} Approved {domain} Internship Report Examples",
  "Writing Your First {domain} Internship Report - {university} Guide",
  "{domain} Virtual Internship Report Format for {university}",
  "Last Minute {domain} Internship Report Help for {university} Students",
  "{university} {domain} Internship Assessment Criteria & Report Tips",
  "Professional {domain} Internship Report Writing Service for {university}",
  "{domain} Internship Learning Outcomes for {university} Students",
  "Common Mistakes in {domain} Internship Reports - {university} Edition",
  "{university} {domain} Internship Report Submission Guidelines 2024"
];

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 80);
};

const generateSitemap = (): string => {
  const urls: string[] = [];
  let postId = 1;
  const today = new Date().toISOString().split('T')[0];

  for (let templateIndex = 0; templateIndex < blogTemplates.length; templateIndex++) {
    for (let uniIndex = 0; uniIndex < universities.length; uniIndex++) {
      if (postId > 500) break;
      
      const domainIndex = (templateIndex + uniIndex) % domains.length;
      const template = blogTemplates[templateIndex];
      const university = universities[uniIndex];
      const domain = domains[domainIndex];
      
      const title = template
        .replace(/{domain}/g, domain)
        .replace(/{university}/g, university);
      
      const slug = generateSlug(title) + '-' + postId;
      
      urls.push(`  <url>
    <loc>https://internreport.in/blog/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
      
      postId++;
    }
    if (postId > 500) break;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
};

console.log(generateSitemap());
