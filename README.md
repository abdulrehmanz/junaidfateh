# Dr. Junaid Fateh: personal website

Website of **Dr. Muhammad Junaid Fateh**, MBBS, FCPS (Plastic Surgery), plastic, cosmetic and reconstructive surgeon in Lahore.

Built with [Eleventy](https://www.11ty.dev/) as a fast static site. All content lives in plain text files (Markdown and YAML), so pages can be added or edited without touching code. **See [CONTENT-GUIDE.md](CONTENT-GUIDE.md) for step-by-step instructions.**

## What's included

- Home, About, Contact, FAQ, Cost Guide, Patient Journey and Overseas Patients pages
- 55 procedure pages in 6 categories, each with stats, benefits, candidacy, recovery timeline, FAQs, before/after sliders, and slots for **videos (YouTube, TikTok, Instagram, Facebook, MP4) and social links**
- Hair Transplant hub with an interactive **graft estimator**
- Before & after gallery, reviews and videos pages that fill themselves from the procedure files
- WhatsApp booking form that pre-fills the procedure and location
- English / Urdu switch (Google Translate)
- Lahore location pages for local search
- SEO and AI-search optimisation: answer-first "quick answer" boxes, Roman Urdu summaries and search names, 14 to 20 target keywords per page, 9 to 11 FAQs per procedure, unique titles and descriptions, canonical links, Open Graph, image and video sitemap, AI-friendly robots.txt, llms.txt and llms-full.txt, IndexNow pings after deploy, and schema.org structured data (Person, Physician, MedicalWebPage, MedicalProcedure, FAQPage, BlogPosting, VideoObject, ItemList, BreadcrumbList)
- Blog with 16 patient-education articles
- Optional Google Analytics 4 and Meta Pixel with lead tracking

## Preview it without installing anything

The ready-built site is in the `_site` folder. From this folder run:

```bash
python3 scripts/preview.py
```

Your browser opens `http://localhost:8080/`. (Opening `_site/index.html` by double-clicking does not work, because the pages expect to be served from a web address.)

## Run it on your computer

Requires [Node.js](https://nodejs.org/) 18 or newer.

```bash
npm install        # first time only
npm start          # local preview with live reload
npm run check      # validate content
npm run build      # build the site into _site/
```

`npm start` prints the local address (usually `http://localhost:8080/`).

## Deploying

The site is hosted on **Vercel** at https://drjunaidfateh.com/ (www and the vercel.app address redirect there). Every push to `main` is built and published by Vercel automatically, using the settings in `vercel.json` (content check, build, output folder `_site`, redirects and caching headers). If the content check fails, Vercel keeps the previous version live.

Recommended Vercel setting: in **Project > Settings > Environment Variables** add `VERCEL_DEEP_CLONE` = `true`, so the "Updated" dates on pages come from the full git history.

The GitHub workflow in `.github/workflows/deploy.yml` re-checks the content on every push and then notifies Bing and other IndexNow search engines about the changes.

To use a custom domain, add it in Vercel under **Project > Settings > Domains**, then change `url` in `src/_data/site.yml` to the new address.

## Project structure

```
src/
  _data/            site settings, locations, reviews, videos, FAQs, estimator
  _includes/        page layouts and reusable parts (header, footer, cards...)
  assets/           CSS, JavaScript, images, videos
  procedures/       one Markdown file per procedure
  categories/       one Markdown file per procedure category
  blog/             blog articles
  *.njk             the other pages (home, about, contact...)
lib/                video embeds and structured data helpers
scripts/            content checker and image optimiser
templates/          starting points for new procedures and blog articles
```
