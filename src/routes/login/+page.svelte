<script lang="ts">
	import { goto } from '$app/navigation';
	import Field from '$lib/components/ui/Field.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import State from '$lib/components/ui/State.svelte';
	import { api, message } from '$lib/client/api';
	import type { PageData } from './$types';
	export let data: PageData;
	let username = '',
		password = '',
		loading = false,
		error = '';
	async function login() {
		if (loading) return;
		loading = true;
		error = '';
		try {
			const result = await api<{ redirectTo: string }>('/api/login', {
				method: 'POST',
				body: JSON.stringify({ username, password })
			});
			password = '';
			await goto(result.redirectTo, { invalidateAll: true });
		} catch (cause) {
			error = message(cause);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head><title>Logg inn – Treningsplan</title></svelte:head>
<main
	class="lt fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#ffe6f7] via-[#fff5fc] to-[#ffe6f7] p-4"
>
	<form
		on:submit|preventDefault={login}
		aria-busy={loading}
		class="w-full max-w-sm bg-white rounded-3xl px-8 pt-10 pb-8 shadow-2xl border border-[#fd98dd]/40 flex flex-col gap-6"
	>
		<h1 class="text-center font-bold text-[clamp(1.5rem,7.5vw,1.875rem)] mb-3">
			<span class="text-[#fd98dd] italic">TRENINGS</span><span class="text-[#eb26ad] italic"
				>PLAN</span
			>
		</h1>
		<Field
			id="username"
			label="Brukernavn"
			bind:value={username}
			autocomplete="username"
			maxlength={120}
			required
			disabled={loading}
			placeholder="Ditt brukernavn"
		/>
		<Field
			id="password"
			label="Passord"
			type="password"
			bind:value={password}
			autocomplete="current-password"
			maxlength={1024}
			required
			disabled={loading}
			placeholder="••••••••"
		/>
		<State
			error={error ||
				(data.authUnavailable
					? 'Innloggingstjenesten er midlertidig utilgjengelig. Prøv igjen.'
					: '')}
		/>
		<div class="grid pt-2">
			<Button type="submit" disabled={loading || !username || !password}
				>{loading ? 'Logger inn…' : 'Logg inn'}</Button
			>
		</div>
	</form>
</main>
