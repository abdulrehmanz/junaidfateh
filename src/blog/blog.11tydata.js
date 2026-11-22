// Settings shared by every blog article in this folder.
export default {
  layout: "layouts/post.njk",
  pageType: "post",
  eleventyComputed: {
    permalink: (data) => (typeof data.permalink === "string" && data.permalink ? data.permalink : `/blog/${data.page.fileSlug}/`),
  },
};
