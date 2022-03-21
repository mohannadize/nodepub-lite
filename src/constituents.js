const { getMimeType, isRTLLanguage, getExtension } = require("./utils");
const replacements = require("./replacements");

const constituents = {
  getMimetype: () => 'application/epub+zip',
  
  getContainer: (document) => {
    let result = ``;
    result += `<?xml version="1.0" encoding='UTF-8' ?>[[EOL]]`;
    result += `<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">[[EOL]]`;
    result += `    <rootfiles>[[EOL]]`;
    result += `        <rootfile full-path="OEBPF/ebook.opf"[[EOL]]`;
    result += `            media-type="application/oebps-package+xml"/>[[EOL]]`;
    result += `    </rootfiles>[[EOL]]`;
    result += `</container>[[EOL]]`;

    return replacements(document, result);
  },

  getContents: (document, overrideContents) => {
    const dir =
      document.isRTL || isRTLLanguage(document.language) ? "rtl" : "auto";
    let body = ``;
    body += `<body dir="${dir}">[[EOL]]`;
    if (overrideContents) {
      body += overrideContents;
    } else {
      body += `    <h1 class="h1">[[EOL]]`;
      body += `        [[CONTENTS]][[EOL]]`;
      body += `    </h1>[[EOL]]`;
      body += `    <nav id="toc" epub:type="toc">[[EOL]]`;
      body += `        <ol>[[EOL]]`;
      for (let i = 1; i <= document.sections.length; i += 1) {
        const section = document.sections[i - 1];
        if (!section.excludeFromContents) {
          const { title, filename } = section;
          body += `            <li class="table-of-content">[[EOL]]`;
          body += `                <a href="${filename}">${title}</a>[[EOL]]`;
          body += `            </li>[[EOL]]`;
        }
      }
      body += `        </ol>[[EOL]]`;
      body += `    </nav>[[EOL]]`;
    }
    body += `</body>[[EOL]]`;

    let result = ``;
    result += `<?xml version="1.0" encoding="UTF-8"?>[[EOL]]`;
    result += `<!DOCTYPE html>[[EOL]]`;
    result += `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="[[LANGUAGE]]"[[EOL]]`;
    result += `    lang="[[LANGUAGE]]">[[EOL]]`;
    result += `    <head>[[EOL]]`;
    result += `        <title>[[TITLE]]</title>[[EOL]]`;
    result += `        <meta charset="UTF-8" />[[EOL]]`;
    result += `        <link rel="stylesheet" type="text/css" href="../css/ebook.css" />[[EOL]]`;
    result += `    </head>[[EOL]]`;
    result += `    ${body}[[EOL]]`;
    result += `</html>[[EOL]]`;

    return replacements(document, result);
  },

  getCover: (document) => {
    let result = ``;
    result += `<?xml version='1.0' encoding='UTF-8' ?>[[EOL]]`;
    result += `<!DOCTYPE html[[EOL]]>`;
    result += `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="[[LANGUAGE]]">[[EOL]]`;
    result += `  <head>[[EOL]]`;
    result += `      <meta charset="UTF-8" />[[EOL]]`;
    result += `      <title>[[TITLE]]</title>[[EOL]]`;
    result += `      <style type='text/css'>[[EOL]]`;
    result += `          body { margin: 0; padding: 0; text-align: center; }[[EOL]]`;
    result += `          .cover { margin: 0; padding: 0; font-size: 1px; }[[EOL]]`;
    result += `          img { margin: 0; padding: 0; height: 100%; }[[EOL]]`;
    result += `      </style>[[EOL]]`;
    result += `  </head>[[EOL]]`;
    result += `  <body>[[EOL]]`;
    result += `    <div class='cover'>[[EOL]]`;
    result += `      <img style='height: 100%;width: 100%;' src='images/${document.cover.name}' alt='Cover' />[[EOL]]`;
    result += `    </div>[[EOL]]`;
    result += `  </body>[[EOL]]`;
    result += `</html>[[EOL]]`;

    return replacements(document, result);
  },

  getCSS: (document) => {
    let result = ``;
    if (document.isRTL || isRTLLanguage(document.language)) {
      result += `body, html {[[EOL]]`;
      result += `    text-align: right;[[EOL]]`;
      result += `}[[EOL]]`;
    }
    result += `${document.CSS}[[EOL]]`;
    return replacements(document, result);
  },

  getNCX: (document) => {
    let navMap = ``;
    let playOrder = 1;
    navMap += `<navMap>[[EOL]]`;
    navMap += `    <navPoint id='cover' playOrder='${playOrder++}'>[[EOL]]`;
    navMap += `        <navLabel><text>Cover</text></navLabel>[[EOL]]`;
    navMap += `        <content src='cover.xhtml'/>[[EOL]]`;
    navMap += `    </navPoint>[[EOL]]`;

    for (i = 1; i <= document.sections.length; i += 1) {
      if (!document.sections[i - 1].excludeFromContents) {
        if (document.sections[i - 1].isFrontMatter) {
          const fname = document.sections[i - 1].filename;
          title = document.sections[i - 1].title;
          document.filesForTOC.push({
            title,
            link: `${fname}`,
            itemType: "front",
          });
          navMap += `    <navPoint class='section' id='s${i}' playOrder='${playOrder++}'>[[EOL]]`;
          navMap += `        <navLabel><text>${title}</text></navLabel>[[EOL]]`;
          navMap += `        <content src='content/${fname}'/>[[EOL]]`;
          navMap += `    </navPoint>[[EOL]]`;
        }
      }
    }

    if (document.showContents) {
      document.filesForTOC.push({
        title: document.contents,
        link: "toc.xhtml",
        itemType: "contents",
      });

      navMap += `    <navPoint id="toc" playOrder="${playOrder++}" class="chapter">[[EOL]]`;
      navMap += `        <navLabel>[[EOL]]`;
      navMap += `            <text>[[CONTENTS]]</text>[[EOL]]`;
      navMap += `        </navLabel>[[EOL]]`;
      navMap += `        <content src="content/toc.xhtml" />[[EOL]]`;
      navMap += `    </navPoint>[[EOL]]`;
    }

    for (i = 1; i <= document.sections.length; i += 1) {
      if (!document.sections[i - 1].excludeFromContents) {
        if (!document.sections[i - 1].isFrontMatter) {
          const fname = document.sections[i - 1].filename;
          title = document.sections[i - 1].title;
          document.filesForTOC.push({
            title,
            link: `${fname}`,
            itemType: "main",
          });
          navMap += `    <navPoint class="chapter" id="s${i}" playOrder="${playOrder++}">[[EOL]]`;
          navMap += `        <navLabel><text>${title}</text></navLabel>[[EOL]]`;
          navMap += `        <content src="content/${fname}" />[[EOL]]`;
          navMap += `    </navPoint>[[EOL]]`;
        }
      }
    }

    navMap += `</navMap>[[EOL]]`;

    let result = ``;
    result += `<?xml version="1.0" encoding="UTF-8"?>[[EOL]]`;
    result += `<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">[[EOL]]`;
    result += `    <head>[[EOL]]`;
    result += `        <meta name="dtb:uid" content="[[ID]]" />[[EOL]]`;
    result += `        <meta name="dtb:generator" content="ebook-generator" />[[EOL]]`;
    result += `        <meta name="dtb:depth" content="1" />[[EOL]]`;
    result += `        <meta name="dtb:totalPageCount" content="0" />[[EOL]]`;
    result += `        <meta name="dtb:maxPageNumber" content="0" />[[EOL]]`;
    result += `    </head>[[EOL]]`;
    result += `    <docTitle>[[EOL]]`;
    result += `        <text>[[TITLE]]</text>[[EOL]]`;
    result += `    </docTitle>[[EOL]]`;
    result += `    <docAuthor>[[EOL]]`;
    result += `        <text>[[AUTHOR]]</text>[[EOL]]`;
    result += `    </docAuthor>[[EOL]]`;
    result += `    ${navMap}[[EOL]]`;
    result += `</ncx>[[EOL]]`;

    return replacements(document, result);
  },

  getOPF: (document) => {
    const progressionDirection =
      document.isRTL || isRTLLanguage(document.language) ? "rtl" : "default";

    let metadata = ``;
    metadata += `<metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">[[EOL]]`;
    metadata += `    <dc:identifier id="BookId">[[ID]]</dc:identifier>[[EOL]]`;
    metadata += `    <meta refines="#BookId" property="identifier-type" scheme="onix:codelist5">[[ID]]</meta>[[EOL]]`;
    metadata += `    <meta property="dcterms:identifier" id="meta-identifier">BookId</meta>[[EOL]]`;
    if (document.series && document.sequence) {
      metadata += `    <dc:title>[[TITLE]] ([[SERIES]] #[[SEQUENCE]])</dc:title>[[EOL]]`;
      metadata += `    <meta property="dcterms:title" id="meta-title">[[TITLE]] ([[SERIES]] #[[SEQUENCE]])</meta>[[EOL]]`;
    } else if (document.series) {
      metadata += `    <dc:title>[[TITLE]] ([[SERIES]])</dc:title>[[EOL]]`;
      metadata += `    <meta property="dcterms:title" id="meta-title">[[TITLE]] ([[SERIES]])</meta>[[EOL]]`;
    } else if (document.sequence) {
      metadata += `    <dc:title>[[TITLE]] (#[[SEQUENCE]])</dc:title>[[EOL]]`;
      metadata += `    <meta property="dcterms:title" id="meta-title">[[TITLE]] (#[[SEQUENCE]])</meta>[[EOL]]`;
    } else {
      metadata += "    <dc:title>[[TITLE]]</dc:title>[[EOL]]";
      metadata += `    <meta property="dcterms:title" id="meta-title">[[TITLE]]</meta>[[EOL]]`;
    }
    metadata += `    <meta property="dcterms:language" id="meta-language">[[LANGUAGE]]</meta>[[EOL]]`;
    metadata += `    <meta property="dcterms:modified">[[MODIFIED]]</meta>[[EOL]]`;
    metadata += `    <meta refines="#creator" property="file-as">[[AUTHOR]]</meta>[[EOL]]`;
    metadata += `    <meta property="dcterms:publisher">[[PUBLISHER]]</meta>[[EOL]]`;
    metadata += `    <meta property="dcterms:date">[[MODIFIED]]</meta>[[EOL]]`;
    metadata += `    <meta property="dcterms:rights">All rights reserved</meta>[[EOL]]`;
    metadata += `    <meta name="cover" content="image_cover" />[[EOL]]`;
    metadata += `    <meta name="generator" content="ebook-generator" />[[EOL]]`;
    metadata += `    <meta property="ibooks:specified-fonts">true</meta>[[EOL]]`;
    metadata += `    <dc:creator id="creator">[[AUTHOR]]</dc:creator>[[EOL]]`;
    metadata += `    <dc:language>[[LANGUAGE]]</dc:language>[[EOL]]`;
    metadata += `    <dc:publisher>[[PUBLISHER]]</dc:publisher>[[EOL]]`;
    metadata += `    <dc:description>[[DESCRIPTION]]</dc:description>[[EOL]]`;
    metadata += `    <dc:date>[[MODIFIED]]</dc:date>[[EOL]]`;
    metadata += `    <dc:rights>Copyright &#x00A9; [[PUBLISHED]] by [[PUBLISHER]]</dc:rights>[[EOL]]`;
    if (document.genre) {
      metadata += `    <dc:subject>[[GENRE]]</dc:subject>[[EOL]]`;
    }
    if (document.tags) {
      const tags = document.tags.split(",");
      for (i = 0; i < tags.length; i += 1) {
        metadata += `    <dc:subject>${tags[i]}</dc:subject>[[EOL]]`;
      }
    }
    if (document.series && document.sequence) {
      metadata += `    <meta name='calibre:series' content='[[SERIES]]'/>[[EOL]]`;
      metadata += `    <meta name='calibre:series_index' content='[[SEQUENCE]]'/>[[EOL]]`;
    }
    metadata += `</metadata>[[EOL]]`;

    let manifest = ``;
    manifest += `<manifest>[[EOL]]`;
    manifest += `    <item id="image_cover" href="images/cover${getExtension(
      getMimeType(document.cover.data)
    )}"  media-type="${getMimeType(document.cover.data)}" />[[EOL]]`;
    manifest += `    <item id='cover' media-type='application/xhtml+xml' href='cover.xhtml'/>[[EOL]]`;
    manifest += `    <item id="ncx" href="navigation.ncx" media-type="application/x-dtbncx+xml" />[[EOL]]`;
    if (document.showContents) {
      manifest += `    <item id="toc" href="content/toc.xhtml" media-type="application/xhtml+xml" properties="nav" />[[EOL]]`;
    }
    manifest += `    <item id="css" href="css/ebook.css" media-type="text/css" />[[EOL]]`;
    // Sections
    for (i = 1; i <= document.sections.length; i += 1) {
      const { filename } = document.sections[i - 1];
      manifest += `    <item id='s${i}' media-type='application/xhtml+xml' href='content/${filename}'/>[[EOL]]`;
    }

    if (document.images && document.images.length) {
      for (i = 0; i < document.images.length; i += 1) {
        const image = document.images[i];
        const imageFile = image.name;
        const imageType = getMimeType(image.data) || "";
        if (imageType.length > 0) {
          manifest += `    <item id='img${i}' media-type='${imageType}' href='images/${imageFile}'/>[[EOL]]`;
        }
      }
    }

    manifest += `</manifest>[[EOL]]`;

    let spine = ``;
    spine += `<spine toc="ncx" page-progression-direction='${progressionDirection}'>[[EOL]]`;
    spine += "    <itemref idref='cover' linear='yes' />[[EOL]]";
    // Sections
    for (i = 1; i <= document.sections.length; i += 1) {
      if (document.sections[i - 1].isFrontMatter) {
        spine += `    <itemref idref='s${i}' />[[EOL]]`;
      }
    }

    if (document.showContents) {
      spine += "    <itemref idref='toc'/>[[EOL]]";
    }

    for (i = 1; i <= document.sections.length; i += 1) {
      if (!document.sections[i - 1].isFrontMatter) {
        spine += `    <itemref idref='s${i}' />[[EOL]]`;
      }
    }
    spine += `</spine>[[EOL]]`;

    let result = ``;
    result += `<?xml version="1.0" encoding="UTF-8"?>[[EOL]]`;
    result += `<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId"[[EOL]]`;
    result += `    xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xml:lang="en"[[EOL]]`;
    result += `    xmlns:media="http://www.idpf.org/epub/vocab/overlays/#"[[EOL]]`;
    result += `    prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0/">[[EOL]]`;
    result += `    ${metadata}[[EOL]]`;
    result += `    ${manifest}[[EOL]]`;
    result += `    ${spine}[[EOL]]`;
    result += `    <guide>[[EOL]]`;
    result += `        <reference type="text" title="Table of Content" href="content/toc.xhtml" />[[EOL]]`;
    result += `    </guide>[[EOL]]`;
    result += `</package>[[EOL]]`;

    return replacements(document, result);
  },

  getSection: (document, sectionNumber) => {
    const dir =
      document.isRTL || isRTLLanguage(document.language) ? "rtl" : "auto";
    const section = document.sections[sectionNumber - 1];
    const { title, content } = section;

    let result = ``;
    result += `<?xml version="1.0" encoding="utf-8"?>[[EOL]]`;
    result += `<!DOCTYPE html>[[EOL]]`;
    result += `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="[[LANGUAGE]]">[[EOL]]`;
    result += `    <head>[[EOL]]`;
    result += `        <meta charset="utf-8" />[[EOL]]`;
    result += `        <title>${title}</title>[[EOL]]`;
    result += `        <link rel="stylesheet" type="text/css" href="../css/ebook.css" />[[EOL]]`;
    result += `    </head>[[EOL]]`;
    result += `    <body dir="${dir}">[[EOL]]`;
    result += `        <h1>${title}</h1>[[EOL]]`;
    result += `        <div class="content">[[EOL]]`;
    result += `            ${content}[[EOL]]`;
    result += `        </div>[[EOL]]`;
    result += `    </body>[[EOL]]`;
    result += `</html>[[EOL]]`;

    return replacements(document, result);
  },

  getTOC: (document) => {
    let content = ``;
    if (document.generateContentsCallback) {
      const callbackContent = document.generateContentsCallback(
        document.filesForTOC
      );
      content = constituents.getContents(document, callbackContent);
    } else {
      content = constituents.getContents(document);
    }
    return replacements(document, content);
  },
};

module.exports = constituents;
