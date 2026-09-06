"use client";
import { useEffect } from 'react';
import { markWorldUnavailable } from '@/lib/journey/bridge';
export function WorldStage() {
  useEffect(() => {
    const lifetime = new AbortController();
    let dispose: (() => void) | undefined;
    void import('@/lib/journey/stage').then(({ createWorldStage }) => { if (!lifetime.signal.aborted) dispose = createWorldStage(document.body); }).catch(() => {
      if (lifetime.signal.aborted) return;
      markWorldUnavailable();
      const loading = document.getElementById('loading');
      if (loading) { loading.classList.add('journey-error'); loading.style.display = 'block'; loading.textContent = 'The view is unavailable. Explore the portfolio using the links above.'; }
    });
    return () => { lifetime.abort(); dispose?.(); };
  }, []);
  return <div className="photographic-journey" data-world-stage aria-label="Room to Earth visual journey">
    <div id="hero-scene" tabIndex={-1} role="region" aria-label="Toronto to Earth photographic journey">
      <canvas className="scene__canvas scene__canvas--space" id="space-canvas" aria-hidden="true" />
      <canvas className="scene__canvas scene__canvas--ground" id="ground-canvas" aria-hidden="true" />
      <div id="plates" className="plates" aria-hidden="true" /><div className="scene__veil" />
    </div>
    <div className="scene" aria-hidden="true">
      <div className="aerial"><div className="aerial-image" id="aerial-image" /></div>
      <div className="exterior" id="exterior"><div className="house-plane" id="house-plane">
        {/* eslint-disable @next/next/no-img-element */}
        <img id="exterior-photo" src="/assets/house-exterior-v1.webp" alt="" />
        {/* eslint-disable @next/next/no-img-element */}
        <div className="window-aperture"><img src="/assets/room-window-v1.webp" alt="" /></div>
      </div></div>
      {/* eslint-disable @next/next/no-img-element */}
      <div className="room" id="room"><img id="room-photo" src="/assets/room-window-v1.webp" alt="" fetchPriority="high" /></div>
      <div className="light" id="light" /><div className="shade" />
    </div>
    <div className="loading" role="status" id="loading">Opening the view…</div>
    <button type="button" id="mobile-drag" aria-pressed="false" hidden>Rotate view</button>
    <details className="credits"><summary>Image credits</summary><p>Room: generated visual study; not a photograph of Mohamad&apos;s home. Aerial: City of Toronto, <a href="https://open.toronto.ca/open-data-licence/">Open Government Licence – Toronto</a>. Earth: NASA GIBS, Blue Marble and Black Marble. Moon: <a href="https://trek.nasa.gov/moon/">NASA Moon Trek, LRO WAC</a> and <a href="https://pds-geosciences.wustl.edu/missions/lro/lola.htm">LOLA / NASA PDS</a>. Jupiter: <a href="https://science.nasa.gov/photojournal/cassinis-best-maps-of-jupiter-cylindrical-map/">NASA/JPL/Space Science Institute, Cassini</a>. Mars: <a href="https://www.mars.asu.edu/data/mdim_color/">NASA/JPL/USGS, Viking</a>. Mercury: <a href="https://astrogeology.usgs.gov/search/map/mercury_messenger_mdis_basemap_enhanced_color_global_mosaic_665m">NASA/JHUAPL/Carnegie Institution of Washington/USGS, MESSENGER</a> (enhanced color). Terrain: Mapzen; contains information licensed under the Open Government Licence – Canada.</p></details>
    <div id="film-progress" hidden /><div id="film-hint" hidden />
  </div>;
}
