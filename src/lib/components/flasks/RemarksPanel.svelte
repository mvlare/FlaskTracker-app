<script lang="ts">
	import { MessageSquare, Save } from 'lucide-svelte';
	import { enhance } from '$app/forms';

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

	// Update editedRemarks when remarks prop changes (e.g., selecting different flask)
	$effect(() => {
		editedRemarks = remarks || '';
		saveMessage = null;
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
</script>

<div class="bg-white border border-gray-300 rounded-md p-4 h-full">
	<div class="flex items-center justify-between mb-3">
		<div class="flex items-center gap-2">
			<MessageSquare class="h-5 w-5 text-gray-600" />
			<h3 class="text-sm font-semibold text-gray-700">Remarks</h3>
		</div>
		{#if flaskId}
			<form
				method="POST"
				action="?/updateRemarks"
				use:enhance={() => {
					isSaving = true;
					saveMessage = null;
					return async ({ result }) => {
						isSaving = false;
						if (result.type === 'success') {
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
					class="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 text-gray-800 rounded-md hover:bg-yellow-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
				>
					<Save class="h-4 w-4" />
					{isSaving ? 'Saving...' : 'Save'}
				</button>
			</form>
		{/if}
	</div>
	{#if flaskName}
		<div class="mb-2 text-xs text-gray-600">
			<span class="font-medium">Flask:</span>
			{flaskName}
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
		class="w-full border border-gray-200 rounded p-3 bg-gray-50 min-h-[320px] max-h-[320px] text-sm text-gray-800 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:cursor-not-allowed disabled:bg-gray-100"
	></textarea>
</div>
