<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	let {
		currentPage = 1,
		totalPages = 1,
		totalCount = 0
	}: {
		currentPage?: number;
		totalPages?: number;
		totalCount?: number;
	} = $props();

	function goToPage(newPage: number) {
		if (newPage < 1 || newPage > totalPages) return;
		const url = new URL(page.url);
		url.searchParams.set('page', newPage.toString());
		goto(url.toString(), { replaceState: true, keepFocus: true });
	}
</script>

<div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
	<div class="flex flex-1 justify-between sm:hidden">
		<button
			onclick={() => goToPage(currentPage - 1)}
			disabled={currentPage === 1}
			class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			Previous
		</button>
		<button
			onclick={() => goToPage(currentPage + 1)}
			disabled={currentPage === totalPages}
			class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			Next
		</button>
	</div>
	<div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
		<div>
			<p class="text-sm text-gray-700">
				Showing
				<span class="font-medium">{(currentPage - 1) * 15 + 1}</span>
				to
				<span class="font-medium">{Math.min(currentPage * 15, totalCount)}</span>
				of
				<span class="font-medium">{totalCount}</span>
				results
			</p>
		</div>
		<div>
			<nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
				<button
					onclick={() => goToPage(currentPage - 1)}
					disabled={currentPage === 1}
					class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<span class="sr-only">Previous</span>
					<ChevronLeft class="h-5 w-5" />
				</button>

				{#each Array(totalPages) as _, i}
					{@const pageNum = i + 1}
					{#if totalPages <= 7 || pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)}
						<button
							onclick={() => goToPage(pageNum)}
							class="relative inline-flex items-center px-4 py-2 text-sm font-semibold {pageNum === currentPage
								? 'z-10 bg-blue-500 text-white focus:z-20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500'
								: 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}"
						>
							{pageNum}
						</button>
					{:else if pageNum === currentPage - 2 || pageNum === currentPage + 2}
						<span
							class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
						>
							...
						</span>
					{/if}
				{/each}

				<button
					onclick={() => goToPage(currentPage + 1)}
					disabled={currentPage === totalPages}
					class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<span class="sr-only">Next</span>
					<ChevronRight class="h-5 w-5" />
				</button>
			</nav>
		</div>
	</div>
</div>
