"use client";
import Link from 'next/link';
import { usePortfolio } from '../shell/PortfolioProvider';
export function HomeContent() {
  const { navigate } = usePortfolio();
  const follow = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); navigate('/projects');
  };
  return <div className="home-film photographic-journey">
    <section className="introduction" id="introduction">
      <h1>Mohamad<br />Awad.</h1><p>Civil engineering student at TMU.</p>
      <Link className="work-link" href="/projects" onClick={follow}>Explore my work <span aria-hidden="true">↗</span></Link>
    </section>
    <section className="arrival" id="arrival" aria-label="Continue exploring" inert>
      <p>Selected work.</p><Link className="work-link" href="/projects" onClick={follow}>Explore my work <span aria-hidden="true">↗</span></Link>
    </section>
    <div id="film-runway" aria-hidden="true" />
    <noscript><p className="no-script">Use the navigation to explore the portfolio. This visual journey needs JavaScript.</p></noscript>
  </div>;
}
