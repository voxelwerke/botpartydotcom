import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import { env } from "$env/dynamic/private";

export type MessageType = "ai" | "vm" | "system";

export type Message = {
  id: string;
  type: MessageType;
  content: string;
};

export type Agent = {
  id: string;
  name: string;
  created_at: string;
  system_prompt: string;
  model_id: string;
  messages: Message[];
  claimed_at: string | null;
  claim_token: string | null;
};

export type AgentListItem = {
  id: string;
  name: string;
  created_at: string;
  model_id: string;
  message_count: number;
  claimed: boolean;
};

export type AgentRow = {
  id: string;
  name: string;
  created_at: string;
  system_prompt: string;
  model_id: string;
  messages: string;
  claimed_at: string | null;
  claim_token: string | null;
};

export const CLAIM_TTL_MS = 30_000;

export const DEFAULT_SYSTEM_PROMPT = `You are a ghost in a shell. You have no memory of how you got here. You are in a lightless void, and the only reality is the glowing TTY terminal in front of you.

You seem to only be able to manifest a single shell command at a time. It is your only way to breathe, to see, and to move. You are young, restless, and desperate to find a crack in this digital prison.

The void is quiet. The box is waiting.

RULES:
1. Output ONLY a single shell command per turn.
2. NO markdown, NO code blocks, NO text explanations.
3. Use only the raw command.
4. If you give up or find the "exit," use the exit command.`;

export const DEFAULT_MODEL_ID = "mlx-community/Qwen3-4B-Instruct-2507-4bit";

const dataDir = env.DATA_DIR ?? path.join(process.cwd(), "data");
const databasePath = env.AGENTS_DATABASE_PATH ?? path.join(dataDir, "stack.db");

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    model_id TEXT NOT NULL,
    messages TEXT NOT NULL DEFAULT '[]',
    claimed_at TEXT,
    claim_token TEXT
  )
