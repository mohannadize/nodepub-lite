import JSZip from "jszip";
import structuralFiles from "./constituents/structural";
import markupFiles from "./constituents/markup";
import * as utils from "./utils";
import { saveAs } from "file-saver";

// Construct a new document

export default class NodepubLite {
  constructor(metadata, generateContentsCallback) {
    this.CSS = "";
    this.sections = [];
    this.images = [];
    this.metadata = metadata;
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

  // Add a new section entry (usually a chapter) with the given title and
  // (HTML) body content. Optionally excludes it from the contents page.
  // If it is Front Matter then it will appear before the contents page.
  // The overrideFilename is optional and refers to the name used inside the epub.
  // by default the filenames are auto-numbered. No extention should be given.
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

  // Add a CSS file to the EPUB. This will be shared by all sections.
  addCSS(content) {
    this.CSS = content;
  }

  // Gets the number of sections added so far.
  getSectionCount() {
    return this.sections.length;
  }

  // Gets the files needed for the EPUB, as an array of objects.
  // Note that 'compress:false' MUST be respected for valid EPUB files.
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

  async createJSZip(epubname = "ebook") {
    const files = await this.getFilesForEPUB();

    // Start creating the zip.
    const archive = new JSZip();

    await new Promise((resolveWrite) => {
      // Write the file contents.
      files.forEach((file) => {
        const content = utils.isDataURI(file.content)
          ? utils.dataURItoBlob(file.content)
          : file.content;

        if (file.folder.length > 0) {
          archive.file(
            `${file.folder}/${file.name}`,
            content,
            file.options
          );
        } else {
          archive.file(file.name, content, file.options);
        }
      });

      resolveWrite();
    });

    archive
      .generateAsync({ type: "blob", mimeType: structuralFiles.getMimetype() })
      .then(function (blob) {
        saveAs(blob, `${epubname}.epub`);
      });
  }
}
