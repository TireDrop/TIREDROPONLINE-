/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // The palette is sampled from the TireDrop mark rather than picked to
        // taste. The logo's chrome sits on a cyan-leaning electric blue that
        // runs from a deep azure up to a bright cyan, and using those exact
        // values is what makes the artwork look like it belongs to the site
        // instead of being pasted onto it.
        ink: "#070E1A", // deepest surface — 19.3:1 with white
        steel: "#101C2E", // raised dark surface
        graphite: "#22344C", // borders and dividers on dark
        smoke: "#586274", // muted body copy — 6.1:1 on white, 5.7:1 on fog
        fog: "#F4F6FA", // light page background, faint cool cast
        bone: "#FFFFFF",

        // Primary action, straight off the mark. Clears AA against white
        // button text at 5.07:1.
        drop: "#0068E8",
        dive: "#0053C4", // hover / pressed
        sky: "#EFF5FF", // tinted wash; kept light enough that text-drop clears 4.5:1 on it

        // The mark's bright cyan. It is 8.2:1 on ink but only 2.4:1 on white,
        // so it is a dark-surface accent — never body text on a light page.
        volt: "#00B4FC",

        // Extreme Tires' own red, for the "Powered by" lockup and anywhere the
        // parent brand is named. Not a UI accent here.
        extremeRed: "#D40C10",
        extremeDeep: "#A40104",

        amber: "#F5A623", // badge fills and ratings; 9.5:1 on ink
        amberInk: "#8A4F00", // the same idea as text on a light surface, 6.6:1
      },

      fontFamily: {
        // Archivo carries a width axis, so headings can be heavy and slightly
        // expanded rather than condensed and letter-spaced — which is the look
        // every template defaults to. Instrument Sans has more warmth in its
        // lowercase than the usual neutral workhorse.
        display: [
          '"Archivo"',
          '"Archivo Black"',
          "Helvetica Neue",
          "sans-serif",
        ],
        sans: ['"Instrument Sans"', "system-ui", "-apple-system", "sans-serif"],
      },

      borderRadius: {
        // Tailwind's `rounded-sm` is 2px, which reads as "no radius at all".
        // Every surface in the app asks for `rounded-sm`, so softening it here
        // softens the whole site at once without touching a component.
        sm: "6px",
        card: "12px",
      },

      boxShadow: {
        // Three stacked layers — a hairline, a close contact shadow and a wide
        // ambient one. A single large blur is what makes a card look printed
        // on rather than resting on the page.
        card: "0 0 0 1px rgba(7,14,26,.04), 0 1px 2px rgba(7,14,26,.06), 0 8px 20px -6px rgba(7,14,26,.10)",
        lift: "0 0 0 1px rgba(7,14,26,.05), 0 2px 4px rgba(7,14,26,.06), 0 18px 38px -10px rgba(7,14,26,.20)",
        // For the blue actions, tinted so the shadow looks lit by the button.
        glow: "0 4px 14px -2px rgba(0,104,232,.35)",
      },

      backgroundImage: {
        // A dark surface with a single flat fill reads as a rectangle. These
        // give the ink sections a light source.
        "ink-wash":
          "radial-gradient(120% 90% at 50% -10%, #17293F 0%, #0A1526 45%, #070E1A 100%)",
        "steel-wash": "linear-gradient(180deg, #14233A 0%, #0B1524 100%)",
      },

      maxWidth: { site: "1280px" },
    },
  },
  plugins: [],
};
