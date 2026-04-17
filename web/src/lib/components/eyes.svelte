<script lang="ts">
  let mouseX = $state(0);
  let mouseY = $state(0);
  let svgElement = $state<SVGSVGElement>();

  // Configuration
  const eyeSpacing = 35; // Distance from center
  const eyeY = 45; // Vertical position
  const eyeRadius = 30; // Outer eye size
  const pupilRadius = 10; // Pupil size
  const maxOffset = eyeRadius - pupilRadius - 2; // Constrain pupil inside eye

  function handleMouseMove(e: MouseEvent) {
    if (!svgElement) return;
    const rect = svgElement.getBoundingClientRect();
    // Get mouse position relative to SVG center (100, 100)
    mouseX = e.clientX - (rect.left + rect.width / 2);
    mouseY = e.clientY - (rect.top + rect.height / 2);
  }

  // Logic to calculate individual eye offsets
  function getPupilOffset(centerX: number, centerY: number) {
    const dx = mouseX - (centerX - 100); // Adjusting for coordinate system
    const dy = mouseY - (centerY - 100);
    const angle = Math.atan2(dy, dx);
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), 100); // Cap distance influence

    // Map the distance to the constrained radius
    const moveDist = (distance / 100) * maxOffset;

    return {
      x: Math.cos(angle) * moveDist,
      y: Math.sin(angle) * moveDist,
    };
  }

  const leftPupil = $derived(getPupilOffset(100 - eyeSpacing, eyeY + 50));
  const rightPupil = $derived(getPupilOffset(100 + eyeSpacing, eyeY + 50));
</script>

<svelte:window onmousemove={handleMouseMove} />

<div class="container">
  <svg
    bind:this={svgElement}
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="25" y="25" width="150" height="150" rx="30" fill="#333" />

    <circle cx={100 - eyeSpacing} cy={eyeY + 50} r={eyeRadius} fill="white" />
    <circle
      cx={100 - eyeSpacing + leftPupil.x}
      cy={eyeY + 50 + leftPupil.y}
      r={pupilRadius}
      fill="black"
    />

    <circle cx={100 + eyeSpacing} cy={eyeY + 50} r={eyeRadius} fill="white" />
    <circle
      cx={100 + eyeSpacing + rightPupil.x}
      cy={eyeY + 50 + rightPupil.y}
      r={pupilRadius}
      fill="black"
    />
  </svg>
</div>

<style>
  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 300px;
  }
  svg {
    width: 200px;
    height: 200px;
  }
</style>
