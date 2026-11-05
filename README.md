# Astro Soulprint by Alex

Multi-page site. GitHub Pages builds it automatically with Jekyll; there is nothing to run yourself.

## Page addresses

Every reading page is a folder with an `index.html` inside, so the link has no `.html`:

| Page | Folder | Link |
|------|--------|------|
| Home | `index.html` | `/` |
| Aligned Love | `aligned-love/` | `/aligned-love/` |
| Aligned Wealth & Career | `aligned-wealth-career/` | `/aligned-wealth-career/` |
| Karmic Healing & Aura Protection | `karmic-healing/` | `/karmic-healing/` |
| Cosmic Timing | `cosmic-timing/` | `/cosmic-timing/` |
| Soulprint Core | `soulprint-core/` | `/soulprint-core/` |
| Human Design Readings (all HD readings) | `human-design/` | `/human-design/` |
| 2027 Cosmic Roadmap | `roadmap.html` | `/roadmap.html` |
| Free Human Design Chart calculator | `soulprint-chart/` | `/soulprint-chart/` |

The old `.html` addresses (for example `aligned-love.html`) still work: they send visitors to the new link.

## Publish on GitHub Pages

1. Create a new **public** repository on github.com (for example `astro-soulprint`).
2. Upload everything in this folder to the repository root (`index.html`, `style.css`, `images/`).
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **Deploy from a branch**.
5. Set **Branch** to `main` and the folder to `/ (root)`, then click **Save**.
6. Wait 1–2 minutes. The site appears at `https://<your-username>.github.io/<repo-name>/`.

## Editing

- Prices, descriptions: the category page (e.g. `aligned-love/index.html`; search for `class="price"`).  Add a THB price with
  `<span class="alt">· 1,234 THB</span>`.
- **Human Design readings are written once.** HD Full Chart, HD 4 Arrows, HD Love, HD Wealth & Career and HD Healing live in
  `_includes/packages/` (one file each). Edit a price or text there and it changes on both its category page and `/human-design/`.
- **Add a new Human Design reading:** copy one file in `_includes/packages/` (for example `hd-love.html`), edit it, then add one line
  `{% include packages/your-file.html %}` to the category page where it belongs and to `human-design/index.html`. Change `count`
  for that card in `_data/categories.yml`.
- Testimonials: add `testimonial-1.jpg` … `testimonial-5.jpg` (shown in the Contact section of `index.html`) to `images/testimonials/`; to add more, copy one `<figure>` line in `index.html`.
- Colours: the `:root` block at the top of `style.css`.
- Header, menu and footer: edit once in `_includes/header.html` / `_includes/footer.html`; every page picks it up.
- The reading pages (menu, footer links and the cards on the home page, including the numbers and Burmese lines): `_data/categories.yml`.
- **Add a new page:** make a folder with an `index.html` (copy `human-design/index.html`), keep `root: "../"` in its top block, add it to
  `_data/categories.yml`, and add a 1200×630 picture named after it in `images/share/`.
- Each page starts with a small `---` block: `title`, `description`, `active` (which menu item is highlighted), `root` (`"../"` for pages
  inside a folder) and `share_image` (the picture in `images/share/`). The title, description and picture are what Facebook and
  Messenger show when someone shares that page. Leave the block in place.
- Facebook remembers old previews. After you change a page's title, description or picture, open
  https://developers.facebook.com/tools/debug/ , paste the page link and press **Scrape Again**.
- The full links Facebook needs are built from `url` and `baseurl` in `_config.yml`. If you ever connect your own domain
  (for example `https://astrosoulprint.com`), change those two lines.
- Pages only render correctly once published (or built with Jekyll), not by double-clicking the file.

## Client intake form

`intake.html` (+ `intake.css`, `intake.js`) is the post-payment intake form. Setup steps: see `SETUP-INTAKE.md`.
