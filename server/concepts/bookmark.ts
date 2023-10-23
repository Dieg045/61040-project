import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface BookmarkDoc extends BaseDoc {
  user: ObjectId;
  name: string;
  destination: URL;
}

export default class BookmarkConcept {
  public readonly bookmarks = new DocCollection<BookmarkDoc>("bookmarks");

  async getById(_id: ObjectId) {
    const bookmark = await this.bookmarks.readOne({ _id });
    if (bookmark === null) {
      throw new NotFoundError(`Bookmark not found!`);
    }
    return bookmark;
  }

  async getByOwner(user: ObjectId) {
    const bookmarks = await this.bookmarks.readMany({ owner: user });
    return bookmarks;
  }

  async create(user: ObjectId, name: string, destination: URL) {
    await this.isAvailableName(user, name);
    const _id = await this.bookmarks.createOne({ user, name, destination });
    return { msg: "Bookmark created successfully!", bookmark: await this.bookmarks.readOne({ _id }) };
  }

  async delete(_id: ObjectId) {
    await this.bookmarks.deleteOne({ _id });
    return { msg: "Bookmark deleted!" };
  }

  async rename(name: string, _id: ObjectId) {
    const bookmark = await this.bookmarks.readOne({ _id });
    if (!bookmark) {
      throw new NotFoundError(`Bookmark ${_id} does not exist!`);
    }

    await this.isAvailableName(bookmark.user, name);

    const update = JSON.parse(`{ $set: { "name" : ${name} } }`);

    this.sanitizeUpdate(update);
    await this.bookmarks.updateOne({ _id }, update);
    return { msg: "Bookmark updated successfully!" };
  }

  private async isAvailableName(user: ObjectId, name: string) {
    if (await this.bookmarks.readOne({ user, name })) {
      throw new BookmarkNameAlreadyInUseError(user, name);
    }
  }

  private sanitizeUpdate(update: Partial<BookmarkDoc>) {
    // Make sure the update cannot change the owner.
    const allowedUpdates = ["name", "destination"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}

export class BookmarkNameAlreadyInUseError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly name: string,
  ) {
    super("{0} already has a bookmark named {1}!", user, name);
  }
}
