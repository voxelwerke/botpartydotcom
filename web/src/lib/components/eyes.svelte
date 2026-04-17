<script lang="ts">
  import * as brain from "brain.js";
  import { onMount } from "svelte";

  // --- 1. Svelte State ---
  let mouseX = $state(0);
  let mouseY = $state(0);
  let isInside = $state(false);
  let isTraining = $state(false);
  let svgElement = $state<SVGSVGElement>();

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
  const historyWindow = 16;
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

  const waitForPaint = () =>
    new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 100);
    });

  async function trainBot() {
    if (isTraining) return;
    isTraining = true;
    await waitForPaint();

    const shuffle = (array: any[]) => {
      return array.sort(() => Math.random() - 0.5);
    };

    const makeFollow = () => {
      const steps = [];
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 16) {
        const x = Math.cos(a);
        const y = Math.sin(a);

        const pLX = x;
        const pLY = y;
        const pRX = x;
        const pRY = y;

        steps.push(makeStep(x, y, 1, pLX, pLY, pRX, pRY, 1, 1, 0));
      }
      return shuffle(steps);
    };

    const makeRandom = () => {
      const steps = [];

      for (let i = 0; i < 10; i++) {
        steps.push(
          makeStep(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            1,
            1,
            0,
          ),
        );
      }
      return shuffle(steps);
    };

    const trainingData: number[][][] = [
      [
        // Idle / autonomous wandering + blink while mouse absent
        makeStep(0, 0, -1, -0.08, 0.05, -0.08, 0.05, 1, 0, -0.05),
        makeStep(0, 0, -1, 0.02, 0.08, 0.02, 0.08, 0, 1, 0.03),
        makeStep(0, 0, -1, 0.07, 0.02, 0.07, 0.02, 0, 0, 0.05),
      ],
      makeFollow(),
      makeRandom(),
    ];

    try {
      net.train(trainingData, {
        iterations: 500,
        log: false,
        errorThresh: 0.01,
      });
      history = [];
      modelVector = [0, 0, 0, 0.02, -0.02, 0.02, -0.02, 1, 1, 0];
    } finally {
      isTraining = false;
    }
  }

  // --- 4. The Loop ---
  function handleMouseMove(e: MouseEvent) {
    if (!svgElement) return;
    const rect = svgElement.getBoundingClientRect();
    mouseX =
      ((e.clientX - (rect.left + rect.width / 2)) / window.innerWidth) * 2; // Normalized
    mouseY =
      ((e.clientY - (rect.top + rect.height / 2)) / window.innerHeight) * 2;
    isInside = true;
  }

  onMount(() => {
    void trainBot();

    const interval = setInterval(() => {
      if (isTraining) return;
      const normalizedMouseX = Math.max(-1, Math.min(1, mouseX));
      const normalizedMouseY = Math.max(-1, Math.min(1, mouseY));

      if (isInside) {
        modelVector[0] = normalizedMouseX;
        modelVector[1] = normalizedMouseY;
        modelVector[2] = 1;
      } else {
        modelVector[0] = -1;
        modelVector[1] = -1;
        modelVector[2] = -1;
      }

      history = [...history, [...modelVector]].slice(-historyWindow);

      // Inside your setInterval...
      const prediction = net.run(history) as number[];

      if (prediction && prediction.length === vectorSize) {
        // Use a smoothing factor (0.1 = very smooth/slow, 0.5 = snappy)
        const lerp = (current: number, target: number, speed: number) =>
          current + (target - current) * speed;

        const speed = 0.2;

        // Smoothly transition the face values
        face = {
          pLX: lerp(face.pLX, (prediction[3] ?? 0) * 12, speed),
          pLY: lerp(face.pLY, (prediction[4] ?? 0) * 12, speed),
          pRX: lerp(face.pRX, (prediction[5] ?? 0) * 12, speed),
          pRY: lerp(face.pRY, (prediction[6] ?? 0) * 12, speed),
          lidL: lerp(
            face.lidL,
            Math.max(0.1, Math.min(1, prediction[7] ?? 1)),
            speed,
          ),
          lidR: lerp(
            face.lidR,
            Math.max(0.1, Math.min(1, prediction[8] ?? 1)),
            speed,
          ),
          neckRoll: lerp(face.neckRoll, (prediction[9] ?? 0) * 20, speed),
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

<center>
  <svg
    bind:this={svgElement}
    viewBox="0 0 200 200"
    style="transform: rotate({face.neckRoll}deg); transition: transform 0.1s linear;"
  >
    <rect x="25" y="25" width="150" height="150" rx="30" fill="#333" />

    <g transform="translate({100 - eyeSpacing}, {eyeY + 50})">
      <ellipse rx="25" ry={25 * face.lidL} fill="white" />
      {#if !isTraining}
        <circle cx={face.pLX} cy={face.pLY} r="8" fill="black" />
      {/if}
    </g>

    <g transform="translate({100 + eyeSpacing}, {eyeY + 50})">
      <ellipse rx="25" ry={25 * face.lidR} fill="white" />
      {#if !isTraining}
        <circle cx={face.pRX} cy={face.pRY} r="8" fill="black" />}
      {/if}
    </g>
  </svg>
</center>

<button onclick={() => void trainBot()} disabled={isTraining}>
  {isTraining ? "Training..." : "Retrain"}
</button>

<code>
  {isInside}
  {mouseX}
  {mouseY}
  {modelVector}
  {history}
  {face}
</code>

<style>
  svg {
    width: 250px;
    height: 250px;
    overflow: visible;
  }

  code {
    display: none;
  }
</style>
