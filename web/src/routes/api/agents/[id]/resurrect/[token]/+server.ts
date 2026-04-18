import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { resurrectAgent } from "$lib/server/agents";

export const POST: RequestHandler = ({ params }) => {
  const result = resurrectAgent(
    params.id as string,
    params.token as string,
  );
  if (!result.ok) {
    if (result.reason === "not_found") throw error(404, "agent not found");
    if (result.reason === "bad_token") throw error(403, "invalid token");
    throw error(410, "claim expired");
  }
  return json({ ok: true, agent: result.agent });
};
