<script lang="ts">
	import { authClient } from "$lib/auth-client";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";

	// Use server-side data instead of client stores to avoid SSR issues
	const session = $derived($page.data.session);
	const user = $derived($page.data.user);
	const isAdmin = $derived($page.data.isAdmin);

	async function handleSignOut() {
		await authClient.signOut();
		goto("/auth/signin");
	}
</script>

<header class="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 shadow-md">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<img src="/flask_imau.png" alt="IMAU Flask" class="h-12 w-12 object-contain" />
			<div>
				<h1 class="text-xl font-bold text-white">Flask Tracking System</h1>
				<p class="text-xs text-white/90">Manage and monitor your laboratory flasks</p>
			</div>
		</div>
		<div class="flex items-center gap-4">
			<div class="rounded-md bg-white px-4 py-2 shadow-sm">
				<img src="/imau-institute.png" alt="IMAU Institute" class="h-12 w-auto object-contain" />
			</div>

			{#if session}
				<!-- User is signed in -->
				<div class="flex items-center gap-3">
					<span class="text-sm font-medium text-white">
						{user?.name || user?.email}
					</span>
					<!-- Admin Link -->
					{#if isAdmin}
						<button
							onclick={() => goto("/admin/users")}
							class="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 transition-colors shadow-sm"
						>
							Manage Users
						</button>
					{/if}
					<button
						onclick={handleSignOut}
						class="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 transition-colors shadow-sm"
					>
						Sign out
					</button>
				</div>
			{:else}
				<!-- User is not signed in -->
				<button
					onclick={() => goto("/auth/signin")}
					class="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 transition-colors shadow-sm"
				>
					Sign in
				</button>
			{/if}
		</div>
	</div>
</header>
