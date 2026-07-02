import { loadFont } from "@remotion/google-fonts/Manrope";

// Manrope é a fonte usada na UI real do Ficker (ver src/app/theme/themeConfig.ts).
const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

/** Família de fonte principal do vídeo — mesma da aplicação (Manrope). */
export const FONT = fontFamily;
