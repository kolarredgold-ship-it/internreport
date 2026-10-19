# InternReport.in

Below is a FULL, PROFESSIONAL PRD (Product Requirements Document) for your Internship Project Report Generator App.
This PRD is written in startup / SaaS / investor / developer–ready format and can be directly shared with developers, UI designers, or payment partners (Razorpay).
________________________________________
📘 PRODUCT REQUIREMENTS DOCUMENT (PRD)
Product Name
Internship Project Report Generator (IPRG)
Version
v1.0
Prepared For
Web & App Development Team
AI Integration Team
Payment Gateway (Razorpay) Compliance
________________________________________
1. PRODUCT OVERVIEW
1.1 Problem Statement
Indian graduate students are required to submit internship project reports (3–40 pages) in a strict university-prescribed format.
Most students:
•	Lack academic writing skills
•	Face time constraints
•	Do not understand university evaluation standards
•	Cannot afford expensive project consultants
1.2 Solution
A secure, paid web application that:
•	Collects student internship details
•	Uses AI (DeepSeek) to generate exam-ready internship project reports
•	Allows online payment via Razorpay
•	Provides Word & PDF downloads
________________________________________
2. TARGET USERS
Primary Users
•	B.Com, BBA, BCA, MBA, Engineering students
•	Indian universities (Bengaluru North University, etc.)
Secondary Users
•	Colleges
•	Internship coordinators
•	Academic consultants (future expansion)
________________________________________
3. PRODUCT GOALS & OBJECTIVES
Business Goals
•	Monetize AI-based academic content
•	Achieve Razorpay approval
•	Build scalable SaaS product
•	Reduce manual project-writing dependency
User Goals
•	Generate high-quality project reports easily
•	Save time and money
•	Get university-compliant documents
________________________________________
4. CORE FEATURES (MVP)
4.1 Authentication System
•	User registration
•	Secure login
•	Password encryption (bcrypt)
•	Forgot password (OTP / Email)
•	Session-based or JWT authentication
________________________________________
4.2 User Dashboard
•	Profile details
•	Project creation form
•	Page selection (3–40 pages)
•	Price display
•	Payment status
•	Download history
________________________________________
4.3 Internship Data Collection Form
Mandatory inputs:
•	Course
•	Student Name
•	Register Number
•	College Name
•	University
•	Guide Name
•	Internship Title
•	Company Name & Location
•	Internship Duration
•	Academic Year
•	Topic / Specialization
•	Pages required
________________________________________
4.4 Payment System (Razorpay)
•	Page-based pricing
•	Secure Razorpay checkout
•	Payment verification using signature
•	Store only:
o	Order ID
o	Payment ID
o	Status
•	No storage of card / UPI details
________________________________________
4.5 AI Content Generation
•	AI: DeepSeek API
•	Academic, Indian university style
•	Exam-friendly
•	Plagiarism-free
•	Human-like writing
•	Section-wise deep elaboration
•	Page-length controlled
________________________________________
4.6 Document Generation
•	Convert AI output to:
o	DOCX
o	PDF
•	University-style formatting
•	Download buttons
________________________________________
5. POLICY & COMPLIANCE (MANDATORY)
5.1 Terms & Conditions
•	AI-assisted academic reference only
•	No guarantee of marks or approval
•	User responsibility disclaimer
•	No redistribution
5.2 Privacy Policy
•	Data collected: Name, Email, Mobile, Academic inputs, Payment ID
•	Password encryption
•	Payments via Razorpay only
•	No data selling
5.3 Payment Policy
•	Payment before generation
•	Razorpay-only processing
•	Transparent pricing
5.4 Refund Policy
•	No refund after generation
•	Refund only for failed service
•	Request within 48 hours
5.5 Security Policy
•	HTTPS enforced
•	Secure APIs
•	Encrypted credentials
•	PCI-DSS compliant payments
________________________________________
6. USER FLOW
1.	User visits website
2.	Creates account / logs in
3.	Accepts policies
4.	Fills internship form
5.	Selects page count
6.	Makes payment via Razorpay
7.	AI generates report
8.	User downloads Word/PDF
________________________________________
7. NON-FUNCTIONAL REQUIREMENTS
Performance
•	AI response time ≤ 60 seconds (depends on pages)
•	Payment verification < 3 seconds
Security
•	SQL injection protection
•	XSS protection
•	Rate limiting
•	Secure API keys (env-based)
Scalability
•	Modular backend
•	Can add admin panel later
•	Can add college licensing later
________________________________________
8. TECH STACK (RECOMMENDED)
Frontend
•	HTML / CSS / React / Next.js
Backend
•	Node.js / PHP / Python
AI
•	DeepSeek AI API
Payments
•	Razorpay API
Storage
•	MySQL / PostgreSQL / MongoDB
________________________________________
9. FUTURE ENHANCEMENTS (POST-MVP)
•	Admin dashboard
•	College branding
•	Multiple course support
•	Viva questions generator
•	Plagiarism checker
•	Bulk student upload
•	Franchise / license model
________________________________________
10. SUCCESS METRICS (KPIs)
•	Successful payment rate
•	Report generation completion rate
•	Refund requests
•	Repeat users
•	College onboarding
________________________________________
11. RISKS & MITIGATION
Risk	Mitigation
AI content rejection	Academic-style prompts
Razorpay rejection	Full policy compliance
Abuse	Rate limiting & logging
Plagiarism concerns	Unique generation per user
________________________________________
12. APPROVAL CRITERIA
The product will be considered ready when:
•	Razorpay account approved
•	Payments working end-to-end
•	Reports generated correctly
•	DOCX/PDF downloads working
•	Policies accessible publicly
________________________________________
📌 FINAL NOTE
This PRD is production-ready and suitable for:
•	Developers
•	Investors
•	Payment gateway onboarding
•	SaaS documentation
________________________________________
LIMIT GENERATE REPORT TO 3 TIMES ONLY IF THEY NEED MORE TOPUP OF 499 AND ADD BACKEND

REPORT SHOULD GENERATE USING DEEPSEEK AI AS PER UNIVERSITY PATTERN AS GIVEN IN PROMOT IN STARTING AND DEEPSEEK AI API KEY IS sk-4f560764a5884ee1b464399bd26e6a76
IF ANY ERRORS OCCURS WHILE USING DEEPSEEK AI USE THIS LINK TO FOR GETTING ERROR SOLVED https://api-docs.deepseek.com/

Generate the report as a downloadable DOCX file with proper formatting instead of plain text. AND Create a 'My Reports' page showing all previously generated reports with download history.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://internreport.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/15f32310-635d-4a8b-b1cb-4b5fc132c251).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
