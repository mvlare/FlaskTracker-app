<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { FlaskConical, ArrowLeft, Info, ChevronRight } from 'lucide-svelte';
	import FloatingLabelInput from '$lib/components/form/FloatingLabelInput.svelte';
	import Tooltip from '$lib/components/form/Tooltip.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let isSubmitting = $state(false);

	// Form fields
	let name = $state('');
	let remarks = $state('');
	let brokenAt = $state('');

	function handleCancel() {
		goto('/');
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
			Back to Flasks
		</button>
		<div class="flex items-center gap-3">
			<FlaskConical class="h-8 w-8 text-sky-600" />
			<h1 class="text-3xl font-bold text-gray-800">New Flask</h1>
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

	<!-- Success Message -->
	{#if form?.success}
		<div
			class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-6"
			role="alert"
		>
			<strong class="font-semibold">Success!</strong>
			<span class="block sm:inline">Flask created successfully.</span>
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
		<!-- Flask Name - Always Visible -->
		<div class="mb-4">
			<FloatingLabelInput
				id="name"
				name="name"
				label="Flask Name"
				bind:value={name}
				required={true}
				disabled={isSubmitting}
				placeholder="UU-1-001"
			/>
			<div class="flex items-center gap-1 mt-1">
				<Info class="h-3 w-3 text-gray-400" />
				<p class="text-xs text-gray-500">Required. This name must be unique.</p>
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

			<div class="mt-4 space-y-4">
				<!-- Remarks -->
				<div>
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
						<Tooltip text="Optional. Additional notes about the flask.">
							<Info class="h-3 w-3 text-gray-400 hover:text-gray-600" />
						</Tooltip>
						<p class="text-xs text-gray-500">Optional notes about this flask</p>
					</div>
				</div>

				<!-- Broken Date -->
				<div>
					<FloatingLabelInput
						id="brokenAt"
						name="brokenAt"
						type="date"
						label="Broken Date"
						bind:value={brokenAt}
						disabled={isSubmitting}
					/>
					<div class="flex items-center gap-1 mt-1">
						<Tooltip text="Date when the flask was broken.">
							<Info class="h-3 w-3 text-gray-400 hover:text-gray-600" />
						</Tooltip>
						<p class="text-xs text-gray-500">When flask was broken</p>
					</div>
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
				disabled={isSubmitting || !name.trim()}
				class="px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-medium"
			>
				{isSubmitting ? 'Creating...' : 'Create Flask'}
			</button>
		</div>
	</form>
</div>
