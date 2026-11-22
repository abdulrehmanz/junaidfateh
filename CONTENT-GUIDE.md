# Content guide

Everything on the website comes from simple text files in the `src` folder. You never need to touch HTML to update content.

You can edit files in two ways:

- **On GitHub (no software needed):** open the file on github.com, press the pencil icon, make the change and press **Commit changes**. The site rebuilds and goes live in about two minutes.
- **On your computer:** edit the file, run `npm run check`, then commit and push.

Lines starting with `#` in `.yml` and `.md` files are comments. They explain the settings and are never shown on the website.

---

## Quick reference

| I want to... | Edit this file |
|---|---|
| Change phone, WhatsApp, email, social links | `src/_data/site.yml` |
| Add the PMDC number or real statistics | `src/_data/site.yml` |
| Add Layyah address, hours or map | `src/_data/locations.yml` |
| Add a video to a procedure page | `src/procedures/<procedure>.md` (under `videos:`) |
| Add a link to an Instagram/TikTok post on a procedure page | `src/procedures/<procedure>.md` (under `social_links:`) |
| Add a general video (not about one procedure) | `src/_data/videos.yml` |
| Add a patient review | `src/_data/reviews.yml` |
| Add before and after photos | `src/assets/images/procedures/<procedure>/` and the procedure file |
| Set a "from" price | `src/procedures/<procedure>.md` (`price_from:`) |
| Write a blog article | copy `templates/new-blog-post.md` into `src/blog/` |
| Add a new procedure | copy `templates/new-procedure.md` into `src/procedures/` |
| Change general FAQs | `src/_data/generalFaqs.yml` |
| Change the home page specialty cards | `src/_data/specialties.yml` |
| Change the hair graft estimator numbers | `src/_data/estimator.yml` |
| Turn on Google Analytics or Meta Pixel | `src/_data/site.yml` (`analytics:`) |
| Connect a custom domain | `src/_data/site.yml` (see the last section) |

---

## Adding videos and social links to a procedure

Open the procedure file, for example `src/procedures/fue-hair-transplant.md`. Near the top you will find:

```yaml
videos:

social_links:
```

Add one item per video, indented by two spaces and starting with `- url:`:

```yaml
videos:
  - url: https://www.youtube.com/watch?v=abc123XYZ00
    title: "FUE hair transplant explained"
  - url: https://www.youtube.com/shorts/abc123XYZ00
  - url: https://www.tiktok.com/@dr.junaidfateh/video/7312345678901234567
    title: "Day 10 after FUE"
  - url: https://www.instagram.com/reel/C1abcDEFghi/
  - url: https://www.facebook.com/drjunaidfateh/videos/1234567890/
  - url: /assets/videos/fue-recovery.mp4
    poster: /assets/images/procedures/fue-hair-transplant/fue-hair-transplant-after.webp

social_links:
  - url: https://www.instagram.com/p/C1abcDEFghi/
    label: "Patient journey on Instagram"
  - url: https://www.tiktok.com/@dr.junaidfateh
    label: "More hair videos on TikTok"
```

What happens automatically:

- The video appears in a **Videos & posts** section on that procedure page.
- It also appears on the **Videos** page (grouped by category) and on the category page.
- The first procedure videos also appear on the home page.
- YouTube videos load only when someone presses play, so the page stays fast.
- `title` is optional. Shorts and TikToks are shown in portrait format.
- For your own video files, put the `.mp4` file in `src/assets/videos/` (keep files small, ideally under 20 MB; YouTube is better for long videos).

**TikTok tip:** use the full link that contains `/video/` and a long number. Short links like `vm.tiktok.com/...` cannot be embedded, so they are shown as a button instead.

## General videos

Videos that are not about one procedure (an introduction, an interview, a Q&A) go in `src/_data/videos.yml`:

```yaml
- url: https://www.youtube.com/watch?v=abc123XYZ00
  title: "Meet Dr. Junaid Fateh"
  featured: true        # also show on the home page
```

Replace the `[]` at the bottom of the file with your list the first time you add one.

## Patient reviews

Open `src/_data/reviews.yml`, copy an existing block and edit it:

