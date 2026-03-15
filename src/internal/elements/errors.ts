export class ErrElementNotFound extends Error {
  tagName: string;
  constructor(tagName: string) {
    super(`element '${tagName}' not found`);
    this.tagName = tagName;
  }
}

export class ErrModuleNotFound extends Error {
  path: string;
  constructor(path: string) {
    super(`module '${path}' not found`);
    this.path = path;
  }
}
