<script lang="ts">
	import { CalendarDate } from '@internationalized/date';
	import { formatDateDisplay, dateToCalendarDate, calendarDateToDate, formatForSubmission } from '$lib/utils/dates';
	import { Calendar } from 'lucide-svelte';

	let {
		id,
		name,
		label,
		value = $bindable(''),
		required = false,
		disabled = false,
		placeholder = 'dd-mm-yyyy'
	}: {
		id: string;
		name: string;
		label: string;
		value?: string;
		required?: boolean;
		disabled?: boolean;
		placeholder?: string;
	} = $props();

	let isOpen = $state(false);
	let isFocused = $state(false);
	let calendarRef: HTMLDivElement | undefined = $state();
	let containerRef: HTMLDivElement | undefined = $state();

	// Display value in dd-mm-yyyy format for user input
	let displayValue = $state('');

	// Track the currently displayed month/year in calendar (independent of selected date)
	let displayMonth = $state<{ year: number; month: number }>({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });

	// Convert string value (yyyy-mm-dd) to CalendarDate for the picker
	let selectedDate = $derived.by(() => {
		if (!value) return undefined;
		try {
			const date = new Date(value + 'T00:00:00Z');
			return dateToCalendarDate(date);
		} catch {
			return undefined;
		}
	});

	// Label should always be in "active" (floating) position to avoid overlapping with placeholder
	const isActive = $derived(true);

	// Month names for display
	const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

	// Calendar calculations
	let daysInMonth = $derived(new Date(displayMonth.year, displayMonth.month, 0).getDate());
	let firstDay = $derived(new Date(displayMonth.year, displayMonth.month - 1, 1).getDay());

	// Parse dd-mm-yyyy input to yyyy-mm-dd
	function parseDisplayValue(input: string): string {
		// Remove any non-digit or hyphen characters
		const cleaned = input.replace(/[^\d-]/g, '');

		// Try to parse dd-mm-yyyy format
		const parts = cleaned.split('-');
		if (parts.length === 3) {
			const day = parts[0].padStart(2, '0');
			const month = parts[1].padStart(2, '0');
			const year = parts[2];

			// Validate the date
			const dayNum = parseInt(day);
			const monthNum = parseInt(month);
			const yearNum = parseInt(year);

			if (yearNum >= 1900 && yearNum <= 2100 && monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
				// Return yyyy-mm-dd format
				return `${year}-${month}-${day}`;
			}
		}

		return '';
	}

	function handleInputChange(event: Event) {
		const input = (event.target as HTMLInputElement).value;
		displayValue = input;

		// Try to parse the input
		const parsed = parseDisplayValue(input);
		if (parsed) {
			value = parsed;
		} else if (input === '') {
			value = '';
		}
	}

	function handleDateSelect(date: CalendarDate) {
		const jsDate = calendarDateToDate(date);
		value = formatForSubmission(jsDate);
		displayValue = formatDateDisplay(jsDate);
		isOpen = false;
	}

	function handleClear() {
		value = '';
		displayValue = '';
		isOpen = false;
	}

	function handleToday() {
		const today = new Date();
		const todayCalendar = dateToCalendarDate(today);
		if (todayCalendar) {
			handleDateSelect(todayCalendar);
		}
	}

	function handlePrevMonth() {
		if (displayMonth.month === 1) {
			displayMonth = { year: displayMonth.year - 1, month: 12 };
		} else {
			displayMonth = { ...displayMonth, month: displayMonth.month - 1 };
		}
	}

	function handleNextMonth() {
		if (displayMonth.month === 12) {
			displayMonth = { year: displayMonth.year + 1, month: 1 };
		} else {
			displayMonth = { ...displayMonth, month: displayMonth.month + 1 };
		}
	}

	function handleFocus() {
		isFocused = true;
	}

	function handleBlur() {
		isFocused = false;

		// On blur, validate and format the input
		if (displayValue && value) {
			try {
				const date = new Date(value + 'T00:00:00Z');
				displayValue = formatDateDisplay(date);
			} catch {
				// Invalid date, keep as-is
			}
		}
	}

	function handleCalendarClick(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (!disabled) {
			isOpen = !isOpen;
		}
	}

	// Handle click outside to close calendar
	function handleClickOutside(event: MouseEvent) {
		if (isOpen && containerRef && !containerRef.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	// Sync displayValue with value changes from calendar
	$effect(() => {
		if (value) {
			try {
				const date = new Date(value + 'T00:00:00Z');
				displayValue = formatDateDisplay(date);
			} catch {
				// Invalid date
			}
		} else {
			displayValue = '';
		}
	});

	// When picker opens, initialize display month to selected date or current date
	$effect(() => {
		if (isOpen) {
			if (selectedDate) {
				displayMonth = { year: selectedDate.year, month: selectedDate.month };
			} else {
				const now = new Date();
				displayMonth = { year: now.getFullYear(), month: now.getMonth() + 1 };
			}
		}
	});

	// Add click outside listener
	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});
