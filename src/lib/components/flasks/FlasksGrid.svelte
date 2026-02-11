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
		lowPressureAt: Date | string | null;
		boxName: string | null;
	}

	let {
		flasks = [],
		sortBy = 'flask',
		sortOrder = 'desc',
		onSelectFlask
	}: {
		flasks: Flask[];
		sortBy?: string;
		sortOrder?: string;
		onSelectFlask?: (flask: Flask) => void;
	} = $props();

	let selectedIndex = $state(0);
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

	function isSortedBy(column: string, order: 'asc' | 'desc' | null = null) {
		if (sortBy !== column) return order === null;
		if (order === null) return true;
		return sortOrder === order;
	}

	function handleRowClick(index: number) {
		selectedIndex = index;
		if (onSelectFlask && flasks[index]) {
			onSelectFlask(flasks[index]);
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (flasks.length === 0) return;

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, flasks.length - 1);
			if (onSelectFlask && flasks[selectedIndex]) {
				onSelectFlask(flasks[selectedIndex]);
			}
			scrollToRow(selectedIndex);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
			if (onSelectFlask && flasks[selectedIndex]) {
				onSelectFlask(flasks[selectedIndex]);
			}
			scrollToRow(selectedIndex);
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
		// Select first flask by default
		if (flasks.length > 0 && onSelectFlask) {
			onSelectFlask(flasks[0]);
		}
	});
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="overflow-x-auto border border-gray-300 rounded-md bg-white" role="application" aria-label="Flasks data grid">
	<table bind:this={tableRef} class="min-w-full divide-y divide-gray-200">
		<thead class="bg-gray-100 sticky top-0">
			<tr>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 tracking-wider w-20">
					Id
				</th>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
					<button
						onclick={() => handleSort('flask')}
						class="flex items-center gap-1 hover:text-gray-900 transition-colors"
					>
						Flask
						{#if isSortedBy('flask', null)}
							<ArrowUpDown class="h-4 w-4" />
						{:else if isSortedBy('flask', 'asc')}
							<ArrowUp class="h-4 w-4" />
						{:else}
							<ArrowDown class="h-4 w-4" />
						{/if}
					</button>
				</th>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
					<button
						onclick={() => handleSort('box')}
						class="flex items-center gap-1 hover:text-gray-900 transition-colors"
					>
						Box
						{#if isSortedBy('box', null)}
							<ArrowUpDown class="h-4 w-4" />
						{:else if isSortedBy('box', 'asc')}
							<ArrowUp class="h-4 w-4" />
						{:else}
							<ArrowDown class="h-4 w-4" />
						{/if}
					</button>
				</th>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 tracking-wider">
					Broken Date
				</th>
				<th
					class="px-4 py-3 text-left text-xs font-semibold text-gray-700 tracking-wider"
					title="Latest Low Pressure Date"
				>
					Low Pressure Date
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
						<td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
							{flask.id}
						</td>
						<td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
							{flask.name}
						</td>
						<td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
							{flask.boxName || '-'}
						</td>
						<td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
							{formatDateDisplay(flask.brokenAt) || '-'}
						</td>
						<td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
							{formatDateDisplay(flask.lowPressureAt) || '-'}
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>
