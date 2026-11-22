/**
 * Builds the JSON-LD structured data (schema.org) for each page.
 * Google uses this to understand who Dr. Junaid is, where he practises,
 * which procedures each page describes, and the FAQs on the page.
 */

const strip = (s) =>
  String(s ?? "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // markdown links -> text
    .replace(/[*_`>#]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

export function buildSchema(d, abs) {
  const site = d.site;
  const url = abs(d.page.url);
  const home = abs("/");
  const personId = home + "#dr-junaid-fateh";
  const sameAs = Object.values(site.social || {}).filter(Boolean);
  const graph = [];

  const person = {
    "@type": "Person",
    "@id": personId,
    name: site.fullName,
    alternateName: site.name,
    honorificPrefix: "Dr.",
    jobTitle: site.jobTitle,
    description: site.description,
    url: abs("/about/"),
    image: abs("/assets/images/doctor/dr-junaid-fateh.jpg"),
    email: site.email,
    telephone: site.phoneHref,
    knowsAbout: ["Plastic surgery", "Hair transplant", "Gynecomastia surgery", "Liposuction", "Hand surgery", "Reconstructive surgery", "Non-surgical aesthetic medicine"],
    alumniOf: (site.education || []).map((e) => ({ "@type": "EducationalOrganization", name: e.institution })),
    hasCredential: (site.education || []).map((e) => ({
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "degree",
      name: e.title,
      recognizedBy: { "@type": "Organization", name: e.institution },
    })),
    memberOf: (site.memberships || []).map((m) => ({ "@type": "Organization", name: m.name })),
    sameAs,
  };
  if (site.pmdcNumber) person.identifier = { "@type": "PropertyValue", propertyID: "PMDC registration", value: site.pmdcNumber };

  graph.push({ "@type": "WebSite", "@id": home + "#website", url: home, name: site.name, inLanguage: site.language, publisher: { "@id": personId } });
  graph.push(person);

  for (const loc of d.locations || []) {
    const address = { "@type": "PostalAddress", addressLocality: loc.city, addressRegion: loc.region, addressCountry: "PK" };
    if (loc.address) address.streetAddress = loc.address;
    if (loc.postalCode) address.postalCode = loc.postalCode;
    const clinic = {
      "@type": "Physician",
      "@id": home + "#practice-" + loc.id,
      name: `${site.name}, Plastic Surgeon in ${loc.city}`,
      url: home,
      image: abs("/assets/images/doctor/dr-junaid-fateh.jpg"),
      telephone: (loc.phone || site.phone).replace(/\s+/g, ""),
      medicalSpecialty: "PlasticSurgery",
      isAcceptingNewPatients: true,
      address,
      areaServed: [loc.city, "Punjab", "Pakistan"],
      employee: { "@id": personId },
      sameAs,
    };
    if (loc.latitude && loc.longitude) clinic.geo = { "@type": "GeoCoordinates", latitude: loc.latitude, longitude: loc.longitude };
    if (loc.mapsUrl) clinic.hasMap = loc.mapsUrl;
    if (loc.clinic) clinic.location = { "@type": "Place", name: loc.clinic };
    graph.push(clinic);
  }

  // Breadcrumbs
  const crumbs = [{ name: "Home", url: home }];
  if (d.pageType === "procedure") {
    const cat = (d.collections.categories || []).find((c) => c.fileSlug === d.category);
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
  if (crumbs.length > 1) {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: strip(c.name), item: c.url })),
    });
  }

  // Page-specific entities
  if (d.pageType === "procedure") {
    graph.push({
      "@type": "MedicalProcedure",
      name: d.title,
      alternateName: d.short_title,
      description: strip(d.seo?.description || d.summary),
      url,
      image: d.before_after?.[0]?.after ? abs(d.before_after[0].after) : undefined,
      procedureType: d.category === "non-surgical" ? "https://schema.org/NoninvasiveProcedure" : "https://schema.org/SurgicalProcedure",
      howPerformed: strip(d.summary),
      followup: strip(d.recovery?.intro),
      mainEntityOfPage: url,
    });
  }
  if (d.pageType === "post") {
    graph.push({
      "@type": "BlogPosting",
      headline: d.title,
      description: strip(d.description),
      datePublished: new Date(d.page.date).toISOString(),
      dateModified: new Date(d.updated || d.page.date).toISOString(),
      author: { "@id": personId },
      publisher: { "@id": personId },
      image: d.image ? abs(d.image) : undefined,
      mainEntityOfPage: url,
      articleSection: d.category,
    });
  }
  if (d.pageType === "about") {
    graph.push({ "@type": "ProfilePage", url, mainEntity: { "@id": personId } });
  }

  // FAQs: procedure/category/post pages use `faqs`, the FAQ page uses grouped data
  let faqs = [];
  if (Array.isArray(d.faqs)) faqs = d.faqs;
  if (d.pageType === "faq-page") faqs = (d.generalFaqs || []).flatMap((g) => g.items || []);
  if (d.pageType === "home") faqs = (d.generalFaqs || []).flatMap((g) => g.items || []).filter((f) => f.home);
  faqs = faqs.filter((f) => f && f.q && f.a);
  if (faqs.length) {
    graph.push({
      "@type": "FAQPage",
      url,
      mainEntity: faqs.map((f) => ({ "@type": "Question", name: strip(f.q), acceptedAnswer: { "@type": "Answer", text: strip(f.a) } })),
    });
  }

  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}
