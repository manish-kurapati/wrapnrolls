# Wrap N'Roll

Static restaurant website with six pages: Home, Wraps, Burgers, Sides, Sodas, and Customise.

Open index.html in a modern browser, or serve this folder with any static web server. No build step or package installation is required. Keep the assets folder alongside the HTML files. The Lilita One font is bundled locally; its license is in assets/fonts/OFL-Lilita-One.txt.

Wraps and Burgers use lightweight SVG hero animations that play once and hold their finished state, with ambient steam. Sides and Sodas start with compact headings and floating illustrations. Product photo areas use white placeholders with a softened yellow pattern; soda imagery is retained. Wraps and Sides have separate category menus and a return to favourites. Animations respect reduced-motion preferences.

To connect online ordering, set ORDER_URL in assets/menu.js and CUSTOM_ORDER_URL in assets/customise-order.js. Until these are configured, ordering links display a coming-soon message. Promotions are configured in assets/offers.js.

Food illustrations are serving suggestions.

Page navigation and the home intro reveal share a Framer Motion wave wipe. To rebuild its checked-in browser bundle after editing src/page-waves.js, run npm install followed by npm run build. The static pages also work directly from the folder using the existing assets/page-waves.js bundle.
