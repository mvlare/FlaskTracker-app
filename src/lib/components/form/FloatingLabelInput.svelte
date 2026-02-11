<script lang="ts">
	let {
		id,
		name,
		label,
		value = $bindable(''),
		type = 'text',
		required = false,
		disabled = false,
		placeholder = '',
		rows = 4
	}: {
		id: string;
		name: string;
		label: string;
		value?: string;
		type?: 'text' | 'date' | 'textarea';
		required?: boolean;
		disabled?: boolean;
		placeholder?: string;
		rows?: number;
	} = $props();

	let isFocused = $state(false);

	// Label should be in "active" (floating) position if field has value or is focused
	// For date inputs, always keep label floating to avoid overlap with browser's date format
	const isActive = $derived(type === 'date' || isFocused || value.length > 0);

	function handleFocus() {
		isFocused = true;
	}

	function handleBlur() {
		isFocused = false;
	}
</script>

<div class="relative">
	{#if type === 'textarea'}
		<textarea
			{id}
			{name}
			bind:value
			placeholder={isActive ? placeholder : ''}
			{disabled}
			{rows}
			onfocus={handleFocus}
			onblur={handleBlur}
			class="w-full px-4 py-2 pt-6 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all resize-y peer"
			class:bg-gray-50={disabled}
			class:cursor-not-allowed={disabled}
		></textarea>
	{:else}
		<input
			{type}
			{id}
			{name}
			bind:value
			placeholder={isActive ? placeholder : ''}
			{disabled}
			{required}
			onfocus={handleFocus}
			onblur={handleBlur}
			class="w-full px-4 py-2 pt-6 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all peer"
			class:bg-gray-50={disabled}
			class:cursor-not-allowed={disabled}
		/>
	{/if}

	<!-- Floating Label -->
	<label
		for={id}
		class="absolute left-3 transition-all duration-200 pointer-events-none select-none {isActive
			? 'top-2 text-xs bg-white px-1 -translate-y-0'
			: 'top-1/2 -translate-y-1/2 text-sm text-gray-500'}"
		class:text-sky-600={isActive && isFocused}
		class:text-gray-600={isActive && !isFocused}
	>
		{label}
		{#if required}
			<span class="text-red-500">*</span>
		{/if}
	</label>
</div>
