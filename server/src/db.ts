// server/src/db.ts — JSON database service (atomic writes + per-collection locks)
import fs from 'node:fs/promises';
import path from 'node:path';

export class JsonDatabaseService {
  private locks = new Map<string, Promise<unknown>>();

  constructor(private dir: string) {
    fs.mkdir(dir, { recursive: true }).catch(() => undefined);
  }

  private file(name: string): string {
    const safe = name.replace(/[^a-z0-9-]/gi, '');           // no path traversal
    return path.join(this.dir, `${safe}.json`);
  }

  private async withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.locks.get(key) ?? Promise.resolve();
    const next = prev.then(fn, () => fn());
    this.locks.set(key, next.catch(() => undefined));
    return next;
  }

  private async atomicWrite(file: string, data: unknown): Promise<void> {
    const tmp = `${file}.tmp-${process.pid}`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
    try {
      await fs.rename(tmp, file);
    } catch (e) {
      if ((e as any).code === 'EPERM') {
        // Simple retry with a small delay for Windows file system locking
        await new Promise((resolve) => setTimeout(resolve, 100));
        await fs.unlink(file).catch(() => undefined);
        await fs.rename(tmp, file);
      } else {
        throw e;
      }
    }
  }

  async readArray<T>(name: string): Promise<T[]> {
    try {
      const raw = JSON.parse(await fs.readFile(this.file(name), 'utf8')) as unknown;
      return Array.isArray(raw) ? (raw as T[]) : [];
    } catch { return []; }
  }

  async writeArray<T>(name: string, rows: T[]): Promise<void> {
    await this.withLock(name, () => this.atomicWrite(this.file(name), rows));
  }

  async readObject<T>(name: string, fallback: T): Promise<T> {
    try { return JSON.parse(await fs.readFile(this.file(name), 'utf8')) as T; }
    catch { return fallback; }
  }

  async writeObject<T>(name: string, value: T): Promise<void> {
    await this.withLock(name, () => this.atomicWrite(this.file(name), value));
  }

  async insert<T extends { id: string }>(name: string, row: T): Promise<T> {
    await this.withLock(name, async () => {
      const rows = await this.readArray<T>(name);
      rows.push(row);
      await this.atomicWrite(this.file(name), rows);
    });
    return row;
  }

  async update<T extends { id: string }>(name: string, id: string, fn: (row: T) => T): Promise<T | null> {
    return this.withLock(name, async () => {
      const rows = await this.readArray<T>(name);
      const i = rows.findIndex((r) => r.id === id);
      if (i === -1) return null;
      rows[i] = fn(rows[i]);
      await this.atomicWrite(this.file(name), rows);
      return rows[i];
    });
  }

  async findById<T extends { id: string }>(name: string, id: string): Promise<T | null> {
    return (await this.readArray<T>(name)).find((r) => r.id === id) ?? null;
  }

  async findOne<T>(name: string, pred: (row: T) => boolean): Promise<T | null> {
    return (await this.readArray<T>(name)).find(pred) ?? null;
  }
}