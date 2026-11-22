// Publishes the IndexNow key file (see indexNowKey in src/_data/site.yml)
export default class {
  data() {
    return {
      eleventyExcludeFromCollections: true,
      permalink: (data) => (data.site.indexNowKey ? `/${data.site.indexNowKey}.txt` : false),
    };
  }
  render(data) {
    return data.site.indexNowKey;
  }
}
