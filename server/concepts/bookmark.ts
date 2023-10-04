import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface BookmarkDoc extends BaseDoc {
  owner: ObjectId;
  name: string;
  destination: URL;
}

export default class BookmarkConcept {
  public readonly bookmarks = new DocCollection<BookmarkDoc>("users");

  async getBookmarkById(_id: ObjectId) {
    const bookmark = await this.bookmarks.readOne({ _id });
    if (bookmark === null) {
      throw new NotFoundError(`Bookmark not found!`);
    }
    return bookmark;
  }

  async getBookmarksByOwner(_id: ObjectId) {
    const maybeBookmarks = await this.bookmarks.readOne({ owner: _id });
    if (maybeBookmarks === null) {
      throw new NotFoundError(`Bookmarks not found for user!`);
    }
    return maybeBookmarks;
  }

  async create(owner: ObjectId, name: string, destination: URL) {
    await this.isNameUniqueInOwner(owner, name);
    const _id = await this.bookmarks.createOne({ owner, name, destination });
    return { msg: "Bookmark created successfully!", bookmark: await this.bookmarks.readOne({ _id }) };
  }

  async delete(_id: ObjectId) {
    await this.bookmarks.deleteOne({ _id });
    return { msg: "Bookmark deleted!" };
  }

  async update(_id: ObjectId, update: Partial<BookmarkDoc>) {
    if (update.name !== undefined) {
      await this.canRename(_id, update.name);
    }
    await this.bookmarks.updateOne({ _id }, update);
    return { msg: "Bookmark updated successfully!" };
  }

  private async canRename(_id: ObjectId, name: string) {
    const bookmark = await this.getBookmarkById(_id);
    await this.isNameUniqueInOwner(bookmark.owner, name);
  }

  private async isNameUniqueInOwner(owner: ObjectId, name: string) {
    if (await this.bookmarks.readOne({ owner, name })) {
      throw new NotAllowedError(`Bookmark with name ${name} already exists!`);
    }
  }
}
