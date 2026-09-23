/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // TireDrop palette. Blue reads calmer and more trustworthy than red for
        // a national online store, which is why the brand moved to it; Extreme
        // Tires' red is kept for the "Powered by" lockup that ties the two
        // together.
        ink: "#0A1628",       // deep navy, primary dark surface (18:1 with white)
        steel: "#122135",     // raised dark surface
        graphite: "#24354C",  // borders / dividers on dark
        smoke: "#667085",     // muted body text
        fog: "#F3F6FB",       // light page background, faint blue cast
        bone: "#FFFFFF",

        // Primary action. #0B5FFF clears AA against white text at 5.13:1.
        drop: "#0B5FFF",      // primary action / brand accent
        dive: "#0A4FD8",      // accent hover / pressed
        sky: "#E6EFFF",       // tinted surface for highlights and washes

        // Extreme Tires' own red, for the "Powered by Extreme Tires" lockup
        // and anywhere the parent brand is referenced. Not a UI accent here.
        extremeRed: "#D40C10",
        extremeDeep: "#A40104",

        amber: "#F5A623",     // ratings, savings badges
      },
      fontFamily: {
        display: ['"Barlow Condensed"', "Impact", "sans-serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(14,15,17,.06), 0 8px 24px rgba(14,15,17,.08)",
        lift: "0 12px 32px rgba(14,15,17,.16)",
      },
      maxWidth: { site: "1280px" },
    },
  },
  plugins: [],
};
