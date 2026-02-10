<script lang="ts">
	import { onMount } from 'svelte';
	import { Search } from 'lucide-svelte';

	let {
		onSelect,
		onClose
	}: {
		onSelect: (boxId: number) => void;
		onClose: () => void;
	} = $props();

	let boxes = $state<Array<{ id: number; name: string }>>([]);
	let filterText = $state('');
	let loading = $state(true);
	let error = $state('');

	let filteredBoxes = $derived(
		boxes.filter((box) => box.name.toLowerCase().includes(filterText.toLowerCase()))
	);

	// Load boxes from server
	onMount(async () => {
		try {
			const response = await fetch('/api/boxes?orderBy=name&order=desc');
			if (!response.ok) {
				throw new Error('Failed to load boxes');
			}
			boxes = await response.json();
		} catch (err) {
			console.error('Error loading boxes:', err);
			error = 'Failed to load boxes. Please try again.';
		} finally {
			loading = false;
		}
	});

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}
</script>

<div
	class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
	onclick={handleOverlayClick}
>
	<div
		class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
		onclick={(e) => e.stopPropagation()}
	>
		<!-- Header -->
		<div class="px-6 py-4 border-b border-gray-200">
			<h2 class="text-xl font-bold text-gray-800">Select Box</h2>
		</div>

		<!-- Search Input -->
		<div class="px-6 py-4 border-b border-gray-200">
			<div class="relative">
				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<Search class="h-5 w-5 text-gray-400" />
				</div>
				<input
					type="text"
					bind:value={filterText}
					placeholder="Type to filter boxes..."
					class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
					autofocus
				/>
			</div>
		</div>

		<!-- Box List -->
		<div class="px-6 py-4 max-h-96 overflow-y-auto">
			{#if loading}
				<p class="text-center text-gray-500 py-4">Loading boxes...</p>
			{:else if error}
				<div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
					{error}
				</div>
			{:else if filteredBoxes.length === 0}
				<p class="text-center text-gray-500 py-4">
					{boxes.length === 0 ? 'No boxes available' : 'No boxes match your search'}
				</p>
			{:else}
				<ul class="space-y-1">
					{#each filteredBoxes as box}
						<li>
							<button
								onclick={() => onSelect(box.id)}
								class="w-full text-left px-4 py-3 rounded-md hover:bg-sky-50 transition-colors text-gray-700 font-medium"
							>
								{box.name}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<!-- Footer -->
		<div class="px-6 py-4 border-t border-gray-200 flex justify-end">
			<button
				onclick={onClose}
				class="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
			>
				Cancel
			</button>
		</div>
	</div>
</div>
