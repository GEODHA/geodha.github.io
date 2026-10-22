# GEODHA

**Civic accountability for Bengaluru's 369 GBA wards.** Citizen-generated reports → documented evidence → institutions act.

## About GEODHA

GEODHA is a civic accountability platform piloting in Bengaluru, India. The website functions as an insights engine and reporting interface while the GEODHA mobile app is in development.

### Mission
- Empower citizens to report solid waste problems (open burning, illegal dumps, truck non-arrival)
- Surface ward-level accountability data for residents, journalists, and RWAs
- Make grievance patterns visible — without exposing raw individual records

## Project info

**Repository**: https://github.com/arplut/arplut.github.io  
**Live Website**: https://geodha.org  
**Active branch**: `claude/geodha-website-upgrade-CRw1d`

---

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — hero, problem empathy section, services |
| `/dashboard` | Ward map — 369 GBA wards tinted by city corporation with live app reports; citizen testimonials carousel below |
| `/data` | Data & analysis — open burning × vulnerable communities |
| `/report` | Report a Problem — mobile-optimised form |
| `/blog` | Blog (Notion embed) |
| `/map` | Legacy map/reports view — preserved |
| `/jalandhar` | Jalandhar (Punjab) city data page — live report map, size/status filters, Punjab-wide counts, large-spot and before/after cleanup carousels. Defaults to Hindi. |
| `/about` | About GEODHA |
| `/privacy` | Privacy policy |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in real values. **Never commit `.env`.**

| Variable | Description | Required |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase API key | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Yes |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics measurement ID | Yes |
| `VITE_FIREBASE_VAPID_KEY` | Firebase VAPID key (push notifications) | Yes |
| `VITE_BLOG_NOTION_URL` | Notion embed URL for `/blog` page | No (has default) |
| `VITE_REPORT_FORM_URL` | External form URL for `/report` submissions | No |

---

## Data Files

All data files live in `/data/`. **No raw grievance records are exposed publicly.**

