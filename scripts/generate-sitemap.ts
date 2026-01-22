import { blogPosts } from '../src/data/blogPosts';
import * as fs from 'fs';
import * as path from 'path';

const today = new Date().toISOString().split('T')[0];

const generateBlogSitemap = (): string => {
  const urls = blogPosts.map(post => `  <url>
    <loc>https://internreport.in/blog/${post.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
};

// Generate sitemap
const sitemap = generateBlogSitemap();
const outputPath = path.join(__dirname, '../public/sitemap-blog.xml');
fs.writeFileSync(outputPath, sitemap);
console.log(`Blog sitemap generated with ${blogPosts.length} URLs at ${outputPath}`);
