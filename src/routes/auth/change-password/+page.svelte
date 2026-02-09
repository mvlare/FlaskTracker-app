<script lang="ts">
	import { authClient } from "$lib/auth-client";
	import { goto } from "$app/navigation";
	import { Eye, EyeOff } from "lucide-svelte";

	let oldPassword = $state("");
	let newPassword = $state("");
	let error = $state("");
	let success = $state("");
	let loading = $state(false);
	let showOldPassword = $state(false);
	let showNewPassword = $state(false);

	async function handleChangePassword() {
		loading = true;
		error = "";
		success = "";

		// Basic validation
		if (!oldPassword || !newPassword) {
			error = "Both fields are required";
			loading = false;
			return;
		}

		if (newPassword.length < 8) {
			error = "New password must be at least 8 characters";
			loading = false;
			return;
		}

		if (oldPassword === newPassword) {
			error = "New password must be different from old password";
			loading = false;
			return;
		}

		try {
			const result = await authClient.changePassword({
				currentPassword: oldPassword,
				newPassword: newPassword,
			});

			if (result.error) {
				error = result.error.message || "Failed to change password";
			} else {
				success = "Password changed successfully!";
				// Clear fields
				oldPassword = "";
				newPassword = "";
				// Redirect after a short delay
				setTimeout(() => {
					goto("/");
				}, 2000);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : "Failed to change password";
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
	<div class="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
		<div class="mb-8 text-center">
			<h1 class="text-2xl font-bold text-gray-900">Change Password</h1>
			<p class="mt-2 text-gray-600">Update your FlaskTracker password</p>
		</div>

		{#if error}
			<div class="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
				{error}
			</div>
		{/if}

		{#if success}
			<div class="mb-4 rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700">
				{success}
			</div>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); handleChangePassword(); }} class="space-y-4">
			<div>
				<label for="old-password" class="mb-1 block text-sm font-medium">Old Password</label>
				<div class="relative">
					<input
						id="old-password"
						type={showOldPassword ? "text" : "password"}
						bind:value={oldPassword}
						required
						class="w-full rounded border px-3 py-2 pr-10"
						placeholder="••••••••"
					/>
					<button
						type="button"
						onclick={() => showOldPassword = !showOldPassword}
						class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
						aria-label={showOldPassword ? "Hide old password" : "Show old password"}
					>
						{#if showOldPassword}
							<EyeOff class="h-5 w-5" />
						{:else}
							<Eye class="h-5 w-5" />
						{/if}
					</button>
				</div>
			</div>

			<div>
				<label for="new-password" class="mb-1 block text-sm font-medium">New Password</label>
				<div class="relative">
					<input
						id="new-password"
						type={showNewPassword ? "text" : "password"}
						bind:value={newPassword}
						required
						minlength="8"
						class="w-full rounded border px-3 py-2 pr-10"
						placeholder="••••••••"
					/>
					<button
						type="button"
						onclick={() => showNewPassword = !showNewPassword}
						class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
						aria-label={showNewPassword ? "Hide new password" : "Show new password"}
					>
						{#if showNewPassword}
							<EyeOff class="h-5 w-5" />
						{:else}
							<Eye class="h-5 w-5" />
						{/if}
					</button>
				</div>
				<p class="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full rounded bg-sky-500 py-2 text-white hover:bg-sky-600 disabled:opacity-50"
			>
				{loading ? "Changing..." : "Change Password"}
			</button>
		</form>

		<div class="mt-6 text-center">
			<a href="/" class="text-sm text-blue-600 hover:underline">
				Back to Home
			</a>
		</div>
	</div>
</div>
