import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { deleteAgent, getAgent } from "$lib/server/agents";

export const GET: RequestHandler = ({ params }) => {
  const agent = getAgent(params.id as string);
  if (!agent) throw error(404, "agent not found");
  return json({ agent });
};

export const DELETE: RequestHandler = ({ params }) => {
  const ok = deleteAgent(params.id as string);
  if (!ok) throw error(404, "agent not found");
  return json({ ok: true });
};
