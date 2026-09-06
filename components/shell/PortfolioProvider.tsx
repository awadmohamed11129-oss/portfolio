"use client";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { whenWorldStage, worldUnavailable } from '@/lib/journey/bridge';
import type { TransitState } from '@/lib/journey/navigator';
import { usePathname, useRouter } from "next/navigation";
import { destinationForPath, type DestinationId, type DeviceId, type DeviceState, type InteractionMode, type NavigationOptions } from "@/lib/portfolio/contracts";

type PortfolioContextValue = {
  transit: TransitState;
  destination: DestinationId;
  mode: InteractionMode;
  device: DeviceState | null;
  navigationToken: number;
  navigate: (href: string, options?: NavigationOptions) => void;
  setMode: (mode: InteractionMode) => void;
  openDevice: (id: DeviceId, expanded?: boolean) => void;
  expandDevice: () => void;
  closeDevice: () => void;
};
const PortfolioContext = createContext<PortfolioContextValue | null>(null);
export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) throw new Error("PortfolioProvider is required");
  return context;
}
export function PortfolioProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const destination = destinationForPath(pathname);
  const [transit, setTransit] = useState<TransitState>({ phase: 'idle', destination, active: false, elapsed: 0, duration: 0 });
  const pendingPath = useRef<string | null>(null);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sequence = useRef(0);
  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    const restoreContent = () => { if (!disposed) setTransit(value => ({ ...value, phase: 'idle', active: false })); };
    window.addEventListener('stage:unavailable', restoreContent);
    void whenWorldStage().then(stage => { if (!disposed) unsubscribe = stage.navigator.subscribe(setTransit); }).catch(restoreContent);
    return () => { disposed = true; unsubscribe?.(); window.removeEventListener('stage:unavailable', restoreContent); clearTimeout(navigationTimer.current); };
  }, []);
  const [modeState, setModeState] = useState<InteractionMode>(destination === "home" ? "world" : "content");
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [navigationToken, setNavigationToken] = useState(0);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const previousPath = useRef(pathname);
  // A new route must render its own mode before history restores its scroll.
  const mode = previousPath.current === pathname ? modeState
    : destination === "home" ? "world" : "content";
  const setMode = useCallback((next: InteractionMode) => { setModeState(next); if (next !== "device") setDevice(null); }, []);
  const navigate = useCallback((href: string, options: NavigationOptions = {}) => {
    if (!href.startsWith("/") || href.startsWith("//")) return;
    setDevice(null);
    setModeState(options.mode ?? (destinationForPath(href) === "home" ? "world" : "content"));
    setNavigationToken(value => value + 1);
    const current = ++sequence.current;
    pendingPath.current = href;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || worldUnavailable();
    setTransit(value => ({ ...value, phase: reduced ? 'idle' : 'leave', destination: destinationForPath(href) }));
    void whenWorldStage().then(stage => { if (current === sequence.current) return stage.navigator.go(destinationForPath(href)); }).catch(() => {
      if (current === sequence.current) setTransit(value => ({ ...value, phase: 'idle', active: false }));
    });
    clearTimeout(navigationTimer.current);
    navigationTimer.current = setTimeout(() => {
      if (options.replace) router.replace(href); else router.push(href);
    }, reduced ? 0 : 300);
  }, [router]);
  const openDevice = useCallback((id: DeviceId, expanded = false) => {
    restoreFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDevice({ id, expanded: expanded || window.matchMedia("(max-width: 767px)").matches });
    setModeState("device");
    setNavigationToken(value => value + 1);
  }, []);
  const expandDevice = useCallback(() => setDevice(value => value ? { ...value, expanded: true } : null), []);
  const closeDevice = useCallback(() => {
    setDevice(null);
    setModeState("world");
    setNavigationToken(value => value + 1);
    requestAnimationFrame(() => { if (restoreFocus.current?.isConnected) restoreFocus.current.focus(); });
  }, []);
  useLayoutEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    void whenWorldStage().then(stage => stage.film.syncContent()).catch(() => {});
    if (pendingPath.current === pathname) pendingPath.current = null;
    else {
      const current = ++sequence.current;
      pendingPath.current = null;
      clearTimeout(navigationTimer.current);
      void whenWorldStage().then(stage => { if (current === sequence.current) return stage.navigator.go(destinationForPath(pathname), { instant: true }); }).catch(() => {
        if (current === sequence.current) setTransit(value => ({ ...value, phase: 'idle', active: false }));
      });
    }
    setDevice(null);
    setModeState(destinationForPath(pathname) === "home" ? "world" : "content");
    setNavigationToken(value => value + 1);
  }, [pathname]);
  return <PortfolioContext.Provider value={{ destination, transit, mode, device, navigationToken, navigate, setMode, openDevice, expandDevice, closeDevice }}>{children}</PortfolioContext.Provider>;
}
