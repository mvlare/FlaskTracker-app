<script lang="ts">
	import { MessageSquare, Save, X, GitBranch, ChevronRight } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { formatDateDisplay } from '$lib/utils/dates';

	let {
		remarks = $bindable(''),
		flaskName = '',
		flaskId = null
	}: {
		remarks?: string | null;
		flaskName?: string;
		flaskId?: number | null;
	} = $props();

	let editedRemarks = $state(remarks || '');
	let isSaving = $state(false);
	let saveMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);
	let hasChanges = $derived(editedRemarks !== (remarks || ''));

	// Low pressure date state
	let latestLowPressureDate = $state<string | null>(null);
	let isLoadingLowPressure = $state(false);
	let lowPressureError = $state<string | null>(null);

	// Fetch latest low pressure date
	async function fetchLatestLowPressure(id: number) {
		isLoadingLowPressure = true;
		lowPressureError = null;
		try {
			const response = await fetch(`/api/flasks/${id}/latest-low-pressure`);
			if (!response.ok) throw new Error('Failed to fetch');
			const data = await response.json();
			latestLowPressureDate = data.latestLowPressureAt;
		} catch (err) {
			lowPressureError = 'Unable to load';
			latestLowPressureDate = null;
		} finally {
			isLoadingLowPressure = false;
		}
	}

	// Update editedRemarks when remarks prop changes (e.g., selecting different flask)
	$effect(() => {
		editedRemarks = remarks || '';
		saveMessage = null;

		// Reset and fetch low pressure date when flask changes
		latestLowPressureDate = null;
		lowPressureError = null;
		if (flaskId) {
			fetchLatestLowPressure(flaskId);
		}
	});

	function handleTabKey(event: KeyboardEvent) {
		if (event.key === 'Tab') {
			event.preventDefault();
			const target = event.target as HTMLTextAreaElement;
			const start = target.selectionStart;
			const end = target.selectionEnd;

			// Insert tab character at cursor position
			editedRemarks = editedRemarks.substring(0, start) + '\t' + editedRemarks.substring(end);

			// Move cursor after the inserted tab
			setTimeout(() => {
				target.selectionStart = target.selectionEnd = start + 1;
			}, 0);
		}
	}

	function handleCancel() {
		editedRemarks = remarks || '';
		saveMessage = null;
	}
</script>

<div class="bg-white border border-gray-300 rounded-md p-4 h-full">
	<div class="flex items-center justify-between mb-3">
		<div class="flex items-center gap-2">
			<MessageSquare class="h-5 w-5 text-gray-600" />
			<h3 class="text-sm font-semibold text-gray-700">Remarks</h3>
		</div>
		{#if flaskId}
			<div class="flex gap-2">
				<button
					type="button"
					onclick={handleCancel}
					disabled={!hasChanges || isSaving || !flaskId}
					class="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
				>
					<X class="h-4 w-4" />
					Cancel
				</button>
				<form
					method="POST"
					action="?/updateRemarks"
					use:enhance={() => {
						isSaving = true;
						saveMessage = null;
						return async ({ result, update }) => {
							isSaving = false;
							if (result.type === 'success') {
								// Refresh the page data to get updated remarks from database
								await invalidateAll();
								saveMessage = { type: 'success', text: 'Saved successfully' };
								setTimeout(() => {
									saveMessage = null;
								}, 3000);
							} else {
								saveMessage = { type: 'error', text: 'Failed to save remarks' };
							}
						};
					}}
				>
					<input type="hidden" name="flaskId" value={flaskId} />
					<input type="hidden" name="remarks" value={editedRemarks} />
					<button
						type="submit"
						disabled={!hasChanges || isSaving || !flaskId}
						class="flex items-center gap-1 px-3 py-1.5 bg-sky-500 text-gray-800 rounded-md hover:bg-sky-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
					>
						<Save class="h-4 w-4" />
						{isSaving ? 'Saving...' : 'Save'}
					</button>
				</form>
			</div>
		{/if}
	</div>
	{#if flaskName}
		<div class="mb-2 text-xs text-gray-600">
			<span class="font-medium">Flask:</span>
			{flaskName}
		</div>
	{/if}
	{#if flaskId}
		<div class="mb-2 text-xs text-gray-600">
			<span class="font-medium">Latest Low Pressure:</span>
			{#if isLoadingLowPressure}
				<span>Loading...</span>
			{:else if lowPressureError}
				<span class="text-red-600">{lowPressureError}</span>
			{:else if latestLowPressureDate}
				<span class="font-bold text-gray-800">{formatDateDisplay(latestLowPressureDate)}</span>
			{:else}
				<span>No events recorded</span>
			{/if}
		</div>
	{/if}
	{#if saveMessage}
		<div
			class="mb-2 px-3 py-2 rounded text-xs {saveMessage.type === 'success'
				? 'bg-green-50 text-green-800 border border-green-200'
				: 'bg-red-50 text-red-800 border border-red-200'}"
		>
			{saveMessage.text}
		</div>
	{/if}
	<textarea
		bind:value={editedRemarks}
		onkeydown={handleTabKey}
		placeholder={flaskId ? 'Enter remarks...' : 'Select a flask to edit remarks'}
		disabled={!flaskId}
		class="w-full border border-gray-200 rounded p-3 bg-gray-50 min-h-[320px] text-sm text-gray-800 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:bg-gray-100"
	></textarea>

	<!-- Flask Tree Section -->
	{#if flaskId}
		<div class="mt-4 border-t border-gray-200 pt-4">
			<details class="group">
				<summary class="cursor-pointer list-none">
					<div class="flex items-center gap-2 py-1 text-gray-700 font-medium text-sm">
						<ChevronRight
							class="h-3 w-3 transition-transform duration-200 group-open:rotate-90"
						/>
						<GitBranch class="h-3 w-3" />
						<span>Flask Tree</span>
					</div>
				</summary>

				<div class="mt-3">
					{#await import('$lib/components/flasks/FlaskTreeView.svelte')}
						<div class="text-xs text-gray-500 py-2">Loading tree...</div>
					{:then { default: FlaskTreeView }}
						<div class="bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
							<FlaskTreeView flaskId={flaskId} compact={true} />
						</div>
					{:catch}
						<div class="text-xs text-red-600 py-2">Failed to load tree component</div>
					{/await}
				</div>
			</details>
		</div>
	{/if}
</div>