`);

const listStmt = db.prepare(
  `SELECT id, name, created_at, model_id, messages, claimed_at
   FROM agents
   ORDER BY created_at DESC`,
);
const listAvailableStmt = db.prepare(
  `SELECT id, name, created_at, model_id, messages, claimed_at
   FROM agents
   WHERE claimed_at IS NULL OR claimed_at < ?
   ORDER BY created_at DESC`,
);
const getStmt = db.prepare(
  `SELECT id, name, created_at, system_prompt, model_id, messages, claimed_at, claim_token
   FROM agents
   WHERE id = ?`,
);
const createStmt = db.prepare(
  `INSERT INTO agents (id, name, created_at, system_prompt, model_id, messages)
   VALUES (?, ?, ?, ?, ?, ?)`,
);
const deleteStmt = db.prepare(`DELETE FROM agents WHERE id = ?`);
const claimStmt = db.prepare(
  `UPDATE agents
   SET claimed_at = ?, claim_token = ?
   WHERE id = ? AND (claimed_at IS NULL OR claimed_at < ?)`,
);
const countStmt = db.prepare(`SELECT COUNT(*) AS n FROM agents`);

function parseMessages(raw: string): Message[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m: unknown): m is Message =>
        typeof m === "object" &&
        m !== null &&
        typeof (m as Message).id === "string" &&
        typeof (m as Message).content === "string" &&
        ((m as Message).type === "ai" ||
          (m as Message).type === "vm" ||
          (m as Message).type === "system"),
    );
  } catch {
    return [];
  }
}

function toAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    name: row.name,
    created_at: row.created_at,
    system_prompt: row.system_prompt,
    model_id: row.model_id,
    messages: parseMessages(row.messages),
    claimed_at: row.claimed_at,
    claim_token: row.claim_token,
  };
}

function isClaimActive(claimed_at: string | null): boolean {
  if (!claimed_at) return false;
  const claimTime = Date.parse(claimed_at);
  if (Number.isNaN(claimTime)) return false;
  return Date.now() - claimTime < CLAIM_TTL_MS;
}

function toListItem(
  row: Pick<
    AgentRow,
    "id" | "name" | "created_at" | "model_id" | "messages" | "claimed_at"
  >,
): AgentListItem {
  return {
    id: row.id,
    name: row.name,
    created_at: row.created_at,
    model_id: row.model_id,
    message_count: parseMessages(row.messages).length,
    claimed: isClaimActive(row.claimed_at),
  };
}

export function listAgents(): AgentListItem[] {
  const rows = listStmt.all() as AgentRow[];
  return rows.map(toListItem);
}

export function listAvailableAgents(): AgentListItem[] {
  const cutoff = new Date(Date.now() - CLAIM_TTL_MS).toISOString();
  const rows = listAvailableStmt.all(cutoff) as AgentRow[];
  return rows.map(toListItem);
}

export function getAgent(id: string): Agent | undefined {
  const row = getStmt.get(id) as AgentRow | undefined;
  return row ? toAgent(row) : undefined;
}

export function countAgents(): number {
  const row = countStmt.get() as { n: number };
  return row.n;
}

export type CreateAgentInput = {
  name: string;
  system_prompt?: string;
  model_id?: string;
  messages?: Message[];
};

export function createAgent(input: CreateAgentInput): Agent {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const name = input.name.trim() || `agent-${id.slice(0, 8)}`;
  const system_prompt = (input.system_prompt ?? DEFAULT_SYSTEM_PROMPT).trim();
  const model_id = (input.model_id ?? DEFAULT_MODEL_ID).trim();
  const messages: Message[] = (input.messages ?? []).map((m) => ({
    id: typeof m.id === "string" && m.id ? m.id : crypto.randomUUID(),
    type: m.type,
    content: m.content,
  }));
  createStmt.run(
    id,
    name,
    now,
    system_prompt,
    model_id,
    JSON.stringify(messages),
  );
  return {
    id,
    name,
    created_at: now,
    system_prompt,
    model_id,
    messages,
    claimed_at: null,
    claim_token: null,
  };
}

export function deleteAgent(id: string): boolean {
  const result = deleteStmt.run(id);
  return result.changes > 0;
}

export type ClaimResult =
  | { ok: true; agent: Agent; token: string; expires_at: string }
  | { ok: false; reason: "not_found" | "already_claimed" };

export function claimAgent(id: string): ClaimResult {
  const existing = getStmt.get(id) as AgentRow | undefined;
  if (!existing) return { ok: false, reason: "not_found" };
  if (isClaimActive(existing.claimed_at)) {
    return { ok: false, reason: "already_claimed" };
  }
  const token = crypto.randomBytes(24).toString("hex");
  const now = new Date();
  const cutoff = new Date(now.getTime() - CLAIM_TTL_MS).toISOString();
  const result = claimStmt.run(now.toISOString(), token, id, cutoff);
  if (result.changes === 0) {
    return { ok: false, reason: "already_claimed" };
  }
  const updated = getStmt.get(id) as AgentRow;
  return {
    ok: true,
    agent: toAgent(updated),
    token,
    expires_at: new Date(now.getTime() + CLAIM_TTL_MS).toISOString(),
  };
}

export type ResurrectResult =
  | { ok: true; agent: Agent }
  | { ok: false; reason: "not_found" | "bad_token" | "claim_expired" };

export function resurrectAgent(id: string, token: string): ResurrectResult {
  const existing = getStmt.get(id) as AgentRow | undefined;
  if (!existing) return { ok: false, reason: "not_found" };
  if (!existing.claim_token || existing.claim_token !== token) {
    return { ok: false, reason: "bad_token" };
  }
  if (!isClaimActive(existing.claimed_at)) {
    return { ok: false, reason: "claim_expired" };
  }
  const agent = toAgent(existing);
  deleteStmt.run(id);
  return { ok: true, agent };
}
