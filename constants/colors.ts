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

export function getScoreBgColor(score: number): string {
  if (score < 0) return "#F3F4F6";
  if (score < 40) return "#FDEAE8";
  if (score < 65) return "#FEF5E0";
  if (score < 85) return "#E8F5DC";
  return "#DCF3CA";
}

export function getScoreBorderColor(score: number): string {
  if (score < 0) return "#D1D5DB";
  if (score < 40) return "#EF4444";
  if (score < 65) return "#F59E0B";
  if (score < 85) return "#84CC16";
  return "#22C55E";
}

export function getScoreTextColor(score: number): string {
  if (score < 0) return "#6B7280";
  if (score < 40) return "#B91C1C";
  if (score < 65) return "#92400E";
  if (score < 85) return "#4D7C0F";
  return "#166534";
}
