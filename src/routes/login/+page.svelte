<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Field from '$lib/components/ui/Field.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import State from '$lib/components/ui/State.svelte';
	import { api, message, ClientError } from '$lib/client/api';
	import type { PageData } from './$types';
	export let data: PageData;
	let username = '',
		password = '',
		loading = false,
		error = '';
	let blockedUntil = 0;
	let remaining = 0;
	$: countdown = [Math.floor(remaining / 3600), Math.floor((remaining % 3600) / 60), remaining % 60]
		.map((value) => String(value).padStart(2, '0'))
		.join(':');
	onMount(() => {
		const timer = setInterval(() => {
			remaining = Math.max(0, Math.ceil((blockedUntil - Date.now()) / 1000));
		}, 1000);
		return () => clearInterval(timer);
	});
	async function login() {
		if (loading || remaining > 0) return;
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
			if (cause instanceof ClientError && cause.status === 429 && cause.retryAfterSeconds) {
				remaining = cause.retryAfterSeconds;
				blockedUntil = Date.now() + remaining * 1000;
			}
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
		{#if remaining > 0}
			<p class="text-sm text-center" role="status">
				Prøv igjen om {countdown} (timer:minutter:sekunder).
			</p>
		{/if}
		<div class="grid pt-2">
			<Button type="submit" disabled={loading || remaining > 0 || !username || !password}
				>{loading ? 'Logger inn…' : 'Logg inn'}</Button
			>
		</div>
	</form>
</main>
