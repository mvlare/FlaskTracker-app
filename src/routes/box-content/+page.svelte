<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { ArrowLeft, Plus, Save, Edit, Trash2, X } from 'lucide-svelte';
	import FloatingLabelInput from '$lib/components/form/FloatingLabelInput.svelte';
	import FloatingLabelDatePicker from '$lib/components/form/FloatingLabelDatePicker.svelte';
	import { formatDateDisplay } from '$lib/utils/dates';

	let { data, form } = $props();

	// Box selection state
	let boxSearchQuery = $state('');
	let allBoxes = $state<Array<{ id: number; name: string }>>([]);
	let isLoadingBoxes = $state(true);

	// Filtered boxes based on search query
	let filteredBoxes = $derived(
		allBoxes.filter((box) => box.name.toLowerCase().includes(boxSearchQuery.toLowerCase()))
	);

	// Check if current search matches the selected box (to hide list when box is selected)
	let isBoxSelected = $derived(
		data.box && boxSearchQuery.trim().toLowerCase() === data.box.name.toLowerCase()
	);

	// Tab state: 'new' or 'returned'
	let activeTab = $state<'new' | 'returned'>('new');

	// For "Returned" tab: track which closed shipment is selected
	let selectedClosedShipmentId = $state<number | null>(null);

	// Derived: Which shipment is focused based on tab
	let focusedShipmentId = $derived(
		activeTab === 'new' ? data.openShipment?.id || null : selectedClosedShipmentId
	);

	// Derived: Is flasks table editable? (only if "New" tab is active)
	let isBlock3Editable = $derived(activeTab === 'new');

	// Form states
	let isSubmitting = $state(false);
	let editingLineId = $state<number | null>(null);

	// Add flask form state
	let showAddFlask = $state(false);
	let newLineFlaskId = $state('');
	let newLineRemarks = $state('');

	// Load all boxes on mount
	$effect(() => {
		fetch('/api/boxes')
			.then((res) => res.json())
			.then((boxes) => {
				allBoxes = boxes;
				isLoadingBoxes = false;
			})
			.catch((err) => {
				console.error('Failed to load boxes:', err);
				isLoadingBoxes = false;
			});
	});

	// Pre-fill search field when a box is selected
	$effect(() => {
		if (data.box && boxSearchQuery === '') {
			boxSearchQuery = data.box.name;
		}
	});

	function handleBoxSelect(boxId: number, boxName: string) {
		boxSearchQuery = boxName;
		goto(`/box-content?boxId=${boxId}`);
	}

	function handleBoxSearchKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && filteredBoxes.length > 0) {
			event.preventDefault();
			const firstMatch = filteredBoxes[0];
			handleBoxSelect(firstMatch.id, firstMatch.name);
		}
	}

	function handleCancelSelection() {
		goto('/');
	}

	function handleClosedShipmentClick(shipmentId: number) {
		selectedClosedShipmentId = shipmentId;
	}

	function resetAddFlaskForm() {
		showAddFlask = false;
		newLineFlaskId = '';
		newLineRemarks = '';
	}

	function confirmDelete(name: string): boolean {
		return confirm(`Are you sure you want to delete flask ${name}?`);
	}
</script>

