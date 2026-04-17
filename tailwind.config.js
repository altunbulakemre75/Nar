/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        nar: {
          primary: "#C73030",
          dark: "#6B1A1A",
          light: "#FFF5F2",
          cream: "#FFFDFB",
          accent: "#FF7A5C",
        },
        score: {
          unhealthy: "#EF5C4A",
          warning: "#F5B947",
          ok: "#A5D65F",
          good: "#7ECC54",
          perfect: "#5FB847",
        },
      },
      fontFamily: {
        sans: ["Inter-Regular"],
        "sans-medium": ["Inter-Medium"],
        "sans-bold": ["Inter-Bold"],
        serif: ["PlayfairDisplay-BoldItalic"],
        "serif-light": ["PlayfairDisplay-Italic"],
      },
    },
  },
  plugins: [],
};
