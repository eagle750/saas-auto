/**
 * Template context for static Next.js projects.
 *
 * Covers: landing pages, marketing sites, portfolios, blogs, documentation sites.
 * These projects have no backend database, no authentication, and no user-specific state.
 * Content is either static, fetched from a headless CMS, or read from local MDX/JSON files.
 */

export const STATIC_TEMPLATE_CONTEXT = `
## Project Type: Static Next.js Application

This is a static or content-driven Next.js project. Apply these patterns throughout.

### Typical File Structure
\`\`\`
├── next.config.ts              # Static export config, image domains
├── tailwind.config.ts          # Design tokens, custom fonts
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with fonts, metadata, analytics
│   │   ├── page.tsx            # Home / landing page
│   │   ├── globals.css         # Tailwind base, global styles
│   │   ├── about/
│   │   │   └── page.tsx
│   │   ├── blog/
│   │   │   ├── page.tsx        # Blog index
│   │   │   └── [slug]/
│   │   │       └── page.tsx    # Individual blog post
│   │   ├── projects/
│   │   │   └── page.tsx
│   │   └── contact/
│   │       └── page.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navigation.tsx
│   │   ├── sections/           # Full-page sections for landing pages
│   │   │   ├── HeroSection.tsx
│   │   │   ├── FeaturesSection.tsx
│   │   │   ├── TestimonialsSection.tsx
│   │   │   ├── PricingSection.tsx
│   │   │   └── CTASection.tsx
│   │   └── ui/                 # shadcn/ui components
│   ├── content/                # MDX or JSON content files
│   │   └── blog/
│   │       └── *.mdx
│   └── lib/
│       ├── utils.ts            # cn() and misc helpers
│       └── content.ts          # Content fetching utilities
\`\`\`

### Key Patterns

#### Root Layout
- Install and configure custom fonts using \`next/font/google\`
- Set \`<html lang="en">\` and include a \`<ThemeProvider>\` if dark mode is supported
- Add global metadata in \`generateMetadata\` or directly in the layout
- Use \`<Script>\` for third-party analytics (GA4, Plausible) with \`strategy="afterInteractive"\`

#### Landing Page Sections
- Divide pages into semantic full-width sections using \`<section>\` with \`id\` attributes for anchor links
- Use Framer Motion for scroll-triggered animations with \`useInView\`
- Implement lazy loading for images below the fold
- Add structured data (JSON-LD) for SEO in Server Components

#### Blog Pattern (MDX)
- Use \`next-mdx-remote\` or \`@next/mdx\` for MDX rendering
- Generate static params with \`generateStaticParams\` for all blog slugs
- Add \`generateMetadata\` with Open Graph image support
- Include reading time estimation and table of contents

#### Contact Form
- Use React Hook Form + Zod for client-side validation
- Submit via a Server Action or \`/api/contact\` route
- Send emails via Resend or Nodemailer
- Show toast notifications on success/failure

#### Performance Targets
- Use \`<Image>\` from next/image for all images: width, height, priority for LCP images
- Implement \`loading="lazy"\` for below-fold images
- Use \`next/font\` for zero-layout-shift font loading
- Target Core Web Vitals: LCP < 2.5s, CLS < 0.1, FID < 100ms

#### next.config.ts Settings
\`\`\`typescript
const config: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  // For fully static export (no server):
  // output: "export",
};
\`\`\`

### Component Architecture
- Every section component receives typed props — never hardcode content
- Export content arrays/objects from a separate \`src/data/\` directory
- Use \`cn()\` from \`@/lib/utils\` for conditional class merging (clsx + tailwind-merge)
- Implement a consistent spacing scale: section padding of \`py-16 md:py-24\`
- Use CSS Grid for complex layouts, Flexbox for alignment within components
`.trim();
