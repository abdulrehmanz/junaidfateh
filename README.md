# Dr. Junaid Fateh: personal website

Website of **Dr. Muhammad Junaid Fateh**, MBBS, FCPS (Plastic Surgery), plastic, cosmetic and reconstructive surgeon in Lahore and Layyah.

Built with [Eleventy](https://www.11ty.dev/) as a fast static site. All content lives in plain text files (Markdown and YAML), so pages can be added or edited without touching code. **See [CONTENT-GUIDE.md](CONTENT-GUIDE.md) for step-by-step instructions.**

## What's included

- Home, About, Contact, FAQ, Cost Guide, Patient Journey and Overseas Patients pages
- 55 procedure pages in 6 categories, each with stats, benefits, candidacy, recovery timeline, FAQs, before/after sliders, and slots for **videos (YouTube, TikTok, Instagram, Facebook, MP4) and social links**
- Hair Transplant hub with an interactive **graft estimator**
- Before & after gallery, reviews and videos pages that fill themselves from the procedure files
- Blog with 8 patient-education articles
- WhatsApp booking form that pre-fills the procedure and location
- English / Urdu switch (Google Translate)
- SEO: unique titles and descriptions, canonical links, Open Graph images, sitemap, robots.txt and schema.org structured data (Physician, Person, MedicalProcedure, FAQPage, BlogPosting, BreadcrumbList)
- Optional Google Analytics 4 and Meta Pixel with lead tracking

## Preview it without installing anything

The ready-built site is in the `_site` folder. From this folder run:

```bash
python3 scripts/preview.py
```

Your browser opens `http://localhost:8080/junaidfateh/`. (Opening `_site/index.html` by double-clicking does not work, because the pages expect to be served from a web address.)

## Run it on your computer

Requires [Node.js](https://nodejs.org/) 18 or newer.

```bash
npm install        # first time only
npm start          # local preview with live reload
npm run check      # validate content
npm run build      # build the site into _site/
```

`npm start` prints the local address. While `pathPrefix` in `src/_data/site.yml` is `/junaidfateh/`, the preview is at `http://localhost:8080/junaidfateh/`.

## Deploying

Every push to `main` builds and publishes the site to GitHub Pages using `.github/workflows/deploy.yml`.

One-time setup: on GitHub open **Settings > Pages** and set **Source** to **GitHub Actions**.

The site is then live at `https://abdulrehmanz.github.io/junaidfateh/`. To move to a custom domain, follow the last section of the content guide.

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
