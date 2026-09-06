"use client";
import Link from "next/link";
import { usePortfolio } from "./PortfolioProvider";
export function Navigation() {
  const { destination, navigate } = usePortfolio();
  const follow = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); navigate(href);
  };
  return <header className="site-header" data-home={destination === "home"}>
    <Link className="site-name" href="/" onClick={event => follow(event, '/')} aria-label="Mohamad Awad, home">Mohamad Awad<span>Toronto, Canada</span></Link>
    <nav aria-label="Primary"><ul>
      {(["projects", "experience", "about", "resume", "contact"] as const).map(id => <li key={id}><Link href={"/" + id} onClick={event => follow(event, '/' + id)} aria-current={destination === id ? "page" : undefined}>{id[0].toUpperCase() + id.slice(1)}</Link></li>)}
    </ul></nav>
  </header>;
}
