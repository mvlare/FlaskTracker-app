<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { ArrowLeft, Plus, Save, Edit, Trash2, X, List, Search, Copy, Clipboard, Pencil, ArrowUpAZ, Maximize2, Minimize2, Check, Wind } from 'lucide-svelte';
	import FloatingLabelInput from '$lib/components/form/FloatingLabelInput.svelte';
	import FloatingLabelDatePicker from '$lib/components/form/FloatingLabelDatePicker.svelte';
	import { formatDateDisplay, formatForSubmission } from '$lib/utils/dates';

	let { data, form } = $props();

	// Capture the flask to restore on the landing page (set once on mount, unaffected by internal navigation)
	let returnFlaskId: string | null = null;
	onMount(() => {
		returnFlaskId = new URLSearchParams(window.location.search).get('returnFlaskId');
	});

	function handleBackToFlasks() {
		goto(returnFlaskId ? `/?flaskId=${returnFlaskId}` : '/');
	}

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

	// Remarks expand states
	let shipmentRemarksExpanded = $state(false);
	let returnedRemarksExpanded = $state(false);
	let flaskLineEditExpanded = $state(false);

	// View remarks modal (for flask line display mode)
	let showViewRemarks = $state(false);
	let viewRemarksText = $state('');

	let readyAtValue = $state('');
	let returnedAtValue = $state('');

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
		shipmentRemarksExpanded = false;
		returnedRemarksExpanded = false;
		flaskLineEditExpanded = false;
		readyAtValue = data.openShipment?.readyAt
			? data.openShipment.readyAt.toISOString().split('T')[0]
			: '';
		returnedAtValue = data.openShipment?.returnedAt
			? data.openShipment.returnedAt.toISOString().split('T')[0]
			: '';
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
		handleBackToFlasks();
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
		<div class="mb-4">
			<button
				onclick={handleBackToFlasks}
				class="flex items-center gap-2 text-sky-600 hover:text-sky-700 mb-2"
			>
				<ArrowLeft class="h-4 w-4" />
				Home
			</button>
			<h1 class="text-3xl font-bold text-gray-900">Boxes</h1>
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

		<!-- Main grid: always visible -->
		<div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
			<!-- LEFT column: Box search (always) + Shipments panel (when box selected) -->
			<div class="col-span-1 lg:col-span-2 flex flex-col gap-2">
				<!-- Box search (always visible) -->
				<div class="bg-white rounded-lg shadow border border-gray-200">
					<div class="p-3 {isPickerOpen ? 'border-b border-gray-200' : ''}">
						<div class="relative" bind:this={pickerContainerRef}>
							<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
							<input
								id="boxSearch"
								name="boxSearch"
								type="text"
								autocomplete="off"
								bind:value={boxSearchQuery}
								onfocus={() => (isPickerOpen = true)}
								onkeydown={handleBoxSearchKeydown}
								placeholder=" "
								disabled={isLoadingBoxes}
								class="block w-full pl-10 pt-6 pb-2 pr-10 text-gray-900 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent peer disabled:bg-gray-100 {isBoxSelected
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

				{#if data.box && data.closedShipments.length === 0}
					<button
						type="button"
						onclick={() => goto(`/boxes/${data.box!.id}/edit`)}
						class="self-start flex items-center gap-1.5 px-3 py-1 text-sm border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
					>
						<Pencil class="h-4 w-4" />
						Edit Box
					</button>
				{/if}

				<!-- Shipments panel (only when a box is selected) -->
				{#if data.box}
					<div class="bg-white rounded-lg shadow p-6">
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
								Current
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
								History
							</button>
						</div>

						<!-- Tab Content -->
						{#if activeTab === 'new'}
							<!-- NEW TAB: Unified form (creates or updates header) -->
							<form
								method="POST"
								action={data.openShipment ? '?/updateHeader' : '?/createHeader'}
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
								{#if data.openShipment}
									<input type="hidden" name="headerId" value={data.openShipment.id} />
								{:else}
									<input type="hidden" name="boxId" value={data.box.id} />
								{/if}

								<div class="space-y-4">
									<FloatingLabelInput
										id="destination"
										name="destinationText"
										label="Destination"
										type="text"
										value={data.openShipment?.destinationText || ''}
										disabled={isSubmitting}
									/>

									<div class="flex items-center gap-2">
										<div class="flex-1">
											<FloatingLabelDatePicker
												id="readyAt"
												name="readyAt"
												label="Ready"
												bind:value={readyAtValue}
												disabled={isSubmitting}
												placeholder="dd-mm-yyyy"
											/>
										</div>
										<button
											type="button"
											tabindex="-1"
											onclick={() => (readyAtValue = formatForSubmission(new Date()))}
											disabled={isSubmitting}
											title="Set to today"
											class="text-gray-400 hover:text-sky-600 disabled:text-gray-300 transition-colors flex-shrink-0"
										>
											<Check class="h-4 w-4" />
										</button>
									</div>

									<div class="flex items-center gap-2">
										<div class="flex-1">
											<FloatingLabelDatePicker
												id="returnedAt"
												name="returnedAt"
												label="Returned"
												bind:value={returnedAtValue}
												disabled={isSubmitting}
												placeholder="dd-mm-yyyy"
											/>
										</div>
										<button
											type="button"
											tabindex="-1"
											onclick={() => (returnedAtValue = formatForSubmission(new Date()))}
											disabled={isSubmitting}
											title="Set to today"
											class="text-gray-400 hover:text-sky-600 disabled:text-gray-300 transition-colors flex-shrink-0"
										>
											<Check class="h-4 w-4" />
										</button>
									</div>

									<!-- Remarks Textarea with expand toggle -->
									<div class="relative">
										<textarea
											id="remarks"
											name="remarks"
											rows={shipmentRemarksExpanded ? 10 : 3}
											disabled={isSubmitting}
											placeholder=" "
											class="block w-full px-3 pt-6 pb-2 pr-8 text-gray-900 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent peer disabled:bg-gray-100 resize-none"
											value={data.openShipment?.remarks || ''}
										></textarea>
										<label
											for="remarks"
											class="absolute text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-left start-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-disabled:text-gray-400"
										>
											Remarks
										</label>
										<button
											type="button"
											tabindex="-1"
											onclick={() => (shipmentRemarksExpanded = !shipmentRemarksExpanded)}
											class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
											title={shipmentRemarksExpanded ? 'Collapse' : 'Expand'}
										>
											{#if shipmentRemarksExpanded}
												<Minimize2 class="h-3.5 w-3.5" />
											{:else}
												<Maximize2 class="h-3.5 w-3.5" />
											{/if}
										</button>
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
							<!-- RETURNED TAB: List of closed shipments + readonly detail fields -->
							{#if data.closedShipments.length === 0}
								<p class="text-gray-500 text-center py-8">No history yet.</p>
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

											<!-- Readonly remarks with expand toggle -->
											<div class="relative">
												<textarea
													id="selectedRemarks"
													readonly
													rows={returnedRemarksExpanded ? 10 : 3}
													class="w-full px-4 py-2 pt-6 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all resize-none"
												>{selected.remarks || ''}</textarea>
												<label
													for="selectedRemarks"
													class="absolute left-3 top-2 text-xs text-gray-600 bg-white px-1 pointer-events-none select-none"
												>
													Remarks
												</label>
												<button
													type="button"
													tabindex="-1"
													onclick={() => (returnedRemarksExpanded = !returnedRemarksExpanded)}
													class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
													title={returnedRemarksExpanded ? 'Collapse' : 'Expand'}
												>
													{#if returnedRemarksExpanded}
														<Minimize2 class="h-3.5 w-3.5" />
													{:else}
														<Maximize2 class="h-3.5 w-3.5" />
													{/if}
												</button>
											</div>
										</div>
									{/if}
								{/if}
							{/if}
						{/if}
					</div>
				{/if}
			</div>

			<!-- RIGHT column: Flasks table (3/5 width on large screens, full width on small) -->
			<div class="col-span-1 lg:col-span-3 flex flex-col">
				{#if data.box}
					<div class="bg-white rounded-lg shadow p-6 flex-1">
						<div class="flex justify-between items-center mb-3">
							<div>
								<h2 class="text-lg font-semibold text-gray-900">Flasks in{data.box ? ` ${data.box.name}` : ''}{#if focusedShipmentId} <span class="text-sm font-normal text-gray-500">({data.focusedShipmentLines.length})</span>{/if}</h2>
								{#if focusedShipment && (focusedShipment.readyAt || focusedShipment.returnedAt)}
									<p class="text-xs mt-0.5">
										<span class="font-semibold text-gray-900">History:</span>
										<span class="text-gray-500">{focusedShipment.readyAt ? formatDateDisplay(focusedShipment.readyAt) : '?'}
										→
										{focusedShipment.returnedAt ? formatDateDisplay(focusedShipment.returnedAt) : '?'}</span>
									</p>
								{/if}
							</div>
							{#if focusedShipmentId}
								<div class="flex gap-2">
									<button
										type="button"
										onclick={() => focusedShipment?.readyAt && goto(`/sampling/${focusedShipmentId}?boxId=${data.box!.id}`)}
										disabled={!focusedShipment?.readyAt}
										class="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors font-medium shadow-sm {focusedShipment?.readyAt ? 'bg-sky-500 text-gray-800 hover:bg-sky-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}"
									>
										<Wind class="h-4 w-4" />
										Sampling sheet
									</button>
									{#if isBlock3Editable}
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
											class="flex items-center gap-2 px-3 py-1.5 text-sm bg-sky-500 text-gray-800 rounded-md hover:bg-sky-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
										>
											<Plus class="h-4 w-4" />
											Add Flask
										</button>
									{/if}
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
											{#await fetch('/api/flasks?availableOnly=true').then((r) => r.json())}
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
												<span class="inline-flex items-center gap-1">
													Name
													<ArrowUpAZ class="h-3.5 w-3.5 text-sky-500" />
												</span>
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
											<tr class="align-top">
												<td class="px-2 py-2 text-gray-900">
													{line.flask.id}
												</td>
												<td class="px-2 py-2 font-medium text-gray-900">
													{line.flask.name}
												</td>
												<td class="px-2 py-2 text-gray-700 max-w-48">
													{#if editingLineId === line.id && isBlock3Editable}
														<!-- Edit mode: multi-line textarea -->
														<form
															method="POST"
															action="?/updateLine"
															use:enhance={() => {
																isSubmitting = true;
																return async ({ result, update }) => {
																	isSubmitting = false;
																	if (result.type === 'success') {
																		editingLineId = null;
																		flaskLineEditExpanded = false;
																	}
																	await update();
																};
															}}
															class="flex flex-col gap-1.5"
														>
															<input type="hidden" name="lineId" value={line.id} />
															<div class="relative">
																<textarea
																	name="remarks"
																	rows={flaskLineEditExpanded ? 6 : 2}
																	disabled={isSubmitting}
																	class="w-full text-sm border border-gray-300 rounded px-2 py-1 pr-7 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none disabled:bg-gray-100"
																	value={line.remarks || ''}
																></textarea>
																<button
																	type="button"
																	tabindex="-1"
																	onclick={() => (flaskLineEditExpanded = !flaskLineEditExpanded)}
																	class="absolute top-1 right-1 text-gray-400 hover:text-gray-600 transition-colors"
																	title={flaskLineEditExpanded ? 'Collapse' : 'Expand'}
																>
																	{#if flaskLineEditExpanded}
																		<Minimize2 class="h-3 w-3" />
																	{:else}
																		<Maximize2 class="h-3 w-3" />
																	{/if}
																</button>
															</div>
															<div class="flex gap-1">
																<button
																	type="submit"
																	disabled={isSubmitting}
																	class="px-2 py-1 bg-sky-500 text-gray-800 rounded hover:bg-sky-600 disabled:bg-gray-300 text-xs"
																>
																	Save
																</button>
																<button
																	type="button"
																	onclick={() => { editingLineId = null; flaskLineEditExpanded = false; }}
																	disabled={isSubmitting}
																	class="px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-xs"
																>
																	Cancel
																</button>
															</div>
														</form>
													{:else}
														<!-- Display mode: truncated text with expand button -->
														<div class="flex items-start gap-1 min-w-0">
															<span class="block truncate flex-1 min-w-0" title={line.remarks || ''}>
																{line.remarks || '-'}
															</span>
															{#if line.remarks}
																<button
																	type="button"
																	onclick={() => { viewRemarksText = line.remarks || ''; showViewRemarks = true; }}
																	class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
																	title="View full remarks"
																>
																	<Maximize2 class="h-3.5 w-3.5" />
																</button>
															{/if}
														</div>
													{/if}
												</td>
												{#if isBlock3Editable}
													<td class="px-2 py-2">
														{#if editingLineId !== line.id}
															<div class="flex gap-1">
																<button
																	type="button"
																	onclick={() => { editingLineId = line.id; flaskLineEditExpanded = false; }}
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
				{:else if $page.url.searchParams.get('boxId')}
					<div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
						<p class="text-sm text-amber-800">
							{data.error || 'Box not found. Please select a different box from the list above.'}
						</p>
					</div>
				{/if}
			</div>
		</div>
	</div>

{#if showCopyConfirm}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		role="dialog"
		aria-modal="true"
		aria-labelledby="copy-confirm-title"
		tabindex="-1"
		onkeydown={(e) => { if (e.key === 'Escape') showCopyConfirm = false; }}
	>
		<div class="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
			<h3 id="copy-confirm-title" class="mb-2 text-lg font-semibold text-gray-900">Copy last return</h3>
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
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		role="dialog"
		aria-modal="true"
		aria-labelledby="delete-confirm-title"
		tabindex="-1"
		onkeydown={(e) => { if (e.key === 'Escape') showDeleteConfirm = false; }}
	>
		<div class="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
			<h3 id="delete-confirm-title" class="mb-2 text-lg font-semibold text-gray-900">Delete flask</h3>
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

<!-- View remarks modal (flask line display mode) -->
{#if showViewRemarks}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		role="dialog"
		aria-modal="true"
		onclick={(e) => { if (e.target === e.currentTarget) showViewRemarks = false; }}
		onkeydown={(e) => { if (e.key === 'Escape') showViewRemarks = false; }}
		tabindex="-1"
	>
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
			<h3 class="mb-3 text-lg font-semibold text-gray-900">Remarks</h3>
			<textarea
				readonly
				rows="8"
				class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none"
				value={viewRemarksText}
			></textarea>
			<div class="mt-4 flex justify-end">
				<button
					type="button"
					onclick={() => (showViewRemarks = false)}
					class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
</div>
