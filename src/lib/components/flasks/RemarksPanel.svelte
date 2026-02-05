<script lang="ts">
	import { MessageSquare } from 'lucide-svelte';

	let { remarks = $bindable(''), flaskName = '' } = $props();
</script>

<div class="bg-white border border-gray-300 rounded-md p-4 h-full">
	<div class="flex items-center gap-2 mb-3">
		<MessageSquare class="h-5 w-5 text-gray-600" />
		<h3 class="text-sm font-semibold text-gray-700">Remarks</h3>
	</div>
	{#if flaskName}
		<div class="mb-2 text-xs text-gray-600">
			<span class="font-medium">Flask:</span>
			{flaskName}
		</div>
	{/if}
	<div class="border border-gray-200 rounded p-3 bg-gray-50 min-h-[320px] max-h-[320px] overflow-y-auto">
		{#if remarks}
			<p class="text-sm text-gray-800 whitespace-pre-wrap break-words font-mono">{remarks}</p>
		{:else}
			<p class="text-sm text-gray-400 italic">No remarks available</p>
		{/if}
	</div>
</div>
