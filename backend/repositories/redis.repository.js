import {RecordStore} from "./file.repository.js";
import { redis } from "../config/redis.js";

class RedisStore extends RecordStore {
  constructor() {
    super();
  }

  async save(record) {
    await redis.hset(`file:${record.id}`, record);
    return record;
  }

  async findById(id) {
    const result = await redis.hgetall(`file:${id}`);
    return Object.keys(result).length ? result : null;
  }

  async findAll() {
    const keys = await this.#scanKeys(`file:*`);
    const results = await Promise.all(
      keys.map((k) => redis.hgetall(k))
    );
    return results.filter(Boolean);
  }

  async findFilenameById(id) {
    return await redis.hget(`file:${id}`, 'filename');
  }

  async remove(id) {
    const n = await redis.del(`file:${id}`);
    return n > 0;
  }

  async #scanKeys(pattern) {
    const keys = [];
    let cursor = '0';
    do {
      const [next, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      keys.push(...batch);
    } while (cursor !== '0');
    return keys;
  }
}   

export default new RedisStore();