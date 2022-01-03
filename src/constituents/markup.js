const replacements = require('./replacements');
const {isRTLLanguage} = require("../utils")

const markup = {

  // Provide the contents page.
  getContents: (document, overrideContents) => {
    let result = '';
    result += "<?xml version='1.0' encoding='utf-8'?>[[EOL]]";
    result += "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd' >[[EOL]]";
    result += "<html xmlns='http://www.w3.org/1999/xhtml'>[[EOL]]";
    result += '  <head>[[EOL]]';
    result += '    <title>[[CONTENTS]]</title>[[EOL]]';
    result += "    <link rel='stylesheet' type='text/css' href='../css/ebook.css' />[[EOL]]";
    result += '  </head>[[EOL]]';
    result += '  <body>[[EOL]]';

    if (overrideContents) {
      result += overrideContents;
    } else {
      result += "    <div class='contents'>[[EOL]]";
      result += '      <h1>[[CONTENTS]]</h1>[[EOL]]';
      for (let i = 1; i <= document.sections.length; i += 1) {
        const section = document.sections[i - 1];
        if (!section.excludeFromContents) {
          const { title } = section;
          result += `      <a href='s${i}.xhtml'>${title}</a><br/>[[EOL]]`;
        }
      }
      result += '    </div>[[EOL]]';
    }
    result += '  </body>[[EOL]]';
    result += '</html>[[EOL]]';
    return result;
  },

  // Provide the contents of the TOC file.
  getTOC: (document) => {
    let content = '';
    if (document.generateContentsCallback) {
      const callbackContent = document.generateContentsCallback(document.filesForTOC);
      content = markup.getContents(document, callbackContent);
    } else {
      content = markup.getContents(document);
    }
    return replacements(document, replacements(document, content));
  },

  // Provide the contents of the cover HTML enclosure.
  getCover: (document) => {
    let result = '';
    result += "<?xml version='1.0' encoding='UTF-8' ?>[[EOL]]";
    result += "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN'  'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'>[[EOL]]";
    result += "<html xmlns='http://www.w3.org/1999/xhtml' xml:lang='en'>[[EOL]]";
    result += '<head>[[EOL]]';
    result += '  <title>[[TITLE]]</title>[[EOL]]';
    result += "  <style type='text/css'>[[EOL]]";
    result += '    body { margin: 0; padding: 0; text-align: center; }[[EOL]]';
    result += '    .cover { margin: 0; padding: 0; font-size: 1px; }[[EOL]]';
    result += '    img { margin: 0; padding: 0; height: 100%; }[[EOL]]';
    result += '  </style>[[EOL]]';
    result += '</head>[[EOL]]';
    result += '<body>[[EOL]]';
    result += `  <div class='cover'><img style='height: 100%;width: 100%;' src='images/${document.coverImage.name}' alt='Cover' /></div>[[EOL]]`;
    result += '</body>[[EOL]]';
    result += '</html>[[EOL]]';

    return replacements(document, replacements(document, result));
  },

  // Provide the contents of the CSS file.
  getCSS: (document) => {
    let baseCSS = `@page{margin:10px}a,abbr,acronym,address,applet,article,aside,audio,b,big,blockquote,body,canvas,caption,center,cite,code,del,details,dfn,div,em,embed,fieldset,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,header,hgroup,html,i,iframe,img,ins,kbd,label,legend,mark,menu,nav,object,output,p,pre,q,ruby,s,samp,section,small,span,strike,strong,sub,summary,sup,table,tbody,td,tfoot,th,thead,time,tr,tt,u,var,video{margin:0;padding:0;border:0;font-size:100%;vertical-align:baseline}table{border-collapse:collapse;border-spacing:0}dd,dl,dt,li,ol,ul{margin:0;padding:0;border:0;font-size:100%;vertical-align:baseline}body{text-align:justify;line-height:120%}h1{text-indent:0;text-align:center;margin:100px 0 0 0;font-size:2em;font-weight:700;page-break-before:always;line-height:150%}h2{text-indent:0;text-align:center;margin:50px 0 0 0;font-size:1.5em;font-weight:700;page-break-before:always;line-height:135%}h3{text-indent:0;text-align:left;font-size:1.4em;font-weight:700}h4{text-indent:0;text-align:left;font-size:1.2em;font-weight:700}h5{text-indent:0;text-align:left;font-size:1.1em;font-weight:700}h6{text-indent:0;text-align:left;font-size:1em;font-weight:700}h1,h2,h3,h4,h5,h6{-webkit-hyphens:none!important;hyphens:none;page-break-after:avoid;page-break-inside:avoid}p{text-indent:1.25em;margin:0;widows:2;orphans:2}p.centered{text-indent:0;margin:1em 0 0 0;text-align:center}p.centeredbreak{text-indent:0;margin:1em 0 1em 0;text-align:center}p.texttop{margin:1.5em 0 0 0;text-indent:0}p.clearit{clear:both}p.toctext{margin:0 0 0 1.5em;text-indent:0}p.toctext2{margin:0 0 0 2.5em;text-indent:0}ul{margin:1em 0 0 2em;text-align:left}ol{margin:1em 0 0 2em;text-align:left}span.i{font-style:italic}span.b{font-weight:700}span.u{text-decoration:underline}span.st{text-decoration:line-through}span.ib{font-style:italic;font-weight:700}span.iu{font-style:italic;text-decoration:underline}span.bu{font-weight:700;text-decoration:underline}span.ibu{font-style:italic;font-weight:700;text-decoration:underline}span.ipadcenterfix{text-align:center}img{max-width:100%}table{margin:1em auto}td,th,tr{margin:0;padding:2px;border:1px solid #000;font-size:100%;vertical-align:baseline}.footnote{vertical-align:super;font-size:.75em;text-decoration:none}span.dropcap{font-size:300%;font-weight:700;height:1em;float:left;margin:.3em .125em -.4em .1em}div.pullquote{margin:2em 2em 0 2em;text-align:left}div.pullquote p{font-weight:700;font-style:italic}div.pullquote hr{width:100%;margin:0;height:3px;color:#2e8de0;background-color:#2e8de0;border:0}div.blockquote{margin:1em 1.5em 0 1.5em;text-align:left;font-size:.9em}`
    if (isRTLLanguage(document.metadata.language)) baseCSS += `
    body, html {
      text-align: right;
      direction: rtl;
    }
    `;
    baseCSS += replacements(document, replacements(document, document.CSS));
    return baseCSS;
  },

  // Provide the contents of a single section's HTML.
  getSection: (document, sectionNumber) => {
    const section = document.sections[sectionNumber - 1];
    const { title } = section;
    const { content } = section;

    let result = '';
    result += "<?xml version='1.0' encoding='utf-8'?>[[EOL]]";
    result += "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'>[[EOL]]";
    result += "<html xmlns='http://www.w3.org/1999/xhtml'>[[EOL]]";
    result += "  <head profile='http://dublincore.org/documents/dcmi-terms/'>[[EOL]]";
    result += "    <meta http-equiv='Content-Type' content='text/html;' />[[EOL]]";
    result += `    <title>[[TITLE]] - ${title}</title>[[EOL]]`;
    result += "    <meta name='DCTERMS.title' content='[[TITLE]]' />[[EOL]]";
    result += "    <meta name='DCTERMS.language' content='[[LANGUAGE]]' scheme='DCTERMS.RFC4646' />[[EOL]]";
    result += "    <meta name='DCTERMS.source' content='MFW' />[[EOL]]";
    result += "    <meta name='DCTERMS.issued' content='{$issued}' scheme='DCTERMS.W3CDTF'/>[[EOL]]";
    result += "    <meta name='DCTERMS.creator' content='[[AUTHOR]]'/>[[EOL]]";
    result += "    <meta name='DCTERMS.contributor' content='' />[[EOL]]";
    result += "    <meta name='DCTERMS.modified' content='{$issued}' scheme='DCTERMS.W3CDTF'/>[[EOL]]";
    result += "    <meta name='DCTERMS.provenance' content='' />[[EOL]]";
    result += "    <meta name='DCTERMS.subject' content='[[GENRE]]' />[[EOL]]";
    result += "    <link rel='schema.DC' href='http://purl.org/dc/elements/1.1/' hreflang='en' />[[EOL]]";
    result += "    <link rel='schema.DCTERMS' href='http://purl.org/dc/terms/' hreflang='en' />[[EOL]]";
    result += "    <link rel='schema.DCTYPE' href='http://purl.org/dc/dcmitype/' hreflang='en' />[[EOL]]";
    result += "    <link rel='schema.DCAM' href='http://purl.org/dc/dcam/' hreflang='en' />[[EOL]]";
    result += "    <link rel='stylesheet' type='text/css' href='../css/ebook.css' />[[EOL]]";
    result += '  </head>[[EOL]]';
    result += '  <body>[[EOL]]';
    result += `    <div id='s${sectionNumber}'></div>[[EOL]]`;
    result += '    <div>[[EOL]]';

    const lines = content.split('\n');
    lines.forEach((line) => {
      if (line.length > 0) {
        result += `      ${line}[[EOL]]`;
      }
    });

    result += '    </div>[[EOL]]';
    result += '  </body>[[EOL]]';
    result += '</html>[[EOL]]';

    return replacements(document, replacements(document, result));
  },

};

module.exports = markup;
