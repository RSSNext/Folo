class ShareExtensionPreprocessor {
  run({ completionFunction }) {
    // Extract meta tags and image sources from the document
    const metas = {
      title: document.title,
    };

    // Get all meta elements
    const metaElements = document.querySelectorAll("meta");
    for (const meta of metaElements) {
      const name = meta.getAttribute("name") || meta.getAttribute("property");
      const content = meta.getAttribute("content");

      if (name && content) {
        metas[name] = content;
      }
    }

    

    // Call the completion function with the extracted data
    completionFunction({
      baseURI: document.baseURI,
      meta: JSON.stringify(metas),
    });
  }
}
var ExtensionPreprocessingJS = new ShareExtensionPreprocessor();
