<script lang="ts">
	import { Plus, Pencil, ChevronDown, FlaskConical, Box, BaggageClaim } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let { selectedFlaskId = null }: { selectedFlaskId?: number | null } = $props();

	let showNewMenu = $state(false);

	function handleNewFlask() {
		goto('/flasks/new');
		showNewMenu = false;
	}

	function handleNewBox() {
		goto('/boxes/new');
		showNewMenu = false;
	}

	function handleEditFlask() {
		if (selectedFlaskId) {
			goto(`/flasks/${selectedFlaskId}/edit`);
		}
	}

	function handleBoxFlasks() {
		goto('/box-content');
	}

	// Close menu when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.new-menu-container')) {
			showNewMenu = false;
		}
	}

	$effect(() => {
		if (showNewMenu) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div class="flex gap-2 py-3">
	<!-- + New Dropdown Button -->
	<div class="relative new-menu-container">
		<button
			onclick={() => (showNewMenu = !showNewMenu)}
			class="flex items-center gap-2 px-4 py-2 bg-sky-500 text-gray-800 rounded-md hover:bg-sky-600 transition-colors font-medium text-sm shadow-sm"
		>
			<Plus class="h-4 w-4" />
			New
			<ChevronDown class="h-3 w-3" />
		</button>

		{#if showNewMenu}
			<div
				class="absolute bottom-full mb-1 left-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-40"
			>
				<button
					onclick={handleNewFlask}
					class="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-sky-50 transition-colors"
				>
					<FlaskConical class="h-4 w-4" />
					New flask
				</button>
				<button
					onclick={handleNewBox}
					class="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-sky-50 transition-colors"
				>
					<Box class="h-4 w-4" />
					New box
				</button>
			</div>
		{/if}
	</div>

	<!-- Edit Flask Button -->
	<button
		onclick={handleEditFlask}
		disabled={!selectedFlaskId}
		class="flex items-center gap-2 px-4 py-2 bg-sky-500 text-gray-800 rounded-md hover:bg-sky-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm"
	>
		<Pencil class="h-4 w-4" />
		Flask
	</button>

	<!-- Box Shipments Button -->
	<button
		onclick={handleBoxFlasks}
		class="flex items-center gap-2 px-4 py-2 bg-sky-500 text-gray-800 rounded-md hover:bg-sky-600 transition-colors font-medium text-sm shadow-sm"
	>
		<BaggageClaim class="h-4 w-4" />
		Box shipments
	</button>
</div>
