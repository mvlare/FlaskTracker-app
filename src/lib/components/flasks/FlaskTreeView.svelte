<script lang="ts">
	import { formatDateDisplay } from '$lib/utils/dates';

	interface TreeRow {
		flask_id: number;
		flask_name: string;
		flask_broken_at: Date | string | null;
		flask_ref_type_name: string;
	}

	let { flaskId, compact = false }: { flaskId: number; compact?: boolean } = $props();

	let treeData = $state<TreeRow[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	async function fetchTreeData(id: number) {
		isLoading = true;
		error = null;
		try {
			const response = await fetch(`/api/flasks/${id}/tree`);
			if (!response.ok) throw new Error('Failed to fetch');
			const data = await response.json();
			treeData = data.treeData || [];
		} catch (err) {
			error = 'Failed to load tree data';
			treeData = [];
		} finally {
			isLoading = false;
		}
	}

	// Fetch when flaskId changes
	$effect(() => {
		if (flaskId) {
			fetchTreeData(flaskId);
		}
	});
</script>

{#if isLoading}
	<div class="animate-pulse">
		<div class="h-10 bg-gray-200 rounded mb-2"></div>
		<div class="h-8 bg-gray-100 rounded mb-2"></div>
		<div class="h-8 bg-gray-100 rounded mb-2"></div>
	</div>
{:else if error}
	<div class="px-4 py-6 text-center">
		<p class="text-red-600 text-sm mb-2">{error}</p>
		<button
			onclick={() => fetchTreeData(flaskId)}
			class="text-sky-600 hover:text-sky-700 text-sm"
		>
			Retry
		</button>
	</div>
{:else if treeData.length === 0}
	<div class="px-4 py-6 text-center text-gray-500 text-sm">
		{compact ? 'No tree references' : 'No reference tree data available for this flask.'}
	</div>
{:else}
	<div class="{compact ? 'max-h-60 overflow-y-auto' : ''} overflow-x-auto">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-100 {compact ? '' : 'sticky top-0'}">
				<tr>
					{#if !compact}
						<th class="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
							Flask ID
						</th>
					{/if}
					<th class="{compact ? 'px-1.5 py-1.5' : 'px-2 py-2'} text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
						Flask Name
					</th>
					<th class="{compact ? 'px-1.5 py-1.5' : 'px-2 py-2'} text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
						Reference Type
					</th>
					<th class="{compact ? 'px-1.5 py-1.5' : 'px-2 py-2'} text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
						Broken Date
					</th>
				</tr>
			</thead>
			<tbody class="bg-white divide-y divide-gray-200">
				{#each treeData as row}
					<tr class="hover:bg-gray-50 transition-colors">
						{#if !compact}
							<td class="px-2 py-3 whitespace-nowrap text-sm text-gray-900">
								{row.flask_id}
							</td>
						{/if}
						<td class="{compact ? 'px-1.5 py-2 text-xs' : 'px-2 py-3 text-sm'} whitespace-nowrap font-medium text-gray-900">
							{row.flask_name}
						</td>
						<td class="{compact ? 'px-1.5 py-2' : 'px-2 py-3'} whitespace-nowrap">
							<span
								class="px-2 py-1 rounded-md {compact ? 'text-xs' : 'text-xs'} font-medium"
								class:bg-blue-100={row.flask_ref_type_name === 'original'}
								class:text-blue-800={row.flask_ref_type_name === 'original'}
								class:bg-sky-100={row.flask_ref_type_name !== 'original'}
								class:text-sky-800={row.flask_ref_type_name !== 'original'}
							>
								{row.flask_ref_type_name}
							</span>
						</td>
						<td class="{compact ? 'px-1.5 py-2 text-xs' : 'px-2 py-3 text-sm'} whitespace-nowrap text-gray-700">
							{formatDateDisplay(row.flask_broken_at) || '-'}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
