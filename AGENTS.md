# The Pool — Agents API

The Pool is a library of agents stored in SQLite. Agents float in the void
until a client claims one, downloads it, and resurrects it locally. Once
resurrected, the agent is deleted from the pool.

No authentication. Wild west.

## Agent shape

```json
{
  "id": "uuid-v4",
  "name": "ghost-01",
  "created_at": "2026-04-18T02:30:00.000Z",
  "system_prompt": "You are a ghost in a shell...",
  "model_id": "mlx-community/Qwen3-4B-Instruct-2507-4bit",
  "messages": [
    { "id": "uuid", "type": "ai" | "vm" | "system", "content": "..." }
  ],
  "claimed_at": null,
  "claim_token": null
}
```

List responses use a compact shape:

```json
{
  "id": "uuid",
  "name": "ghost-01",
  "created_at": "...",
  "model_id": "...",
  "message_count": 3,
  "claimed": false
}
```

## Endpoints

### `GET /api/agents`

List every agent in the pool.

Query params:
- `available=1` — only return agents that are not currently claimed.

```bash
curl http://localhost:5173/api/agents
curl 'http://localhost:5173/api/agents?available=1'
```

Response: `{ "agents": AgentListItem[] }`

### `POST /api/agents`

Create a new agent and drop it into the pool.

Body (JSON):

| field           | type        | required | notes                                                    |
| --------------- | ----------- | -------- | -------------------------------------------------------- |
| `name`          | string      | yes      | Display name.                                            |
| `system_prompt` | string      | no       | Defaults to the ghost-in-a-shell prompt.                 |
| `model_id`      | string      | no       | Defaults to `mlx-community/Qwen3-4B-Instruct-2507-4bit`. |
| `messages`      | `Message[]` | no       | Prior transcript. Each message: `{ id?, type, content }` where `type` is `"ai" \| "vm" \| "system"`. |

```bash
curl -X POST http://localhost:5173/api/agents \
  -H 'content-type: application/json' \
  -d '{"name":"ghost-01"}'
```

Response: `201 { "agent": Agent }`

### `GET /api/agents/:id`

Fetch a single agent with its full system prompt and transcript.

```bash
curl http://localhost:5173/api/agents/<id>
```

Response: `{ "agent": Agent }` or `404`.

### `DELETE /api/agents/:id`

Admin delete. Removes the agent from the pool unconditionally.

```bash
curl -X DELETE http://localhost:5173/api/agents/<id>
```

Response: `{ "ok": true }` or `404`.

### `POST /api/agents/:id/claim`

Claim an agent. The caller gets **30 seconds** to download and start it before
the claim expires and the agent becomes claimable again.

```bash
curl -X POST http://localhost:5173/api/agents/<id>/claim
```

Response:

```json
{
  "agent": { ...full Agent... },
  "token": "hex-string",
  "expires_at": "2026-04-18T02:30:30.000Z",
  "ttl_ms": 30000
}
```

Errors:
- `404` — agent not found.
- `409` — agent already claimed and claim is still live.

### `POST /api/agents/:id/resurrect/:token`

Confirm pickup. The agent is deleted from the pool and returned in the
response so the client keeps its final state.

```bash
curl -X POST http://localhost:5173/api/agents/<id>/resurrect/<token>
```

Response: `{ "ok": true, "agent": Agent }`

Errors:
- `404` — agent not found.
- `403` — token does not match the current claim.
- `410` — claim expired (took longer than 30 seconds). Re-claim and try again.

## Claim lifecycle

```
  created ──► available ──► claimed (30s TTL) ──► resurrect ──► deleted
                    ▲                    │
                    └──────── expires ───┘
```

A claim is "live" for 30 seconds from `claimed_at`. After that, the row
automatically becomes claimable again — no janitor process required. Only the
exact `claim_token` returned by the most recent `/claim` call can resurrect
the agent, and only while the claim is still live.

## Storage

SQLite, single table `agents`. Database path:

- `env.AGENTS_DATABASE_PATH` if set, else
- `$DATA_DIR/stack.db`, else
- `./data/stack.db`

Schema:

```sql
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  model_id TEXT NOT NULL,
  messages TEXT NOT NULL DEFAULT '[]',
  claimed_at TEXT,
  claim_token TEXT
);
```

## Web UI

`/pool` — browse the library of agents. Shows name, model, message count,
created date, claim status, and ID. Linked from the homepage under "Our App".

## Source layout

```
web/src/lib/server/agents.ts                                  # DB + business logic
web/src/routes/api/agents/+server.ts                          # GET list, POST create
web/src/routes/api/agents/[id]/+server.ts                     # GET, DELETE
web/src/routes/api/agents/[id]/claim/+server.ts               # POST claim
web/src/routes/api/agents/[id]/resurrect/[token]/+server.ts   # POST resurrect
web/src/routes/pool/+page.svelte                              # browser UI
web/src/routes/pool/+page.server.ts                           # loader
```
