import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { claimAgent, CLAIM_TTL_MS } from "$lib/server/agents";

export const POST: RequestHandler = ({ params }) => {
  const result = claimAgent(params.id as string);
  if (!result.ok) {
    if (result.reason === "not_found") throw error(404, "agent not found");
    throw error(409, "agent already claimed");
  }
  return json({
    agent: result.agent,
    token: result.token,
    expires_at: result.expires_at,
    ttl_ms: CLAIM_TTL_MS,
  });
};
