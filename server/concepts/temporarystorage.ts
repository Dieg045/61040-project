import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface StorageDoc extends BaseDoc {
  items: Set<ObjectId>;
  owner: ObjectId;
}

export default class TemporaryStorageConcept {
  public readonly storages = new DocCollection<StorageDoc>("temporarystorages");

  async getStorageById(_id: ObjectId) {
    const storage = await this.storages.readOne({ _id });
    if (storage === null) {
      throw new NotFoundError(`Temporary storage not found!`);
    }
    return storage;
  }

  async getStorageByOwner(owner: ObjectId) {
    const maybeStorage = await this.storages.readOne({ owner });
    if (maybeStorage === null) {
      throw new NotFoundError(`Temporary Storage not found for user!`);
    }
    return maybeStorage;
  }

  async getOwner(storage: ObjectId) {
    const storageDoc = await this.getStorageById(storage);
    return storageDoc.owner;
  }

  async create(owner: ObjectId) {
    await this.canCreate(owner);
    const _id = await this.storages.createOne({ items: new Set(), owner });
    return { msg: "Temporary storage created successfully!", user: await this.storages.readOne({ _id }) };
  }

  async addItem(storage: ObjectId, item: ObjectId) {
    const storageDoc = await this.getStorageById(storage);
    const newItems = storageDoc.items || new Set([item]);
    await this.storages.updateOne({ _id: storage }, { items: newItems });
    return { msg: "Temporary storage updated successfully!" };
  }

  async removeItem(storage: ObjectId, item: ObjectId) {
    const storageDoc = await this.getStorageById(storage);
    const newItems = storageDoc.items || new Set();
    newItems.delete(item);
    await this.storages.updateOne({ _id: storage }, { items: newItems });
    return { msg: "Temporary storage updated successfully!" };
  }

  async getAllItems(storage: ObjectId) {
    const storageDoc = await this.getStorageById(storage);
    return storageDoc.items;
  }

  async clearAllItems(storage: ObjectId) {
    await this.storageExists(storage);
    await this.storages.updateOne({ _id: storage }, { items: new Set() });
    return { msg: "Temporary storage items cleared successfully!" };
  }

  private async canCreate(owner: ObjectId) {
    if (await this.storages.readOne({ owner })) {
      throw new NotAllowedError(`User already owns a temporary storage!`);
    }
  }

  async storageExists(_id: ObjectId) {
    const maybeStorage = await this.storages.readOne({ _id });
    if (maybeStorage === null) {
      throw new NotFoundError(`Temporary storage not found!`);
    }
  }
}
