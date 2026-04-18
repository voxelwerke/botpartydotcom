<script lang="ts">
  import * as brain from "brain.js";
  import { onMount } from "svelte";

  // --- 1. Svelte State ---
  let mouseX = $state(0);
  let mouseY = $state(0);
  let isInside = $state(false);
  let isTraining = $state(false);
  let svgElement = $state<SVGSVGElement>();

  let face = $state({
    pX: 0,
    pY: 0,
    lidL: 1,
    lidR: 1,
    neckRoll: 0,
  });

  // --- 2. Brain Configuration ---
  // NeuralNetworkGPU breaks under production minification (gpu.js AST parser
  // can't handle mangled variables). CPU NeuralNetwork is tiny-dataset fast.
  const net = new brain.NeuralNetwork({
    hiddenLayers: [5],
    activation: "tanh",
  });

  async function trainBot() {
    isTraining = true;

    // Training data format: { input: [x, y, inside], output: [pX, pY, lidL, lidR, neck] }
    const trainingData = [];

    // 1. Teach Follow behavior (Mapping mouse pos to eye pos)
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 2 - 1;
      const y = Math.random() * 2 - 1;
      trainingData.push({
        input: [x, y, 1],
        output: [x, y, 1, 1, x * 0.2], // Slight neck roll with mouse x
      });
    }

    // 2. Teach Idle behavior (When mouse is gone, look center/blink)
    trainingData.push({ input: [0, 0, -1], output: [0, 0.2, 0, 0, 0] });
    trainingData.push({ input: [0.5, -0.5, -1], output: [0, 0, 1, 1, 0] });

    await net.trainAsync(trainingData, {
      iterations: 200,
      errorThresh: 0.05,
    });

    isTraining = false;
  }

  function handleMouseMove(e: MouseEvent) {
    if (!svgElement) return;
    const rect = svgElement.getBoundingClientRect();
    // Normalize to -1 to 1 based on SVG center
    mouseX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    mouseY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    isInside = true;
  }

  onMount(() => {
    trainBot();

    const loop = () => {
      if (!isTraining) {
        const input = [
          Math.max(-1, Math.min(1, mouseX)),
          Math.max(-1, Math.min(1, mouseY)),
          isInside ? 1 : -1,
        ];

        const out = net.run(input) as number[];

        if (out) {
          const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
          const s = 0.33; // Smoothness

          face = {
            pX: lerp(face.pX, out[0], s),
            pY: lerp(face.pY, out[1], s),
            lidL: lerp(face.lidL, out[2], s),
            lidR: lerp(face.lidR, out[3], s),
            neckRoll: lerp(face.neckRoll, out[4], s),
          };
        }
      }
      requestAnimationFrame(loop);
    };

    const raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });

  const eyeSpacing = 35;
  const eyeY = 45;
</script>

<svelte:window
  onmousemove={handleMouseMove}
  onmouseleave={() => (isInside = false)}
  onblur={() => (isInside = false)}
/>

<center>
  <div class="container">
    <svg
      bind:this={svgElement}
      viewBox="0 0 200 200"
      style="transform: rotate({face.neckRoll * 20}deg)"
    >
      <defs>
        <linearGradient id="faceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#333" />
          <stop offset="100%" stop-color="#000" />
        </linearGradient>
        <clipPath id="headClip">
          <rect x="25" y="25" width="150" height="150" rx="30" />
        </clipPath>
        <mask id="faceCutoutMask">
          <rect x="25" y="25" width="150" height="150" rx="30" fill="white" />
          <ellipse
            cx={100 - eyeSpacing}
            cy={eyeY + 50}
            rx="25"
            ry={25 * face.lidL}
            fill="black"
          />
          <ellipse
            cx={100 + eyeSpacing}
            cy={eyeY + 50}
            rx="25"
            ry={25 * face.lidR}
            fill="black"
          />
        </mask>
      </defs>

      {#if !isTraining}
        <g clip-path="url(#headClip)">
          <circle
            cx={100 - eyeSpacing + face.pX * 12}
            cy={eyeY + 50 + face.pY * 12}
            r="8"
            fill="black"
          />
          <circle
            cx={100 + eyeSpacing + face.pX * 12}
            cy={eyeY + 50 + face.pY * 12}
            r="8"
            fill="black"
          />
        </g>
      {/if}

      <rect
        x="25"
        y="25"
        width="150"
        height="150"
        rx="30"
        fill="url(#faceGradient)"
        mask="url(#faceCutoutMask)"
      />
    </svg>
  </div>
</center>

<style>
  .container {
    margin-top: 50px;
  }
  svg {
    width: 250px;
    height: 250px;
    transition: transform 0.1s linear;
  }
</style>
