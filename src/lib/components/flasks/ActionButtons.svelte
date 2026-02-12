<script lang="ts">
	import { Plus, AlertCircle, Pencil, ChevronDown, FlaskConical, Box } from 'lucide-svelte';
	import { FlaskInBox } from '$lib/components/icons';
	import { goto } from '$app/navigation';

	let { selectedFlaskId = null }: { selectedFlaskId?: number | null } = $props();

	let showNewMenu = $state(false);
	let showBoxSelector = $state(false);

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
		showBoxSelector = true;
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
				class="absolute bottom-full mb-1 left-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[160px]"
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

	<!-- ! Issue Button -->
	<button
		onclick={() => console.log('Issue for flask:', selectedFlaskId)}
		disabled={!selectedFlaskId}
		class="flex items-center gap-2 px-4 py-2 bg-sky-500 text-gray-800 rounded-md hover:bg-sky-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm"
	>
		<AlertCircle class="h-4 w-4" />
		Issue
	</button>

	<!-- Edit Box-Flasks Button -->
	<button
		onclick={handleBoxFlasks}
		class="flex items-center gap-2 px-4 py-2 bg-sky-500 text-gray-800 rounded-md hover:bg-sky-600 transition-colors font-medium text-sm shadow-sm"
	>
		<FlaskInBox class="h-4 w-4" />
		Box-Flasks
	</button>
</div>

<!-- Box Selector Modal -->
{#if showBoxSelector}
	{#await import('$lib/components/boxes/BoxSelector.svelte')}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white rounded-lg p-4">Loading...</div>
		</div>
	{:then { default: BoxSelector }}
		<BoxSelector
			onSelect={(boxId) => {
				console.log('Selected box:', boxId);
				showBoxSelector = false;
				// Future: goto(`/boxes/${boxId}/content`)
			}}
			onClose={() => (showBoxSelector = false)}
		/>
	{/await}
{/if}
