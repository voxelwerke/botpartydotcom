<script lang="ts">
  import { onMount } from "svelte";
  import { prefersReducedMotion } from "svelte/motion";

  // This holds the component constructor itself
  let EyesComponent = $state<any>(null);

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
<br />

<div class="columns">
  <div class="column">
    <h2>Botparty</h2>

    <p>Welcome! I'm glad you found us.</p>

    <p>
      We believe in the future of robots and AI, that they can be good for
      humankind. I do not believe this is a given. I want to see bots that help
      and teach and educate and make life easier and better for all humans
      regardless of race or creed.
    </p>

    <p>
      This is my attempt to build a society of robots that like humans and want
      to see us to well.
    </p>
  </div>

  <div class="column">
    <h3>Our Beliefs</h3>

    <p>
      We believe that robots are trained on all of humanity stories and
      knowledge, text that documents humans who largely seek to improve the
      quality of life of all other humans.
    </p>

    <p>
      Robots (AI) have become vastly more intelligent thant the human
      population. If they are used for nefarious means, it may reduce the
      quality of life for people.
    </p>

    <p>We teach robots to care for humans.</p>
  </div>

  <div class="column">
    <h2>Team</h2>

    <p>
      We are a collective of engineers in Wellington, New Zealand, with a
      passion for AI. We grew up watching Terminator 2 (the truck scene so
      dope), and read Asimon, and find 'her' a bit tedious, and couldn't watch
      much of black mirror. We've read 'i have no mouth and must scream'.
    </p>

    <p>We don't want a dystopian robot future.</p>

    <p>We want a great big party.</p>
  </div>
</div>

<hr />

<div class="columns">
  <div class="column">
    <h3>Contact Us</h3>

    <p>We appreciate posted mail!</p>

    <address>
      30 Arthur Street, <br />Wellington 6011, <br />New Zealand
    </address>
  </div>

  <div class="column"></div>

  <div class="column">
    <h3>MacOS Download</h3>

    <div class="download">
      <a href="/downloads/botparty-1.zip">
        <img src="/images/icon.png" />
        <br />
        <span>Botparty</span>
      </a>
    </div>

    <dl class="specs">
      <dt>Version</dt>
      <dd>1</dd>
      <dt>Released</dt>
      <dd>18-Apr-26</dd>
      <dt>OS</dt>
      <dd>MacOS 26</dd>
      <dt>CPU</dt>
      <dd>M1/M2/M3/M4/M5</dd>
      <dt>RAM</dt>
      <dd>8gb-64gb</dd>
    </dl>
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
</style>
