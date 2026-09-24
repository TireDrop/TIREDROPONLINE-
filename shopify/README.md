# Shopify theme source

The Liquid half of TireDrop. These files are the source of truth for the custom
sections on the Shopify store; they are uploaded to the theme with
`themeFilesUpsert` rather than edited in the theme editor, so that a change
lands in version control first and the store second.

## Target

Store: tiredroponline.com
Base theme: **Horizon** (Shopify's 2026 default). Chosen over Dawn for its
block nesting — up to eight levels — which is what lets these layouts be
rebuilt as editable sections rather than hard-coded Liquid.

Work happens on an unpublished duplicate, never the live theme. Shopify blocks
API writes to the live theme, which is the behaviour we want: publishing stays
a human decision in the admin.

## Layout

    sections/    custom sections, each with a {% schema %} so the copy stays
                 editable in the theme editor after it ships
    templates/   page templates that compose those sections

## Conventions

Every section is self-contained: its own scoped CSS, no dependency on
Horizon's internal class names, which are not a public API and will move.

Dark sections pin their text colour instead of inheriting it. A dark band that
inherits the body colour renders near-black on navy — that exact bug shipped on
the React site and had to be fixed after a reader reported they could not read
a heading. Horizon would reproduce it, so every dark section here sets white
explicitly.

Decorative numerals and ornaments are `aria-hidden`. A screen reader announcing
a bare "01" with no context is noise, and hiding it is also what exempts the
low-contrast watermark styling under WCAG 1.4.3.

Brand values are written as literal hex rather than Horizon palette references
where the palette cannot express them. Horizon's palette is four colours;
the brand runs to ten.
