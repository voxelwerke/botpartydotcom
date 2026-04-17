<script lang="ts">
  import { onMount } from "svelte";

  // This holds the component constructor itself
  let EyesComponent = $state<any>(null);

  onMount(async () => {
    // Import the component dynamically
    const module = await import("$lib/components/eyes.svelte");

    // In Svelte files, the default export is the component
    EyesComponent = module.default;
  });
</script>

<h1>Botparty</h1>

{#if EyesComponent}
  <EyesComponent />
{/if}
