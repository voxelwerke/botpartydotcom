import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  createAgent,
  listAgents,
  listAvailableAgents,
  type CreateAgentInput,
  type Message,
} from "$lib/server/agents";

export const GET: RequestHandler = ({ url }) => {
  const available = url.searchParams.get("available");
  const agents =
    available === "1" || available === "true"
      ? listAvailableAgents()
      : listAgents();
  return json({ agents });
};

export const POST: RequestHandler = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw error(400, "invalid json body");
  }
  if (!body || typeof body !== "object") {
    throw error(400, "body must be an object");
  }
  const b = body as Record<string, unknown>;
  if (typeof b.name !== "string" || !b.name.trim()) {
    throw error(400, "name is required");
  }
  const input: CreateAgentInput = { name: b.name };
  if (typeof b.system_prompt === "string") input.system_prompt = b.system_prompt;
  if (typeof b.model_id === "string") input.model_id = b.model_id;
  if (Array.isArray(b.messages)) {
    const msgs: Message[] = [];
    for (const m of b.messages) {
      if (
        m &&
        typeof m === "object" &&
        typeof (m as Message).content === "string" &&
        ((m as Message).type === "ai" ||
          (m as Message).type === "vm" ||
          (m as Message).type === "system")
      ) {
        msgs.push({
          id: typeof (m as Message).id === "string" ? (m as Message).id : "",
          type: (m as Message).type,
          content: (m as Message).content,
        });
      }
    }
    input.messages = msgs;
  }
  const agent = createAgent(input);
  return json({ agent }, { status: 201 });
};