```yaml
- name: "Ali Raza"
  city: "Multan"
  procedure: "FUE Hair Transplant"
  procedure_slug: fue-hair-transplant   # file name of the procedure, so it also shows on that page
  rating: 5
  featured: true                        # show on the home page
  source: "Google"                      # optional
  text: "The review text, exactly as the patient wrote it."
```

Only publish real reviews from real patients, with their permission.

## Before and after photos

1. Create a folder named after the procedure file, for example `src/assets/images/procedures/gynecomastia/` (it may already exist).
2. Add the photos. Before and after should be the same size and framing. WebP or JPG both work; keep each image under about 300 KB. To convert and shrink photos you can run `python3 scripts/optimize-images.py path/to/photos`.
3. In the procedure file, add a pair under `before_after:` (you can have several pairs):

```yaml
before_after:
  - before: /assets/images/procedures/gynecomastia/gynecomastia-before.webp
    after: /assets/images/procedures/gynecomastia/gynecomastia-after.webp
    caption: "Grade 2 gynecomastia, 3 months after surgery"
  - before: /assets/images/procedures/gynecomastia/patient-2-before.webp
    after: /assets/images/procedures/gynecomastia/patient-2-after.webp
```

Photos then appear on the procedure page, its category page and the gallery. Only use photos of Dr. Junaid's own patients who have given written consent.

## Prices

Each procedure file has `price_from: ""`. Leave it empty to show "Ask for a quote", or fill it in:

```yaml
price_from: "PKR 120,000"
```

The price then appears on the procedure page and in the Cost Guide table.

## Adding a new procedure

1. Copy `templates/new-procedure.md` into `src/procedures/` and rename it. The file name becomes the address, so use lowercase words and dashes, e.g. `jaw-contouring.md` becomes `/procedures/jaw-contouring/`.
2. Fill in every field. `category` decides which menu column and category page it appears in.
3. Run `npm run check`.

It automatically appears in the menu, the procedures page, its category page, the booking form dropdown, the cost guide, the sitemap and Google structured data.

## Writing a blog article

1. Copy `templates/new-blog-post.md` into `src/blog/` and rename it.
2. Keep `draft: true` while writing. Remove that line (or set it to `false`) to publish.
3. Write the article in Markdown below the second `---` line.

Markdown basics: `## Heading`, `**bold**`, `*italic*`, `- list item`, `[link text](/procedures/liposuction/)`.

## Contact details, credentials and numbers

`src/_data/site.yml` holds the phone, WhatsApp, email, social links, education, memberships and PMDC number. The `stats:` section controls the numbers strip on the home page. Leave a value empty and it is hidden:

```yaml
stats:
  - value: "2,000+"
    label: "Procedures performed"
```

Please only enter figures you can stand behind.

## Locations

`src/_data/locations.yml` has one block per city. For Layyah, fill in:

- `clinic`: the clinic name
- `address`: street address
- `days` and `hours`: when Dr. Junaid is there
- `mapsUrl`: the Google Maps share link
- `mapEmbed`: in Google Maps press **Share > Embed a map**, and copy only the address inside `src="..."`
- `latitude` and `longitude`: right-click the pin in Google Maps to copy them

## Analytics

In `src/_data/site.yml` fill in `analytics.ga4` (Google Analytics 4 ID, like `G-ABC123`) and/or `analytics.metaPixel`. The site then tracks visits, booking form opens and WhatsApp leads (`generate_lead` in Google Analytics, `Lead` in Meta).

## Connecting a custom domain

When the domain is ready (for example `drjunaidfateh.com`):

1. In `src/_data/site.yml` set:
   ```yaml
   url: "https://drjunaidfateh.com"
   pathPrefix: "/"
   customDomain: "drjunaidfateh.com"
   ```
2. At your domain registrar, add the DNS records GitHub lists under **Settings > Pages > Custom domain**.
3. In GitHub **Settings > Pages**, enter the domain and tick **Enforce HTTPS** once it is available.
4. Add the site to Google Search Console and submit `https://drjunaidfateh.com/sitemap.xml`.

## Checking your changes

`npm run check` validates every procedure, category and blog file. It reports:

- broken YAML (usually a missing quote or wrong indentation)
- missing required fields or images
- SEO titles or descriptions that are too long or short
- leftover wording from the old clinic site, prices written in text, or the word "guarantee"

The same check runs automatically on GitHub before every deploy, so a mistake cannot take the site down: the previous version stays live until it is fixed.
