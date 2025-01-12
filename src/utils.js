const helpers = {};

helpers.isDataURI = (s) => {
  const regex =
    /^\s*data:([a-z]+\/[a-z]+(;[a-z\-]+\=[a-z\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/i;
  return typeof s === "string" && !!s.match(regex);
};

helpers.getMimeType = (imageData) => {
  if (typeof imageData === "string") {
    let mimeType = imageData.split(",")[0].split(":")[1].split(";")[0];
    return mimeType;
  }
  return imageData.type;
};

helpers.getExtension = (mimetype) => {
  const extensions = {
    "image/svg+xml": ".svg",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/tiff": ".tiff",
  };
  return extensions[mimetype] || "";
};

helpers.dataURItoBlob = (dataURI) => {
  // convert base64 to raw binary data held in a string
  var byteString = atob(dataURI.split(",")[1]);

  // separate out the mime component
  var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

  // write the bytes of the string to an ArrayBuffer
  var arrayBuffer = new ArrayBuffer(byteString.length);
  var _ia = new Uint8Array(arrayBuffer);
  for (var i = 0; i < byteString.length; i++) {
    _ia[i] = byteString.charCodeAt(i);
  }

  var dataView = new DataView(arrayBuffer);
  var blob = new Blob([dataView], { type: mimeString });
  return blob;
};

helpers.isRTLLanguage = (ISOCode) => {
  const rtlLanguageList = {
    ar: "Arabic",
    arc: "Aramaic",
    dv: "Divehi",
    fa: "Persian",
    ha: "Hausa",
    he: "Hebrew",
    khw: "Khowar",
    ks: "Kashmiri",
    ku: "Kurdish",
    ps: "Pashto",
    ur: "Urdu",
    yi: "Yiddish",
  };
  return rtlLanguageList.hasOwnProperty(ISOCode.toLowerCase());
};

module.exports = helpers;
