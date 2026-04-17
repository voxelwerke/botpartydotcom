<script lang="ts">
  import * as brain from "brain.js";
  import { onMount } from "svelte";

  // --- 1. Svelte State ---
  let mouseX = $state(0);
  let mouseY = $state(0);
  let isInside = $state(false);
  let svgElement = $state<SVGSVGElement>();
  let trainingStatus = $state("Sleeping...");

  // The "Face" state controlled by the brain
  let face = $state({
    pLX: 0,
    pLY: 0,
    pRX: 0,
    pRY: 0,
    lidL: 1,
    lidR: 1,
    neckRoll: 0,
  });

  // --- 2. Brain Configuration ---
  const historyWindow = 256;
  let history = $state<number[][]>([]);
  let modelVector = $state<number[]>([0, 0, 0, 0, 0, 0, 0, 1, 1, 0]);
  const vectorSize = 10;

  const net = new brain.recurrent.LSTMTimeStep({
    inputSize: vectorSize,
    outputSize: vectorSize,
    hiddenLayers: [18, 18],
  });

  // --- 3. Training Logic ---
  // Vector shape per timestep:
  // [mouseX, mouseY, present, pLX, pLY, pRX, pRY, lidL, lidR, neckRoll]
  function makeStep(
    mouseXValue: number,
    mouseYValue: number,
    present: number,
    pLX: number,
    pLY: number,
    pRX: number,
    pRY: number,
    lidL: number,
    lidR: number,
    neckRoll: number,
  ) {
    return [
      mouseXValue,
      mouseYValue,
      present,
      pLX,
      pLY,
      pRX,
      pRY,
      lidL,
      lidR,
      neckRoll,
    ];
  }

  function trainBot() {
    const trainingData: number[][][] = [
      [
        // Idle / autonomous wandering + blink while mouse absent
        makeStep(0, 0, 0, 0.05, -0.03, 0.05, -0.03, 1, 1, 0.08),
        makeStep(0, 0, 0, -0.08, 0.05, -0.08, 0.05, 1, 1, -0.05),
        makeStep(0, 0, 0, 0.02, 0.08, 0.02, 0.08, 1, 1, 0.03),
        makeStep(0, 0, 0, 0, 0, 0, 0, 0.2, 0.2, 0),
        makeStep(0, 0, 0, -0.04, -0.06, -0.04, -0.06, 1, 1, -0.06),
        makeStep(0, 0, 0, 0.07, 0.02, 0.07, 0.02, 1, 1, 0.05),
      ],
      [
        // Mouse moves right/up and face follows
        makeStep(-0.8, -0.4, 1, -0.75, -0.45, -0.75, -0.45, 1, 1, -0.22),
        makeStep(-0.4, -0.2, 1, -0.4, -0.2, -0.4, -0.2, 1, 1, -0.12),
        makeStep(0, 0, 1, 0, 0, 0, 0, 1, 1, 0),
        makeStep(0.4, 0.2, 1, 0.4, 0.2, 0.4, 0.2, 1, 1, 0.12),
        makeStep(0.8, 0.4, 1, 0.75, 0.45, 0.75, 0.45, 1, 1, 0.22),
      ],
      [
        // Quick vertical scan while present
        makeStep(0, -0.8, 1, 0, -0.75, 0, -0.75, 1, 1, -0.1),
        makeStep(0, -0.4, 1, 0, -0.4, 0, -0.4, 1, 1, -0.05),
        makeStep(0, 0, 1, 0, 0, 0, 0, 1, 1, 0),
        makeStep(0, 0.4, 1, 0, 0.4, 0, 0.4, 1, 1, 0.05),
        makeStep(0, 0.8, 1, 0, 0.75, 0, 0.75, 1, 1, 0.1),
      ],
    ];

    trainingStatus = "Training...";
    net.train(trainingData, {
      iterations: 1200,
      log: false,
      errorThresh: 0.006,
    });
    history = [];
    modelVector = [0, 0, 0, 0.02, -0.02, 0.02, -0.02, 1, 1, 0];
    trainingStatus = "Online";
  }

  // --- 4. The Loop ---
  function handleMouseMove(e: MouseEvent) {
    if (!svgElement) return;
    const rect = svgElement.getBoundingClientRect();
    mouseX = (e.clientX - (rect.left + rect.width / 2)) / 100; // Normalized
    mouseY = (e.clientY - (rect.top + rect.height / 2)) / 100;
    isInside = true;
  }

  onMount(() => {
    trainBot();

    const interval = setInterval(() => {
      const normalizedMouseX = Math.max(-1, Math.min(1, mouseX));
      const normalizedMouseY = Math.max(-1, Math.min(1, mouseY));

      if (isInside) {
        modelVector[0] = normalizedMouseX;
        modelVector[1] = normalizedMouseY;
        modelVector[2] = 1;
      } else {
        modelVector[2] = 0;
      }

      history = [...history, [...modelVector]].slice(-historyWindow);

      const prediction = net.run(history) as number[];
      if (prediction && prediction.length === vectorSize) {
        modelVector = [...prediction];
        if (isInside) {
          modelVector[0] = normalizedMouseX;
          modelVector[1] = normalizedMouseY;
          modelVector[2] = 1;
        } else {
          modelVector[2] = 0;
        }

        face = {
          pLX: (prediction[3] ?? 0) * 12,
          pLY: (prediction[4] ?? 0) * 12,
          pRX: (prediction[5] ?? 0) * 12,
          pRY: (prediction[6] ?? 0) * 12,
          lidL: Math.max(0.1, Math.min(1, prediction[7] ?? 1)),
          lidR: Math.max(0.1, Math.min(1, prediction[8] ?? 1)),
          neckRoll: (prediction[9] ?? 0) * 20,
        };
      }
    }, 16);

    return () => clearInterval(interval);
  });

  const eyeSpacing = 35;
  const eyeY = 45;
</script>

<svelte:window
  onmousemove={handleMouseMove}
  onmouseleave={() => (isInside = false)}
  onblur={() => (isInside = false)}
/>

<div class="status">{trainingStatus}</div>

<svg
  bind:this={svgElement}
  viewBox="0 0 200 200"
  style="transform: rotate({face.neckRoll}deg); transition: transform 0.1s linear;"
>
  <rect x="25" y="25" width="150" height="150" rx="30" fill="#333" />

  <g transform="translate({100 - eyeSpacing}, {eyeY + 50})">
    <ellipse rx="25" ry={25 * face.lidL} fill="white" />
    <circle cx={face.pLX} cy={face.pLY} r="8" fill="black" />
  </g>

  <g transform="translate({100 + eyeSpacing}, {eyeY + 50})">
    <ellipse rx="25" ry={25 * face.lidR} fill="white" />
    <circle cx={face.pRX} cy={face.pRY} r="8" fill="black" />
  </g>
</svg>

<button onclick={trainBot}>Retrain</button>

<style>
  svg {
    width: 250px;
    height: 250px;
    overflow: visible;
  }
</style>
