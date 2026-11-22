/**
 * Builds the JSON-LD structured data (schema.org) for each page.
 *
 * Search engines and AI assistants use this to understand who Dr. Junaid is,
 * where he practises, which procedure a page is about, its FAQs, videos and
 * articles. Everything is generated from the same data that builds the pages,
 * so it always matches what visitors see.
 */

const strip = (s) =>
  String(s ?? "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // markdown links -> text
    .replace(/[*_`>#]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const clean = (obj) => {
  // remove empty values so the output stays valid and tidy
  if (Array.isArray(obj)) return obj.map(clean).filter((v) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length));
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const c = clean(v);
      if (c !== undefined && c !== null && c !== "" && !(Array.isArray(c) && !c.length)) out[k] = c;
    }
    return out;
  }
  return obj;
};

function youtubeId(url) {
  const m = String(url || "").match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function buildSchema(d, abs, lastModified) {
  const site = d.site;
  const url = abs(d.page.url);
  const home = abs("/");
  const personId = home + "#dr-junaid-fateh";
  const websiteId = home + "#website";
  const sameAs = Object.values(site.social || {}).filter(Boolean);
  const modified = lastModified ? lastModified(d.page.inputPath) : new Date();
  const procedures = d.collections?.procedures || [];
  const locations = d.locations || [];
  const graph = [];

  /* ── The surgeon ─────────────────────────────────────────────── */
  const person = {
    "@type": ["Person"],
    "@id": personId,
    name: site.fullName,
    alternateName: [site.name, "Dr Junaid Fateh", "Dr. M. Junaid Fateh"],
    honorificPrefix: "Dr.",
    honorificSuffix: site.shortCredentials,
    jobTitle: site.jobTitle,
    description: site.description,
    url: abs("/about/"),
    image: abs("/assets/images/doctor/dr-junaid-fateh.jpg"),
    email: site.email,
    telephone: site.phoneHref,
    knowsLanguage: ["English", "Urdu"],
    hasOccupation: {
      "@type": "Occupation",
      name: "Plastic Surgeon",
      occupationLocation: locations.map((l) => ({ "@type": "City", name: l.city })),
    },
    knowsAbout: [
      "Plastic surgery", "Cosmetic surgery", "Reconstructive surgery", "Hair transplant", "FUE hair transplant",
      "FUT hair transplant", "Beard transplant", "Gynecomastia surgery", "Liposuction", "VASER liposuction",
      "Tummy tuck", "Rhinoplasty", "Botox", "Dermal fillers", "Hand surgery", "Burn reconstruction", "Microsurgery",
    ],
    alumniOf: (site.education || []).map((e) => ({ "@type": "EducationalOrganization", name: e.institution })),
    hasCredential: (site.education || []).map((e) => ({
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "degree",
      name: e.title,
      recognizedBy: { "@type": "Organization", name: e.institution },
    })),
    memberOf: (site.memberships || []).map((m) => ({ "@type": "Organization", name: m.name })),
    workLocation: locations.map((l) => ({ "@id": home + "#practice-" + l.id })),
    sameAs,
  };
  if (site.pmdcNumber) person.identifier = { "@type": "PropertyValue", propertyID: "PMDC registration", value: site.pmdcNumber };
  graph.push(person);

  graph.push({
    "@type": "WebSite",
    "@id": websiteId,
    url: home,
    name: site.name,
    alternateName: site.fullName,
    description: site.description,
    inLanguage: "en-PK",
    publisher: { "@id": personId },
    about: { "@id": personId },
  });

  /* ── Practice locations (local SEO) ──────────────────────────── */
  const serviceList = procedures.map((p) => ({ "@type": "MedicalProcedure", name: p.data.title, url: abs(p.url) }));
  const fullServices = ["home", "location", "contact"].includes(d.pageType) || d.page.url === "/contact/";
  for (const loc of locations) {
    const address = { "@type": "PostalAddress", streetAddress: loc.address, addressLocality: loc.city, addressRegion: loc.region, postalCode: loc.postalCode, addressCountry: "PK" };
    graph.push({
      "@type": ["Physician", "MedicalBusiness"],
      "@id": home + "#practice-" + loc.id,
      name: `${site.name}, Plastic Surgeon in ${loc.city}`,
      alternateName: loc.clinic ? `${site.name} at ${loc.clinic}` : undefined,
      description: `${site.fullName}, ${site.shortCredentials}, plastic, cosmetic and reconstructive surgeon seeing patients in ${loc.city}.`,
      url: abs(`/plastic-surgeon-${loc.id}/`),
      image: abs("/assets/images/doctor/dr-junaid-fateh.jpg"),
      logo: abs("/android-chrome-512x512.png"),
      telephone: (loc.phone || site.phone).replace(/\s+/g, ""),
      email: site.email,
      medicalSpecialty: "https://schema.org/PlasticSurgery",
      isAcceptingNewPatients: true,
      currenciesAccepted: "PKR",
      address,
      geo: loc.latitude && loc.longitude ? { "@type": "GeoCoordinates", latitude: loc.latitude, longitude: loc.longitude } : undefined,
      hasMap: loc.mapsUrl,
      location: loc.clinic ? { "@type": "Place", name: loc.clinic, address } : undefined,
      areaServed: (loc.areasServed || [loc.city]).map((a) => ({ "@type": "City", name: a })),
      employee: { "@id": personId },
      availableService: fullServices ? serviceList : undefined,
      sameAs,
    });
  }

  /* ── Breadcrumbs ─────────────────────────────────────────────── */
  const crumbs = [{ name: "Home", url: home }];
  const cat = d.pageType === "procedure" ? (d.collections.categories || []).find((c) => c.fileSlug === d.category) : null;
  if (d.pageType === "procedure") {
    crumbs.push({ name: "Procedures", url: abs("/procedures/") });
    if (cat) crumbs.push({ name: cat.data.nav_title, url: abs(cat.url) });
    crumbs.push({ name: d.short_title || d.title, url });
  } else if (d.pageType === "category") {
    crumbs.push({ name: "Procedures", url: abs("/procedures/") });
    crumbs.push({ name: d.nav_title || d.title, url });
  } else if (d.pageType === "post") {
    crumbs.push({ name: "Blog", url: abs("/blog/") });
    crumbs.push({ name: d.title, url });
  } else if (d.page.url !== "/" && d.title) {
    crumbs.push({ name: d.breadcrumb || d.title, url });
  }
  const breadcrumbId = url + "#breadcrumb";
  if (crumbs.length > 1) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": breadcrumbId,
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: strip(c.name), item: c.url })),
    });
  }

  /* ── The page itself ─────────────────────────────────────────── */
  const pageDescription = strip(d.quick_answer || d.seo?.description || d.description || d.summary || site.description);
  const webPage = {
    "@type": ["WebPage"],
    "@id": url + "#webpage",
    url,
    name: strip(d.seo?.title || d.title || site.name),
    description: pageDescription,
    inLanguage: "en-PK",
    isPartOf: { "@id": websiteId },
    breadcrumb: crumbs.length > 1 ? { "@id": breadcrumbId } : undefined,
    dateModified: new Date(modified).toISOString(),
    author: { "@id": personId },
    publisher: { "@id": personId },
    primaryImageOfPage: d.image ? { "@type": "ImageObject", url: abs(d.image) } : undefined,
  };
  if (["procedure", "category", "post", "faq-page", "location"].includes(d.pageType) || /journey|cost|overseas/.test(d.page.url)) {
    webPage["@type"] = ["WebPage", "MedicalWebPage"];
    webPage.audience = { "@type": "Patient" };
    webPage.specialty = "https://schema.org/PlasticSurgery";
    webPage.medicalAudience = { "@type": "MedicalAudience", audienceType: "Patient" };
  }
  if (d.last_reviewed) {
    webPage.lastReviewed = new Date(d.last_reviewed).toISOString().slice(0, 10);
    webPage.reviewedBy = { "@id": personId };
  }
  if (d.pageType === "about") {
    webPage["@type"] = ["WebPage", "ProfilePage", "AboutPage"];
    webPage.mainEntity = { "@id": personId };
  }
  if (d.pageType === "home") webPage.about = { "@id": personId };
  if (d.page.url === "/contact/") webPage["@type"] = ["WebPage", "ContactPage"];
  graph.push(webPage);

  /* ── Procedure pages ─────────────────────────────────────────── */
  if (d.pageType === "procedure") {
    const procId = url + "#procedure";
    const names = [...(d.also_known_as || []), d.urdu_name, d.short_title !== d.title ? d.short_title : null].filter(Boolean);
    const images = (d.before_after || []).flatMap((p) => [p.before, p.after]).filter(Boolean).map((i) => abs(i));
    graph.push({
      "@type": "MedicalProcedure",
      "@id": procId,
      name: d.title,
      alternateName: names,
      description: strip(d.quick_answer || d.summary),
      url,
      image: images,
      procedureType: d.category === "non-surgical" ? "https://schema.org/NoninvasiveProcedure" : "https://schema.org/SurgicalProcedure",
      bodyLocation: d.body_location,
      relevantSpecialty: "https://schema.org/PlasticSurgery",
      howPerformed: strip(d.summary),
      preparation: strip(d.candidates?.outro || d.candidates?.intro),
      followup: strip([d.recovery?.intro, ...(d.recovery?.timeline || []).map((t) => `${t.stage}: ${t.text}`)].filter(Boolean).join(" ")),
      mainEntityOfPage: { "@id": url + "#webpage" },
    });
    webPage.about = { "@id": procId };
    webPage.mainEntity = { "@id": procId };
  }

  /* ── Category pages: list of procedures ──────────────────────── */
  if (d.pageType === "category") {
    const items = procedures.filter((p) => p.data.category === d.page.fileSlug);
    graph.push({
      "@type": "ItemList",
      "@id": url + "#procedures",
      name: d.title,
      numberOfItems: items.length,
      itemListElement: items.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(p.url), name: p.data.title })),
    });
    webPage.mainEntity = { "@id": url + "#procedures" };
  }

  /* ── Blog articles ───────────────────────────────────────────── */
  if (d.pageType === "post") {
    const related = (d.related_procedures || []).map((s) => procedures.find((p) => p.fileSlug === s)).filter(Boolean);
    graph.push({
      "@type": "BlogPosting",
      "@id": url + "#article",
      headline: d.title,
      description: strip(d.description),
      abstract: (d.key_takeaways || []).map(strip).join(" "),
      keywords: d.keywords,
      articleSection: d.category,
      inLanguage: "en-PK",
      datePublished: new Date(d.page.date).toISOString(),
      dateModified: new Date(Math.max(new Date(d.updated || d.page.date), new Date(modified))).toISOString(),
      author: { "@id": personId },
      publisher: { "@id": personId },
      image: d.image ? abs(d.image) : undefined,
      about: related.map((p) => ({ "@type": "MedicalProcedure", name: p.data.title, url: abs(p.url) })),
      isPartOf: { "@id": websiteId },
      mainEntityOfPage: { "@id": url + "#webpage" },
    });
    webPage.mainEntity = { "@id": url + "#article" };
  }

  /* ── Videos on the page ──────────────────────────────────────── */
  for (const v of d.videos || []) {
    if (!v || !v.url) continue;
    const id = youtubeId(v.url);
    graph.push({
      "@type": "VideoObject",
      name: v.title || `${d.short_title || d.title} video by ${site.name}`,
      description: v.description || v.title || `${d.short_title || d.title}: video from ${site.fullName}.`,
      thumbnailUrl: id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : v.poster ? abs(v.poster) : abs(site.ogImage),
      uploadDate: v.date ? new Date(v.date).toISOString() : undefined,
      embedUrl: id ? `https://www.youtube.com/embed/${id}` : undefined,
      contentUrl: id ? undefined : /^https?:/.test(v.url) ? v.url : abs(v.url),
      url: v.url.startsWith("/") ? abs(v.url) : v.url,
      publisher: { "@id": personId },
    });
  }

  /* ── FAQs ────────────────────────────────────────────────────── */
  let faqs = [];
  if (Array.isArray(d.faqs)) faqs = d.faqs;
  if (d.pageType === "faq-page") faqs = (d.generalFaqs || []).flatMap((g) => g.items || []);
  if (d.pageType === "home") faqs = (d.generalFaqs || []).flatMap((g) => g.items || []).filter((f) => f.home);
  faqs = faqs.filter((f) => f && f.q && f.a);
  if (faqs.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": url + "#faq",
      url,
      isPartOf: { "@id": url + "#webpage" },
      mainEntity: faqs.map((f) => ({ "@type": "Question", name: strip(f.q), acceptedAnswer: { "@type": "Answer", text: strip(f.a) } })),
    });
  }

  const json = JSON.stringify(clean({ "@context": "https://schema.org", "@graph": graph })).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}
