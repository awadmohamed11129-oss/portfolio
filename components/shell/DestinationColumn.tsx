"use client";

import type { ReactNode } from "react";
import { usePortfolio } from "./PortfolioProvider";

export function DestinationColumn({ children }: { children: ReactNode }) {
  const { destination, transit } = usePortfolio();
  return <main id="main-content" tabIndex={-1} className="destination-column"
    data-destination-column data-destination={destination} data-phase={transit.phase}>
    {children}
  </main>;
}

export default DestinationColumn;
