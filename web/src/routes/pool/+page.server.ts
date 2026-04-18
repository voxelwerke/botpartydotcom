import type { PageServerLoad } from "./$types";
import { countAgents, listAgents } from "$lib/server/agents";

export const load: PageServerLoad = () => {
  return {
    agents: listAgents(),
    total: countAgents(),
  };
};
