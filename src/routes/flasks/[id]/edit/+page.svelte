<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { FlaskConical, ArrowLeft } from 'lucide-svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let isSubmitting = $state(false);

	// Form fields - initialize from loaded data
	let name = $state(data.flask.name);
	let remarks = $state(data.flask.remarks || '');
	let brokenAt = $state(
		data.flask.brokenAt ? data.flask.brokenAt.toISOString().split('T')[0] : ''
	);
	let lowPressureAt = $state(
		data.flask.lowPressureAt ? data.flask.lowPressureAt.toISOString().split('T')[0] : ''
	);

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
			<h1 class="text-3xl font-bold text-gray-800">Edit Flask</h1>
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
		action="?/update"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				await update();
				isSubmitting = false;
			};
		}}
		class="bg-white shadow-md rounded-lg p-6"
	>
		<!-- Flask Name -->
		<div class="mb-6">
			<label for="name" class="block text-sm font-semibold text-gray-700 mb-2">
				Flask Name <span class="text-red-500">*</span>
			</label>
			<input
				type="text"
				id="name"
				name="name"
				bind:value={name}
				required
				placeholder="Enter flask name (e.g., UU-1-001)"
				class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
				disabled={isSubmitting}
			/>
			<p class="mt-1 text-sm text-gray-500">Required. This name must be unique.</p>
		</div>

		<!-- Remarks -->
		<div class="mb-6">
			<label for="remarks" class="block text-sm font-semibold text-gray-700 mb-2">
				Remarks
			</label>
			<textarea
				id="remarks"
				name="remarks"
				bind:value={remarks}
				rows="4"
				placeholder="Enter any remarks about this flask"
				class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all resize-y"
				disabled={isSubmitting}
			></textarea>
			<p class="mt-1 text-sm text-gray-500">Optional. Additional notes about the flask.</p>
		</div>

		<!-- Broken At -->
		<div class="mb-6">
			<label for="brokenAt" class="block text-sm font-semibold text-gray-700 mb-2">
				Broken Date
			</label>
			<input
				type="date"
				id="brokenAt"
				name="brokenAt"
				bind:value={brokenAt}
				class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
				disabled={isSubmitting}
			/>
			<p class="mt-1 text-sm text-gray-500">Optional. Date when the flask was broken.</p>
		</div>

		<!-- Low Pressure At -->
		<div class="mb-6">
			<label for="lowPressureAt" class="block text-sm font-semibold text-gray-700 mb-2">
				Low Pressure Date
			</label>
			<input
				type="date"
				id="lowPressureAt"
				name="lowPressureAt"
				bind:value={lowPressureAt}
				class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
				disabled={isSubmitting}
			/>
			<p class="mt-1 text-sm text-gray-500">
				Optional. Date when the flask had low pressure.
			</p>
		</div>

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
				{isSubmitting ? 'Updating...' : 'Update Flask'}
			</button>
		</div>
	</form>
</div>
