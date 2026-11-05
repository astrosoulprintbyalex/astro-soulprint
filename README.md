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
| 2027 Lord of the Year (free annual profection tool) | `2027-lord-of-the-year/` | `/2027-lord-of-the-year/` |
| Which reading is right for me? (quiz) | `find-my-reading/` | `/find-my-reading/` |
| 2027 Cosmic Roadmap | `roadmap.html` | `/roadmap.html` |
| Cosmic Weather (free weekly sky guide) | `cosmic-weather/` | `/cosmic-weather/` |
| Free Charts (Human Design + Birth Chart) | `soulprint-chart/` | `/soulprint-chart/` |

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
- **The quiz** (`find-my-reading/index.html`) has its own copy of each reading's name, price and Burmese line inside the script (`var R = {...}`). If you change a price or add a reading on a package page, update it there too. The questions and the matching rules are in the same script (`var Q`, `function pick`).
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

## 2027 Lord of the Year

`2027-lord-of-the-year/` is a free tool: the visitor enters a birth date and rising sign and sees which house is activated in
their 2027 birthday year and which planet is their Lord of the Year (whole-sign houses, traditional rulers). It runs on the
visitor's device and saves nothing.

- The calculation and every sentence (English and Burmese) are in `2027-lord-of-the-year/lord.js`. To change a house or planet
  text, edit the `en` (English) or `mm` (Burmese) line there.
- The reading promo card at the bottom is in `2027-lord-of-the-year/index.html`. The Messenger button opens
  `https://m.me/astrosoulprintbyalex?ref=2027` (Messenger cannot pre-fill a message, so the button text asks people to send "2027").
- Tests: `node --test tests/*.test.js` (they also run on GitHub when you save a change).

## Reading Prep (private studio tool)

`studio/reading-prep/` is your private prep page, at `/studio/reading-prep/`. It is not in the menu, not in any list, and has a
`noindex` tag so search engines skip it. (It is unlisted, not locked: anyone who knows the address can open the tool, but it
saves nothing on the website. Client details and notes stay in your own browser.)

- Enter name, birth date, time and place. It reuses the chart engine in `soulprint-chart/` (nothing there was changed) and shows
  Type, Strategy, Authority, Profile, Definition, Incarnation Cross, centers, channels, gates, the chart, plus astrology Sun, Moon and Rising.
- Below is a reading outline with a note box per section. Notes save automatically per client in this browser only
  (clearing browser data deletes them). **Copy all notes** copies everything as plain text; use it as your backup.
- Edit the sections or their prompts in `studio/reading-prep/outline.js` (`SECTIONS`). Keep each `id` as it is, because notes are saved under it.
- Rising needs latitude and longitude, which the chart's city lists do not have. `studio/reading-prep/data/places/` holds a list of
  places with coordinates and time zones (built from GeoNames, towns of 10,000+ people, all Myanmar places we have). If a town is
  not listed, type its coordinates. To rebuild the list: `cd soulprint-chart && npm ci && cd .. && node studio/reading-prep/tools/build-places.js`.
- Tests: `node --test tests/*.test.js` (Sun, Moon and Rising are checked against the Swiss Ephemeris).

## Client intake form

`intake.html` (+ `intake.css`, `intake.js`) is the post-payment intake form. Setup steps: see `SETUP-INTAKE.md`.

## Cosmic Weather (weekly sky guide)

`cosmic-weather/` works out the current week's sky (Monday to Sunday, Myanmar Time) on the visitor's device with the same
astronomy library as the chart page: Moon phases (and eclipses), the Moon's sign through the week, planets changing sign and
retrogrades starting or ending. **Nothing needs updating for the cards: they change by themselves every week.**

### The "Note from Alex" box (update it once a week)

Edit one small file: `_data/cosmic-note.yml`.

1. On github.com open `_data/cosmic-note.yml` and click the pencil icon (Edit).
2. Change `week_of`, and the text under `my:` (Burmese) and `en:` (English). Keep the `|` and keep every text line indented by 2 spaces. A blank line makes a new paragraph.
3. Click **Commit changes**. The page updates in 1–2 minutes.

To hide the box, leave both `my:` and `en:` empty. The little `week_of` label shows readers how fresh the note is.

### Changing the wording

Every meaning sentence (English `en` and Burmese `my`) is in `cosmic-weather/words.js`: the four Moon phases, eclipses, the Moon in each
sign, each planet's lines, and the tone of each sign. The sky maths is in `cosmic-weather/sky.js` and the layout in `cosmic-weather/page.js`.
To preview another week, add `?date=2026-11-23` to the page link. Tests: `node --test tests/*.test.js`.
The Facebook picture is `images/share/cosmic-weather.png` (1200x630); after changing it, press **Scrape Again** in the Facebook debugger.

## Testimonial frame maker (private)

`studio/testimonials/index.html` is a private tool at `/studio/testimonials/`. It is not in the menu, is `noindex`, and works
entirely on your device (nothing is uploaded). Upload a client chat screenshot, add an optional title and package name, drag
boxes over names to blur or cover them, and download a 1080×1350 PNG. On a phone, turn "drawing" on to drag the hide boxes,
then off to scroll again. The logo is `images/logo.jpg`; colours and layout are at the top of the page's script.

## Sales Tracker (private)

`studio/sales/` (`/studio/sales/`) is a private page for logging sales: date, client, package, amount in THB and payment status.
It is not in the menu and has `noindex`, so search engines are asked to skip it. Anyone who knows the link can open it,
but it holds no data: everything you log is saved only in the browser you use (localStorage), so each device has its own list.

- Use **Export backup** now and then; it downloads a `.json` file. **Import backup** replaces the list in this browser with that file,
  which is also how you move your sales to another phone or computer. Clearing the browser's site data deletes the list, so keep backups.
- The package list and default THB prices are at the top of `studio/sales/sales.js` (`PACKAGES`). The monthly goal (50,000 THB)
  can be changed on the page under "Change monthly goal".
- "This month's total" counts every sale logged that month, paid or not; "Paid" and "Not fully paid" show the split.

## Transit card maker (private)

`studio/transit-card/` is a private tool (not in the menu, `noindex`; open it at `/studio/transit-card/`). Pick a date, add a short
message (Burmese or English) and download a 1080×1350 PNG in the emerald, cream and gold style. It shows the Moon's sign and phase,
planets changing sign or stationing retrograde/direct in the 7 days from that date, and which planets are retrograde.

- Calculations: `transit.js`, using the same astronomy library as the Human Design chart. Card drawing: `card.js`. Page: `index.html`, `app.js`.
- Times on the card use the chosen time zone (default Myanmar, UTC+6:30); the Moon is read at local noon.
- "Write in my style" (`voice.js`) fills the message box with a short Burmese-English line in Alex's voice, built from that date's real
  transits. These are hand-written templates, not AI; edit the wording in `voice.js` (one pair of versions per topic).
- Tests: `node --test tests/*.test.js`.
