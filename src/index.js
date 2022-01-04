const JSZip = require("jszip");
const structuralFiles = require("./constituents/structural");
const markupFiles = require("./constituents/markup");
const utils = require("./utils");
const { saveAs } = require("file-saver");

/**
 * @typedef {Object} Image
 * @property {string} name Image Name
 * @property {string} type Image Mime Type
 * @property {(DataURI|Blob)} data Image Data
 *
 */

/**
 * @typedef {Object} MetaData
 * @property {string} id - Id of the ebook
 * @property {Image} cover - Cover Image
 * @property {string} title - Title
 * @property {string} author - Author
 * @property {string} [genre] - Subject of the EPUB
 * @property {string} [series] - Series
 * @property {number} [sequence] - Number in the sequence of the series
 * @property {string} [tags] - becomes subjects in the final EPUB
 * @property {string} [copyright] - Copy
 * @property {string} [publisher] - Publisher
 * @property {string} [published] - Publish date year-month-day format
 * @property {string} [language] - The short ISO language name
 * @property {string} [description] - Book description
 * @property {boolean} [showContents] - Show table of contents
 * @property {string} [contents] - Table of contents page title
 * @property {string} [source] - Book Source URL
 * @property {Image[]} [images] - An array of the images used in the epub
 *
 */

/**
 * @typedef {Function} ContentPageGenerator
 * @param {array} items an array with of the epub items
 * @property {string} items[].title - the title of the section being linked to
 * @property {string} items[].link -  the relative `href` within the EPUB
 * @property {string} items[].itemType -  one of 3 types, those being *front* for front matter, *contents* for the contents page, and *main* for the remaining sections. You can use this to omit front matter from the contents page if required
 * @returns {string} 
 *
 */

/**
 * @module NodepubLite class
 */

class NodepubLite {
  /**
   * Construct a new document
   * @example <caption>Returns a new document instance</caption>
   * const metadata = {
   *    id: "1",
   *    title: "Example Book",
   *    cover: {
   *      name: "Cover.png",
   *      type: "image/png",
   *      data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
   *    },
   *    author: "Author",
   * };
   *
   * const instance = new NodepubLite(metadata)
   *
   * @example <caption>Returns a new document instance with a custom contents page</caption>
   * const metadata = {
   *    id: "1",
   *    title: "Example Book",
   *    cover: {
   *      name: "Cover.png",
   *      type: "image/png",
   *      data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
   *    },
   *    author: "Author",
   * };
   *
   * const makeContentsPage = (links) => {
   *   let contents = "<h1>Chapters</h1>";
   *   links.forEach((link) => {
   *     if (link.itemType !== "contents") {
   *       contents += "<a href='" + link.link + "'>" + link.title + "</a><br />";
   *     }
   *   });
   *   return contents;
   * };
   *
   * const instance = new NodepubLite(metadata, makeContentsPage)
   * @param {MetaData} metadata
   * @param {ContentPageGenerator} [generateContentsCallback] - a function which is called when the contents
   * page is being constructed.
   */
  constructor(metadata, generateContentsCallback) {
    this.CSS = "";
    this.sections = [];
    this.images = [];
    this.metadata = {
      language: "en",
      ...metadata,
    };
    this.generateContentsCallback = generateContentsCallback;
    this.showContents = true;
    this.filesForTOC = [];
    this.coverImage = {};

    // Basic validation.
    const required = ["id", "title", "author", "cover"];
    if (metadata == null) throw new Error("Missing metadata");
    required.forEach((field) => {
      const prop = metadata[field];
      if (field === "cover") {
        if (prop == null || typeof prop === "undefined" || !prop.name)
          throw new Error(`Missing metadata: ${field}`);
        this.coverImage = prop;
      }
      if (
        prop == null ||
        typeof prop === "undefined" ||
        prop.toString().trim() === ""
      )
        throw new Error(`Missing metadata: ${field}`);
    });

    if (
      metadata.showContents !== null &&
      typeof metadata.showContents !== "undefined"
    ) {
      this.showContents = metadata.showContents;
    }
  }

  /**
   * Add a new section entry (usually a chapter) with the given title and
   * (HTML) body content. Optionally excludes it from the contents page.
   * If it is Front Matter then it will appear before the contents page.
   * The overrideFilename is optional and refers to the name used inside the epub.
   * by default the filenames are auto-numbered. No extention should be given.
   * @param {string} title - Table of contents entry
   * @param {string} content  - HTML content of the section
   * @param {boolean} [excludeFromContents] - Hide from contents/navigation
   * @param {boolean} [isFrontMatter] - Places before any contents page
   * @param {string} [overrideFilename] - Section filename inside the EPUB
   */
  addSection(
    title,
    content,
    excludeFromContents,
    isFrontMatter,
    overrideFilename
  ) {
    let filename = overrideFilename;
    if (
      filename == null ||
      typeof filename === "undefined" ||
      filename.toString().trim() === ""
    ) {
      const i = this.sections.length + 1;
      filename = `s${i}`;
    }
    filename = `${filename}.xhtml`;
    this.sections.push({
      title,
      content,
      excludeFromContents: excludeFromContents || false,
      isFrontMatter: isFrontMatter || false,
      filename,
    });
  }

