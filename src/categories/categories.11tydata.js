// Settings shared by every category page in this folder.
export default {
  layout: "layouts/category.njk",
  pageType: "category",
  eleventyComputed: {
    permalink: (data) => (typeof data.permalink === "string" && data.permalink ? data.permalink : `/procedures/${data.page.fileSlug}/`),
  },
};
