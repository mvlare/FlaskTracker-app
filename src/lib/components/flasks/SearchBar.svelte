<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Search } from 'lucide-svelte';

	let { flaskSearch = $bindable(''), boxSearch = $bindable('') } = $props();

	let flaskSearchInput = $state(flaskSearch);
	let boxSearchInput = $state(boxSearch);
	let debounceTimeout: ReturnType<typeof setTimeout>;

	function handleSearch() {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			const url = new URL($page.url);
			url.searchParams.set('page', '1'); // Reset to first page on search
			if (flaskSearchInput) {
				url.searchParams.set('flaskSearch', flaskSearchInput);
			} else {
				url.searchParams.delete('flaskSearch');
			}
			if (boxSearchInput) {
				url.searchParams.set('boxSearch', boxSearchInput);
			} else {
				url.searchParams.delete('boxSearch');
			}
			goto(url.toString(), { replaceState: true, keepFocus: true });
		}, 300);
	}
</script>

<div class="flex gap-4 mb-4">
	<div class="flex-1">
		<label for="flask-search" class="block text-sm font-medium text-gray-700 mb-1">
			Flask Name
		</label>
		<div class="relative">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
			<input
				id="flask-search"
				type="text"
				bind:value={flaskSearchInput}
				oninput={handleSearch}
				placeholder="Search flasks..."
				class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
			/>
		</div>
	</div>
	<div class="flex-1">
		<label for="box-search" class="block text-sm font-medium text-gray-700 mb-1"> Box Name </label>
		<div class="relative">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
			<input
				id="box-search"
				type="text"
				bind:value={boxSearchInput}
				oninput={handleSearch}
				placeholder="Search boxes..."
				class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
			/>
		</div>
	</div>
</div>
