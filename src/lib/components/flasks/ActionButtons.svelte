<script lang="ts">
	import { Plus, AlertCircle, Box, History } from 'lucide-svelte';

	let { selectedFlaskId = null }: { selectedFlaskId?: number | null } = $props();
</script>

<div class="flex gap-2 py-3">
	<button
		onclick={() => console.log('New flask')}
		class="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-gray-800 rounded-md hover:bg-yellow-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm"
	>
		<Plus class="h-4 w-4" />
		New
	</button>
	<button
		onclick={() => console.log('Issue for flask:', selectedFlaskId)}
		disabled={!selectedFlaskId}
		class="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-gray-800 rounded-md hover:bg-yellow-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm"
	>
		<AlertCircle class="h-4 w-4" />
		Issue
	</button>
	<button
		onclick={() => console.log('Box for flask:', selectedFlaskId)}
		disabled={!selectedFlaskId}
		class="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-gray-800 rounded-md hover:bg-yellow-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm"
	>
		<Box class="h-4 w-4" />
		Box
	</button>
	<button
		onclick={() => console.log('History for flask:', selectedFlaskId)}
		disabled={!selectedFlaskId}
		class="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-gray-800 rounded-md hover:bg-yellow-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm"
	>
		<History class="h-4 w-4" />
		History
	</button>
</div>
