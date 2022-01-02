const path = require("path");

const clientConfig = {
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "nodepub-lite.js",
    library: {
      name: "NodepubLite",
      type: "umd",
      export: "default",
    },
  },
};

module.exports = [clientConfig];
