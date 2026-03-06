<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { ArrowLeft, Pencil, Save, X } from 'lucide-svelte';
	import { formatDateDisplay } from '$lib/utils/dates';

	let { data, form } = $props();

	interface EditFormState {
		sampledAtDate: string;
		sampledAtTime: string;
		sampledLatRaw: string;
		sampledLonRaw: string;
		sampledInitialPressure: string;
		sampledLocalStartTime: string;
		sampledLocalStopFlushTime: string;
		sampledFinalPressure: string;
		sampledWindSpeedDirection: string;
		sampledShipSpeedDirection: string;
		sampledComments: string;
	}

	let sortBy = $state<'id' | 'name'>('id');
	const sortedLines = $derived(
		[...data.lines].sort((a, b) =>
			sortBy === 'name' ? a.flask.name.localeCompare(b.flask.name) : a.id - b.id
		)
	);
	const idRank = $derived(
		new Map(data.lines.map((line, i) => [line.id, i + 1]))
	);

	let editingLineId = $state<number | null>(null);
	let editForm = $state<EditFormState>({
		sampledAtDate: '',
		sampledAtTime: '',
		sampledLatRaw: '',
		sampledLonRaw: '',
		sampledInitialPressure: '',
		sampledLocalStartTime: '',
		sampledLocalStopFlushTime: '',
		sampledFinalPressure: '',
		sampledWindSpeedDirection: '',
		sampledShipSpeedDirection: '',
		sampledComments: ''
	});

	function startEdit(line: (typeof data.lines)[number]) {
		editingLineId = line.id;
		editForm = {
			sampledAtDate: line.sampledAt ? new Date(line.sampledAt).toISOString().split('T')[0] : '',
			sampledAtTime: line.sampledAt
				? new Date(line.sampledAt).toISOString().substring(11, 16)
				: '',
			sampledLatRaw: line.sampledLatRaw ?? '',
			sampledLonRaw: line.sampledLonRaw ?? '',
			sampledInitialPressure:
				line.sampledInitialPressure != null ? String(line.sampledInitialPressure) : '',
			sampledLocalStartTime: line.sampledLocalStartTime ?? '',
			sampledLocalStopFlushTime: line.sampledLocalStopFlushTime ?? '',
			sampledFinalPressure:
				line.sampledFinalPressure != null ? String(line.sampledFinalPressure) : '',
			sampledWindSpeedDirection: line.sampledWindSpeedDirection ?? '',
			sampledShipSpeedDirection: line.sampledShipSpeedDirection ?? '',
			sampledComments: line.sampledComments ?? ''
		};
	}

	function cancelEdit() {
		editingLineId = null;
	}

	function copyToClipboard(value: string) {
		navigator.clipboard.writeText(value);
	}

	function handleBack() {
		goto(data.boxId ? `/box-content?boxId=${data.boxId}` : '/box-content');
	}

	const inputClass =
		'w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500';