| File | Description |
|---|---|
| `data/ward-heatmap.json` | **PLACEHOLDER** — pre-aggregated normalised severity scores (0–1) per ward per category. Replace with pipeline output when confirmed. |
| `data/gba-ward-boundaries.json` | GBA 369-ward boundaries (final delimitation notified 19 Nov 2025, Dec 2025 ward names), simplified with mapshaper. Source: [OpenCity — GBA Wards Delimitation 2025](https://data.opencity.in/dataset/gba-wards-delimitation-2025). `ward_num` is a site-wide key (1–369); `ward_id` is the official number within the corporation. |
| `data/gba-corporations.json` | Outlines of the 5 GBA city corporations (Central, North, East, South, West), dissolved from the ward boundaries. |
| `data/legacy-bbmp-ward-centroids.json` | Centroids of the old 198 BBMP wards, mapped to the containing GBA ward. Used only to assign testimonials still keyed by the old ward numbers to a GBA ward. |

### Ward GeoJSON
Corporation colours and names live in `src/config/gba.ts`; geometry helpers in `src/lib/geo.ts`.

---

## Ward Images

`/public/ward-images/` contains manually curated visual evidence per ward. See `public/ward-images/README.md` for the full curation guide.

Structure:
```
/public/ward-images/
├── [ward-slug]/
│   ├── 01-description.jpg
│   └── 02-description.jpg
└── README.md
```

Images are shown in the Dashboard with captions only. Max 2–3 images per ward. **No complaint metadata is embedded.**

## 📱 GEODHA App – Comprehensive Feature List

### 1️⃣ User Profile & Access

#### User Registration & Login
- Email, phone number, or social login
- Option for pseudonymous/anonymous reporting (to encourage participation)

#### User Dashboard
- History of submitted reports
- Endorsements given & received
- Badges/recognition for contributions (kept simple, not gamified bloat)

#### Profile Settings
- Language preference (English, Kannada, others in future)
- Notification preferences (alerts for nearby hotspots, report updates)
- Privacy settings (share name publicly or keep anonymous)

### 2️⃣ Reporting & Data Capture

#### Report Creation
- Capture photo via in-app camera OR upload existing photo
- Auto-fetch metadata (date, time, GPS) from uploaded image
- Verify metadata vs. user's current/selected location
- Allow user to manually set location if reporting remotely
- Add short description (free text + optional tags for category selection)

#### Data Segregation (in-app backend AI or manual prompts)
- Automatically detect/report type (e.g., garbage pile, burning, sewage) — kept basic but expandable
- User option to reclassify if auto-tagging is wrong

### 3️⃣ Maps & Visualization

#### Interactive Heatmap
- View all reports as pins/heatmap
- Clustering within 5m radius → shows as one collated report
- Option to "endorse" an existing report OR "create new" if different

#### Filtering & Layers
- Filter reports by status (Red/Yellow/Green)
- Time filter (last 24h, last week, all-time)
- Category filter (garbage, burning, waterlogging, etc.)

### 4️⃣ Report Validation & Endorsements

#### Validation Flow
Reports categorized by:
- 🟢 **Green** → Report endorsed + cleanup verified
- 🟡 **Yellow** → Newly reported, pending verification
- 🔴 **Red** → Verified problem, not resolved

#### Endorsements
- Other users can validate that a report is real (by photo or visit)
- Users can validate cleanup (by submitting a new photo tagged to the report)
- Threshold system (e.g., ≥3 endorsements = verified)

### 5️⃣ Data Analytics (User-facing)

#### Personal Contribution Analytics
Reports submitted, # endorsed, % verified successful cleanups

#### Community Dashboard
- Total reports in area
- Breakdown by category (garbage vs. burning vs. sewage, etc.)
- Hotspot view (top 3 neighborhoods with most issues)

### 6️⃣ Communication & Sharing

#### Shareable Reports
- Auto-generate simple template for WhatsApp, Telegram, email (with image, location link, short description, and report ID)
- Quick share button → "Send to GBA / Ward Officer / WhatsApp Group"

#### Community Updates
Notifications for:
- When a nearby report is created
- When a user's report gets endorsed/closed
- When a hotspot near them escalates

### 7️⃣ UI/UX Principles Integrated
- **Simple Reporting Flow (3 Steps Max)**: Take/Upload Photo → Auto/Confirm Location → Submit
- **Visual Feedback**: Clear map pins, intuitive color-coded categories (Green/Yellow/Red)
- **Minimal Text Required**: Auto-fill + guided categories to avoid overwhelming the user
- **Trust & Transparency**: Endorsements shown publicly; each report has a "Report History" log (who endorsed/closed)
- **Accessibility**: Multilingual, icon-driven navigation for non-English literate users

### 8️⃣ Knowledge & Blog Page

#### In-App Blog/Knowledge Hub
- Regular posts explaining causes of common civic issues (e.g., why garbage burning happens, waste segregation tips, waterlogging causes)
- Practical "What You Can Do" guides for individuals, RWAs, schools, and local businesses
- Stories of successful community/NGO/government clean-up initiatives
- Links to partner organizations, campaigns, and volunteering opportunities

#### Personalized Suggestions
- Blog posts suggested based on the type of report a user made (e.g., after reporting garbage burning → suggest "Alternatives to Burning" article)

#### Multilingual Content
- Available in local languages (Kannada, Hindi, etc.) for wider accessibility

#### Engagement Features
- Save/share blog posts easily to WhatsApp or social media
- Simple feedback option ("Was this useful?") to refine content

## 🤖 AI & Advanced Features

### 1️⃣ AI Image Recognition for Auto-Classification
- **Core Idea**: Use computer vision to analyze uploaded photos and automatically classify issues (e.g., open garbage dump, burning, sewage overflow, construction debris)
- **Benefits**:
  - Reduces manual input burden for users
  - Improves accuracy in categorization for analytics
  - Helps filter out spam/fake reports
  - Enables pattern detection over time (e.g., recurring burning vs. stagnant sewage)
- **Scalability**: As the dataset grows, the AI model can be retrained for higher accuracy and customized for local problem types (e.g., Bengaluru garbage burning, Delhi dust)

### 2️⃣ Web Dashboard for Ward Officers, NGOs & Public Transparency
- **Core Idea**: A companion web platform where verified stakeholders (ward officers, NGOs, RWAs) can access real-time reports and analytics
- **Features**:
  - **Hotspot Maps**: View heatmaps of reports, filter by category (garbage, sewage, air-quality, etc.)
  - **Status Tracking**: See which reports are green/yellow/red and endorsement activity
  - **Data Export**: Download reports for planning, presentations, or RTI (Right to Information) requests
  - **Public Transparency Layer**: A simplified dashboard open to the public for trust-building and media usage
- **Benefits**:
  - Helps government officials prioritize interventions based on validated citizen data
  - Enables NGOs & RWAs to plan clean-ups or awareness drives
  - Increases trust and accountability by making report data visible to everyone

## 🚀 Future-Proof (Expandable but Not Immediate)
- AI image recognition to auto-classify issues with higher accuracy
- Integration with external low-cost pollution sensors (PM, VOCs)
- Web dashboard for ward officers & NGOs (public-facing transparency layer)

## Styling Guidelines

### Design System
The website uses a comprehensive design system built on Tailwind CSS with semantic tokens defined in `index.css` and `tailwind.config.ts`.

#### Color Palette
- **Primary Colors**: Use HSL format with semantic tokens (--primary, --primary-foreground)
- **Background**: Gradient-based backgrounds using --gradient-subtle and --gradient-primary
- **Text**: Semantic text colors (--foreground, --muted-foreground)
- **Accents**: Consistent accent colors for highlights and interactive elements

#### Typography
- **Headings**: Bold, large typography with gradient text effects for emphasis
- **Body Text**: Readable font sizes with proper line spacing
- **Interactive Text**: Proper contrast ratios for accessibility

#### Component Styling
- **Cards**: Soft shadows (--shadow-soft) with gradient backgrounds
- **Buttons**: Multiple variants (hero, outline, ghost) with consistent hover states
- **Animations**: Smooth transitions using CSS custom properties and Tailwind animations

### Animation Guidelines
- **Slide Animations**: Use `animate-slide-in-right` for progressive content reveal
- **Hover Effects**: Scale and shadow animations for interactive elements
- **Transitions**: Smooth 300-500ms transitions for state changes
- **Loading States**: Skeleton loaders and fade-in animations

### Responsive Design
- **Mobile-first**: Start with mobile design, enhance for larger screens
- **Grid Systems**: Use CSS Grid for complex layouts, Flexbox for simple arrangements
- **Breakpoints**: Follow Tailwind's standard breakpoints (sm, md, lg, xl)
- **Touch Targets**: Ensure buttons and interactive elements are adequately sized

### Component Architecture
- **Modular Design**: Break large components into smaller, focused components
- **Reusability**: Create variants and props for flexible component usage
- **Performance**: Lazy load images and optimize asset delivery
- **Accessibility**: Proper ARIA labels, semantic HTML, and keyboard navigation

### Best Practices

#### CSS/Styling
1. **Always use semantic tokens** instead of direct colors (e.g., `text-primary` not `text-blue-500`)
2. **Maintain consistency** in spacing, shadows, and border radius across components
3. **Use gradient backgrounds** for visual interest while maintaining readability
4. **Implement smooth animations** for better user experience

#### Component Structure
1. **Keep components focused** - each component should have a single responsibility
2. **Use TypeScript** for better development experience and error prevention
3. **Implement proper error boundaries** for robust user experience
4. **Follow React best practices** for hooks and state management

#### Performance
1. **Optimize images** with proper alt text and lazy loading
2. **Use efficient animations** that don't cause layout thrashing
3. **Implement proper loading states** for better perceived performance
4. **Bundle optimization** for faster initial page loads

## How can I edit this code?

There are several ways of editing your application.

**Clone and Edit Locally**

If you want to work locally using your preferred IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone https://github.com/arplut/arplut.github.io.git

# Step 2: Navigate to the project directory.
cd arplut.github.io

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

This project can be deployed using GitHub Pages or any static hosting service.

### GitHub Pages Deployment

The project is already configured for GitHub Pages deployment. Simply push your changes to the main branch and GitHub Actions will automatically build and deploy the site.

### Alternative Deployment Options

- **Vercel**: Connect your GitHub repository to Vercel for automatic deployments
- **Netlify**: Deploy directly from GitHub with continuous deployment
- **Firebase Hosting**: Use Firebase CLI to deploy to Firebase Hosting

## Can I connect a custom domain?

Yes, you can connect a custom domain to your GitHub Pages site.

### Setting up a custom domain

1. **Add your domain to GitHub Pages**:
   - Go to your repository settings
   - Scroll down to the "Pages" section
   - Enter your custom domain in the "Custom domain" field

2. **Configure DNS records**:
   - Add a CNAME record pointing to `<username>.github.io`
   - Or add A records pointing to GitHub's IP addresses

3. **Enable HTTPS**:
   - GitHub Pages will automatically provision an SSL certificate for your custom domain

For detailed instructions, refer to the [GitHub Pages custom domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).
