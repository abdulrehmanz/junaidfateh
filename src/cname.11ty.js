// Writes a CNAME file for GitHub Pages only when site.customDomain is set in src/_data/site.yml
export default class {
  data() {
    return {
      eleventyExcludeFromCollections: true,
      permalink: (data) => (data.site.customDomain ? "/CNAME" : false),
    };
  }
  render(data) {
    return data.site.customDomain;
  }
}
