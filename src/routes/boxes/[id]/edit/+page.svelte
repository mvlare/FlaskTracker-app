<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Box, ArrowLeft, Info, ChevronRight } from 'lucide-svelte';
	import FloatingLabelInput from '$lib/components/form/FloatingLabelInput.svelte';
	import Tooltip from '$lib/components/form/Tooltip.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let isSubmitting = $state(false);

	let name = $state('');
	let remarks = $state('');

	$effect(() => {
		name = data.box.name;
		remarks = data.box.remarks || '';
	});

	function handleCancel() {
		goto(`/box-content?boxId=${data.box.id}`);
	}
</script>

<div class="container mx-auto px-4 py-6 max-w-4xl bg-slate-50 min-h-screen">
	<!-- Header -->
	<div class="mb-6">
		<button
			onclick={handleCancel}
			class="flex items-center gap-2 text-sky-600 hover:text-sky-700 mb-4"
		>
			<ArrowLeft class="h-4 w-4" />
			Back to Box Shipments
		</button>
		<div class="flex items-center gap-3">
			<Box class="h-8 w-8 text-sky-600" />
			<h1 class="text-3xl font-bold text-gray-800">Edit Box</h1>
		</div>
	</div>

	<!-- Error Message -->
	{#if form?.error}
		<div
			class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6"
			role="alert"
		>
			<strong class="font-semibold">Error:</strong>
			<span class="block sm:inline">{form.error}</span>
		</div>
	{/if}

	<!-- Form -->
	<form
		method="POST"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				await update();
				isSubmitting = false;
			};
		}}
		class="bg-white shadow-md rounded-lg p-4"
	>
		<!-- Box Name -->
		<div class="mb-4">
			<FloatingLabelInput
				id="name"
				name="name"
				label="Box Name"
				bind:value={name}
				required={true}
				disabled={isSubmitting || data.nameReadOnly}
				placeholder="Box A"
			/>
			<div class="flex items-center gap-1 mt-1">
				<Info class="h-3 w-3 text-gray-400" />
				{#if data.nameReadOnly}
					<p class="text-xs text-amber-600">Name cannot be changed — this box is used in a shipment.</p>
				{:else}
					<p class="text-xs text-gray-500">Required. This name must be unique.</p>
				{/if}
			</div>
		</div>

		<!-- Optional Metadata - Collapsible -->
		<details open class="group mb-4">
			<summary class="cursor-pointer list-none">
				<div
					class="flex items-center gap-2 py-2 text-gray-700 font-semibold border-t border-gray-200 -mx-4 px-4"
				>
					<ChevronRight
						class="h-4 w-4 transition-transform duration-200 group-open:rotate-90"
					/>
					<span>Additional Details</span>
				</div>
			</summary>

			<div class="mt-4">
				<FloatingLabelInput
					id="remarks"
					name="remarks"
					type="textarea"
					label="Remarks"
					bind:value={remarks}
					disabled={isSubmitting}
					placeholder="Enter any remarks..."
					rows={4}
				/>
				<div class="flex items-center gap-1 mt-1">
					<Tooltip text="Optional. Additional notes about the box.">
						<Info class="h-3 w-3 text-gray-400 hover:text-gray-600" />
					</Tooltip>
					<p class="text-xs text-gray-500">Optional notes about this box</p>
				</div>
			</div>
		</details>

		<!-- Action Buttons -->
		<div class="flex gap-4 justify-end pt-4 border-t border-gray-200">
			<button
				type="button"
				onclick={handleCancel}
				disabled={isSubmitting}
				class="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
			>
				Cancel
			</button>
			<button
				type="submit"
				disabled={isSubmitting || (!data.nameReadOnly && !name.trim())}
				class="px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-medium"
			>
				{isSubmitting ? 'Saving...' : 'Save Box'}
			</button>
		</div>
	</form>
</div>
