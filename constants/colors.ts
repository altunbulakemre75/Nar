export const colors = {
  primary: "#C73030",
  dark: "#6B1A1A",
  light: "#FFF5F2",
  cream: "#FFFDFB",
  accent: "#FF7A5C",

  // Score gradient
  score: {
    unhealthy: "#EF5C4A",
    warning: "#F5B947",
    ok: "#A5D65F",
    good: "#7ECC54",
    perfect: "#5FB847",
  },

  text: {
    primary: "#111111",
    secondary: "#666666",
    tertiary: "#999999",
  },

  border: "#EEEEEE",
};

export function scoreColor(score: number): string {
  if (score < 25) return colors.score.unhealthy;
  if (score < 50) return colors.score.warning;
  if (score < 65) return colors.score.ok;
  if (score < 85) return colors.score.good;
  return colors.score.perfect;
}

export function scoreLabel(score: number): string {
  if (score < 25) return "Hedefinle hiç uyumlu değil";
  if (score < 50) return "Hedefinle pek uyumlu değil";
  if (score < 65) return "Ara sıra tercih edilebilir";
  if (score < 85) return "Hedefinle uyumlu";
  return "Hedefinle çok uyumlu";
}