</script>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-full mx-auto px-4 py-4">
		<!-- Header -->
		<div class="flex items-center gap-3 mb-4 flex-wrap">
			<button
				type="button"
				onclick={handleBack}
				class="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
			>
				<ArrowLeft class="h-4 w-4" />
				Back
			</button>
			<span class="text-gray-300">|</span>
			<span class="text-sm text-gray-700">
				<span class="font-semibold">Box:</span>
				{data.box.name}
			</span>
			<span class="text-gray-300">|</span>
			<span class="text-sm text-gray-700">
				<span class="font-semibold">Destination:</span>
				{data.header.destinationText ?? '—'}
			</span>
			<span class="text-gray-300">|</span>
			<span class="text-sm text-gray-700">
				<span class="font-semibold">Ready:</span>
				{data.header.readyAt ? formatDateDisplay(data.header.readyAt) : '—'}
			</span>
			<span class="text-gray-300">|</span>
			<span class="text-sm text-gray-700">
				<span class="font-semibold">Returned:</span>
				{data.header.returnedAt ? formatDateDisplay(data.header.returnedAt) : '—'}
			</span>
		</div>

		{#if form?.error}
			<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
				{form.error}
			</div>
		{/if}

		<!-- Table -->
		<div class="bg-white rounded-lg shadow overflow-hidden">
			<div
				class="overflow-x-auto overflow-y-auto"
				style="max-height: calc(15 * 2.25rem + 2.5rem);"
			>
				<table class="w-full text-xs border-collapse">
					<thead class="bg-gray-50 sticky top-0 z-10">
						<tr>
							<th
								class="py-2 px-2 text-left font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap cursor-pointer select-none"
								onclick={() => (sortBy = 'id')}
							># <span class={sortBy === 'id' ? 'text-gray-700' : 'text-gray-300'}>↑</span></th>
							<th
								class="py-2 px-2 text-left font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap cursor-pointer select-none"
								onclick={() => (sortBy = 'name')}
								>Flask <span class={sortBy === 'name' ? 'text-gray-700' : 'text-gray-300'}>↑</span></th
							>
							<th
								class="py-2 px-2 text-left font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap"
								>Date+Time (UTC)</th
							>
							<th
								class="py-2 px-2 text-left font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap"
								>Latitude</th
							>
							<th
								class="py-2 px-2 text-left font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap"
								>Longitude</th
							>
							<th
								class="py-2 px-2 text-left font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap"
								>Initial <br/>pressure</th
							>
							<th
								class="py-2 px-2 text-left font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap"
								>Start time <br/>(LT)</th
							>
							<th
								class="py-2 px-2 text-left font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap"
								>Stop flush <br/>time (LT)</th
							>
							<th
								class="py-2 px-2 text-left font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap"
								>Final <br/>pressure</th
							>
							<th
								class="py-2 px-2 text-left font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap"
								>Wind <br/>Speed & direction</th
							>
							<th
								class="py-2 px-2 text-left font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap"
								>Ship <br/>Speed & direction</th
							>
							<th
								class="py-2 px-2 text-left font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap"
								>Comment</th
							>
							<th
								class="py-2 px-2 text-left font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap"
								>Actions</th
							>
						</tr>
					</thead>
					<tbody>
						{#each sortedLines as line (line.id)}
							{#if editingLineId === line.id}
								<!-- Edit row -->
								<tr class="bg-sky-50 border-b border-gray-100">
									<td class="py-1 px-2 text-gray-400 text-xs">{idRank.get(line.id)}</td>
									<td class="py-1 px-2 font-medium text-gray-900 whitespace-nowrap"
										>{line.flask.name}</td
									>
									<td class="py-1 px-2">
										<form
											id="edit-form-{line.id}"
											method="POST"
											action="?/updateLine"
											use:enhance={() => {
												return async ({ result, update }) => {
													if (result.type === 'success') {
														editingLineId = null;
													}
													await update();
												};
											}}
										>
											<input type="hidden" name="lineId" value={line.id} />
											<div class="flex gap-1">
												<input
													type="date"
													name="sampledAtDate"
													bind:value={editForm.sampledAtDate}
													class={inputClass}
													style="min-width:7rem;"
												/>
												<input
													type="time"
													name="sampledAtTime"
													bind:value={editForm.sampledAtTime}
													class={inputClass}
													style="min-width:5rem;"
												/>
											</div>
										</form>
									</td>
									<td class="py-1 px-2">
										<input
											form="edit-form-{line.id}"
											type="text"
											name="sampledLatRaw"
											bind:value={editForm.sampledLatRaw}
											class={inputClass}
											style="min-width:5rem;"
										/>
									</td>
									<td class="py-1 px-2">
										<input
											form="edit-form-{line.id}"
											type="text"
											name="sampledLonRaw"
											bind:value={editForm.sampledLonRaw}
											class={inputClass}
											style="min-width:5rem;"
										/>
									</td>
									<td class="py-1 px-2">
										<input
											form="edit-form-{line.id}"
											type="number"
											step="any"
											name="sampledInitialPressure"
											bind:value={editForm.sampledInitialPressure}
											class={inputClass}
											style="min-width:4rem;"
										/>
									</td>
									<td class="py-1 px-2">
										<input
											form="edit-form-{line.id}"
											type="time"
											name="sampledLocalStartTime"
											bind:value={editForm.sampledLocalStartTime}
											class={inputClass}
											style="min-width:5rem;"
										/>
									</td>
									<td class="py-1 px-2">
										<input
											form="edit-form-{line.id}"
											type="time"
											name="sampledLocalStopFlushTime"
											bind:value={editForm.sampledLocalStopFlushTime}
											class={inputClass}
											style="min-width:5rem;"
										/>
									</td>
									<td class="py-1 px-2">
										<input
											form="edit-form-{line.id}"
											type="number"
											step="any"
											name="sampledFinalPressure"
											bind:value={editForm.sampledFinalPressure}
											class={inputClass}
											style="min-width:4rem;"
										/>
									</td>
									<td class="py-1 px-2">
										<input
											form="edit-form-{line.id}"
											type="text"
											name="sampledWindSpeedDirection"
											bind:value={editForm.sampledWindSpeedDirection}
											class={inputClass}
											style="min-width:4rem;"
										/>
									</td>
									<td class="py-1 px-2">
										<input
											form="edit-form-{line.id}"
											type="text"
											name="sampledShipSpeedDirection"
											bind:value={editForm.sampledShipSpeedDirection}
											class={inputClass}
											style="min-width:4rem;"
										/>
									</td>
									<td class="py-1 px-2">
										<input
											form="edit-form-{line.id}"
											type="text"
											name="sampledComments"
											bind:value={editForm.sampledComments}
											class={inputClass}
											style="min-width:6rem;"
										/>
									</td>
									<td class="py-1 px-2 whitespace-nowrap">
										<div class="flex gap-1">
											<button
												type="submit"
												form="edit-form-{line.id}"
												class="flex items-center gap-1 px-2 py-0.5 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
											>
												<Save class="h-3 w-3" />
												Save
											</button>
											<button
												type="button"
												onclick={cancelEdit}
												class="flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
											>
												<X class="h-3 w-3" />
												Cancel
											</button>
										</div>
									</td>
								</tr>
							{:else}
								<!-- Display row -->
								<tr class="border-b border-gray-100 hover:bg-gray-50">
									<td class="py-1 px-2 text-gray-400 text-xs">{idRank.get(line.id)}</td>
									<td class="py-1 px-2 font-medium text-gray-900 whitespace-nowrap"
										>{line.flask.name}</td
									>
									<td class="py-1 px-2 text-gray-700 whitespace-nowrap">
										{#if line.sampledAt}
											{new Date(line.sampledAt).toISOString().split('T')[0].split('-').reverse().join('-')}
											{new Date(line.sampledAt).toISOString().substring(11, 16)}
										{:else}
											<span class="text-gray-400">—</span>
										{/if}
									</td>
									<td class="py-1 px-2 text-gray-700">
										{#if line.sampledLatRaw}
											<div class="relative group inline-block">
												<span>{line.sampledLatRaw}</span>
												{#if line.sampledLat != null}
													<div class="absolute left-0 top-full z-20 hidden group-hover:block pt-1"><div class="flex items-center gap-1 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
														{line.sampledLat.toFixed(4)}°
														<button
															type="button"
															onclick={() => copyToClipboard(String(line.sampledLat))}
															class="ml-1 hover:text-sky-300 transition-colors"
															title="Copy"
														>⏘</button>
													</div></div>
												{/if}
											</div>
										{:else}
											<span class="text-gray-400">—</span>
										{/if}
									</td>
									<td class="py-1 px-2 text-gray-700">
										{#if line.sampledLonRaw}
											<div class="relative group inline-block">
												<span>{line.sampledLonRaw}</span>
												{#if line.sampledLon != null}
													<div class="absolute left-0 top-full z-20 hidden group-hover:block pt-1"><div class="flex items-center gap-1 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
														{line.sampledLon.toFixed(4)}°
														<button
															type="button"
															onclick={() => copyToClipboard(String(line.sampledLon))}
															class="ml-1 hover:text-sky-300 transition-colors"
															title="Copy"
														>⏘</button>
													</div></div>
												{/if}
											</div>
										{:else}
											<span class="text-gray-400">—</span>
										{/if}
									</td>
									<td class="py-1 px-2 text-gray-700">
										{#if line.sampledInitialPressure != null}
											{line.sampledInitialPressure}
										{:else}
											<span class="text-gray-400">—</span>
										{/if}
									</td>
									<td class="py-1 px-2 text-gray-700 whitespace-nowrap">
										{#if line.sampledLocalStartTime}
											{line.sampledLocalStartTime}
										{:else}
											<span class="text-gray-400">—</span>
										{/if}
									</td>
									<td class="py-1 px-2 text-gray-700 whitespace-nowrap">
										{#if line.sampledLocalStopFlushTime}
											{line.sampledLocalStopFlushTime}
										{:else}
											<span class="text-gray-400">—</span>
										{/if}
									</td>
									<td class="py-1 px-2 text-gray-700">
										{#if line.sampledFinalPressure != null}
											{line.sampledFinalPressure}
										{:else}
											<span class="text-gray-400">—</span>
										{/if}
									</td>
									<td class="py-1 px-2 text-gray-700">
										{#if line.sampledWindSpeedDirection}
											{line.sampledWindSpeedDirection}
										{:else}
											<span class="text-gray-400">—</span>
										{/if}
									</td>
									<td class="py-1 px-2 text-gray-700">
										{#if line.sampledShipSpeedDirection}
											{line.sampledShipSpeedDirection}
										{:else}
											<span class="text-gray-400">—</span>
										{/if}
									</td>
									<td class="py-1 px-2 text-gray-700">
										{#if line.sampledComments}
											{line.sampledComments}
										{:else}
											<span class="text-gray-400">—</span>
										{/if}
									</td>
									<td class="py-1 px-2">
										<button
											type="button"
											onclick={() => startEdit(line)}
											class="flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
										>
											<Pencil class="h-3 w-3" />
											Edit
										</button>
									</td>
								</tr>
							{/if}
						{/each}
						{#if data.lines.length === 0}
							<tr>
								<td colspan="13" class="py-6 px-4 text-center text-sm text-gray-500">
									No flasks in this shipment.
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
