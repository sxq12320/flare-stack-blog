import type { ThemeConfig } from "@/features/theme/contract/config";

export const config: ThemeConfig = {
  home: {
    recentPostsLimit: 5,
    popularPostsLimit: 3,
    recentAlbumsLimit: 6,
  },
  posts: {
    postsPerPage: 24,
  },
  post: {
    relatedPostsLimit: 4,
  },
  album: {
    albumsPerPage: 12,
  },
};
