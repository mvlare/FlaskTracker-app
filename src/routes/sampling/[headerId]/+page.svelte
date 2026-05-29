<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import { ArrowLeft, Pencil, Save, X, Clipboard } from 'lucide-svelte';
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
	let clearConfirmId = $state<number | null>(null);
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
			sampledLocalStartTime: line.sampledLocalStartTime?.substring(0, 5) ?? '',
			sampledLocalStopFlushTime: line.sampledLocalStopFlushTime?.substring(0, 5) ?? '',
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

	// ── Paste from spreadsheet ──────────────────────────────────────────────
	interface PasteRow {
		flaskName: string;
		lineId: number | null;
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

	let showPaste = $state(false);
	let pasteRows = $state<PasteRow[]>([]);
	let pasteError = $state('');
	let isImporting = $state(false);
	let pasteRowsJson = $state('');
	let pasteFormEl: HTMLFormElement | undefined = $state();

	const flaskIndex = $derived(new Map(data.lines.map((l) => [l.flask.name.toLowerCase(), l.id])));
	const matchedCount = $derived(pasteRows.filter((r) => r.lineId !== null).length);

	function parseDateToISO(raw: string): string {
		const s = raw?.trim();
		if (!s) return '';
		if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
		const dmy = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})$/);
		if (dmy) {
			const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
			return `${year}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
		}
		const months: Record<string, string> = {
			jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
			jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'
		};
		const dmy2 = s.match(/^(\d{1,2})[\s\-]([A-Za-z]{3})[\s\-\/](\d{2,4})/);
		if (dmy2) {
			const m = months[dmy2[2].toLowerCase()];
			if (m) {
				const year = dmy2[3].length === 2 ? `20${dmy2[3]}` : dmy2[3];
				return `${year}-${m}-${dmy2[1].padStart(2, '0')}`;
			}
		}
		return '';
	}

	function parseTimeToHHMM(raw: string): string {
		const s = raw?.trim();
		if (!s) return '';
		if (/^\d{2}:\d{2}$/.test(s)) return s;
		if (/^\d{4}$/.test(s)) return `${s.slice(0, 2)}:${s.slice(2)}`;
		const hm = s.match(/^(\d{1,2}):(\d{2})/);
		if (hm) return `${hm[1].padStart(2, '0')}:${hm[2]}`;
		return s;
	}

	function parsePasteText(text: string): PasteRow[] {
		const rows: PasteRow[] = [];
		for (const line of text.trim().split('\n')) {
			const cols = line.split('\t').map((c) => c.trim());
			const flaskName = cols[0] ?? '';
			if (!flaskName) continue;
			// skip header rows
			if (/flask|id|name/i.test(flaskName) && !flaskName.includes('-')) continue;
			rows.push({
				flaskName,
				lineId: flaskIndex.get(flaskName.toLowerCase()) ?? null,
				sampledAtDate: parseDateToISO(cols[1] ?? ''),
				sampledAtTime: parseTimeToHHMM(cols[2] ?? ''),
				sampledLatRaw: cols[3] ?? '',
				sampledLonRaw: cols[4] ?? '',
				sampledInitialPressure: cols[5] ?? '',
				sampledLocalStartTime: parseTimeToHHMM(cols[6] ?? ''),
				sampledLocalStopFlushTime: parseTimeToHHMM(cols[7] ?? ''),
				sampledFinalPressure: cols[8] ?? '',
				sampledWindSpeedDirection: cols[9] ?? '',
				sampledShipSpeedDirection: cols[10] ?? '',
				sampledComments: cols[11] ?? ''
			});
		}
		return rows;
	}

	async function readClipboard() {
		pasteError = '';
		try {
			const text = await navigator.clipboard.readText();
			if (!text.trim()) { pasteError = 'Clipboard is empty.'; return; }
			pasteRows = parsePasteText(text);
			if (pasteRows.length === 0) pasteError = 'No rows recognised. Check column order.';
		} catch {
			pasteError = 'Clipboard access denied. Paste text manually below.';
		}
	}

	async function confirmImport() {
		pasteRowsJson = JSON.stringify(pasteRows.filter((r) => r.lineId !== null));
		await tick();
		pasteFormEl?.requestSubmit();
	}
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
			<span class="text-gray-300">|</span>
			<button
				type="button"
				onclick={() => { showPaste = !showPaste; pasteRows = []; pasteError = ''; }}
				class="flex items-center gap-1 text-sm text-sky-600 hover:text-sky-800 transition-colors"
			>
				<Clipboard class="h-4 w-4" />
				Paste clipboard spreadsheet
			</button>
		</div>

		<!-- Paste panel -->
		{#if showPaste}
			<div class="mb-4 p-3 bg-sky-50 border border-sky-200 rounded-lg text-sm">
				<div class="flex items-center justify-between mb-2">
					<p class="text-xs text-gray-600">
						Copy rows from your spreadsheet (Gemini output), then click Read clipboard.<br/>
						Expected column order: <span class="font-mono">Flask ID · Date · Time UTC · Lat · Lon · Init.pressure · Start LT · Stop LT · Final pressure · Wind · Ship · Comment</span>
					</p>
					<button type="button" onclick={() => { showPaste = false; pasteRows = []; }}
						class="ml-3 text-gray-400 hover:text-gray-600"><X class="h-4 w-4" /></button>
				</div>

				<button
					type="button"
					onclick={readClipboard}
					class="flex items-center gap-1 px-3 py-1.5 text-xs bg-sky-600 text-white rounded hover:bg-sky-700 transition-colors"
				>
					<Clipboard class="h-3.5 w-3.5" />
					Read clipboard
				</button>

				{#if pasteError}
					<p class="mt-2 text-xs text-red-600">{pasteError}</p>
				{/if}

				{#if pasteRows.length > 0}
					<div class="mt-3">
						<p class="text-xs text-gray-600 mb-1">
							{matchedCount} of {pasteRows.length} row(s) matched to flasks in this shipment.
							{#if pasteRows.length - matchedCount > 0}
								<span class="text-amber-600">{pasteRows.length - matchedCount} not found (will be skipped).</span>
							{/if}
						</p>
						<div class="overflow-x-auto max-h-48 border border-gray-200 rounded bg-white">
							<table class="w-full text-xs">
								<thead class="bg-gray-50 sticky top-0">
									<tr>
										<th class="px-2 py-1 text-left font-medium text-gray-600">Flask</th>
										<th class="px-2 py-1 text-left font-medium text-gray-600">Date</th>
										<th class="px-2 py-1 text-left font-medium text-gray-600">Time UTC</th>
										<th class="px-2 py-1 text-left font-medium text-gray-600">Lat</th>
										<th class="px-2 py-1 text-left font-medium text-gray-600">Lon</th>
									</tr>
								</thead>
								<tbody>
									{#each pasteRows as row}
										<tr class={row.lineId !== null ? 'bg-green-50' : 'bg-amber-50'}>
											<td class="px-2 py-0.5 font-medium {row.lineId !== null ? 'text-green-800' : 'text-amber-700'}">
												{row.flaskName}
											</td>
											<td class="px-2 py-0.5 text-gray-700">{row.sampledAtDate || '—'}</td>
											<td class="px-2 py-0.5 text-gray-700">{row.sampledAtTime || '—'}</td>
											<td class="px-2 py-0.5 text-gray-700">{row.sampledLatRaw || '—'}</td>
											<td class="px-2 py-0.5 text-gray-700">{row.sampledLonRaw || '—'}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						{#if matchedCount > 0}
							<button
								type="button"
								onclick={confirmImport}
								disabled={isImporting}
								class="mt-2 flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
							>
								<Save class="h-3.5 w-3.5" />
								{isImporting ? 'Importing…' : `Import ${matchedCount} row(s)`}
							</button>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Hidden form for paste import -->
			<form
				bind:this={pasteFormEl}
				method="POST"
				action="?/pasteImport"
				class="hidden"
				use:enhance={() => {
					isImporting = true;
					return async ({ result, update }) => {
						isImporting = false;
						if (result.type === 'success') {
							showPaste = false;
							pasteRows = [];
							await invalidateAll();
						}
						await update();
					};
				}}
			>
				<input type="hidden" name="rows" bind:value={pasteRowsJson} />
			</form>
		{/if}

		{#if form?.error}
			<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
				{form.error}
			</div>
		{/if}
		{#if form?.pasteImported}
			<div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
				{form.pasteImported} row(s) imported successfully.
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
													type="text"
													name="sampledAtTime"
													bind:value={editForm.sampledAtTime}
													class={inputClass}
													style="min-width:5rem;"
													placeholder="HH:MM"
													pattern="[0-2][0-9]:[0-5][0-9]"
													maxlength="5"
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
											type="text"
											name="sampledLocalStartTime"
											bind:value={editForm.sampledLocalStartTime}
											class={inputClass}
											style="min-width:5rem;"
											placeholder="HH:MM"
											pattern="[0-2][0-9]:[0-5][0-9]"
											maxlength="5"
										/>
									</td>
									<td class="py-1 px-2">
										<input
											form="edit-form-{line.id}"
											type="text"
											name="sampledLocalStopFlushTime"
											bind:value={editForm.sampledLocalStopFlushTime}
											class={inputClass}
											style="min-width:5rem;"
											placeholder="HH:MM"
											pattern="[0-2][0-9]:[0-5][0-9]"
											maxlength="5"
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
										{#if clearConfirmId === line.id}
											<div class="flex items-center gap-1 flex-wrap">
												<span class="text-xs text-gray-700">Clear sampling data?</span>
												<form method="POST" action="?/clearLine" use:enhance={() => {
													return async ({ update }) => {
														clearConfirmId = null;
														await update();
													};
												}}>
													<input type="hidden" name="lineId" value={line.id} />
													<button type="submit" class="px-2 py-0.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
														Yes
													</button>
												</form>
												<button
													type="button"
													onclick={() => (clearConfirmId = null)}
													class="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
												>
													No
												</button>
											</div>
										{:else}
											<div class="flex gap-1">
												<button
													type="button"
													onclick={() => startEdit(line)}
													class="flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
												>
													<Pencil class="h-3 w-3" />
													Edit
												</button>
												<button
													type="button"
													onclick={() => (clearConfirmId = line.id)}
													class="flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded hover:bg-red-50 hover:text-red-600 transition-colors"
												>
													<X class="h-3 w-3" />
													Clear
												</button>
											</div>
										{/if}
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
