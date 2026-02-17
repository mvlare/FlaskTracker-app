<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { ArrowLeft, Plus, Save, Edit, Trash2, X, List, Search, Copy, Clipboard } from 'lucide-svelte';
	import FloatingLabelInput from '$lib/components/form/FloatingLabelInput.svelte';
	import FloatingLabelDatePicker from '$lib/components/form/FloatingLabelDatePicker.svelte';
	import { formatDateDisplay } from '$lib/utils/dates';

	let { data, form } = $props();

	// Box selection state
	let boxSearchQuery = $state('');
	let allBoxes = $state<Array<{ id: number; name: string }>>([]);
	let isLoadingBoxes = $state(true);
	let isPickerOpen = $state(false);
	let pickerContainerRef: HTMLDivElement | undefined = $state();

	// Filtered boxes based on search query
	let filteredBoxes = $derived(
		allBoxes.filter((box) => box.name.toLowerCase().includes(boxSearchQuery.toLowerCase()))
	);

	// Bold field when the typed text matches the currently selected box
	let isBoxSelected = $derived(
		!!data.box && boxSearchQuery.trim().toLowerCase() === data.box.name.toLowerCase()
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

	// Derived: focused shipment object for date display
	let focusedShipment = $derived(
		activeTab === 'new'
			? (data.openShipment ?? null)
			: (data.closedShipments.find((s) => s.id === selectedClosedShipmentId) ?? null)
	);

	// Form states
	let isSubmitting = $state(false);
	let editingLineId = $state<number | null>(null);
	let showCopyConfirm = $state(false);
	let clipboardCopied = $state(false);
	let copyFormEl = $state<HTMLFormElement | null>(null);
	let showDeleteConfirm = $state(false);
	let deleteFlaskName = $state('');
	let deleteLineId = $state<number | null>(null);

	// Open shipment form error
	let headerError = $state('');

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

	// Pre-fill search field with selected box name whenever the box changes
	$effect(() => {
		const _boxId = data.box?.id; // track this dependency
		boxSearchQuery = data.box ? data.box.name : '';
	});

	// Reset panel state whenever the selected box or focused shipment changes
	$effect(() => {
		const _boxId = data.box?.id; // track box changes
		const fId = data.focusedShipmentId; // track focused shipment changes

		if (fId && fId !== data.openShipment?.id) {
			activeTab = 'returned';
			selectedClosedShipmentId = fId;
		} else {
			activeTab = 'new';
			selectedClosedShipmentId = null;
		}

		showAddFlask = false;
		editingLineId = null;
		newLineFlaskId = '';
		newLineRemarks = '';
	});

	function handleBoxSelect(boxId: number, boxName: string) {
		boxSearchQuery = boxName;
		isPickerOpen = false;
		goto(`/box-content?boxId=${boxId}`);
	}

	function handlePickerClickOutside(event: MouseEvent) {
		if (isPickerOpen && pickerContainerRef && !pickerContainerRef.contains(event.target as Node)) {
			isPickerOpen = false;
		}
	}

	$effect(() => {
		if (isPickerOpen) {
			document.addEventListener('click', handlePickerClickOutside);
			return () => document.removeEventListener('click', handlePickerClickOutside);
		}
	});

	function handleBoxSearchKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && filteredBoxes.length > 0) {
			event.preventDefault();
			handleBoxSelect(filteredBoxes[0].id, filteredBoxes[0].name);
		}
		if (event.key === 'Escape') {
			isPickerOpen = false;
		}
	}

	function handleCancelSelection() {
		goto('/');
	}

	function handleClosedShipmentClick(shipmentId: number) {
		goto(`/box-content?boxId=${data.box!.id}&focusedShipmentId=${shipmentId}`);
	}

	async function copyTableToClipboard() {
		const header = 'ID\tName\tRemarks';
		const rows = data.focusedShipmentLines.map(
			(line) => `${line.flask.id}\t${line.flask.name}\t${line.remarks ?? ''}`
		);
		const tsv = [header, ...rows].join('\n');
		await navigator.clipboard.writeText(tsv);
		clipboardCopied = true;
		setTimeout(() => (clipboardCopied = false), 2000);
	}

	function resetAddFlaskForm() {
		showAddFlask = false;
		newLineFlaskId = '';
		newLineRemarks = '';
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
						<div class="p-3 {isPickerOpen ? 'border-b border-gray-200' : ''}">
							<div class="relative" bind:this={pickerContainerRef}>
								<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
								<input
									id="boxSearch"
									name="boxSearch"
									type="text"
									bind:value={boxSearchQuery}
									onkeydown={handleBoxSearchKeydown}
									placeholder=" "
									disabled={isLoadingBoxes}
									class="block w-full pl-10 pt-6 pb-2 pr-14 text-gray-900 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent peer disabled:bg-gray-100 {isBoxSelected
										? 'font-bold'
										: ''}"
								/>
								<label
									for="boxSearch"
									class="absolute text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-left start-10 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-disabled:text-gray-400"
								>
									Search Box name
								</label>
								<div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
									{#if boxSearchQuery.length > 0}
										<button
											type="button"
											onclick={() => (boxSearchQuery = '')}
											tabindex="-1"
											class="text-gray-400 hover:text-gray-600 transition-colors"
										>
											<X class="h-4 w-4" />
										</button>
									{/if}
									<button
										type="button"
										onclick={() => (isPickerOpen = !isPickerOpen)}
										disabled={isLoadingBoxes}
										tabindex="-1"
										class="text-gray-400 hover:text-gray-600 transition-colors"
									>
										<List class="h-4 w-4" />
									</button>
								</div>
							</div>
						</div>

						{#if isPickerOpen}
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
							onclick={() => {
								activeTab = 'new';
								goto(`/box-content?boxId=${data.box!.id}`);
							}}
							class="px-4 py-2 border-b-2 transition-all {activeTab === 'new'
								? 'border-sky-500 text-sky-600 font-semibold'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
						>
							New
						</button>
						<button
							type="button"
							onclick={() => {
								activeTab = 'returned';
								if (data.closedShipments.length > 0) {
									handleClosedShipmentClick(data.closedShipments[0].id);
								}
							}}
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
								use:enhance={({ formData, cancel }) => {
									const destination = (formData.get('destinationText') as string) ?? '';
									const returnedAt = (formData.get('returnedAt') as string) ?? '';
									if (returnedAt && !destination.trim()) {
										headerError = 'Destination is required when a return date is set.';
										cancel();
										return;
									}
									headerError = '';
									isSubmitting = true;
									return async ({ update }) => {
										isSubmitting = false;
										await update({ reset: false });
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
											class="absolute text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-left start-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-disabled:text-gray-400"
										>
											Remarks
										</label>
									</div>

									{#if headerError}
										<p class="text-sm text-red-600">{headerError}</p>
									{/if}

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
						<!-- RETURNED TAB: List of closed shipments + readonly detail fields -->
						{#if data.closedShipments.length === 0}
							<p class="text-gray-500 text-center py-8">No closed shipments yet.</p>
						{:else}
							<!-- Compact selector list -->
							<div class="space-y-1.5 max-h-36 overflow-y-auto mb-4">
								{#each data.closedShipments as closedShipment}
									<div
										class="cursor-pointer border rounded-lg px-3 py-2 transition-all {selectedClosedShipmentId ===
										closedShipment.id
											? 'border-sky-500 bg-sky-50'
											: 'border-gray-200 bg-gray-50 opacity-50 hover:opacity-100 hover:border-gray-300'}"
										onclick={() => handleClosedShipmentClick(closedShipment.id)}
										role="button"
										tabindex="0"
										onkeydown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												handleClosedShipmentClick(closedShipment.id);
											}
										}}
									>
										<p class="text-sm font-medium text-gray-800 truncate">
											{closedShipment.destinationText || 'N/A'}
										</p>
										<p class="text-xs text-gray-500">
											{closedShipment.readyAt
												? formatDateDisplay(closedShipment.readyAt)
												: 'N/A'} → {closedShipment.returnedAt
												? formatDateDisplay(closedShipment.returnedAt)
												: 'N/A'}
										</p>
									</div>
								{/each}
							</div>

							<!-- Readonly detail fields for selected shipment -->
							{#if selectedClosedShipmentId}
								<hr class="border-t border-gray-300 my-2" />
								{@const selected = data.closedShipments.find(
									(s) => s.id === selectedClosedShipmentId
								)}
								{#if selected}
									<div class="space-y-4">
										<div class="relative">
											<input
												id="selectedDestination"
												type="text"
												readonly
												value={selected.destinationText || ''}
												class="w-full px-4 py-2 pt-6 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
											/>
											<label
												for="selectedDestination"
												class="absolute left-3 top-2 text-xs text-gray-600 bg-white px-1 pointer-events-none select-none"
											>
												Destination
											</label>
										</div>

										<div class="relative">
											<input
												id="selectedReadyAt"
												type="text"
												readonly
												value={selected.readyAt ? formatDateDisplay(selected.readyAt) : ''}
												class="w-full px-4 py-2 pt-6 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
											/>
											<label
												for="selectedReadyAt"
												class="absolute left-3 top-2 text-xs text-gray-600 bg-white px-1 pointer-events-none select-none"
											>
												Ready
											</label>
										</div>

										<div class="relative">
											<input
												id="selectedReturnedAt"
												type="text"
												readonly
												value={selected.returnedAt
													? formatDateDisplay(selected.returnedAt)
													: ''}
												class="w-full px-4 py-2 pt-6 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
											/>
											<label
												for="selectedReturnedAt"
												class="absolute left-3 top-2 text-xs text-gray-600 bg-white px-1 pointer-events-none select-none"
											>
												Returned
											</label>
										</div>

										<div class="relative">
											<textarea
												id="selectedRemarks"
												readonly
												rows="3"
												class="w-full px-4 py-2 pt-6 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all resize-none"
											>{selected.remarks || ''}</textarea>
											<label
												for="selectedRemarks"
												class="absolute left-3 top-2 text-xs text-gray-600 bg-white px-1 pointer-events-none select-none"
											>
												Remarks
											</label>
										</div>
									</div>
								{/if}
							{/if}
						{/if}
					{/if}
				</div>

				<!-- RIGHT: Flasks Table (3/5 width on large screens, full width on small) -->
				<div class="col-span-1 lg:col-span-3 bg-white rounded-lg shadow p-6">
					<div class="flex justify-between items-center mb-3">
						<div>
							<h2 class="text-lg font-semibold text-gray-900">Flasks of shipment{data.box ? ` — ${data.box.name}` : ''}</h2>
							{#if focusedShipment && (focusedShipment.readyAt || focusedShipment.returnedAt)}
								<p class="text-xs text-gray-500 mt-0.5">
									{focusedShipment.readyAt ? formatDateDisplay(focusedShipment.readyAt) : '?'}
									→
									{focusedShipment.returnedAt ? formatDateDisplay(focusedShipment.returnedAt) : '?'}
								</p>
							{/if}
						</div>
						{#if isBlock3Editable && focusedShipmentId}
							<div class="flex gap-2">
								{#if data.closedShipments.length > 0}
									<form
										method="POST"
										action="?/copyLastReturn"
										bind:this={copyFormEl}
										use:enhance={() => {
											isSubmitting = true;
											return async ({ update }) => {
												isSubmitting = false;
												await update();
											};
										}}
									>
										<input type="hidden" name="headerId" value={focusedShipmentId} />
										<input type="hidden" name="boxId" value={data.box!.id} />
										<button
											type="button"
											disabled={isSubmitting}
											onclick={() => (showCopyConfirm = true)}
											class="flex items-center gap-2 px-3 py-1.5 text-sm bg-sky-500 text-gray-800 rounded-md hover:bg-sky-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
										>
											<Copy class="h-4 w-4" />
											Copy last return
										</button>
									</form>
								{/if}
								<button
									type="button"
									onclick={() => (showAddFlask = !showAddFlask)}
									disabled={data.focusedShipmentLines.length >= 15}
									class="flex items-center gap-2 px-3 py-1.5 text-sm bg-sky-500 text-gray-800 rounded-md hover:bg-sky-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
								>
									<Plus class="h-4 w-4" />
									Add Flask {data.focusedShipmentLines.length >= 15 ? '(Max 15)' : ''}
								</button>
							</div>
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
						<div class="flex justify-end mb-2">
							<button
								type="button"
								onclick={copyTableToClipboard}
								class="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
							>
								<Clipboard class="h-3.5 w-3.5" />
								{clipboardCopied ? "Copied!" : "Copy table"}
							</button>
						</div>
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
															<button
																type="button"
																disabled={isSubmitting}
																onclick={() => { deleteLineId = line.id; deleteFlaskName = line.flask.name; showDeleteConfirm = true; }}
																class="text-red-600 hover:text-red-900 disabled:text-gray-400"
																title="Delete"
															>
																<Trash2 class="h-4 w-4" />
															</button>
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
		{:else if !data.box && $page.url.searchParams.get('boxId')}
			<div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
				<p class="text-sm text-amber-800">
					{data.error || 'Box not found. Please select a different box from the list above.'}
				</p>
			</div>
		{/if}
	</div>

{#if showCopyConfirm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
			<h3 class="mb-2 text-lg font-semibold text-gray-900">Copy last return</h3>
			<p class="mb-6 text-sm text-gray-600">
				Copy all flasks from the last returned shipment to this shipment?
			</p>
			<div class="flex justify-end gap-3">
				<button
					type="button"
					onclick={() => (showCopyConfirm = false)}
					class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={() => { showCopyConfirm = false; copyFormEl?.requestSubmit(); }}
					class="rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-sky-600 transition-colors"
				>
					Copy
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showDeleteConfirm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
			<h3 class="mb-2 text-lg font-semibold text-gray-900">Delete flask</h3>
			<p class="mb-6 text-sm text-gray-600">
				Are you sure you want to delete flask <strong>{deleteFlaskName}</strong>?
			</p>
			<div class="flex justify-end gap-3">
				<button
					type="button"
					onclick={() => (showDeleteConfirm = false)}
					class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
				>
					Cancel
				</button>
				<form
					method="POST"
					action="?/deleteLine"
					use:enhance={() => {
						isSubmitting = true;
						showDeleteConfirm = false;
						return async ({ update }) => {
							isSubmitting = false;
							await update();
						};
					}}
				>
					<input type="hidden" name="lineId" value={deleteLineId} />
					<button
						type="submit"
						class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
					>
						Delete
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
</div>
