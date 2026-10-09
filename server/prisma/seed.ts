import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/password";
import { normalizedKey, normalizeUrl } from "../src/lib/url";

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "password123";

interface SeedBookmark {
  title: string;
  url: string;
  description: string;
  tags: string[];
  viewCount?: number;
  lastVisitedAt?: Date;
  isPinned?: boolean;
  isArchived?: boolean;
}

const now = Date.now();
const daysAgo = (days: number) => new Date(now - days * 24 * 60 * 60 * 1000);

const TAGS: { name: string; color: string }[] = [
  { name: "Development", color: "#6366f1" },
  { name: "Design", color: "#ec4899" },
  { name: "News", color: "#0ea5e9" },
  { name: "Tools", color: "#10b981" },
  { name: "Learning", color: "#f59e0b" },
  { name: "AI", color: "#8b5cf6" },
];

const BOOKMARKS: SeedBookmark[] = [
  {
    title: "React documentation",
    url: "https://react.dev/learn",
    description:
      "The official React documentation covering hooks, components, state management and best practices for modern React apps.",
    tags: ["Development", "Learning"],
    viewCount: 42,
    lastVisitedAt: daysAgo(1),
    isPinned: true,
  },
  {
    title: "TypeScript Handbook",
    url: "https://www.typescriptlang.org/docs/handbook/intro.html",
    description: "Definitive guide to TypeScript: types, generics, narrowing and tooling.",
    tags: ["Development", "Learning"],
    viewCount: 31,
    lastVisitedAt: daysAgo(2),
  },
  {
    title: "Prisma ORM documentation",
    url: "https://www.prisma.io/docs/orm",
    description: "Prisma ORM guides for PostgreSQL, migrations, seeding and generated clients.",
    tags: ["Development", "Tools"],
    viewCount: 18,
    lastVisitedAt: daysAgo(4),
    isPinned: true,
  },
  {
    title: "Tailwind CSS documentation",
    url: "https://tailwindcss.com/docs",
    description: "Utility-first CSS framework reference with v4 features and design tokens.",
    tags: ["Design", "Development"],
    viewCount: 25,
    lastVisitedAt: daysAgo(3),
  },
  {
    title: "Hacker News",
    url: "https://news.ycombinator.com/",
    description: "Technology and startup discussion community.",
    tags: ["News"],
    viewCount: 120,
    lastVisitedAt: daysAgo(0),
  },
  {
    title: "Vercel Blog",
    url: "https://vercel.com/blog",
    description: "News about frontend tooling, edge computing and the modern web stack.",
    tags: ["News", "Development"],
    viewCount: 12,
    lastVisitedAt: daysAgo(6),
  },
  {
    title: "GitHub",
    url: "https://github.com/",
    description: "Where the world builds software. Host and review code, manage projects.",
    tags: ["Development", "Tools"],
    viewCount: 210,
    lastVisitedAt: daysAgo(0),
    isPinned: true,
  },
  {
    title: "Figma Community",
    url: "https://www.figma.com/community",
    description: "Free design files, plugins and templates shared by the community.",
    tags: ["Design"],
    viewCount: 9,
    lastVisitedAt: daysAgo(9),
  },
  {
    title: "Refactoring UI",
    url: "https://www.refactoringui.com/",
    description: "Practical tactics and tips for designing beautiful interfaces.",
    tags: ["Design", "Learning"],
    viewCount: 7,
    lastVisitedAt: daysAgo(11),
  },
  {
    title: "MDN Web Docs",
    url: "https://developer.mozilla.org/en-US/docs/Web",
    description: "Resources for developers, by developers: HTML, CSS, JavaScript references.",
    tags: ["Development", "Learning"],
    viewCount: 88,
    lastVisitedAt: daysAgo(1),
  },
  {
    title: "Anthropic Engineering",
    url: "https://www.anthropic.com/engineering",
    description: "Articles about building reliable applications with large language models.",
    tags: ["AI", "News"],
    viewCount: 15,
    lastVisitedAt: daysAgo(5),
  },
  {
    title: "Product Hunt",
    url: "https://www.producthunt.com/",
    description: "Discover the latest technology products and startups.",
    tags: ["News", "Tools"],
    viewCount: 5,
    isArchived: true,
  },
  {
    title: "Dribbble",
    url: "https://dribbble.com/",
    description: "Design portfolio network with shots, trends and inspiration.",
    tags: ["Design"],
    viewCount: 22,
    lastVisitedAt: daysAgo(20),
    isArchived: true,
  },
  {
    title: "Excalidraw",
    url: "https://excalidraw.com/",
    description: "Virtual whiteboard for sketching hand-drawn like diagrams.",
    tags: ["Tools"],
    viewCount: 33,
    lastVisitedAt: daysAgo(2),
  },
  {
    title: "Vue.js documentation",
    url: "https://vuejs.org/guide/introduction.html",
    description: "Progressive JavaScript framework for building user interfaces.",
    tags: ["Development", "Learning"],
    viewCount: 6,
    lastVisitedAt: daysAgo(15),
  },
];

async function main() {
  const passwordHash = hashPassword(DEMO_PASSWORD);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash },
    create: { email: DEMO_EMAIL, name: "Demo User", passwordHash },
  });

  const existing = await prisma.bookmark.count({ where: { userId: user.id } });
  if (existing > 0) {
    console.log(`Seed skipped: user ${DEMO_EMAIL} already has ${existing} bookmarks.`);
    return;
  }

  const tagIds = new Map<string, string>();
  for (const tag of TAGS) {
    const created = await prisma.tag.upsert({
      where: { userId_name: { userId: user.id, name: tag.name } },
      update: { color: tag.color },
      create: { userId: user.id, name: tag.name, color: tag.color },
    });
    tagIds.set(tag.name, created.id);
  }

  for (const bookmark of BOOKMARKS) {
    await prisma.bookmark.create({
      data: {
        userId: user.id,
        title: bookmark.title,
        url: normalizeUrl(bookmark.url),
        normalizedUrl: normalizedKey(bookmark.url),
        description: bookmark.description,
        faviconUrl: `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(
          new URL(normalizeUrl(bookmark.url)).hostname,
        )}`,
        viewCount: bookmark.viewCount ?? 0,
        lastVisitedAt: bookmark.lastVisitedAt ?? null,
        isPinned: bookmark.isPinned ?? false,
        isArchived: bookmark.isArchived ?? false,
        tags: {
          create: bookmark.tags
            .filter((name) => tagIds.has(name))
            .map((name) => ({ tag: { connect: { id: tagIds.get(name) as string } } })),
        },
      },
    });
  }

  console.log(`Seeded demo account: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`Created ${BOOKMARKS.length} bookmarks and ${TAGS.length} tags.`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
