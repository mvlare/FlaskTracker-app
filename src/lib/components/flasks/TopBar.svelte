<script lang="ts">
	import { Beaker } from 'lucide-svelte';
</script>

<header class="bg-gradient-to-r from-yellow-400 to-yellow-500 px-6 py-4 shadow-md">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-6">
			<Beaker class="h-8 w-8 text-gray-800" />
			<nav class="flex items-center gap-4">
				<a
					href="/"
					class="text-lg font-semibold text-gray-800 hover:text-gray-900 transition-colors"
				>
					Flasks
				</a>
			</nav>
		</div>
		<button
			class="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 transition-colors shadow-sm"
		>
			Sign in
		</button>
	</div>
</header>
