import { Hero } from "./landing/Hero";
import { TagRail } from "./landing/TagRail";
import { StatBand } from "./landing/StatBand";
import { FeatureGrid } from "./landing/FeatureGrid";
import { PostList } from "./landing/PostList";
import { SplitFeature } from "./landing/SplitFeature";
import { Faq } from "./landing/Faq";
import { SiteFooter } from "./landing/SiteFooter";

export type LandingView =
  | "patterns"
  | "speed-apps"
  | "popular-lists"
  | "submit"
  | "flashcards"
  | "interview-drill";

// Galaxy.com-style product landing: stacked full-width sections. Each section is
// a self-contained component under ./landing; this just orders them and threads
// navigation. Sections receive a loose (view: string) callback; we narrow here.
export function Landing({
  onNavigate,
}: {
  onNavigate: (view: LandingView) => void;
}) {
  const nav = (view: string) => onNavigate(view as LandingView);
  return (
    <div>
      <Hero onNavigate={nav} />
      <TagRail onNavigate={nav} />
      <StatBand />
      <FeatureGrid onNavigate={nav} />
      <PostList onNavigate={nav} />
      <SplitFeature onNavigate={nav} />
      <Faq />
      <SiteFooter onNavigate={nav} />
    </div>
  );
}
