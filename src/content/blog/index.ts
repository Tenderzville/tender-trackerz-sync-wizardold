import type { BlogPost } from "./types";
import { post as p1 } from "./posts/01-win-government-tenders-kenya";
import { post as p2 } from "./posts/02-free-kenya-tender-sources-compared";
import { post as p3 } from "./posts/03-agpo-certification-kenya";
import { post as p4 } from "./posts/04-winning-bid-proposal-kenya";
import { post as p5 } from "./posts/05-consortium-bidding-kenya";
import { post as p6 } from "./posts/06-tenderpro-learning-hub";
import { post as p7 } from "./posts/07-county-tenders-kenya";
import { post as p8 } from "./posts/08-egp-kenya-walkthrough";
import { post as p9 } from "./posts/09-ai-changing-kenyan-procurement";
import { post as p10 } from "./posts/10-kenya-tender-deadlines";

export const allPosts: BlogPost[] = [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return allPosts.find((p) => p.slug === slug);
}
