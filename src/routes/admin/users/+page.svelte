<script lang="ts">
	import type { PageData } from "./$types";
	import { Eye, EyeOff, Home } from "lucide-svelte";
	import { goto } from "$app/navigation";
	import { formatDateDisplay } from "$lib/utils/dates";

	let { data }: { data: PageData } = $props();

	let showCreateForm = $state(false);
	let newUser = $state({
		name: "",
		email: "",
		password: "",
		isAdmin: false,
	});
	let error = $state("");
	let success = $state("");

	// Reset password state
	let resetPasswordUser = $state<{ id: string; name: string; email: string } | null>(null);
	let newPassword = $state("");
	let showNewPassword = $state(false);
	let resetLoading = $state(false);

	// Delete user state
	let deleteUserConfirm = $state<{ id: string; name: string; email: string } | null>(null);
	let deleteLoading = $state(false);

	async function createUser() {
		error = "";
		success = "";

		if (!newUser.name || !newUser.email || !newUser.password) {
			error = "All fields are required";
			return;
		}

		if (newUser.password.length < 8) {
			error = "Password must be at least 8 characters";
			return;
		}

		try {
			const res = await fetch("/admin/users", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(newUser),
			});

			const result = await res.json();

			if (res.ok) {
				success = `User ${newUser.email} created successfully!`;
				// Reset form
				newUser = {
					name: "",
					email: "",
					password: "",
					isAdmin: false,
				};
				showCreateForm = false;
				// Reload page to show new user
				setTimeout(() => window.location.reload(), 1000);
			} else {
				error = result.error || "Failed to create user";
			}
		} catch (e) {
			error = "Network error. Please try again.";
		}
	}

	function openDeleteConfirm(user: { id: string; name: string; email: string }) {
		deleteUserConfirm = user;
		error = "";
		success = "";
	}

	function closeDeleteConfirm() {
		deleteUserConfirm = null;
	}

	async function confirmDeleteUser() {
		if (!deleteUserConfirm) return;

		error = "";
		success = "";
		deleteLoading = true;

		try {
			const res = await fetch(`/admin/users/${deleteUserConfirm.id}`, {
				method: "DELETE",
			});

			if (res.ok) {
				success = `User ${deleteUserConfirm.email} deleted successfully`;
				setTimeout(() => {
					closeDeleteConfirm();
					window.location.reload();
				}, 1000);
			} else {
				const result = await res.json();
				error = result.error || "Failed to delete user";
			}
		} catch (e) {
			error = "Network error. Please try again.";
		} finally {
			deleteLoading = false;
		}
	}

	function openResetPassword(user: { id: string; name: string; email: string }) {
		resetPasswordUser = user;
		newPassword = "";
		showNewPassword = false;
		error = "";
		success = "";
	}

	function closeResetPassword() {
		resetPasswordUser = null;
		newPassword = "";
		showNewPassword = false;
	}

	async function handleResetPassword() {
		if (!resetPasswordUser) return;

		error = "";
		success = "";
		resetLoading = true;

		if (newPassword.length < 8) {
			error = "Password must be at least 8 characters";
			resetLoading = false;
			return;
		}

		try {
			const res = await fetch(`/admin/users/${resetPasswordUser.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ newPassword }),
			});

			const result = await res.json();

			if (res.ok) {
				success = `Password reset successfully for ${resetPasswordUser.email}`;
				setTimeout(() => {
					closeResetPassword();
				}, 1500);
			} else {
				error = result.error || "Failed to reset password";
			}
		} catch (e) {
			error = "Network error. Please try again.";
		} finally {
			resetLoading = false;
		}
	}
</script>

<div class="container mx-auto p-6">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">User Management</h1>
			<p class="text-sm text-gray-600">Manage FlaskTracker users</p>
		</div>
		<div class="flex items-center gap-3">
			<button
				onclick={() => goto("/")}
				class="flex items-center gap-2 rounded bg-sky-500 px-4 py-2 text-white hover:bg-sky-600"
				title="Go to Home"
			>
				<Home class="h-4 w-4" />
				Home
			</button>
			<button
				onclick={() => (showCreateForm = !showCreateForm)}
				class="rounded bg-sky-500 px-4 py-2 text-white hover:bg-sky-600"
			>
				{showCreateForm ? "Cancel" : "Create User"}
			</button>
		</div>
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

	{#if showCreateForm}
		<div class="mb-6 rounded-lg bg-white p-6 shadow">
			<h2 class="mb-4 text-xl font-semibold">Create New User</h2>
			<form onsubmit={(e) => { e.preventDefault(); createUser(); }} class="space-y-4">
				<div>
					<label class="mb-1 block text-sm font-medium">Name</label>
					<input
						type="text"
						bind:value={newUser.name}
						required
						class="w-full rounded border px-3 py-2"
						placeholder="John Doe"
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium">Email</label>
					<input
						type="email"
						bind:value={newUser.email}
						required
						class="w-full rounded border px-3 py-2"
						placeholder="user@example.com"
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium">Password</label>
					<input
						type="password"
						bind:value={newUser.password}
						required
						minlength="8"
						class="w-full rounded border px-3 py-2"
						placeholder="Minimum 8 characters"
					/>
					<p class="mt-1 text-xs text-gray-500">User can change this password later</p>
				</div>
				<div>
					<label class="flex items-center gap-2">
						<input type="checkbox" bind:checked={newUser.isAdmin} />
						<span class="text-sm font-medium">Admin User (can manage other users)</span>
					</label>
				</div>
				<button
					type="submit"
					class="rounded bg-sky-500 px-4 py-2 text-white hover:bg-sky-600"
				>
					Create User
				</button>
			</form>
		</div>
	{/if}

	<div class="rounded-lg bg-white shadow">
		<table class="w-full">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
					<th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
					<th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Role</th>
					<th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
					<th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200">
				{#each data.users as user}
					<tr class={deleteUserConfirm?.id === user.id ? "bg-red-50" : ""}>
						<td class="px-6 py-4">{user.name}</td>
						<td class="px-6 py-4">{user.email}</td>
						<td class="px-6 py-4">
							{#if user.isAdmin}
								<span class="rounded bg-purple-100 px-2 py-1 text-xs text-purple-800">Admin</span>
							{:else}
								<span class="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800">User</span>
							{/if}
						</td>
						<td class="px-6 py-4">{formatDateDisplay(user.createdAt)}</td>
						<td class="px-6 py-4">
							{#if deleteUserConfirm?.id === user.id}
								<!-- Inline delete confirmation -->
								<div class="flex flex-col gap-2">
									<p class="text-sm font-medium text-red-700">
										Delete user "{deleteUserConfirm.name}"?
									</p>
									<div class="flex gap-2">
										<button
											onclick={confirmDeleteUser}
											disabled={deleteLoading}
											class="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
										>
											{deleteLoading ? "Deleting..." : "Delete"}
										</button>
										<button
											onclick={closeDeleteConfirm}
											disabled={deleteLoading}
											class="rounded bg-gray-300 px-3 py-1 text-sm text-gray-800 hover:bg-gray-400 disabled:opacity-50"
										>
											Cancel
										</button>
									</div>
								</div>
							{:else}
								<!-- Normal action buttons -->
								<div class="flex gap-3">
									<button
										onclick={() => openResetPassword({ id: user.id, name: user.name, email: user.email })}
										class="text-blue-600 hover:underline"
									>
										Reset Password
									</button>
									<button
										onclick={() => openDeleteConfirm({ id: user.id, name: user.name, email: user.email })}
										class="text-red-600 hover:underline"
									>
										Delete
									</button>
								</div>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		{#if data.users.length === 0}
			<div class="p-6 text-center text-gray-500">
				No users found. Create your first user to get started.
			</div>
		{/if}
	</div>
</div>

<!-- Reset Password Modal -->
{#if resetPasswordUser}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
			<h2 class="mb-4 text-xl font-bold">Reset Password</h2>
			<p class="mb-4 text-sm text-gray-600">
				Resetting password for: <strong>{resetPasswordUser.name}</strong> ({resetPasswordUser.email})
			</p>

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

			<form onsubmit={(e) => { e.preventDefault(); handleResetPassword(); }} class="space-y-4">
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
							placeholder="Minimum 8 characters"
						/>
						<button
							type="button"
							onclick={() => showNewPassword = !showNewPassword}
							class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
							aria-label={showNewPassword ? "Hide password" : "Show password"}
						>
							{#if showNewPassword}
								<EyeOff class="h-5 w-5" />
							{:else}
								<Eye class="h-5 w-5" />
							{/if}
						</button>
					</div>
					<p class="mt-1 text-xs text-gray-500">User will need to use this password to sign in</p>
				</div>

				<div class="flex gap-3">
					<button
						type="submit"
						disabled={resetLoading}
						class="flex-1 rounded bg-sky-500 px-4 py-2 text-white hover:bg-sky-600 disabled:opacity-50"
					>
						{resetLoading ? "Resetting..." : "Reset Password"}
					</button>
					<button
						type="button"
						onclick={closeResetPassword}
						disabled={resetLoading}
						class="flex-1 rounded bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400 disabled:opacity-50"
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
