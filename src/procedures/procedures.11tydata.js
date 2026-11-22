// Settings shared by every procedure page in this folder.
export default {
  layout: "layouts/procedure.njk",
  pageType: "procedure",
  eleventyComputed: {
    permalink: (data) => (typeof data.permalink === "string" && data.permalink ? data.permalink : `/procedures/${data.page.fileSlug}/`),
    consultProcedure: (data) => data.title,
  },
};
