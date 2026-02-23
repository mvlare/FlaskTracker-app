<script lang="ts">
	import { authClient } from "$lib/auth-client";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { FlaskConical, User } from "lucide-svelte";

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
	<div class="grid grid-cols-3 items-center">
		<!-- Left: app title -->
		<div class="flex items-center gap-4">
			<FlaskConical class="h-12 w-12 text-white" />
			<div>
				<h1 class="text-xl font-bold text-white">Flask Tracking System</h1>
				<p class="text-xs text-white/90">Manage and monitor your laboratory flasks</p>
			</div>
		</div>

		<!-- Center: IMAU logo -->
		<div class="flex justify-center">
			<div class="rounded-md bg-white px-4 py-2 shadow-sm">
				<img src="/imau-institute.png" alt="IMAU Institute" class="h-12 w-auto object-contain" />
			</div>
		</div>

		<!-- Right: user controls -->
		<div class="flex items-center justify-end gap-4">
			{#if session}
				<div class="flex items-center gap-3">
					<div class="flex items-center gap-1.5 text-sm font-medium text-gray-200">
						<User class="h-4 w-4" />
						<span>{user?.name || user?.email}</span>
					</div>
					{#if isAdmin}
						<button
							onclick={() => goto("/admin/users")}
							class="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 transition-colors shadow-sm"
						>
							Manage Users
						</button>
					{/if}
					<button
						onclick={() => goto("/auth/change-password")}
						class="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 transition-colors shadow-sm"
					>
						Change Password
					</button>
					<button
						onclick={handleSignOut}
						class="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 transition-colors shadow-sm"
					>
						Sign out
					</button>
				</div>
			{:else}
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
