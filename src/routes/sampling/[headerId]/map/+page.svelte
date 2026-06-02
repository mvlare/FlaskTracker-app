<script lang="ts">
	import 'leaflet/dist/leaflet.css';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { ArrowLeft } from 'lucide-svelte';
	import { formatDateDisplay } from '$lib/utils/dates';

	let { data } = $props();

	const validPoints = $derived(
		data.lines.filter(
			(l): l is typeof l & { sampledLat: number; sampledLon: number } =>
				l.sampledLat != null && l.sampledLon != null
		)
	);

	let mapEl: HTMLDivElement | undefined = $state();
	let leafletMap: import('leaflet').Map | undefined;

	function handleBack() {
		goto(data.boxId ? `/sampling/${data.header.id}?boxId=${data.boxId}` : `/sampling/${data.header.id}`);
	}

	function buildPopupHtml(line: (typeof validPoints)[number]): string {
		const rows: [string, string][] = [];
		if (line.sampledAt) {
			const d = new Date(line.sampledAt);
			const date = d.toISOString().split('T')[0].split('-').reverse().join('-');
			const time = d.toISOString().substring(11, 16);
			rows.push(['Date/Time (UTC)', `${date} ${time}`]);
		}
		rows.push(['Lat', line.sampledLatRaw ?? `${line.sampledLat.toFixed(5)}°`]);
		rows.push(['Lon', line.sampledLonRaw ?? `${line.sampledLon.toFixed(5)}°`]);
		if (line.sampledInitialPressure != null) rows.push(['Init. pressure', String(line.sampledInitialPressure)]);
		if (line.sampledLocalStartTime) rows.push(['Start (LT)', line.sampledLocalStartTime.substring(0, 5)]);
		if (line.sampledLocalStopFlushTime) rows.push(['Stop flush (LT)', line.sampledLocalStopFlushTime.substring(0, 5)]);
		if (line.sampledFinalPressure != null) rows.push(['Final pressure', String(line.sampledFinalPressure)]);
		if (line.sampledWindSpeedDirection) rows.push(['Wind', line.sampledWindSpeedDirection]);
		if (line.sampledShipSpeedDirection) rows.push(['Ship', line.sampledShipSpeedDirection]);

		const tableRows = rows
			.map(([label, value]) => `<tr><td class="popup-label">${label}</td><td class="popup-value">${value}</td></tr>`)
			.join('');

		return `<div class="popup-content"><strong class="popup-name">${line.flask.name}</strong><table class="popup-table">${tableRows}</table></div>`;
	}

	onMount(async () => {
		if (!mapEl || validPoints.length === 0) return;

		const L = (await import('leaflet')).default;

		leafletMap = L.map(mapEl);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			maxZoom: 18
		}).addTo(leafletMap);

		const isTouch = window.matchMedia('(pointer: coarse)').matches;

		const markers = validPoints.map((line) => {
			const marker = L.circleMarker([line.sampledLat, line.sampledLon], {
				radius: 6,
				fillColor: '#0ea5e9',
				color: 'white',
				weight: 2,
				fillOpacity: 1
			})
				.bindTooltip(line.flask.name, {
					permanent: true,
					direction: 'right',
					className: 'flask-tooltip'
				})
				.bindPopup(buildPopupHtml(line), { maxWidth: 260 })
				.addTo(leafletMap!);

			if (isTouch) {
				marker.setRadius(10);
			} else {
				marker.on('mouseover', () => marker.openPopup());
				marker.on('mouseout', () => marker.closePopup());
			}

			return marker;
		});

		if (markers.length === 1) {
			leafletMap.setView([validPoints[0].sampledLat, validPoints[0].sampledLon], 10);
		} else {
			const group = L.featureGroup(markers);
			leafletMap.fitBounds(group.getBounds(), { padding: [20, 20] });
		}
	});

	onDestroy(() => {
		leafletMap?.remove();
	});
</script>

<div class="flex flex-col h-screen bg-gray-50">
	<!-- Header -->
	<div class="flex-shrink-0 px-4 py-3 bg-gray-50">
		<div class="inline-flex items-center gap-3 flex-wrap bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-2.5">
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
				<span class="font-semibold">Picked up:</span>
				{data.header.pickedUpAt ? formatDateDisplay(data.header.pickedUpAt) : '—'}
			</span>
			<span class="text-gray-300">|</span>
			<span class="text-sm text-gray-700">
				<span class="font-semibold">Returned:</span>
				{data.header.returnedAt ? formatDateDisplay(data.header.returnedAt) : '—'}
			</span>
		</div>
		<p class="mt-1.5 px-1 text-xs text-gray-500">
			{validPoints.length} {validPoints.length === 1 ? 'location' : 'locations'}
		</p>
	</div>

	<!-- Map -->
	<div class="flex-1 relative">
		{#if validPoints.length === 0}
			<div class="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
				No coordinates recorded yet.
			</div>
		{:else}
			<div bind:this={mapEl} class="absolute inset-0"></div>
		{/if}
	</div>
</div>

<style>
	:global(.flask-tooltip) {
		background: rgba(255, 255, 255, 0.92);
		border: 1px solid #38bdf8;
		color: #0c4a6e;
		font-size: 11px;
		font-weight: 600;
		padding: 2px 6px;
		border-radius: 3px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
		white-space: nowrap;
	}
	:global(.flask-tooltip::before) {
		display: none;
	}
	:global(.popup-content) {
		font-size: 12px;
		line-height: 1.4;
	}
	:global(.popup-name) {
		display: block;
		font-size: 13px;
		font-weight: 700;
		color: #0c4a6e;
		margin-bottom: 5px;
	}
	:global(.popup-table) {
		border-collapse: collapse;
		width: 100%;
	}
	:global(.popup-label) {
		color: #6b7280;
		font-size: 11px;
		padding: 1px 8px 1px 0;
		white-space: nowrap;
		vertical-align: top;
	}
	:global(.popup-value) {
		color: #111827;
		font-size: 11px;
		font-weight: 500;
		padding: 1px 0;
	}
</style>
