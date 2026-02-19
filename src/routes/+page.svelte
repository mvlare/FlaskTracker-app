<script lang="ts">
	import { goto } from '$app/navigation';
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
		boxName: string | null;
		shipmentStatus: string | null;
	} | null>(null);

	function handleSelectFlask(flask: typeof selectedFlask) {
		selectedFlask = flask;
	}

	function handleGlobalKeydown(event: KeyboardEvent) {
		const tag = document.activeElement?.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

		if (event.key === 'n') {
			event.preventDefault();
			goto('/flasks/new');
		} else if (event.key === 'e' && selectedFlask) {
			event.preventDefault();
			goto(`/flasks/${selectedFlask.id}/edit`);
		} else if (event.key === 'b') {
			event.preventDefault();
			goto('/box-content' + (selectedFlask ? '?returnFlaskId=' + selectedFlask.id : ''));
		}
	}
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<TopBar />

<main class="container mx-auto px-4 py-4 max-w-7xl bg-slate-50 min-h-screen">
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

	<ActionButtons selectedFlaskId={selectedFlask?.id || null} />

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-3">
		<div class="lg:col-span-2">
			<FlasksGrid
				flasks={data.flasks}
				sortBy={data.filters.sortBy}
				sortOrder={data.filters.sortOrder}
				onSelectFlask={handleSelectFlask}
				hasActiveSearch={!!data.filters.flaskSearch || !!data.filters.boxSearch}
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

	<Pagination
		currentPage={data.pagination.page}
		totalPages={data.pagination.totalPages}
		totalCount={data.pagination.totalCount}
	/>
</main>
