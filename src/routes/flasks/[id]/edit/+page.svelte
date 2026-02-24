<script lang="ts">
	import { enhance } from '$app/forms';
	import { ArrowLeft, Info, ChevronRight, X, Plus, GitBranch, Check } from 'lucide-svelte';
	import FloatingLabelInput from '$lib/components/form/FloatingLabelInput.svelte';
	import FloatingLabelDatePicker from '$lib/components/form/FloatingLabelDatePicker.svelte';
	import Tooltip from '$lib/components/form/Tooltip.svelte';
	import FlaskTreeView from '$lib/components/flasks/FlaskTreeView.svelte';
	import { formatDateDisplay, formatForSubmission } from '$lib/utils/dates';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let isSubmitting = $state(false);

	// Form fields - initialize from loaded data
	let name = $state('');
	let remarks = $state('');
	let brokenAt = $state('');

	// Low pressure events state
	let lowPressureEvents = $state<typeof data.lowPressureEvents>([]);
	let newLowPressureDate = $state('');
	let isAddingEvent = $state(false);
	let deletingEventId = $state<number | null>(null);

	// Repaired flask state
	let repairedFlaskName = $state('');
	let isAddingRepaired = $state(false);
	let treeRefreshKey = $state(0);

	// Tab state
	let activeTab = $state<'tree' | 'events'>('tree');

	// Sync with server data
	$effect(() => {
		name = data.flask.name;
		remarks = data.flask.remarks || '';
		brokenAt = data.flask.brokenAt ? data.flask.brokenAt.toISOString().split('T')[0] : '';
		lowPressureEvents = data.lowPressureEvents || [];
	});

	function handleCancel() {
		history.back();
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
			Home
		</button>
		<div class="flex items-center gap-3">
			<img src="/Flask_Icon.png" alt="Flask" class="h-12 w-12 object-contain"
			style="filter: brightness(0) saturate(100%) invert(29%) sepia(92%) saturate(1265%) hue-rotate(186deg) brightness(92%)" />
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

	<!-- Flask Name Section -->
	<form
		id="flaskUpdateForm"
		method="POST"
		action="?/update"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				await update();
				isSubmitting = false;
			};
		}}
		class="bg-white shadow-md rounded-lg p-4 mb-6"
	>
		<div class="mb-0">
			<FloatingLabelInput
				id="name"
				name="name"
				label="Flask Name"
				bind:value={name}
				required={true}
				disabled={isSubmitting || data.nameReadOnly}
				placeholder="UU-1-001"
			/>
			<div class="flex items-center gap-1 mt-1">
				<Info class="h-3 w-3 text-gray-400" />
				{#if data.nameReadOnly}
					<p class="text-xs text-amber-600">Name cannot be changed — this flask is placed in a box.</p>
				{:else}
					<p class="text-xs text-gray-500">Required. This name must be unique.</p>
				{/if}
			</div>
		</div>

		<!-- Hidden fields for Additional Details -->
		{#if data.nameReadOnly}
			<input type="hidden" name="name" value={name} />
		{/if}
		<input type="hidden" name="remarks" bind:value={remarks} />
		<input type="hidden" name="brokenAt" bind:value={brokenAt} />
	</form>

	<!-- Two Column Layout: Details (1/3) + Tabs (2/3) -->
	<div class="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4 mb-6">
		<!-- Additional Details Column -->
		<div class="bg-white shadow-md rounded-lg p-4">
			<details open class="group">
				<summary class="cursor-pointer list-none">
					<div class="flex items-center gap-2 py-2 text-gray-700 font-semibold">
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
						<div class="flex items-center gap-2">
							<div class="flex-1">
								<FloatingLabelDatePicker
									id="brokenAt"
									name="brokenAt"
									label="Broken Date"
									bind:value={brokenAt}
									disabled={isSubmitting || data.brokenAtReadOnly}
									placeholder="dd-mm-yyyy"
								/>
							</div>
							<button
								type="button"
								tabindex="-1"
								onclick={() => (brokenAt = formatForSubmission(new Date()))}
								disabled={isSubmitting || data.brokenAtReadOnly}
								title="Set to today"
								class="text-gray-400 hover:text-sky-600 disabled:text-gray-300 transition-colors flex-shrink-0"
							>
								<Check class="h-4 w-4" />
							</button>
						</div>
						<div class="flex items-center gap-1 mt-1">
							<Tooltip text="Date when the flask was broken (format: dd-mm-yyyy).">
								<Info class="h-3 w-3 text-gray-400 hover:text-gray-600" />
							</Tooltip>
							{#if data.brokenAtReadOnly}
								<p class="text-xs text-amber-600">Broken date cannot be changed — a repaired flask is linked to this flask.</p>
							{:else}
								<p class="text-xs text-gray-500">When flask was broken (format: dd-mm-yyyy)</p>
							{/if}
						</div>
					</div>
				</div>
			</details>
		</div>

		<!-- Tabbed Interface (Flask broken history & Low Pressure Events) -->
		<div class="bg-white shadow-md rounded-lg p-4">
			<!-- Tab Buttons -->
			<div class="flex border-b border-gray-200 mb-4">
				<button
					type="button"
					onclick={() => activeTab = 'tree'}
					class="flex items-center gap-2 px-4 py-2 font-medium transition-colors"
					class:text-sky-600={activeTab === 'tree'}
					class:border-b-2={activeTab === 'tree'}
					class:border-sky-600={activeTab === 'tree'}
					class:text-gray-600={activeTab !== 'tree'}
					class:hover:text-gray-800={activeTab !== 'tree'}
				>
					<GitBranch class="h-4 w-4" />
					Flask broken history
				</button>

				<button
					type="button"
					onclick={() => activeTab = 'events'}
					class="flex items-center gap-2 px-4 py-2 font-medium transition-colors"
					class:text-sky-600={activeTab === 'events'}
					class:border-b-2={activeTab === 'events'}
					class:border-sky-600={activeTab === 'events'}
					class:text-gray-600={activeTab !== 'events'}
					class:hover:text-gray-800={activeTab !== 'events'}
				>
					Low Pressure Events
				</button>
			</div>

			<!-- Tab Content -->
			<div class="min-h-[400px]">
				{#if activeTab === 'tree'}
					<div class="space-y-4">
						<!-- Flask Reference Tree -->
						<div class="bg-gray-50 rounded-lg p-4">
							<FlaskTreeView
								flaskId={data.flask.id}
								compact={false}
								refreshKey={treeRefreshKey}
								currentFlaskName={data.flask.name}
							/>
						</div>

						<!-- Conditional Repaired Flask Form -->
						{#if brokenAt}
							<div class="border-t pt-4">
								<form
									method="POST"
									action="?/addRepairedFlask"
									use:enhance={() => {
										isAddingRepaired = true;
										return async ({ result, update }) => {
											await update();
											isAddingRepaired = false;
											if (result.type === 'success') {
												repairedFlaskName = '';
												treeRefreshKey++;
											}
										};
									}}
								>
									<input type="hidden" name="brokenAt" bind:value={brokenAt} />
									<div class="flex items-center gap-2">
										<FloatingLabelInput
											id="repairedFlaskName"
											name="repairedFlaskName"
											label="Repaired Flask Name"
											bind:value={repairedFlaskName}
											required
											disabled={isAddingRepaired}
											placeholder="UU-1-002"
										/>
										<button
											type="submit"
											disabled={isAddingRepaired || !repairedFlaskName.trim()}
											class="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
										>
											<Plus class="h-4 w-4" />
										</button>
									</div>
									<div class="flex items-center gap-1 mt-1">
										<Info class="h-3 w-3 text-gray-400" />
										<p class="text-xs text-gray-500">Enter an existing or new flask name to link as repair</p>
									</div>
								</form>
							</div>
						{/if}
					</div>
				{/if}

				{#if activeTab === 'events'}
					<div>
						<!-- Compact scrollable list -->
						<div class="max-h-96 overflow-y-auto space-y-2 mb-4">
							{#each lowPressureEvents as event}
								<form
									method="POST"
									action="?/deleteLowPressureEvent"
									use:enhance={() => {
										deletingEventId = event.id;
										return async ({ result, update }) => {
											await update();
											deletingEventId = null;
										};
									}}
								>
									<div class="flex items-center gap-2 border-b border-gray-100 pb-2">
										<span class="flex-1 text-sm">
											{formatDateDisplay(new Date(event.lowPressureAt + 'T00:00:00Z'))}
										</span>
										<input type="hidden" name="eventId" value={event.id} />
										<button
											type="submit"
											disabled={deletingEventId === event.id}
											class="text-red-600 hover:text-red-700 disabled:text-gray-400"
										>
											<X class="h-4 w-4" />
										</button>
									</div>
								</form>
							{/each}
							{#if lowPressureEvents.length === 0}
								<p class="text-sm text-gray-500 italic">No low pressure events recorded</p>
							{/if}
						</div>

						<!-- Add new date form -->
						<form
							method="POST"
							action="?/addLowPressureEvent"
							use:enhance={() => {
								isAddingEvent = true;
								return async ({ result, update }) => {
									await update();
									isAddingEvent = false;
									if (result.type === 'success') {
										newLowPressureDate = '';
									}
								};
							}}
							class="border-t pt-4"
						>
							<div class="flex items-center gap-2">
								<FloatingLabelDatePicker
									id="newLowPressureDate"
									name="lowPressureAt"
									label="New Low Pressure Date"
									bind:value={newLowPressureDate}
									disabled={isAddingEvent}
									placeholder="dd-mm-yyyy"
								/>
								<button
									type="submit"
									disabled={!newLowPressureDate || isAddingEvent}
									class="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
								>
									<Plus class="h-4 w-4" />
								</button>
							</div>
							<p class="text-xs text-gray-500 mt-1">Date format: dd-mm-yyyy</p>
						</form>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Action Buttons -->
	<div class="bg-white shadow-md rounded-lg p-4">
		<div class="flex gap-4 justify-end">
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
					form="flaskUpdateForm"
					disabled={isSubmitting || !name.trim()}
					class="px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-medium"
				>
					{isSubmitting ? 'Updating...' : 'Update Flask'}
				</button>
		</div>
	</div>
</div>
