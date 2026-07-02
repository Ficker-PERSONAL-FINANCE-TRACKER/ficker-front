import type React from "react";

/** Shim de `next/navigation`: hooks/rotinas no-op para o render do Remotion. */
export const useRouter = () => ({
  push: () => {},
  replace: () => {},
  back: () => {},
  forward: () => {},
  refresh: () => {},
  prefetch: () => {},
});

export const usePathname = () => "/";
export const useSearchParams = () => new URLSearchParams();
export const useParams = () => ({} as Record<string, string>);
export const redirect = (_url: string) => {};
export const notFound = () => {};
export const useServerInsertedHTML = (_callback: () => React.ReactNode) => {};
