<script lang="ts">
	import 'leaflet/dist/leaflet.css';
	import { onMount, onDestroy } from 'svelte';
	import { X } from 'lucide-svelte';

	let {
		lines,
		onClose
	}: {
		lines: Array<{
			flask: { name: string };
			sampledAt: string | Date | null;
			sampledLatRaw: string | null;
			sampledLonRaw: string | null;
			sampledLat: number | null;
			sampledLon: number | null;
			sampledInitialPressure: number | null;
			sampledLocalStartTime: string | null;
			sampledLocalStopFlushTime: string | null;
			sampledFinalPressure: number | null;
			sampledWindSpeedDirection: string | null;
			sampledShipSpeedDirection: string | null;
		}>;
		onClose: () => void;
	} = $props();

	let mapEl: HTMLDivElement | undefined = $state();
	let modalRef: HTMLDivElement | undefined = $state();
	let leafletMap: import('leaflet').Map | undefined;

	const validPoints = $derived(
		lines.filter(
			(l): l is typeof l & { sampledLat: number; sampledLon: number } =>
				l.sampledLat != null && l.sampledLon != null
		)
	);

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
		modalRef?.focus();

		if (!mapEl || validPoints.length === 0) return;

		const L = (await import('leaflet')).default;

		leafletMap = L.map(mapEl);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution:
				'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
				// On touch devices tap opens the popup; Leaflet's bindPopup handles this by default.
				// We just increase the circle so it's easier to hit.
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

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) onClose();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
			return;
		}
		if (event.key === 'Tab') {
			const focusable = modalRef?.querySelectorAll<HTMLElement>(
				'button, [tabindex]:not([tabindex="-1"])'
			);
			if (!focusable?.length) return;
			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}
	}
</script>

<div
	class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
	onclick={handleOverlayClick}
	role="presentation"
>
	<div
		bind:this={modalRef}
		role="dialog"
		aria-modal="true"
		aria-labelledby="sampling-map-title"
		tabindex="-1"
		onkeydown={handleKeydown}
		class="bg-white rounded-lg shadow-xl flex flex-col outline-none"
		style="width: min(95vw, 1100px); height: min(90vh, 800px);"
		onclick={(e) => e.stopPropagation()}
	>
		<div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
			<h2 id="sampling-map-title" class="text-base font-semibold text-gray-800">
				Sampling locations — {validPoints.length}
				{validPoints.length === 1 ? 'point' : 'points'}
			</h2>
			<button
				onclick={onClose}
				class="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
				aria-label="Close map"
			>
				<X class="h-5 w-5" />
			</button>
		</div>

		<div class="flex-1 relative overflow-hidden rounded-b-lg">
			{#if validPoints.length === 0}
				<div class="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
					No coordinates recorded yet.
				</div>
			{:else}
				<div bind:this={mapEl} class="absolute inset-0"></div>
			{/if}
		</div>
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
