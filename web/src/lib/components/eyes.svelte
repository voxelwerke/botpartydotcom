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
  const historyWindow = 32;
  let history = $state<number[][]>([]);
  let modelVector = $state<number[]>([0, 0, 0, 0, 0, 0, 0, 1, 1, 0]);
  const vectorSize = 10;

  const net = new brain.recurrent.LSTMTimeStep({
    inputSize: vectorSize,
    outputSize: vectorSize,
    hiddenLayers: [8, 8],
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
      for (let a = 0; a < Math.PI * 2; a += 0.1) {
        const x = Math.sin(a);
        const y = Math.cos(a);

        const pLX = -x;
        const pLY = -y;
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
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2; // Normalized
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    isInside = true;
  }

  onMount(() => {
    void trainBot();

    const interval = setInterval(() => {
      if (isTraining) return;
      const nx = Math.max(-1, Math.min(1, mouseX));
      const ny = Math.max(-1, Math.min(1, mouseY));

      if (isInside) {
        modelVector[0] = nx;
        modelVector[1] = ny;
        modelVector[2] = 1;
      } else {
        modelVector[2] = -1;
      }

      history = [...history, [...modelVector]].slice(-historyWindow);

      // Inside your setInterval...
      const prediction = net.run(history) as number[];

      if (prediction && prediction.length === vectorSize) {
        // Use a smoothing factor (0.1 = very smooth/slow, 0.5 = snappy)
        const lerp = (current: number, target: number, speed: number) =>
          current + (target - current) * speed;
        const clampPupil = (value: number) =>
          Math.max(-25, Math.min(25, value));

        const speed = 0.5;

        // Smoothly transition the face values
        face = {
          pLX: clampPupil(lerp(face.pLX, (prediction[3] ?? 0) * 12, speed)),
          pLY: clampPupil(lerp(face.pLY, (prediction[4] ?? 0) * 12, speed)),
          pRX: clampPupil(lerp(face.pRX, (prediction[5] ?? 0) * 12, speed)),
          pRY: clampPupil(lerp(face.pRY, (prediction[6] ?? 0) * 12, speed)),
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
    }, 15);

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
    <defs>
      <mask id="headCutoutMask">
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
      <g>
        <circle
          cx={100 - eyeSpacing + face.pLX}
          cy={eyeY + 50 + face.pLY}
          r="8"
          fill="black"
        />
        <circle
          cx={100 + eyeSpacing + face.pRX}
          cy={eyeY + 50 + face.pRY}
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
      fill="#333"
      mask="url(#headCutoutMask)"
    />
  </svg>

  <br />
  <br />

  <button onclick={() => void trainBot()} disabled={isTraining}>
    {isTraining ? "Training..." : "Retrain"}
  </button>
</center>

<code>
  {isInside}
  {mouseX}
  {mouseY}

  <h3>Input vector</h3>

  <ol class="model-vector">
    {#each modelVector as v}
      <li>{v.toFixed(3)}</li>
    {/each}
  </ol>

  <h3>History</h3>

  {#each history.slice(0, 4) as h}
    <ol class="model-vector">
      {#each h as v}
        <li>{v.toFixed(3)}</li>
      {/each}
    </ol>
  {/each}

  <h3>Face Vector</h3>
  <ol class="model-vector">
    {#each Object.values(face) as v}
      <li>{v.toFixed(3)}</li>
    {/each}
  </ol>
</code>

<style>
  svg {
    width: 250px;
    height: 250px;
    overflow: visible;
  }

  button {
    font: inherit;
    font-size: 1.2rem;
    padding: 0.5rem 1rem;
    border: 4px solid #333;
    border-radius: 0.6rem;
    background: none;
    color: #333;
    width: 8rem;
    cursor: pointer;
  }

  button:hover {
    border-color: #f0a;
    color: white;
    background: #0af;
  }

  ol.model-vector {
    display: flex;
    flex-direction: row;
    gap: 0;
    font-size: 0.8rem;
    color: #666;
  }

  ol.model-vector li {
    list-style: none;
    text-align: center;
    border: 1px solid #666;
    border-right: none;
    width: 3rem;
    height: 3rem;
    line-height: 3rem;
  }

  ol.model-vector li:last-child {
    border-right: 1px solid #666;
  }
</style>
