const path = require("path");

const clientConfig = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "nodepub-lite.js",
    library: {
      name: "NodepubLite",
      type: "umd",
    },
  },
};

module.exports = [clientConfig];
