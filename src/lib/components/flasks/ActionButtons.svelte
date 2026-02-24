<script lang="ts">
	import { Plus, Pencil, FlaskConical, Box, BaggageClaim } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let { selectedFlaskId = null }: { selectedFlaskId?: number | null } = $props();

	function handleNewFlask() {
		goto('/flasks/new');
	}

	function handleNewBox() {
		goto('/boxes/new');
	}

	function handleEditFlask() {
		if (selectedFlaskId) {
			goto(`/flasks/${selectedFlaskId}/edit`);
		}
	}

	function handleBoxFlasks() {
		goto('/box-content' + (selectedFlaskId ? '?returnFlaskId=' + selectedFlaskId : ''));
	}
</script>

<div class="flex gap-2 py-3">
	<!-- New Flask Button -->
	<button
		onclick={handleNewFlask}
		class="flex items-center gap-2 px-4 py-2 bg-sky-500 text-gray-800 rounded-md hover:bg-sky-600 transition-colors font-medium text-sm shadow-sm"
	>
		<Plus class="h-4 w-4" />
		New flask
	</button>

	<!-- New Box Button -->
	<button
		onclick={handleNewBox}
		class="flex items-center gap-2 px-4 py-2 bg-sky-500 text-gray-800 rounded-md hover:bg-sky-600 transition-colors font-medium text-sm shadow-sm"
	>
		<Plus class="h-4 w-4" />
		New box
	</button>

	<!-- Edit Flask Button -->
	<button
		onclick={handleEditFlask}
		disabled={!selectedFlaskId}
		class="flex items-center gap-2 px-4 py-2 bg-sky-500 text-gray-800 rounded-md hover:bg-sky-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm"
	>
		<Pencil class="h-4 w-4" />
		Edit flask
	</button>

	<!-- Boxes Button -->
	<button
		onclick={handleBoxFlasks}
		class="flex items-center gap-2 px-4 py-2 bg-sky-500 text-gray-800 rounded-md hover:bg-sky-600 transition-colors font-medium text-sm shadow-sm"
	>
		<BaggageClaim class="h-4 w-4" />
		Boxes
	</button>
</div>
