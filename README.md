# Wrap N’ Roll — animated opening

Open `index.html` in a modern browser. No installation is required. Keep the assets folder alongside index.html; the bubbly Lilita One font loads from Google Fonts.

This revision follows the uploaded burger-loader reference with a roll instead: small outlined illustration, falling layers, changing preparation captions, a completion bounce, and curved overlapping colour panels that reveal the page.

Sequence:
- 0.00–0.52 s: a thin tortilla drops into place.
- 0.52–1.56 s: lettuce, tomatoes, filling and onion fall with a small bounce.
- 1.56–1.84 s: sauce draws across the filling.
- 1.84–2.52 s: the tortilla shell changes shape continuously around the filling.
- 2.52–3.35 s: finished roll tilts, bounces and displays “Ready to roll!”
- 3.35–5.08 s: gold, dark plum and orange curved panels sweep across, revealing the page.

The same wave transition is used by the page’s section links. Replay and Skip are available. Reduced-motion visitors go straight to the page. Native SVG and requestAnimationFrame provide the roll animation; the Web Animations API drives the waves. This is an HTML animation, not an exported video.

The supplied screenshot’s AI-restored logo remains included. The food illustration is an editable vector drawn directly inside the HTML. Page copy is illustrative brand-concept content.


The featured menu contains five wraps with descriptions and prices transcribed from the supplied menu. Food photos are generated serving suggestions; prompts are in assets/food-prompts.md. The four illustrated making steps animate into view and respect reduced-motion preferences.

To connect online ordering, set ORDER_URL at the top of assets/menu.js. Until a URL is supplied, Order now displays a coming-soon message.


Category pages: wraps.html preserves the former complete home design. burgers.html and sides.html repeat its hero, curved strips, compact catalogue and scroll-driven making section. index.html is the animated illustrated homepage; sodas.html contains the Dirty Soda page with branded illustrated glasses, 36 slowly drifting ice cubes and the supplied nine-drink menu. Shared centered glass navigation is styled in assets/catalog-layout.css. Menu source data is in assets/catalog.json. Burger and side food photos are generated serving suggestions.


The homepage uses orange and ivory editorial sections, illustrated food assets in assets/homepage, and scroll-driven food flight onto the closing wordmark. The original wrap-making opening animation stays on Home only. All homepage illustrations float continuously; reduced-motion preferences stop them. Drinks and fries packaging carry the supplied logo. Image prompts are recorded in assets/homepage-prompts.md.

