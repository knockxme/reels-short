/*
 * npm run db:seed
 * Always adds the common genres and countries. Demo titles are added only outside production
 * (or with SEED_DEMO=1), so a production seed never publishes fake dramas.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// Vertical (3:4) placeholder covers, like real short-drama posters.
const cover = (text: string, bg: string) => `https://placehold.co/720x960/${bg}/ffffff/png?text=${encodeURIComponent(text)}`;

const HLS = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
const MP4 = "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4";

const genres = ["Romance", "Comedy", "Thriller", "Historical", "Fantasy", "Revenge", "Medical", "Action", "Melodrama", "Youth", "CEO", "Rebirth"];
const countries = ["South Korea", "China", "Thailand", "Japan", "Taiwan"];

const demo = [
  { title: "Moonlight Over Seoul", country: "South Korea", genres: ["Romance", "Comedy"], year: 2026, minutes: 84, featured: true, cast: ["Kim Ji-won", "Park Seo-jun"], bg: "7a1f3d" },
  { title: "The Jade Emperor's Daughter", country: "China", genres: ["Historical", "Fantasy", "Romance"], year: 2025, minutes: 112, featured: true, cast: ["Zhao Lusi", "Wang Yibo"], bg: "1f4d7a" },
  { title: "Silent Revenge", country: "South Korea", genres: ["Thriller", "Revenge"], year: 2026, minutes: 76, featured: true, cast: ["Song Hye-kyo", "Lee Do-hyun"], bg: "2b2b2b" },
  { title: "Bangkok Heartbeat", country: "Thailand", genres: ["Romance", "Youth"], year: 2025, minutes: 68, featured: false, cast: ["Bright Vachirawit"], bg: "7a5a1f" },
  { title: "Emergency Room 7", country: "Japan", genres: ["Medical", "Melodrama"], year: 2024, minutes: 95, featured: false, cast: ["Kento Yamazaki"], bg: "1f7a5a" },
  { title: "Last Train to Busan Night", country: "South Korea", genres: ["Action", "Thriller"], year: 2025, minutes: 92, featured: false, cast: ["Ma Dong-seok"], bg: "4d1f7a" },
];

async function main() {
  for (const name of genres) {
    await prisma.genre.upsert({ where: { slug: slugify(name) }, create: { name, slug: slugify(name) }, update: {} });
  }
  for (const name of countries) {
    await prisma.country.upsert({ where: { slug: slugify(name) }, create: { name, slug: slugify(name) }, update: {} });
  }

  if (process.env.NODE_ENV === "production" && process.env.SEED_DEMO !== "1") {
    console.log("Seeded genres and countries. Skipped demo dramas (production).");
    return;
  }

  for (const [i, d] of demo.entries()) {
    const slug = slugify(d.title);
    const country = await prisma.country.findUniqueOrThrow({ where: { slug: slugify(d.country) } });
    const synopsis = `${d.title} is a ${d.year} ${d.genres.join(", ").toLowerCase()} short drama from ${d.country}. This is demo text: replace it with your own unique synopsis of 150 to 300 words.\n\nA good synopsis introduces the main characters, the central conflict and what makes the story worth watching, without spoiling the ending. Unique text like this is what lets each drama page rank in Google.`;
    await prisma.drama.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        title: d.title,
        synopsis,
        posterUrl: cover(d.title, d.bg),
        year: d.year,
        type: "MOVIE",
        status: "COMPLETED",
        rating: 7.5 + (i % 4) * 0.5,
        views: 1000 - i * 120,
        featured: d.featured,
        featuredOrder: i + 1,
        countryId: country.id,
        genres: { connect: d.genres.map((g) => ({ slug: slugify(g) })) },
        actors: { connectOrCreate: d.cast.map((name) => ({ where: { slug: slugify(name) }, create: { name, slug: slugify(name) } })) },
        // The one full video: stored as the title's first episode row, with a backup server.
        episodes: {
          create: {
            number: 1,
            durationSec: d.minutes * 60,
            sources: {
              create: [
                { label: "Server 1", type: "HLS", url: HLS, priority: 0 },
                { label: "Server 2", type: "MP4", url: MP4, priority: 1 },
              ],
            },
          },
        },
      },
    });
  }

  await prisma.post.upsert({
    where: { slug: "best-korean-revenge-dramas" },
    update: {},
    create: {
      slug: "best-korean-revenge-dramas",
      title: "10 Best Korean Revenge Short Dramas to Watch Right Now",
      excerpt: "Craving a story where the villain finally gets what they deserve? These revenge short dramas deliver, start to finish in one sitting.",
      content: "Revenge stories are some of the most watchable short dramas. Here are our picks.\n\n## 1. Silent Revenge\n\nA quiet woman plans the perfect payback. [Watch Silent Revenge](/drama/silent-revenge).\n\n## Why revenge dramas work\n\n- Clear villains\n- Satisfying payoffs\n- The whole story in one video",
    },
  });

  console.log("Seeded genres, countries and demo dramas.");
}

main().finally(() => prisma.$disconnect());
