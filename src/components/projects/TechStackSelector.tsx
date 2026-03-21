"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { GenerationConfig, ProjectTier } from "@/types/project";

interface TechStackSelectorProps {
  value: GenerationConfig;
  onChange: (config: GenerationConfig) => void;
  tier: ProjectTier;
}

interface OptionDef {
  id: string;
  label: string;
  description: string;
  icon: string;
  apiKeyInstructions?: string;
}

interface CategoryDef {
  key: keyof GenerationConfig;
  title: string;
  options: OptionDef[];
  fullstackOnly?: boolean;
}

const CATEGORIES: CategoryDef[] = [
  {
    key: "database",
    title: "Database",
    options: [
      {
        id: "postgresql",
        label: "PostgreSQL",
        description: "Robust open-source relational database",
        icon: "🐘",
        apiKeyInstructions:
          "Set DATABASE_URL in your environment. Format: postgresql://user:password@host:5432/dbname",
      },
      {
        id: "mysql",
        label: "MySQL",
        description: "World's most popular open source database",
        icon: "🐬",
        apiKeyInstructions:
          "Set DATABASE_URL in your environment. Format: mysql://user:password@host:3306/dbname",
      },
      {
        id: "mongodb",
        label: "MongoDB",
        description: "Flexible document-oriented NoSQL database",
        icon: "🍃",
        apiKeyInstructions:
          "Set MONGODB_URI in your environment. Get your connection string from MongoDB Atlas.",
      },
      {
        id: "supabase",
        label: "Supabase",
        description: "Open source Firebase alternative with Postgres",
        icon: "⚡",
        apiKeyInstructions:
          "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from your Supabase project settings.",
      },
      {
        id: "sqlite",
        label: "SQLite",
        description: "Lightweight embedded database, great for prototyping",
        icon: "💾",
      },
      {
        id: "none",
        label: "No Database",
        description: "Static project — no persistence needed",
        icon: "🚫",
      },
    ],
  },
  {
    key: "auth",
    title: "Authentication",
    options: [
      {
        id: "nextauth",
        label: "NextAuth.js",
        description: "Flexible auth for Next.js with many providers",
        icon: "🔐",
        apiKeyInstructions:
          "Set NEXTAUTH_SECRET (random string) and NEXTAUTH_URL. Add provider credentials as needed.",
      },
      {
        id: "clerk",
        label: "Clerk",
        description: "Complete user management out of the box",
        icon: "👤",
        apiKeyInstructions:
          "Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY from your Clerk dashboard.",
      },
      {
        id: "supabase",
        label: "Supabase Auth",
        description: "Built-in auth with Supabase — email, OAuth, magic links",
        icon: "⚡",
        apiKeyInstructions:
          "Use the same Supabase keys: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      },
      {
        id: "firebase",
        label: "Firebase Auth",
        description: "Google-backed auth with generous free tier",
        icon: "🔥",
        apiKeyInstructions:
          "Set NEXT_PUBLIC_FIREBASE_* variables from your Firebase project config.",
      },
      {
        id: "none",
        label: "No Auth",
        description: "Public project — no user accounts needed",
        icon: "🚫",
      },
    ],
  },
  {
    key: "payments",
    title: "Payments",
    fullstackOnly: true,
    options: [
      {
        id: "stripe",
        label: "Stripe",
        description: "Industry-leading payments platform with great DX",
        icon: "💳",
        apiKeyInstructions:
          "Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY from your Stripe dashboard. Also set STRIPE_WEBHOOK_SECRET.",
      },
      {
        id: "razorpay",
        label: "Razorpay",
        description: "Popular payments gateway in India and Southeast Asia",
        icon: "💰",
        apiKeyInstructions:
          "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from your Razorpay dashboard.",
      },
      {
        id: "lemonsqueezy",
        label: "Lemon Squeezy",
        description: "All-in-one payments for digital products and SaaS",
        icon: "🍋",
        apiKeyInstructions:
          "Set LEMONSQUEEZY_API_KEY and LEMONSQUEEZY_STORE_ID from your Lemon Squeezy dashboard.",
      },
      {
        id: "none",
        label: "No Payments",
        description: "Free project — no payment processing needed",
        icon: "🚫",
      },
    ],
  },
  {
    key: "styling",
    title: "Styling",
    options: [
      {
        id: "shadcn",
        label: "shadcn/ui",
        description: "Beautiful components built on Tailwind + Radix UI",
        icon: "🎨",
      },
      {
        id: "tailwind",
        label: "Tailwind CSS only",
        description: "Utility-first CSS framework — no component library",
        icon: "🌊",
      },
      {
        id: "chakra",
        label: "Chakra UI",
        description: "Accessible React component library with theming",
        icon: "⚡",
      },
      {
        id: "css",
        label: "Plain CSS",
        description: "Custom CSS with no framework",
        icon: "📄",
      },
    ],
  },
  {
    key: "deployment",
    title: "Deployment",
    options: [
      {
        id: "vercel",
        label: "Vercel",
        description: "Zero-config deployments built for Next.js",
        icon: "▲",
      },
      {
        id: "netlify",
        label: "Netlify",
        description: "Serverless platform with automatic Git deploys",
        icon: "🌐",
      },
      {
        id: "railway",
        label: "Railway",
        description: "Infrastructure made simple — database included",
        icon: "🚂",
      },
      {
        id: "render",
        label: "Render",
        description: "Cloud for developers — easy auto-deploys",
        icon: "☁️",
      },
      {
        id: "docker",
        label: "Docker",
        description: "Containerized for self-hosted or any cloud",
        icon: "🐳",
      },
    ],
  },
];

interface ApiKeyInstructionsProps {
  instructions: string;
  optionLabel: string;
}

function ApiKeyInstructions({ instructions, optionLabel }: ApiKeyInstructionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        How to get {optionLabel} API keys
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-border/40 bg-muted/30 p-3 text-xs text-muted-foreground">
          {instructions}
        </div>
      )}
    </div>
  );
}

export function TechStackSelector({
  value,
  onChange,
  tier,
}: TechStackSelectorProps) {
  const visibleCategories = CATEGORIES.filter(
    (cat) => !(cat.fullstackOnly && tier !== "FULLSTACK")
  );

  function select(key: keyof GenerationConfig, id: string) {
    onChange({ ...value, [key]: id });
  }

  return (
    <div className="space-y-6">
      {visibleCategories.map((category) => {
        const selected = value[category.key] as string | undefined;

        return (
          <div key={category.key}>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              {category.title}
              {category.fullstackOnly && (
                <span className="ml-2 text-xs font-normal text-purple-400">
                  Full-Stack only
                </span>
              )}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {category.options.map((option) => {
                const isSelected = selected === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => select(category.key, option.id)}
                    className="text-left"
                  >
                    <Card
                      className={cn(
                        "relative cursor-pointer transition-all duration-150",
                        isSelected
                          ? "ring-2 ring-blue-500 bg-blue-500/5"
                          : "hover:ring-1 hover:ring-border"
                      )}
                    >
                      {isSelected && (
                        <span className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-blue-500">
                          <Check className="size-2.5 text-white" />
                        </span>
                      )}
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-2">
                          <span className="text-xl leading-none mt-0.5">
                            {option.icon}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {option.label}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                              {option.description}
                            </p>
                            {isSelected && option.apiKeyInstructions && (
                              <ApiKeyInstructions
                                instructions={option.apiKeyInstructions}
                                optionLabel={option.label}
                              />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TechStackSelector;
