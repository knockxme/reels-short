import type { DramaFilter } from "./data";

export const LISTINGS = {
  browse: {
    title: "Browse All Short Dramas",
    intro: "Browse every Korean, Chinese, Thai and Japanese short drama on our site, recently updated first. Each story plays in full in one video with English subtitles.",
    filter: { sort: "latest" },
  },
  new: {
    title: "New Short Dramas",
    intro: "The newest short dramas added to the site. Every title is the complete story in one video, made to watch on your phone.",
    filter: { sort: "new" },
  },
  popular: {
    title: "Most Popular Short Dramas",
    intro: "The most watched short dramas right now, ranked by views from our viewers. Start any of them and watch the full story in one go.",
    filter: { sort: "popular" },
  },
} satisfies Record<string, { title: string; intro: string; filter: DramaFilter }>;
