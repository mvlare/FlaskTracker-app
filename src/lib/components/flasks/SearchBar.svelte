<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Search, X } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let { flaskSearch = $bindable(''), boxSearch = $bindable('') } = $props();

	let flaskSearchInput = $state(flaskSearch);
	let boxSearchInput = $state(boxSearch);
	let debounceTimeout: ReturnType<typeof setTimeout>;
	let flaskSearchElement: HTMLInputElement;

	// Clear flask search and trigger update
	function handleClearFlaskSearch() {
		flaskSearchInput = '';
		handleSearch();
		flaskSearchElement?.focus();
	}

	// Clear box search and trigger update
	function handleClearBoxSearch() {
		boxSearchInput = '';
		handleSearch();
	}

	function handleSearch() {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			const url = new URL(page.url);
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

	function handleKeyboardShortcut(event: KeyboardEvent) {
		// Focus search field when "/" is pressed (unless already in an input)
		if (event.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
			event.preventDefault();
			flaskSearchElement?.focus();
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeyboardShortcut);
		return () => {
			window.removeEventListener('keydown', handleKeyboardShortcut);
		};
	});
</script>

<div class="flex gap-4 mb-4">
	<div class="flex-1">
		<div class="relative">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
			<input
				bind:this={flaskSearchElement}
				id="flask-search"
				type="text"
				bind:value={flaskSearchInput}
				oninput={handleSearch}
				placeholder="Search flasks... (Press / to focus)"
				title="Search flask by name (Press / to focus)"
				class="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			/>
			{#if flaskSearchInput}
				<button
					type="button"
					onclick={handleClearFlaskSearch}
					class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
					aria-label="Clear flask search"
					title="Clear search"
				>
					<X class="h-4 w-4" />
				</button>
			{/if}
		</div>
	</div>
	<div class="flex-1">
		<div class="relative">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
			<input
				id="box-search"
				type="text"
				bind:value={boxSearchInput}
				oninput={handleSearch}
				placeholder="Search boxes..."
				title="Search boxes..."
				class="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			/>
			{#if boxSearchInput}
				<button
					type="button"
					onclick={handleClearBoxSearch}
					class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
					aria-label="Clear box search"
					title="Clear search"
				>
					<X class="h-4 w-4" />
				</button>
			{/if}
		</div>
	</div>
</div>
