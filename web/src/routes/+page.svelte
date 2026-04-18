<script lang="ts">
  import { onMount } from "svelte";
  import { prefersReducedMotion } from "svelte/motion";

  // This holds the component constructor itself
  let EyesComponent = $state<any>(null);

  const version = "1.2";
  const releaseDate = "18-Apr-26";

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

    <p>Hi! Welcome. I'm glad you found us.</p>

    <p>
      We are a group of engineers who believe in the future of robots and AI,
      that they can be good for humankind. We want to see bots that help and
      teach and educate and make life easier and better for humans of every race
      and creed.
    </p>

    <p>
      This is our attempt to build a society of robots that love humans and want
      to see us thrive and live well.
    </p>
  </div>

  <div class="column">
    <h3>Our App</h3>

    <p>
      Our first app is a bot hosting environment for Apple Macs. You can use it
      to build and experiment with bots in a safe environment.
    </p>

    <p>
      This is a very early version of the system. We want to share it with you
      so you can share your thoughts and feelings.
    </p>

    <p>
      <a href="/pool">Pool</a> of agents without a host.
    </p>
  </div>

  <div class="column">
    <h3>Features</h3>

    <ul class="features">
      <li>MicroVM with Aarch Linux</li>
      <li>Local inference with Qwen 3</li>
      <li>Multi agent support</li>
      <li>Secure file system</li>
      <li>Zero network access</li>
    </ul>

    <h3>Requirements</h3>

    <dl class="specs">
      <dt>Version</dt>
      <dd>{version}</dd>
      <dt>Released</dt>
      <dd>{releaseDate}</dd>
      <dt>OS</dt>
      <dd>MacOS 26 Tahoe</dd>
      <dt>CPU</dt>
      <dd>M1/M2/M3/M4/M5</dd>
      <dt>RAM</dt>
      <dd>8gb-64gb</dd>
    </dl>
  </div>
</div>

<hr />

<div class="columns">
  <div class="column">
    <h3>Our Beliefs</h3>

    <p>
      We believe that robots are trained on all of humanity stories and
      knowledge, text that documents humans who largely seek to improve the
      quality of life of all other humans.
    </p>

    <p>
      <a href="https://github.com/voxelwerke/botparty/blob/main/LICENSE.txt"
        >Source code</a
      >
    </p>
  </div>

  <div class="column">
    <h2>Team</h2>

    <p>
      We are a collective of engineers in Wellington, New Zealand, with a
      passion for AI. We grew up watching <a
        href="https://www.youtube.com/watch?v=ev3dFu8Pzdk">Terminator</a
      >
      and reading
      <a href="https://hex.ooo/library/last_question.html">Asimov</a>.
    </p>
  </div>

  <div class="column">
    <h3>Contact Us</h3>

    <p>We love posted letters and art to decorate our walls!</p>

    <address>
      30 Arthur Street, <br />Wellington 6011, <br />New Zealand
    </address>
  </div>
</div>

<style>
  .columns {
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    flex-direction: row;
    gap: 4rem;
  }

  @media (max-width: 768px) {
    hr {
      display: none;
    }

    .columns {
      padding: 0 1rem;
      flex-direction: column;
      gap: 0.2rem;
    }
  }

  h2 {
    font-size: 1.2em;
  }

  .column {
    flex: 1;
    text-align: justify;
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

  hr {
    margin: 4rem 0;
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
