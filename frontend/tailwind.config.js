const colors = require("tailwindcss/colors");
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  purge: {
    content: [
      "./pages/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
      "./icons/**/*.{js,ts,jsx,tsx}",
      "./constants/theme.ts",
    ],
    safelist: [
      "grid",
      "grid-cols-1",
      "grid-cols-2",
      "grid-cols-3",
      "grid-cols-4",
      "grid-cols-5",
      "grid-cols-6",
      "grid-cols-7",
      "grid-cols-8",
      "grid-cols-9",
      "grid-cols-10",
      "grid-cols-11",
      "grid-cols-12",
      "border",
      "border-2",
      "border-4",
      "border-pink-200",
      "border-red-900",
      "border-gray-700",
      "hidden",
      "bg-red-600",
      "hover:bg-red-700",
      "rounded-xl",
      "ml-2",
      "text-red-500",
      "hover:text-red-600",
      "bg-savage-community",
      "border-savage-community",
      "bg-savage-theos",
      "border-savage-theos",
      "font-animetas",
      "bg-animetas-solid",
    ],
  },
  darkMode: false,
  theme: {
    extend: {
      colors: {
        gray: colors.blueGray,
        rose: colors.rose,
        twitterBlue: "var(--twitter-blue)",
        "npt-dark": "var(--npt-dark)",
        "npt-lighter-dark": "var(--npt-lighter-dark)",
        "savage-community": "#01E19E",
        "savage-theos": "#DF0000",
      },
      backgroundImage: {
        "animetas-solid": "url('/animetas/space-bg.png')",
      },
      fontFamily: {
        sans: ["Poppins", ...defaultTheme.fontFamily.sans],
        animetas: ["JetBrains Mono", ...defaultTheme.fontFamily.sans],
      },
      width: {
        fit: "fit-content",
      },
      zIndex: {
        "-10": "-10",
      },
      scale: {
        225: "2.25",
      },
    },
  },
  variants: {
    extend: {
      zIndex: ["hover"],
      borderWidth: ["hover"],
    },
  },
  plugins: [require("@tailwindcss/aspect-ratio")],
};
