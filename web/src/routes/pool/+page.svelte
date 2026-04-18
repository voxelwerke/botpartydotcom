<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let agents = $state(data.agents);
  let total = $state(data.total);

  async function refresh() {
    const res = await fetch("/api/agents");
    if (!res.ok) return;
    const body = await res.json();
    agents = body.agents;
    total = body.agents.length;
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }
</script>

<svelte:head>
  <title>Pool</title>
</svelte:head>

<div class="wrap">
  <header>
    <h1>Pool</h1>
    <p>Agents without a host.</p>
  </header>

  {#if agents.length === 0}
    <p class="empty">0 agents.</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Model</th>
          <th>Messages</th>
          <th>Created</th>
          <th>Status</th>
          <th>ID</th>
        </tr>
      </thead>
      <tbody>
        {#each agents as agent (agent.id)}
          <tr class:claimed={agent.claimed}>
            <td>{agent.name}</td>
            <td><code>{agent.model_id}</code></td>
            <td class="num">{agent.message_count}</td>
            <td>{formatDate(agent.created_at)}</td>
            <td>
              {#if agent.claimed}
                <span class="tag tag-claimed">claimed</span>
              {:else}
                <span class="tag tag-available">available</span>
              {/if}
            </td>
            <td class="id"><code>{agent.id}</code></td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

  <p>
    <a href="/">Home</a>
  </p>
</div>

<style>
  .wrap {
    max-width: 1100px;
    margin: 2rem auto;
    padding: 0 1rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas,
      "Liberation Mono", monospace;
  }

  h1 {
    margin: 0;
    font-size: 2rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  th,
  td {
    text-align: left;
    padding: 0.5rem 0.6rem;
    border-bottom: 1px solid #eee;
    vertical-align: top;
  }

  th {
    background: #f7f7f7;
    font-weight: 600;
  }

  code {
    background: #f3f3f3;
    padding: 0.05rem 0.3rem;
    border-radius: 3px;
    font-size: 0.85em;
  }
</style>