</script>

<div class="relative" bind:this={containerRef}>
	<div class="relative">
		<!-- Text input for typing dates -->
		<input
			type="text"
			{id}
			{placeholder}
			bind:value={displayValue}
			oninput={handleInputChange}
			onfocus={handleFocus}
			onblur={handleBlur}
			{disabled}
			class="w-full px-4 py-2 pt-6 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
			class:bg-gray-50={disabled}
			class:cursor-not-allowed={disabled}
		/>

		<!-- Calendar icon button -->
		<button
			type="button"
			onclick={handleCalendarClick}
			{disabled}
			tabindex="-1"
			class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
			class:cursor-not-allowed={disabled}
			class:hover:text-gray-400={disabled}
		>
			<Calendar class="h-4 w-4" />
		</button>
	</div>

	<!-- Calendar popover -->
	{#if isOpen}
		<div
			bind:this={calendarRef}
			class="absolute z-50 mt-1 w-auto p-4 bg-white border border-gray-200 rounded-md shadow-lg"
		>
			<div class="space-y-3">
				<!-- Calendar header with month/year navigation -->
				<div class="flex items-center justify-between mb-3">
					<button
						type="button"
						onclick={handlePrevMonth}
						class="px-2 py-1 text-sm hover:bg-gray-100 rounded"
					>
						←
					</button>
					<div class="font-semibold text-sm">
						{monthNames[displayMonth.month - 1]} {displayMonth.year}
					</div>
					<button
						type="button"
						onclick={handleNextMonth}
						class="px-2 py-1 text-sm hover:bg-gray-100 rounded"
					>
						→
					</button>
				</div>

				<!-- Day labels -->
				<div class="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-600 mb-1">
					<div>Su</div>
					<div>Mo</div>
					<div>Tu</div>
					<div>We</div>
					<div>Th</div>
					<div>Fr</div>
					<div>Sa</div>
				</div>

				<!-- Calendar days -->
				<div class="grid grid-cols-7 gap-1">
					{#each Array(firstDay) as _}
						<div></div>
					{/each}
					{#each Array(daysInMonth) as _, i}
						{@const day = i + 1}
						{@const isSelected = selectedDate?.year === displayMonth.year && selectedDate?.month === displayMonth.month && selectedDate?.day === day}
						<button
							type="button"
							onclick={() => handleDateSelect(new CalendarDate(displayMonth.year, displayMonth.month, day))}
							class="h-8 w-8 text-sm rounded hover:bg-sky-100 transition-colors"
							class:bg-sky-500={isSelected}
							class:text-white={isSelected}
							class:hover:bg-sky-600={isSelected}
						>
							{day}
						</button>
					{/each}
				</div>

				<!-- Actions -->
				<div class="flex justify-between gap-2 pt-2 border-t">
					<button
						type="button"
						onclick={handleClear}
						class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
					>
						Clear
					</button>
					<button
						type="button"
						onclick={handleToday}
						class="px-3 py-1.5 text-sm bg-sky-500 text-white hover:bg-sky-600 rounded transition-colors"
					>
						Today
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Floating Label -->
	<label
		for={id}
		class="absolute left-3 transition-all duration-200 pointer-events-none select-none {isActive
			? 'top-2 text-xs bg-white px-1 -translate-y-0'
			: 'top-1/2 -translate-y-1/2 text-sm text-gray-500'}"
		class:text-sky-600={isActive && (isFocused || isOpen)}
		class:text-gray-600={isActive && !isFocused && !isOpen}
	>
		{label}
		{#if required}
			<span class="text-red-500">*</span>
		{/if}
	</label>

	<!-- Hidden input for form submission (yyyy-mm-dd format) -->
	<input type="hidden" {name} {value} {required} />
</div>
