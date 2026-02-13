<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft, GitBranch } from 'lucide-svelte';
	import FlaskTreeView from '$lib/components/flasks/FlaskTreeView.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function handleBack() {
		goto(`/flasks/${data.flask.id}/edit`);
	}
</script>

<div class="container mx-auto px-4 py-6 max-w-4xl bg-slate-50 min-h-screen">
	<!-- Header -->
	<div class="mb-6">
		<button
			onclick={handleBack}
			class="flex items-center gap-2 text-sky-600 hover:text-sky-700 mb-4 transition-colors"
		>
			<ArrowLeft class="h-4 w-4" />
			Back to Flask
		</button>
		<div class="flex items-center gap-3">
			<GitBranch class="h-8 w-8 text-sky-600" />
			<h1 class="text-3xl font-bold text-gray-800">
				Flask Reference Tree: {data.flask.name}
			</h1>
		</div>
	</div>

	<!-- Tree Component -->
	<div class="bg-white shadow-md rounded-lg overflow-hidden p-4">
		<FlaskTreeView flaskId={data.flask.id} compact={false} />
	</div>
</div>
