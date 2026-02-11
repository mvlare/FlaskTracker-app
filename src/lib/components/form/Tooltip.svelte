<script lang="ts">
	let {
		text,
		children
	}: {
		text: string;
		children?: import('svelte').Snippet;
	} = $props();

	let isVisible = $state(false);
	let triggerRef: HTMLSpanElement | null = $state(null);

	function show() {
		isVisible = true;
	}

	function hide() {
		isVisible = false;
	}

	function toggle() {
		isVisible = !isVisible;
	}

	function handleClickOutside(event: MouseEvent) {
		if (triggerRef && !triggerRef.contains(event.target as Node)) {
			isVisible = false;
		}
	}

	$effect(() => {
		if (isVisible) {
			document.addEventListener('click', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});
</script>

<span class="relative inline-block" bind:this={triggerRef}>
	<!-- Trigger -->
	<span
		class="cursor-help"
		onmouseenter={show}
		onmouseleave={hide}
		onclick={toggle}
		onkeydown={(e) => e.key === 'Enter' && toggle()}
		role="button"
		tabindex="0"
		aria-label="More information"
	>
		{@render children?.()}
	</span>

	<!-- Tooltip -->
	{#if isVisible}
		<div
			class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-md shadow-lg max-w-xs w-max z-50 pointer-events-none"
			role="tooltip"
		>
			{text}
			<!-- Arrow -->
			<div
				class="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"
			></div>
		</div>
	{/if}
</span>
