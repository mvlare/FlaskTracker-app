<script lang="ts">
	import TopBar from '$lib/components/flasks/TopBar.svelte';
	import SearchBar from '$lib/components/flasks/SearchBar.svelte';
	import FlasksGrid from '$lib/components/flasks/FlasksGrid.svelte';
	import RemarksPanel from '$lib/components/flasks/RemarksPanel.svelte';
	import ActionButtons from '$lib/components/flasks/ActionButtons.svelte';
	import Pagination from '$lib/components/flasks/Pagination.svelte';

	let { data } = $props();

	let selectedFlask = $state<{
		id: number;
		name: string;
		remarks: string | null;
		brokenAt: Date | string | null;
		lowPressureAt: Date | string | null;
		boxName: string | null;
	} | null>(null);

	function handleSelectFlask(flask: typeof selectedFlask) {
		selectedFlask = flask;
	}
</script>

<TopBar />

<main class="container mx-auto px-4 py-6 max-w-7xl bg-slate-50 min-h-screen">
	{#if data.error}
		<div
			class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4"
			role="alert"
		>
			<strong class="font-semibold">Error:</strong>
			<span class="block sm:inline">{data.error}</span>
		</div>
	{/if}

	<SearchBar
		bind:flaskSearch={data.filters.flaskSearch}
		bind:boxSearch={data.filters.boxSearch}
	/>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
		<div class="lg:col-span-2">
			<FlasksGrid
				flasks={data.flasks}
				sortBy={data.filters.sortBy}
				sortOrder={data.filters.sortOrder}
				onSelectFlask={handleSelectFlask}
			/>
		</div>
		<div class="lg:col-span-1">
			<RemarksPanel
				remarks={selectedFlask?.remarks || ''}
				flaskName={selectedFlask?.name || ''}
				flaskId={selectedFlask?.id || null}
			/>
		</div>
	</div>

	<ActionButtons selectedFlaskId={selectedFlask?.id || null} />

	<Pagination
		currentPage={data.pagination.page}
		totalPages={data.pagination.totalPages}
		totalCount={data.pagination.totalCount}
	/>
</main>
