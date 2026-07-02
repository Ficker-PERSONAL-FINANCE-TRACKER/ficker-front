/**
 * Shim de `next/font/google`: os componentes reais que chamam, ex., Manrope({...})
 * recebem apenas um objeto com fontFamily. A fonte de verdade é carregada via
 * @remotion/google-fonts no entrypoint do vídeo.
 */
const makeFont = () => ({
  style: { fontFamily: "Manrope, sans-serif" },
  className: "",
  variable: "",
});

export const Manrope = makeFont;
export const Inter = makeFont;
export const Roboto = makeFont;
export const Poppins = makeFont;
export const Montserrat = makeFont;
export default makeFont;
