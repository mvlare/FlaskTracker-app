<script lang="ts">
	import type { PageData } from "./$types";

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

	async function deleteUser(userId: string, userEmail: string) {
		if (!confirm(`Are you sure you want to delete user: ${userEmail}?`)) return;

		error = "";
		success = "";

		try {
			const res = await fetch(`/admin/users/${userId}`, {
				method: "DELETE",
			});

			if (res.ok) {
				success = `User ${userEmail} deleted successfully`;
				setTimeout(() => window.location.reload(), 1000);
			} else {
				const result = await res.json();
				error = result.error || "Failed to delete user";
			}
		} catch (e) {
			error = "Network error. Please try again.";
		}
	}
</script>

<div class="container mx-auto p-6">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">User Management</h1>
			<p class="text-sm text-gray-600">Manage FlaskTracker users</p>
		</div>
		<button
			onclick={() => (showCreateForm = !showCreateForm)}
			class="rounded bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
		>
			{showCreateForm ? "Cancel" : "Create User"}
		</button>
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
					class="rounded bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
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
					<tr>
						<td class="px-6 py-4">{user.name}</td>
						<td class="px-6 py-4">{user.email}</td>
						<td class="px-6 py-4">
							{#if user.isAdmin}
								<span class="rounded bg-purple-100 px-2 py-1 text-xs text-purple-800">Admin</span>
							{:else}
								<span class="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800">User</span>
							{/if}
						</td>
						<td class="px-6 py-4">{new Date(user.createdAt).toLocaleDateString()}</td>
						<td class="px-6 py-4">
							<button
								onclick={() => deleteUser(user.id, user.email)}
								class="text-red-600 hover:underline"
							>
								Delete
							</button>
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
