// Typed accessor for the generated topic-tag + neetcode-category enrichment.
//
// Data source: LeetCode topic tags via the community alfa-leetcode-api, merged
// with the neetcode `category` from scripts/blind75Registry.ts.
// Credit: neetcode-gh/leetcode (MIT-licensed) for the category groupings.
//
// Regenerate src/data/topicTags.json with: npx tsx scripts/fetch-topic-tags.ts

import data from "./topicTags.json";

export interface TopicInfo {
  category: string | null;
  topicTags: string[];
}

export const topicTags: Record<string, TopicInfo> = data;

export function getTopicInfo(slug: string): TopicInfo | undefined {
  return topicTags[slug];
}
