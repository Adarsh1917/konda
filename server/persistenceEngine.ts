import fs from "fs/promises";
import path from "path";

interface SyncedData {
  chats: any[];
  memory: Record<string, any>;
  settings: Record<string, any>;
  auth: {
    userEmail: string;
    authMethod: string;
    sessionToken: string | null;
  };
  lastSyncedAt: string;
}

const DB_FILE = path.join(process.cwd(), "data", "db.json");

class BackendPersistenceEngine {
  private inMemoryDb: SyncedData = {
    chats: [],
    memory: {},
    settings: {},
    auth: {
      userEmail: "kondaadarsh163@gmail.com",
      authMethod: "Biometric Passkey",
      sessionToken: null
    },
    lastSyncedAt: new Date().toISOString()
  };

  constructor() {
    this.bootDatabase();
  }

  private async bootDatabase() {
    try {
      const dir = path.dirname(DB_FILE);
      await fs.mkdir(dir, { recursive: true });
      
      try {
        await fs.access(DB_FILE);
        const raw = await fs.readFile(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          this.inMemoryDb = { ...this.inMemoryDb, ...parsed };
          console.log("[SRE_DB] Pre-existing Cloud Persistence database mounted successfully from disk.");
        }
      } catch {
        // File missing or un-formatted - Write initial default structure
        await this.syncToDisk();
      }
    } catch (e) {
      console.error("[SRE_DB] Failed to bind persistence files on system startup:", e);
    }
  }

  private async syncToDisk() {
    try {
      this.inMemoryDb.lastSyncedAt = new Date().toISOString();
      await fs.writeFile(DB_FILE, JSON.stringify(this.inMemoryDb, null, 2));
    } catch (e) {
      console.error("[SRE_DB] FS Write failure on persistence loop:", e);
    }
  }

  // Retrieve current sync payload
  public getStore(): SyncedData {
    return this.inMemoryDb;
  }

  // Complete data override (Cloud Synchronization endpoint handler)
  public async setStore(data: Partial<SyncedData>): Promise<SyncedData> {
    if (data.chats) this.inMemoryDb.chats = data.chats;
    if (data.memory) this.inMemoryDb.memory = data.memory;
    if (data.settings) this.inMemoryDb.settings = data.settings;
    if (data.auth) {
      this.inMemoryDb.auth = {
        ...this.inMemoryDb.auth,
        ...data.auth
      };
    }

    await this.syncToDisk();
    return this.inMemoryDb;
  }

  // Save unique memory tokens
  public async saveMemoryToken(key: string, value: any): Promise<void> {
    this.inMemoryDb.memory[key] = value;
    await this.syncToDisk();
  }

  // Clear session databases safely
  public async purgeStore(): Promise<void> {
    this.inMemoryDb = {
      chats: [],
      memory: {},
      settings: {},
      auth: {
        userEmail: "kondaadarsh163@gmail.com",
        authMethod: "Biometric Passkey",
        sessionToken: null
      },
      lastSyncedAt: new Date().toISOString()
    };
    await this.syncToDisk();
  }
}

export const persistenceEngine = new BackendPersistenceEngine();
