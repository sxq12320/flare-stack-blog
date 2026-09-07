import type { ThemeConfig } from "@/features/theme/contract/config";

export const config: ThemeConfig = {
  home: {
    recentPostsLimit: 4,
    popularPostsLimit: 5,
    recentAlbumsLimit: 6,
  },
  posts: {
    postsPerPage: 12,
  },
  post: {
    relatedPostsLimit: 3,
  },
  album: {
    albumsPerPage: 12,
  },
};
