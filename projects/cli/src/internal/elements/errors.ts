export class ErrElementNotFound extends Error {
  tagName: string;
  constructor(tagName: string) {
    super(`element '${tagName}' not found`);
    this.tagName = tagName;
  }
}
