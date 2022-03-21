const JSZip = require("jszip");
const utils = require("./utils");
const constituents = require("../src/constituents");
const { saveAs } = require("file-saver");

/**
 * @typedef {Object} Image
 * @property {string} name Image Name
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
 * @property {boolean} [isRTL] - force generate RTL Document
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

const DEFAULTS = {
  cover: {},
  showContents: true,
  contents: "Chapters",
  language: "en",
  id: 1,
  CSS: `
body {
  line-height: 1.5;
  text-align: left;
  font-kerning: normal;
  font-variant: common-ligatures oldstyle-nums proportional-nums;
  font-feature-settings: "kern", "liga", "clig", "onum", "pnum";
}

body * {
    line-height: inherit;
}

h1, h2, h3 {
    font-family: sans-serif;
    text-align: center;
    font-variant: common-ligatures lining-nums proportional-nums;
    font-feature-settings: "kern", "liga", "clig", "lnum", "pnum";
}

code {
    font-family: monospace;
    font-variant: no-common-ligatures lining-nums;
    font-feature-settings: "kern" 0, "liga" 0, "clig" 0, "lnum";
    white-space: pre-wrap;
}

pre {
    margin: 1em 0.5em;
    border: 1px solid #aaa;
    box-shadow: 5px 5px 8px #ccc;
    padding: 0.5em;
}

h1, h2, h3, code {
    line-height: 1.2;
    -webkit-hyphens: none;
    -moz-hyphens: none;
    -ms-hyphens: none;
    -epub-hyphens: none;
    adobe-hyphenate: none;
    hyphens: none;
}

p, blockquote {
    font-family: serif;
    -webkit-hyphenate-limit-before: 3;
    -webkit-hyphenate-limit-after: 2;
    -webkit-hyphenate-limit-lines: 2;
    -ms-hyphenate-limit-chars: 6 3 2;
    hyphenate-limit-chars: 6 3 2;
    hyphenate-limit-lines: 2;
}

blockquote {
    font-style: italic;
    margin-left: 3em;
    text-indent: -1.2ch;
}

blockquote:before {
    content: "\\201C\\00A0";
}

blockquote:after {
    content: "\\00A0\\201D";
}

p {
    margin: 0;
    padding: 0;
    text-indent: 1.25em;
    text-align: justify;
    widows: 2;
    orphans: 2;
}

a, a:link, a:visited {
    color: inherit;
    -webkit-text-fill-color: inherit;
    text-decoration: underline dotted #888;
}

a:active, a:hover {
    color: blue;
    text-decoration: underline solid blue;
}

.epub-author {
    color: #555;
}

.epub-link {
    margin-bottom: 30px;
}

.epub-link a {
    color: #666;
    font-size: 90%;
}

.toc-author {
    font-size: 90%;
    color: #555;
}

.toc-link {
    color: #999;
    font-size: 85%;
    display: block;
}

hr {
    width: 100%;
    height: 1em;
    border: 0;
    margin: 1.5em auto;
    text-align: center;
    color: black;
    overflow: hidden;
    page-break-inside: avoid;
    break-inside: avoid;
}

hr:before {
    content: '* * *';
}
  `,
};

const RESERVED = {
  filesForTOC: [],
  sections: [],
};

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
   * @param {MetaData} options
   * @param {ContentPageGenerator} [generateContentsCallback] - a function which is called when the contents
   * page is being constructed.
   */
  constructor(options = {}, generateContentsCallback) {
    const parsedOptions = { ...DEFAULTS, ...options, ...RESERVED };
    const required = ["title", "author", "cover"];
    required.forEach((field) => {
      const prop = parsedOptions[field];
      if (field === "cover") {
        if (prop == null || typeof prop === "undefined" || !prop.data)
          throw new Error(`Missing metadata: cover image`);

        this.coverImage = {
          name: `cover${utils.getExtension(utils.getMimeType(prop.data))}`,
          ...prop,
        };
      }
      if (
        prop == null ||
        typeof prop === "undefined" ||
        prop.toString().trim() === ""
      )
        throw new Error(`Missing metadata: ${field}`);
    });

    for (const key in parsedOptions) {
      this[key] = parsedOptions[key];
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
   * @param {object} [options] - section modifiers
   * @param {boolean} [options.excludeFromContents] - Hide from contents/navigation
   * @param {boolean} [options.isFrontMatter] - Places before any contents page
   * @param {string} [options.overrideFilename] - Section filename inside the EPUB
   */
  addSection(title, content, options = {}) {
    const {
      excludeFromContents = false,
      isFrontMatter = false,
      overrideFilename = undefined,
    } = options;

    let filename = overrideFilename;
    if (
      filename == null ||
      typeof filename === "undefined" ||
      filename.toString().trim() === ""
    ) {
      const i = this.sections.length + 1;
      filename = `s${i}`;
    }

    if (
      this.sections.find(
        ({ filename: check }) => check === `${filename.trim()}.xhtml`
      )
    )
      throw new Error("A section already exist with the same filename");

    filename = `${filename.trim()}.xhtml`;

    this.sections.push({
      title,
      content,
      excludeFromContents,
      isFrontMatter,
      filename,
    });
    return true;
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
    const compressionOptions = {
      STORE: {
        compression: "STORE",
      },
      COMPRESS: {
        compression: "DEFLATE",
        compressionOptions: {
          level: 7,
        },
      },
    };

    // Required files.
    syncFiles.push({
      name: "mimetype",
      folder: "",
      options: compressionOptions.STORE,
      content: constituents.getMimetype(),
    });
    syncFiles.push({
      name: "container.xml",
      folder: "META-INF",
      options: compressionOptions.COMPRESS,
      content: constituents.getContainer(this),
    });
    syncFiles.push({
      name: "ebook.opf",
      folder: "OEBPF",
      options: compressionOptions.COMPRESS,
      content: constituents.getOPF(this),
    });
    syncFiles.push({
      name: "navigation.ncx",
      folder: "OEBPF",
      options: compressionOptions.COMPRESS,
      content: constituents.getNCX(this),
    });
    syncFiles.push({
      name: "cover.xhtml",
      folder: "OEBPF",
      options: compressionOptions.COMPRESS,
      content: constituents.getCover(this),
    });

    // Optional files.
    syncFiles.push({
      name: "ebook.css",
      folder: "OEBPF/css",
      options: compressionOptions.COMPRESS,
      content: constituents.getCSS(this),
    });
    for (let i = 1; i <= this.sections.length; i += 1) {
      const fname = this.sections[i - 1].filename;
      syncFiles.push({
        name: `${fname}`,
        folder: "OEBPF/content",
        options: compressionOptions.COMPRESS,
        content: constituents.getSection(this, i),
      });
    }

    // Table of contents markup.
    if (this.showContents) {
      syncFiles.push({
        name: "toc.xhtml",
        folder: "OEBPF/content",
        options: compressionOptions.COMPRESS,
        content: constituents.getTOC(this),
      });
    }

    // Extra images - add filename into content property and prepare for async handling.
    if (this.cover)
      syncFiles.push({
        name: this.cover.name,
        folder: "OEBPF/images",
        options: compressionOptions.COMPRESS,
        content: this.cover.data,
      });

    if (this.images && Array.isArray(this.images)) {
      console.log(this.images);
      this.images.forEach((image) => {
        console.log(image);
        syncFiles.push({
          name: image.name,
          folder: "OEBPF/images",
          options: compressionOptions.COMPRESS,
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
    const title = this.title;

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
      .generateAsync({ type: "blob", mimeType: constituents.getMimetype() })
      .then(function (blob) {
        return saveAs(blob, `${fileNameWithoutExtension || title}.epub`);
      });
  }
}

module.exports = NodepubLite;
