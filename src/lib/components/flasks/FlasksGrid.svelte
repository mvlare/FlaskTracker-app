<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-svelte';
	import { formatDateDisplay } from '$lib/utils/dates';
	import { onMount } from 'svelte';

	interface Flask {
		id: number;
		name: string;
		remarks: string | null;
		brokenAt: Date | string | null;
		boxName: string | null;
		shipmentStatus: string | null;
	}

	let {
		flasks = [],
		sortBy = 'flask',
		sortOrder = 'desc',
		onSelectFlask,
		hasActiveSearch = false
	}: {
		flasks: Flask[];
		sortBy?: string;
		sortOrder?: string;
		onSelectFlask?: (flask: Flask) => void;
		hasActiveSearch?: boolean;
	} = $props();

	let selectedIndex = $state(-1);
	let tableRef: HTMLTableElement;

	function handleSort(column: string) {
		const url = new URL(page.url);
		if (sortBy === column) {
			// Toggle sort order
			const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
			url.searchParams.set('sortOrder', newOrder);
		} else {
			url.searchParams.set('sortBy', column);
			url.searchParams.set('sortOrder', 'desc');
		}
		goto(url.toString(), { replaceState: true, keepFocus: true });
	}

	function getSortIcon(column: string): 'none' | 'asc' | 'desc' {
		if (sortBy !== column) return 'none';
		return sortOrder === 'asc' ? 'asc' : 'desc';
	}

	function updateSelectionUrl(flaskId: number) {
		const url = new URL(window.location.href);
		url.searchParams.set('flaskId', String(flaskId));
		history.replaceState(history.state, '', url.toString());
	}

	function handleRowClick(index: number) {
		selectedIndex = index;
		if (onSelectFlask && flasks[index]) {
			onSelectFlask(flasks[index]);
		}
		updateSelectionUrl(flasks[index].id);
	}

	function handleKeyDown(event: KeyboardEvent) {
		const tag = document.activeElement?.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

		if (flasks.length === 0) return;

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			// If nothing selected, start at 0, otherwise move down
			selectedIndex = selectedIndex === -1 ? 0 : Math.min(selectedIndex + 1, flasks.length - 1);
			if (onSelectFlask && flasks[selectedIndex]) {
				onSelectFlask(flasks[selectedIndex]);
			}
			scrollToRow(selectedIndex);
			updateSelectionUrl(flasks[selectedIndex].id);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			// If nothing selected, start at 0, otherwise move up
			selectedIndex = selectedIndex === -1 ? 0 : Math.max(selectedIndex - 1, 0);
			if (onSelectFlask && flasks[selectedIndex]) {
				onSelectFlask(flasks[selectedIndex]);
			}
			scrollToRow(selectedIndex);
			updateSelectionUrl(flasks[selectedIndex].id);
		} else if (event.key === 'Enter' && selectedIndex >= 0 && flasks[selectedIndex]) {
			event.preventDefault();
			goto(`/flasks/${flasks[selectedIndex].id}/edit`);
		}
	}

	function scrollToRow(index: number) {
		const row = tableRef?.querySelector(`tr[data-row-index="${index}"]`);
		if (row) {
			row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	}

	onMount(() => {
		// Focus table on mount to enable keyboard navigation
		if (tableRef) {
			tableRef.focus();
		}
		// Restore selection from URL if present (e.g. returning from edit page)
		const params = new URLSearchParams(window.location.search);
		const urlFlaskId = params.get('flaskId');
		if (urlFlaskId) {
			const idx = flasks.findIndex((f) => f.id === parseInt(urlFlaskId));
			if (idx !== -1) {
				selectedIndex = idx;
				if (onSelectFlask) onSelectFlask(flasks[idx]);
				scrollToRow(idx);
				return; // skip hasActiveSearch auto-select
			}
		}
		// Auto-select first flask if there's an active search
		if (hasActiveSearch && flasks.length > 0 && onSelectFlask) {
			selectedIndex = 0;
			onSelectFlask(flasks[0]);
		}
	});
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="overflow-x-auto border border-gray-300 rounded-md bg-white" role="application" aria-label="Flasks data grid">
	<table bind:this={tableRef} class="min-w-full divide-y divide-gray-200">
		<thead class="bg-gray-100 sticky top-0">
			<tr>
				<th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 tracking-wider w-20">
					<button
						onclick={() => handleSort('id')}
						class="flex items-center gap-1 transition-colors {sortBy === 'id' ? 'text-blue-600' : 'hover:text-gray-900'}"
					>
						Id
						{#if getSortIcon('id') === 'none'}
							<ArrowUpDown class="h-4 w-4 text-gray-400" />
						{:else if getSortIcon('id') === 'asc'}
							<ArrowUp class="h-4 w-4 text-blue-600" />
						{:else}
							<ArrowDown class="h-4 w-4 text-blue-600" />
						{/if}
					</button>
				</th>
				<th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
					<button
						onclick={() => handleSort('flask')}
						class="flex items-center gap-1 transition-colors {sortBy === 'flask' ? 'text-blue-600' : 'hover:text-gray-900'}"
					>
						Flask
						{#if getSortIcon('flask') === 'none'}
							<ArrowUpDown class="h-4 w-4 text-gray-400" />
						{:else if getSortIcon('flask') === 'asc'}
							<ArrowUp class="h-4 w-4 text-blue-600" />
						{:else}
							<ArrowDown class="h-4 w-4 text-blue-600" />
						{/if}
					</button>
				</th>
				<th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
					<button
						onclick={() => handleSort('box')}
						class="flex items-center gap-1 transition-colors {sortBy === 'box' ? 'text-blue-600' : 'hover:text-gray-900'}"
					>
						Box
						{#if getSortIcon('box') === 'none'}
							<ArrowUpDown class="h-4 w-4 text-gray-400" />
						{:else if getSortIcon('box') === 'asc'}
							<ArrowUp class="h-4 w-4 text-blue-600" />
						{:else}
							<ArrowDown class="h-4 w-4 text-blue-600" />
						{/if}
					</button>
				</th>
				<th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 tracking-wider w-24">
					Shipment
				</th>
				<th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 tracking-wider w-32">
					Broken Date
				</th>
			</tr>
		</thead>
		<tbody class="bg-white divide-y divide-gray-200">
			{#if flasks.length === 0}
				<tr>
					<td colspan="5" class="px-4 py-8 text-center text-gray-500">
						No flasks found. Try adjusting your search filters.
					</td>
				</tr>
			{:else}
				{#each flasks as flask, index}
					<tr
						data-row-index={index}
						onclick={() => handleRowClick(index)}
						class="cursor-pointer transition-all {index === selectedIndex
							? 'bg-linear-to-r from-blue-100 to-blue-50 border-l-4 border-l-blue-500'
							: 'hover:bg-gray-50'}"
					>
						<td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
							{flask.id}
						</td>
						<td class="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
							{flask.name}
						</td>
						<td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
							{flask.boxName || '-'}
						</td>
						<td class="px-4 py-2 whitespace-nowrap text-sm">
							{#if flask.shipmentStatus === 'New'}
								<span class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
									New
								</span>
							{:else if flask.shipmentStatus === 'Returned'}
								<span class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
									Returned
								</span>
							{/if}
						</td>
						<td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700 w-32">
							{formatDateDisplay(flask.brokenAt) || '-'}
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>
