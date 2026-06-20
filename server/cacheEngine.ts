import fs from "fs/promises";
import path from "path";

// Cache Entry schema
interface CacheEntry {
  value: string;
  source: "L1" | "L3";
  expiresAt: number; // timestamp
}

// Durable Cache Stats
interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  l1Hits: number;
  l3Hits: number;
}

const CACHE_FILE = path.join(process.cwd(), "data", "cache-db.json");
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour text cache duration

class BackendCacheEngine {
  // L1 In-Memory Cache
  private l1Cache = new Map<string, Omit<CacheEntry, "source">>();
  
  // Cache Tracking Telemetry
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    l1Hits: 0,
    l3Hits: 0
  };

  constructor() {
    this.bootPersistentCache();
  }

  // Self-Healing initialization of cache structures on disk
  private async bootPersistentCache() {
    try {
      const dir = path.dirname(CACHE_FILE);
      await fs.mkdir(dir, { recursive: true });
      
      // Verify if file exists, if not initialize it elegantly
      try {
        await fs.access(CACHE_FILE);
      } catch {
        await fs.writeFile(CACHE_FILE, JSON.stringify({}, null, 2));
      }
    } catch (e) {
      console.error("[SRE_CACHE] Failed to provision L3 persistent Cache directory structures:", e);
    }
  }

  private recalculateHitRate() {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? Math.round((this.stats.hits / total) * 100) : 0;
  }

  // Query Cash Pipeline
  public async get(key: string): Promise<CacheEntry | null> {
    const now = Date.now();

    // Try L1 First
    if (this.l1Cache.has(key)) {
      const entry = this.l1Cache.get(key)!;
      if (entry.expiresAt > now) {
        this.stats.hits++;
        this.stats.l1Hits++;
        this.recalculateHitRate();
        console.log(`[SRE_CACHE_HIT] [L1] Key: "${key.substring(0, 40)}..."`);
        return {
          value: entry.value,
          expiresAt: entry.expiresAt,
          source: "L1"
        };
      } else {
        // Expired, invalidate L1
        this.l1Cache.delete(key);
      }
    }

    // Try L3 File Cache
    try {
      const raw = await fs.readFile(CACHE_FILE, "utf-8");
      const db = JSON.parse(raw);
      if (db[key]) {
        const item = db[key];
        if (item.expiresAt > now) {
          // Put back in L1 for faster hot reference next time
          this.l1Cache.set(key, { value: item.value, expiresAt: item.expiresAt });
          
          this.stats.hits++;
          this.stats.l3Hits++;
          this.recalculateHitRate();
          console.log(`[SRE_CACHE_HIT] [L3] Key: "${key.substring(0, 40)}..."`);
          return {
            value: item.value,
            expiresAt: item.expiresAt,
            source: "L3"
          };
        } else {
          // Expired, delete from file
          delete db[key];
          await fs.writeFile(CACHE_FILE, JSON.stringify(db, null, 2));
        }
      }
    } catch (e) {
      console.warn("[SRE_CACHE_L3] Failed to read or parse Cloud/L3 filesystem cache:", e);
    }

    this.stats.misses++;
    this.recalculateHitRate();
    console.log(`[SRE_CACHE_MISS] Key: "${key.substring(0, 40)}..."`);
    return null;
  }

  // Set Cash Registry
  public async set(key: string, value: string, ttlMs: number = DEFAULT_TTL_MS): Promise<void> {
    const expiresAt = Date.now() + ttlMs;

    // Save to L1 Memory
    this.l1Cache.set(key, { value, expiresAt });

    // Save to L3 Persistent File Storage
    try {
      let db: Record<string, any> = {};
      try {
        const raw = await fs.readFile(CACHE_FILE, "utf-8");
        db = JSON.parse(raw);
      } catch {
        // file might be missing/corrupted, self-heal automatically
      }
      
      db[key] = { value, expiresAt };

      // Prune expired tokens during writes to prevent ballooning
      const now = Date.now();
      for (const k in db) {
        if (db[k].expiresAt < now) {
          delete db[k];
        }
      }

      await fs.writeFile(CACHE_FILE, JSON.stringify(db, null, 2));
    } catch (e) {
      console.error("[SRE_CACHE_L3] Persistent Cache Write Failure:", e);
    }
  }

  // Invalidate or Flush Cache keys
  public async flush(): Promise<void> {
    this.l1Cache.clear();
    try {
      await fs.writeFile(CACHE_FILE, JSON.stringify({}, null, 2));
      console.log("[SRE_CACHE] Successfully flushed and rebuilt L1 and L3 Cache boundaries.");
    } catch (e) {
      console.error("[SRE_CACHE_FLUSH] Clear disk failure:", e);
    }
  }

  // Fetch telemetry status metrics for Health Dashboard
  public getTelemetry() {
    return {
      ...this.stats,
      l1Size: this.l1Cache.size
    };
  }
}

export const cacheEngine = new BackendCacheEngine();
