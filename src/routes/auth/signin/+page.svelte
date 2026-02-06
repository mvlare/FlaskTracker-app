<script lang="ts">
	import { authClient } from "$lib/auth-client";
	import { goto } from "$app/navigation";

	let email = $state("");
	let password = $state("");
	let error = $state("");
	let loading = $state(false);

	async function handleSignIn() {
		loading = true;
		error = "";

		try {
			const result = await authClient.signIn.email({
				email,
				password,
			});

			if (result.error) {
				error = result.error.message || "Failed to sign in";
			} else {
				// Redirect to home page after successful sign-in
				goto("/");
			}
		} catch (e) {
			error = e instanceof Error ? e.message : "Failed to sign in";
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-yellow-50 to-yellow-100">
	<div class="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
		<div class="mb-8 text-center">
			<h1 class="text-2xl font-bold text-gray-900">Sign In to FlaskTracker</h1>
			<p class="mt-2 text-gray-600">Enter your credentials to continue</p>
		</div>

		{#if error}
			<div class="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
				{error}
			</div>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); handleSignIn(); }} class="space-y-4">
			<div>
				<label for="email" class="mb-1 block text-sm font-medium">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					required
					class="w-full rounded border px-3 py-2"
					placeholder="admin@flasktracker.local"
				/>
			</div>

			<div>
				<label for="password" class="mb-1 block text-sm font-medium">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					required
					class="w-full rounded border px-3 py-2"
					placeholder="••••••••"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full rounded bg-yellow-500 py-2 text-white hover:bg-yellow-600 disabled:opacity-50"
			>
				{loading ? "Signing in..." : "Sign In"}
			</button>
		</form>

		<p class="mt-6 text-center text-xs text-gray-500">
			FlaskTracker - Closed System<br />
			Contact your administrator for access
		</p>
	</div>
</div>