<div class="min-h-screen bg-gray-50 p-6">
	<div class="max-w-7xl mx-auto">
		<!-- Header: Title and Back Button -->
		<div class="mb-6">
			<button
				onclick={() => goto('/')}
				class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
			>
				<ArrowLeft class="h-4 w-4" />
				Back to Flasks
			</button>
			<h1 class="text-3xl font-bold text-gray-900 mb-4">Box shipments</h1>

			<!-- Search Box Listbox with Cancel Button (below title, left-aligned, width matches shipments panel) -->
			<div class="w-full lg:w-2/5">
				<div class="flex gap-2 items-start">
					<div class="flex-1 bg-white rounded-lg shadow border border-gray-200">
						<div
							class="p-3 {!isBoxSelected && boxSearchQuery.length > 0 ? 'border-b border-gray-200' : ''}"
						>
							<div class="relative">
								<input
									id="boxSearch"
									name="boxSearch"
									type="text"
									bind:value={boxSearchQuery}
									onkeydown={handleBoxSearchKeydown}
									placeholder=" "
									disabled={isLoadingBoxes}
									class="block w-full px-3 pt-6 pb-2 text-gray-900 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent peer disabled:bg-gray-100 {isBoxSelected
										? 'font-bold'
										: ''}"
								/>
								<label
									for="boxSearch"
									class="absolute text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] start-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-disabled:text-gray-400"
								>
									Box name
								</label>
							</div>
						</div>

						{#if !isBoxSelected && boxSearchQuery.length > 0}
							<div class="max-h-48 overflow-y-auto">
								{#if filteredBoxes.length > 0}
									{#each filteredBoxes as box}
										<button
											type="button"
											onclick={() => handleBoxSelect(box.id, box.name)}
											class="w-full text-left px-4 py-2 text-sm hover:bg-sky-50 transition-colors border-b border-gray-100 last:border-b-0"
										>
											{box.name}
										</button>
									{/each}
								{:else}
									<div class="px-4 py-3 text-sm text-gray-500 text-center">No boxes found</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Error message -->
		{#if form?.error}
			<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
				{form.error}
			</div>
		{/if}

		<!-- Success message -->
		{#if form?.success}
			<div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
				Operation completed successfully
			</div>
		{/if}

		<!-- Selected Box Content -->
		{#if data.box}
			<!-- Side-by-side: Shipments (40%) + Flasks (60%) - Responsive: stacks on smaller screens -->
			<div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
				<!-- LEFT: Tabbed Shipments Panel (2/5 width on large screens, full width on small) -->
				<div class="col-span-1 lg:col-span-2 bg-white rounded-lg shadow p-6">
					<!-- Tabs -->
					<div class="flex border-b border-gray-200 mb-4">
						<button
							type="button"
							onclick={() => (activeTab = 'new')}
							class="px-4 py-2 border-b-2 transition-all {activeTab === 'new'
								? 'border-sky-500 text-sky-600 font-semibold'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
						>
							New
						</button>
						<button
							type="button"
							onclick={() => (activeTab = 'returned')}
							class="px-4 py-2 border-b-2 transition-all {activeTab === 'returned'
								? 'border-sky-500 text-sky-600 font-semibold'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
						>
							Returned
						</button>
					</div>

					<!-- Tab Content -->
					{#if activeTab === 'new'}
						<!-- NEW TAB: Open shipment form -->
						{#if data.openShipment}
							{@const openShipment = data.openShipment}
							<form
								method="POST"
								action="?/updateHeader"
								use:enhance={() => {
									isSubmitting = true;
									return async ({ update }) => {
										isSubmitting = false;
										await update();
									};
								}}
							>
								<input type="hidden" name="headerId" value={openShipment.id} />

								<div class="space-y-4">
									<FloatingLabelInput
										id="destination"
										name="destinationText"
										label="Destination"
										type="text"
										value={openShipment.destinationText || ''}
										disabled={isSubmitting}
									/>

									<FloatingLabelDatePicker
										id="readyAt"
										name="readyAt"
										label="Ready"
										value={openShipment.readyAt
											? openShipment.readyAt.toISOString().split('T')[0]
											: ''}
										disabled={isSubmitting}
										placeholder="dd-mm-yyyy"
									/>

									<FloatingLabelDatePicker
										id="returnedAt"
										name="returnedAt"
										label="Returned"
										value={openShipment.returnedAt
											? openShipment.returnedAt.toISOString().split('T')[0]
											: ''}
										disabled={isSubmitting}
										placeholder="dd-mm-yyyy"
									/>

									<!-- Remarks Textarea (3 lines) -->
									<div class="relative">
										<textarea
											id="remarks"
											name="remarks"
											rows="3"
											disabled={isSubmitting}
											placeholder=" "
											class="block w-full px-3 pt-6 pb-2 text-gray-900 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent peer disabled:bg-gray-100 resize-none"
											value={openShipment.remarks || ''}
										></textarea>
										<label
											for="remarks"
											class="absolute text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] start-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-disabled:text-gray-400"
										>
											Remarks
										</label>
									</div>

									<div class="flex gap-2">
										<button
											type="button"
											onclick={handleCancelSelection}
											disabled={isSubmitting}
											class="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
										>
											Cancel
										</button>
										<button
											type="submit"
											disabled={isSubmitting}
											class="px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-medium"
										>
											{isSubmitting ? 'Saving...' : 'Save'}
										</button>
									</div>
								</div>
							</form>
						{:else}
							<div class="text-gray-500 text-center py-8">
								<p class="mb-4">No open shipment.</p>
								<form
									method="POST"
									action="?/createHeader"
									use:enhance={() => {
										isSubmitting = true;
										return async ({ update }) => {
											isSubmitting = false;
											await update();
										};
									}}
								>
									<input type="hidden" name="boxId" value={data.box.id} />
									<button
										type="submit"
										disabled={isSubmitting}
										class="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 text-gray-800 rounded-md hover:bg-sky-600 disabled:bg-gray-300 disabled:text-gray-500 transition-colors font-medium shadow-sm"
									>
										<Plus class="h-4 w-4" />
										Create New Shipment
									</button>
								</form>
							</div>
						{/if}
					{:else}
						<!-- RETURNED TAB: List of closed shipments -->
						{#if data.closedShipments.length === 0}
							<p class="text-gray-500 text-center py-8">No closed shipments yet.</p>
						{:else}
							<div class="space-y-2 max-h-[600px] overflow-y-auto">
								{#each data.closedShipments as closedShipment}
									<div
										class="cursor-pointer border rounded-lg p-3 transition-all {selectedClosedShipmentId ===
										closedShipment.id
											? 'border-sky-500 bg-sky-50'
											: 'border-gray-200 bg-white hover:border-gray-300'}"
										onclick={() => handleClosedShipmentClick(closedShipment.id)}
										role="button"
										tabindex="0"
										onkeydown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												handleClosedShipmentClick(closedShipment.id);
											}
										}}
									>
										<p class="text-sm text-gray-600">
											<span class="font-medium"
												>Dest: {closedShipment.destinationText || 'N/A'}</span
											>
										</p>
										<p class="text-sm text-gray-600">
											Ready: {closedShipment.readyAt
												? formatDateDisplay(closedShipment.readyAt)
												: 'N/A'}
										</p>
										<p class="text-sm text-gray-600">
											Returned: {closedShipment.returnedAt
												? formatDateDisplay(closedShipment.returnedAt)
												: 'N/A'}
										</p>
										{#if closedShipment.remarks}
											<p class="text-sm text-gray-500 italic">{closedShipment.remarks}</p>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					{/if}
				</div>

				<!-- RIGHT: Flasks Table (3/5 width on large screens, full width on small) -->
				<div class="col-span-1 lg:col-span-3 bg-white rounded-lg shadow p-6">
					<div class="flex justify-between items-center mb-3">
						<h2 class="text-lg font-semibold text-gray-900">Flasks of shipment</h2>
						{#if isBlock3Editable && focusedShipmentId}
							<button
								type="button"
								onclick={() => (showAddFlask = !showAddFlask)}
								disabled={data.focusedShipmentLines.length >= 15}
								class="flex items-center gap-2 px-3 py-1.5 text-sm bg-sky-500 text-gray-800 rounded-md hover:bg-sky-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
							>
								<Plus class="h-4 w-4" />
								Add Flask {data.focusedShipmentLines.length >= 15 ? '(Max 15)' : ''}
							</button>
						{/if}
					</div>

					<!-- Add Flask Form -->
					{#if showAddFlask && isBlock3Editable && focusedShipmentId}
						<form
							method="POST"
							action="?/addLine"
							use:enhance={() => {
								isSubmitting = true;
								return async ({ result, update }) => {
									isSubmitting = false;
									if (result.type === 'success') {
										resetAddFlaskForm();
									}
									await update();
								};
							}}
							class="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
						>
							<input type="hidden" name="headerId" value={focusedShipmentId} />

							<div class="grid grid-cols-2 gap-3 mb-3">
								<div>
									<label for="flaskId" class="block text-sm font-medium text-gray-700 mb-1">
										Flask
									</label>
									<select
										id="flaskId"
										name="flaskId"
										bind:value={newLineFlaskId}
										required
										disabled={isSubmitting}
										class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-100"
									>
										<option value="">Select...</option>
										{#await fetch('/api/flasks').then((r) => r.json())}
											<option>Loading...</option>
										{:then flasks}
											{#each flasks as flask}
												<option value={flask.id}>{flask.name}</option>
											{/each}
										{/await}
									</select>
								</div>

								<FloatingLabelInput
									id="newLineRemarks"
									name="remarks"
									label="Remarks"
									type="text"
									bind:value={newLineRemarks}
									disabled={isSubmitting}
								/>
							</div>

							<div class="flex gap-2">
								<button
									type="submit"
									disabled={isSubmitting || !newLineFlaskId}
									class="flex items-center gap-1 px-3 py-1.5 text-sm bg-sky-500 text-gray-800 rounded-md hover:bg-sky-600 disabled:bg-gray-300 disabled:text-gray-500 transition-colors font-medium shadow-sm"
								>
									<Plus class="h-4 w-4" />
									Add
								</button>
								<button
									type="button"
									onclick={resetAddFlaskForm}
									disabled={isSubmitting}
									class="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:bg-gray-300 disabled:text-gray-500 transition-colors font-medium"
								>
									<X class="h-4 w-4" />
									Cancel
								</button>
							</div>
						</form>
					{/if}

					<!-- Compact Flasks Table -->
					{#if !focusedShipmentId}
						<p class="text-gray-500 text-center py-8 text-sm">
							Select a shipment to view its flasks.
						</p>
					{:else if data.focusedShipmentLines.length === 0}
						<p class="text-gray-500 text-center py-8 text-sm">No flasks in this shipment yet.</p>
					{:else}
						<div class="overflow-x-auto">
							<table class="w-full text-sm">
								<thead class="bg-gray-50">
									<tr>
										<th class="w-12 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
											ID
										</th>
										<th class="w-32 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
											Name
										</th>
										<th class="w-48 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
											Remarks
										</th>
										{#if isBlock3Editable}
											<th
												class="w-20 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase"
											>
												Actions
											</th>
										{/if}
									</tr>
								</thead>
								<tbody class="bg-white divide-y divide-gray-200">
									{#each data.focusedShipmentLines as line}
										<tr>
											<td class="px-2 py-2 text-gray-900">
												{line.flask.id}
											</td>
											<td class="px-2 py-2 font-medium text-gray-900">
												{line.flask.name}
											</td>
											<td class="px-2 py-2 text-gray-700 max-w-48 truncate">
												{#if editingLineId === line.id && isBlock3Editable}
													<form
														method="POST"
														action="?/updateLine"
														use:enhance={() => {
															isSubmitting = true;
															return async ({ result, update }) => {
																isSubmitting = false;
																if (result.type === 'success') {
																	editingLineId = null;
																}
																await update();
															};
														}}
														class="flex gap-1"
													>
														<input type="hidden" name="lineId" value={line.id} />
														<FloatingLabelInput
															id="lineRemarks-{line.id}"
															name="remarks"
															label="Remarks"
															type="text"
															value={line.remarks || ''}
															disabled={isSubmitting}
														/>
														<button
															type="submit"
															disabled={isSubmitting}
															class="px-2 py-1 bg-sky-500 text-gray-800 rounded hover:bg-sky-600 disabled:bg-gray-300 text-xs"
														>
															Save
														</button>
														<button
															type="button"
															onclick={() => (editingLineId = null)}
															disabled={isSubmitting}
															class="px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-xs"
														>
															Cancel
														</button>
													</form>
												{:else}
													<span class="block truncate" title={line.remarks || '-'}>
														{line.remarks || '-'}
													</span>
												{/if}
											</td>
											{#if isBlock3Editable}
												<td class="px-2 py-2">
													{#if editingLineId !== line.id}
														<div class="flex gap-1">
															<button
																type="button"
																onclick={() => (editingLineId = line.id)}
																class="text-sky-600 hover:text-sky-900"
																title="Edit"
															>
																<Edit class="h-4 w-4" />
															</button>
															<form
																method="POST"
																action="?/deleteLine"
																use:enhance={() => {
																	if (!confirmDelete(line.flask.name)) {
																		return () => {};
																	}
																	isSubmitting = true;
																	return async ({ update }) => {
																		isSubmitting = false;
																		await update();
																	};
																}}
																class="inline"
															>
																<input type="hidden" name="lineId" value={line.id} />
																<button
																	type="submit"
																	disabled={isSubmitting}
																	class="text-red-600 hover:text-red-900 disabled:text-gray-400"
																	title="Delete"
																>
																	<Trash2 class="h-4 w-4" />
																</button>
															</form>
														</div>
													{/if}
												</td>
											{/if}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			</div>
		{:else if $page.url.searchParams.get('boxId')}
			<div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
				<p class="text-sm text-amber-800">
					{data.error || 'Box not found. Please select a different box from the list above.'}
				</p>
			</div>
		{/if}
	</div>
</div>
