export interface FileEntry {
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

export interface ImageObject {
  name?: string;
  data: string | Blob;
}

export interface MetaData {
  id: string;
  title: string;
  author: string;
  cover: ImageObject;
  language?: "en" | string;
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
  images?: Array<ImageObject & {name: string}>;
}

export interface ContentItem {
  title: string;
  link: string;
  itemType: "front" | "contents" | "main";
}

export type ContentPageGenerator = (items: ContentItem[]) => string;

declare class NodepubLite {
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

export as namespace NodepubLite;
export default NodepubLite;
