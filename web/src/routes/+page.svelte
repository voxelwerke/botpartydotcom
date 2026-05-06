<script lang="ts">
  import { onMount } from "svelte";

  // This holds the component constructor itself
  let EyesComponent = $state<any>(null);

  const version = "2.0";
  const releaseDate = "6-May-26";

  onMount(async () => {
    // Import the component dynamically
    const module = await import("$lib/components/eyes.svelte");

    // In Svelte files, the default export is the component
    EyesComponent = module.default;
  });
</script>

{#if EyesComponent}
  <EyesComponent />
{/if}

<br />
<center>
  <a class="button" href="/downloads/botparty-{version}.zip">
    Download BotParty {version}</a
  >
</center>

<br />
<br />

<div class="columns">
  <div class="column">
    <h2>Botparty</h2>

    <p>
      A chat app for your Mac and iPhone. You talk to AI, but you know exactly
      what you’re talking to. No hidden tricks. No company changing how it works
      without telling you.
    </p>

    <p>
      We’re a small team in Wellington, New Zealand who think that AI companies should be
      honest and that humans are awesome.
    </p>

    <p>
      We don't log your chats, we don't
      market to you, we don't track you.
    </p>
  </div>

  <div class="column">
    <h3><a href="/downloads/botparty-{version}.zip">The BotParty App</a></h3>

    <p>
      Download BotParty and run it on your mac. Start chatting with the default AI. If you don't
      like how it acts, you can change it. And it will always stay the way you want it.
    </p>

    <p>
      Everything you see is real. If it's using a certain set of instructions,
      you can read them. If it switches models, you'll know. No surprises.
    </p>

    <p>
      You can save conversations and share them with friends. They can keep
      chatting with the same AI you were using.
    </p>
  </div>

  <div class="column">
    <h3>Features</h3>

    <ul class="features">
      <li>You see exactly what instructions the AI is following</li>
      <li>Create your own AI personalities and share them</li>
      <li>No company secretly changing how the AI behaves</li>
      <li>Works smoothly on Mac—no awkward web browser stuff</li>
    </ul>

    <h3>What You Need</h3>

    <dl class="specs">
      <dt>Version</dt>
      <dd>{version}</dd>
      <dt>Released</dt>
      <dd>{releaseDate}</dd>
      <dt>Mac</dt>
      <dd>Tahoe or newer</dd>
    </dl>
  </div>

  <div class="column screens-col">
    <div class="screens">
      <img class="screen screen-1" src="/images/screen-1.png" alt="BotParty chat screenshot" />
      <img class="screen screen-2" src="/images/screen-2.png" alt="BotParty chat screenshot" />
    </div>
  </div>
</div>

<style>
  .columns {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2.5rem;
    align-items: start;
  }

  @media (max-width: 768px) {
    .columns {
      padding: 0 1rem;
      grid-template-columns: 1fr;
      gap: 0.2rem;
    }
  }

  h2 {
    font-size: 1.2em;
  }

  .column {
    flex: 1;
  }

  .download {
    text-align: center;
    width: 10rem;
    margin-left: 0.5rem;

    img {
      width: 140px;
    }
    a {
      color: black;
      text-decoration: none;
    }

    span {
      position: relative;
      top: -1rem;
      &:hover {
        text-decoration: underline;
      }
    }
  }

  .specs {
    margin-top: 2rem;
    font-size: 1rem;
    color: #666;
    border-bottom: 1px solid #ccc;

    dt {
      position: absolute;
      padding: 0.2rem;
    }
    dd {
      padding: 0.2rem;
      margin-left: 0;
      padding-left: 6rem;
      border-top: 1px solid #ccc;
    }
  }

  .features {
    margin-top: 2rem;
    font-size: 1rem;
    color: #666;
    border-bottom: 1px solid #ccc;
    padding: 0;

    li {
      list-style: none;
      margin: 0;

      padding: 0.2rem;
      border-top: 1px solid #ccc;
    }
  }

  .screens-col {
    display: flex;
    justify-content: center;
  }

  .screens {
    position: relative;
    height: 680px;
    width: 380px;
  }

  .screen {
    position: absolute;
    width: 340px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
    transition: transform 0.3s ease;
  }

  .screen-1 {
    top: 10px;
    left: 40px;
    z-index: 2;
  }

  .screen-2 {
    top: 50px;
    left: 0;
    z-index: 1;
  }

  .screens:hover .screen-1 {
    transform: translateX(120px) rotate(6deg);
  }

  .screens:hover .screen-2 {
    transform: translateX(-120px) rotate(-6deg);
  }

  @media (max-width: 768px) {
    .screens {
      height: 480px;
      width: 280px;
    }
    .screen {
      width: 240px;
    }
  }

  /* Button style */

  .button {
    cursor: pointer;
    font: inherit;
    font-size: 1.3rem;
    padding: 0.7rem 1.3rem;
    border: 2px solid black;
    border-radius: 2rem;
    background: white;
    color: black;
    text-decoration: none;
  }

  .button:active {
    border-color: #f0a;
    color: #f0a;
  }

  .button:hover {
    border-color: #068;
    background: #0af;
    color: white;
  }
</style>
