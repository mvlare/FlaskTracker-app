<script lang="ts">
  let className = '';
  export { className as class };
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={className}
  {...$$restProps}
>
  <!-- Box - isometric 3D perspective -->
  <!-- Front face -->
  <path d="M2 9 L2 21 L16 21 L16 9" />
  <!-- Top face -->
  <path d="M2 9 L8 5 L22 5 L16 9 Z" />
  <!-- Right side face -->
  <path d="M16 9 L16 21 L22 17 L22 5 Z" />

  <!-- Flask 1 (left flask) - Erlenmeyer style - LARGER -->
  <!-- Neck -->
  <path d="M6 10 L6 12.5 M7.5 10 L7.5 12.5" />
  <!-- Body (wider, taller) -->
  <path d="M5 12.5 L4 17.5 Q4 18.5 6.75 18.5 Q9.5 18.5 9.5 17.5 L8.5 12.5" />

  <!-- Flask 2 (right flask) - Erlenmeyer style - LARGER -->
  <!-- Neck -->
  <path d="M10.5 10 L10.5 12.5 M12 10 L12 12.5" />
  <!-- Body (wider, taller) -->
  <path d="M9.5 12.5 L8.5 17.5 Q8.5 18.5 11.25 18.5 Q14 18.5 14 17.5 L13 12.5" />
</svg>