  /**
   * Add a CSS file to the EPUB. This will be shared by all sections.
   * @param {string} content - CSS to be inserted into the stylesheet
   */
  addCSS(content) {
    this.CSS += content;
  }

  /**
   * @returns {number} number of sections added so far.
   */
  getSectionCount() {
    return this.sections.length;
  }

  /**
   * Gets the files needed for the EPUB, as an array of objects.
   * Note that 'compression:"STORE"' MUST be respected for valid EPUB files.
   * @returns {array} files to be archived
   */
  async getFilesForEPUB() {
    const syncFiles = [];

    // Required files.
    syncFiles.push({
      name: "mimetype",
      folder: "",
      options: {
        compression: "STORE",
      },
      content: structuralFiles.getMimetype(),
    });
    syncFiles.push({
      name: "container.xml",
      folder: "META-INF",
      options: {
        compression: "DEFLATE",
        compressionOptions: {
          level: 4,
        },
      },
      content: structuralFiles.getContainer(this),
    });
    syncFiles.push({
      name: "ebook.opf",
      folder: "OEBPF",
      options: {
        compression: "DEFLATE",
        compressionOptions: {
          level: 4,
        },
      },
      content: structuralFiles.getOPF(this),
    });
    syncFiles.push({
      name: "navigation.ncx",
      folder: "OEBPF",
      options: {
        compression: "DEFLATE",
        compressionOptions: {
          level: 4,
        },
      },
      content: structuralFiles.getNCX(this),
    });
    syncFiles.push({
      name: "cover.xhtml",
      folder: "OEBPF",
      options: {
        compression: "DEFLATE",
        compressionOptions: {
          level: 4,
        },
      },
      content: markupFiles.getCover(this),
    });

    // Optional files.
    syncFiles.push({
      name: "ebook.css",
      folder: "OEBPF/css",
      options: {
        compression: "DEFLATE",
        compressionOptions: {
          level: 4,
        },
      },
      content: markupFiles.getCSS(this),
    });
    for (let i = 1; i <= this.sections.length; i += 1) {
      const fname = this.sections[i - 1].filename;
      syncFiles.push({
        name: `${fname}`,
        folder: "OEBPF/content",
        compression: "DEFLATE",
        compressionOptions: {
          level: 4,
        },
        content: markupFiles.getSection(this, i),
      });
    }

    // Table of contents markup.
    if (this.showContents) {
      syncFiles.push({
        name: "toc.xhtml",
        folder: "OEBPF/content",
        options: {
          compression: "DEFLATE",
          compressionOptions: {
            level: 4,
          },
        },
        content: markupFiles.getTOC(this),
      });
    }

    // Extra images - add filename into content property and prepare for async handling.
    if (this.coverImage)
      syncFiles.push({
        name: this.coverImage.name,
        folder: "OEBPF/images",
        options: {
          compression: "DEFLATE",
          compressionOptions: {
            level: 4,
          },
        },
        content: this.coverImage.data,
      });

    if (this.metadata.images) {
      this.metadata.images.forEach((image) => {
        syncFiles.push({
          name: image.name,
          folder: "OEBPF/images",
          options: {
            compression: "DEFLATE",
            compressionOptions: {
              level: 4,
            },
          },
          content: image.data,
        });
      });
    }

    // Return with the files.
    return syncFiles;
  }

  /**
   * Generates a new epub document and starts downloading in the browser.
   * @example
   * // Generates a book called "book-1.epub" and starts downloading
   * instance.createEPUB("book-1");
   * @param {string} [fileNameWithoutExtension=this.metadata.title] - The epub file name to be used.
   * @returns {Promise} Resolves if the book has been bundled successfully

   */
  async createEPUB(fileNameWithoutExtension) {
    const files = await this.getFilesForEPUB();
    const title = this.metadata.title;

    // Start creating the zip.
    const archive = new JSZip();

    files.forEach((file) => {
      const content = utils.isDataURI(file.content)
        ? utils.dataURItoBlob(file.content)
        : file.content;

      if (file.folder.length > 0) {
        archive.file(`${file.folder}/${file.name}`, content, file.options);
      } else {
        archive.file(file.name, content, file.options);
      }
    });

    return archive
      .generateAsync({ type: "blob", mimeType: structuralFiles.getMimetype() })
      .then(function (blob) {
        return saveAs(blob, `${fileNameWithoutExtension || title}.epub`);
      });
  }
}

module.exports = NodepubLite;