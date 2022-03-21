// Replace a single tag.
const tagReplace = (original, tag, value) => {
  const fullTag = `[[${tag}]]`;
  return original.split(fullTag).join(value || "");
};

// Do all in-line replacements needed.
const replacements = (document, original) => {
  const ISODate = new Date().toISOString().slice(0, 10);
  const modifiedISODate = new Date().toISOString().split(".")[0] + "Z";
  let result = original;
  result = tagReplace(result, "EOL", "\n");
  result = tagReplace(result, "ID", document.id);
  result = tagReplace(result, "TITLE", document.title);
  result = tagReplace(result, "SERIES", document.series);
  result = tagReplace(result, "SEQUENCE", document.sequence);
  result = tagReplace(result, "COPYRIGHT", document.copyright);
  result = tagReplace(result, "LANGUAGE", document.language);
  result = tagReplace(result, "FILEAS", document.fileAs);
  result = tagReplace(result, "AUTHOR", document.author);
  result = tagReplace(result, "PUBLISHER", document.publisher || "Anonymous");
  result = tagReplace(result, "PUBLISHED", document.published || ISODate);
  result = tagReplace(result, "MODIFIED", modifiedISODate);
  result = tagReplace(result, "DESCRIPTION", document.description);
  result = tagReplace(result, "GENRE", document.genre);
  result = tagReplace(result, "TAGS", document.tags);
  result = tagReplace(result, "CONTENTS", document.contents);
  result = tagReplace(result, "SOURCE", document.source);
  return result;
};

module.exports = replacements;
