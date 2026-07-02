/**
 * Paleta e tokens visuais do Ficker.
 * Cores extraídas diretamente da UI real do produto (resume, onboarding, menu).
 */
export const colors = {
  purple: "#6C5DD3",
  purpleLight: "#8E82EF",
  purpleSoft: "#E2E2FB",
  purpleWash: "#EFEAFB",

  success: "#00875A",
  successBg: "#E6F7EF",
  warning: "#FFA940",
  warningBg: "#FFF4E6",
  danger: "#DE350B",
  dangerBg: "#FFEBE6",

  ink: "#11142D",
  muted: "#808191",
  line: "#EFEFF4",
  card: "#FFFFFF",
  bg: "#F8F9FA",
  cream: "#F5F1E9",
  lavender: "#E9E4F7",
  white: "#FFFFFF",
} as const;

export const gradients = {
  brand: `linear-gradient(135deg, ${colors.purple} 0%, ${colors.purpleLight} 100%)`,
  brandSoft: `linear-gradient(135deg, ${colors.purpleSoft} 0%, ${colors.purpleWash} 100%)`,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

export const shadow = {
  soft: "0 12px 40px rgba(108, 93, 211, 0.14)",
  card: "0 8px 30px rgba(17, 20, 45, 0.08)",
  float: "0 30px 80px rgba(17, 20, 45, 0.18)",
} as const;

/** Formata número como moeda brasileira. */
export const brl = (value: number): string =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const brlShort = (value: number): string =>
  `R$ ${Math.round(value).toLocaleString("pt-BR")}`;
