declare module "nodepub-lite" {
  interface FileEntry {
    name: string;
    folder: string;
    options: {
      compression: "DEFLATE" | "STORE";
      compressionOptions?: {
        level: number;
      };
    };
    content: string;
  }

  interface ImageObject {
    name: string;
    type: "image/jpeg" | "image/png";
    data: string | Blob;
  }

  interface MetaData {
    id: string;
    title: string;
    author: string;
    cover: ImageObject;
    language: string;
    series?: string;
    sequence?: number;
    genre?: string;
    tags?: string;
    copyright?: string;
    publisher?: string;
    published?: string;
    description?: string;
    showContents?: boolean | string;
    contents?: string;
    source?: string;
    images?: ImageObject[];
  }

  interface ContentItem {
    title: string;
    link: string;
    itemType: "front" | "contents" | "main";
  }

  type ContentPageGenerator = (items: ContentItem[]) => string;

  class NodepubLite {
    constructor(
      metadata: MetaData,
      generateContentsCallback?: ContentPageGenerator
    );
    addCSS(CSS: string): void;
    addSection(
      title: string,
      content: string,
      excludeFromContents?: boolean,
      isFrontMatter?: boolean,
      overrideFileName?: string
    ): void;
    getSectionCount(): number;
    getFilesForEPUB(): FileEntry[];
    createEPUB(
      fileNameWithoutExtenstion?: string
    ): Promise<PromiseRejectedResult | PromiseFulfilledResult<void>>;
  }

  export default NodepubLite;
}
