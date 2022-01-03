# NodepubLite

This repository is a fork of [kcartlidge/nodepub](https://github.com/kcartlidge/nodepub) that is aimed to create a browser version of this awesome package.

## About NodepubLite

NodepubLite is a Node module which can be used to create EPUB 2 documents.

- Files pass the IDPF online validator
- Files meet Sigil's preflight checks
- Files open fine in iBooks, Adobe Digital Editions, and Calibre
- Files open fine with the Kobo H20 ereader
- Files are fine as KindleGen input
- PNG/JPG cover images - recommend 600x800, 600x900, or similar as minimum
- Custom CSS can be provided
- Inline images within the EPUB
- Optionally generate your own contents page
- Front matter before the contents page
- Exclude sections from auto contents page and metadata-based navigation
- OEBPS and other 'expected' subfolders within the EPUB
- Development is done against Node v15.6.0 since v3.0.0 (February 2021). Node v10.3 or later should work fine.

## Installing NodepubLite

It's on npm at [https://www.npmjs.com/package/nodepub-lite](https://www.npmjs.com/package/nodepub-lite).
Add it as with any other module:

```sh
npm i nodepub-lite
```

Then import it for use:

```javascript
const NodepubLite = require("nodepub-lite");
```

## Defining your EPUB

- Documents consist of _metadata_ and _sections_
  - Metadata is an object with various properties detailing the book
  - Sections are chunks of HTML that can be thought of as chapters

Here's some sample metadata:

```javascript
var metadata = {
  id: "278-123456789",
  cover: {
    name: "Cover.jpeg",
    type: "image/jpeg",
    data: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", // Blob or DataURI
  },
  title: "Unnamed Document",
  series: "My Series",
  sequence: 1,
  author: "KA Cartlidge",
  fileAs: "Cartlidge,KA",
  genre: "Non-Fiction",
  tags: "Sample,Example,Test",
  copyright: "Anonymous, 1980",
  publisher: "My Fake Publisher",
  published: "2000-12-31",
  language: "en",
  description: "A test book.",
  showContents: false,
  contents: "Table of Contents",
  source: "http://www.kcartlidge.com",
  images: [
    {
      name: "./images/1.jpeg",
      type: "image/jpeg",
      data: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", // Blob or DataURI
    },
  ],
};
```

- The `cover` should be an object that has three _keys_.
  - `name` file name as refenced in the document html.
  - `type` mime type of the image.
  - `data` image as _blob_ or _base64 dataURI_.
- The `series` and `sequence` are not recognised by many readers (the _Calibre_ properties are used)
- The `genre` becomes the main subject in the final EPUB
- The `tags` also become subjects in the final EPUB
- For `published` note the _year-month-day_ format
- The `language` is the short _ISO_ language name (`en`, `fr`, `de` etc)
- The `showContents` option (default is `true`) lets you suppress the contents page
- The `images` array is where you refer to all images used inside the book. Every image should be referenced as an object with three _keys_.
  - `name` file name as refenced in the document html, Ex: `name: "hat.png"` should be referenced in your html as `<img src="../images/hat.png" />`.
  - `type` mime type of the image.
  - `data` image as _blob_ or _base64 dataURI_.

Call the `document` method with the aforementioned metadata object detailing your book.

```javascript
var epub = new NodepubLite(metadata);
```

You also have the option to generate your own contents page. Full details on this are shown further down the page.

### Fill in the content

The bulk of the work is adding your content.

Call `addSection` on your new document with a title and the HTML contents for each section in turn (usually a section is a chapter), plus extra options as follows.

```javascript
epub.addSection(
  title,
  content,
  excludeFromContents,
  isFrontMatter,
  overrideFilename
);
```

| PARAMETER           | PURPOSE                          | DEFAULT |
| ------------------- | -------------------------------- | ------- |
| title (required)    | Table of contents entry          |         |
| content (required)  | HTML body text                   | -       |
| excludeFromContents | Hide from contents/navigation    | false   |
| isFrontMatter       | Places before any contents page  | false   |
| overrideFilename    | Section filename inside the EPUB |         |

For example:

```javascript
epub.addSection("Copyright", copyright, false, true);
epub.addSection("Chapter 1", "<h1>One</h1><p>...</p>");
epub.addSection(
  "Chapter 2",
  "<h1>One</h1><p>...</p>",
  false,
  false,
  "chapter-2"
);
```

_Excluding from the contents page list_ allows you to add content which does not appear either in the auto-generated HTML table of contents or the metadata contents used directly by ereaders/software. This is handy for example when adding a page at the end of the book with details of your other books - a common page which may not appear in the book contents.

_Flagging as front matter_ still includes it but passes that flag into any custom content page generation function you may choose to provide. Front matter will also appear in your book ahead of the contents page when read linearly. Useful for dedication pages, for example.

_Override the filename within the generated EPUB_ allows the filename (don't provide an extention) to be specified manually, which enhances internal linking across sections. This was always possible using the auto-generated filenames (eg `s2.xhtml`) but, whilst the naming was predictable, inserting a new section bumped further sections further along the sequence (so `s2` becomes `s3` instead), breaking internal links. Using a manually named section prevents that breakage.

This should only be relevant if you are doing those internal cross-section links; general works of fiction for example won't usually need this facility. See the end of chapter one's content and the definition of content two in the example folder for sample usage.

### Optionally add some extra CSS

You can inject basic CSS into your book.

```javascript
epub.addCSS(`p { text-indent: 0; } p+p { text-indent: 0.75em; }`);
```

### You can also choose to make your own custom contents page

_A standard contents page is included automatically, but can be overridden._
_You can also suppress the contents page entirely; see the metadata section above._

You can create your own by passing a second parameter when creating a _document_ - a function which is called when the contents page is being constructed. That function will be given details of all the links, and is expected to return HTML to use for the contents page.

```javascript
var makeContentsPage = (links) => {
  var contents = "<h1>Chapters</h1>";
  links.forEach((link) => {
    if (link.itemType !== "contents") {
      contents += "<a href='" + link.link + "'>" + link.title + "</a><br />";
    }
  });
  return contents;
};
var epub = new NodepubLite(metadata, makeContentsPage);
```

The `links` array which is passed to your callback function consists of objects with the following properties:

- _title_ - the title of the section being linked to
- _link_ - the relative `href` within the EPUB
- _itemType_ - one of 3 types, those being _front_ for front matter, _contents_ for the contents page, and _main_ for the remaining sections
  - You can use this to omit front matter from the contents page if required

Your callback function should return a string of HTML which will form the body of the contents page.
The `example.js` mentioned in the next section shows this in action.

## Generating your EPUB

Note that NodepubLite is _asynchronous_, actionable using `async`/`await`.

```javascript
// This will generate an epub file `example.epub`
// that will start downloading inside the browser window.
const promise = epub.createEpub("example").catch(console.error);
```
