<script lang="ts">
	import {
		User,
		X,
		SquarePen,
		Dumbbell,
		ChevronRight,
		FileText,
		Moon,
		LogOut,
		ArrowLeft
	} from 'lucide-svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import State from '$lib/components/ui/State.svelte';
	import { styrkeProgrammer } from '$lib/config/resources';
	import { api, message } from '$lib/client/api';
	import type { User as AppUser, Athlete } from '$lib/domain/types';
	export let user: AppUser;
	export let athlete: Athlete | null = null;
	export let darkMode: boolean;
	export let onClose: () => void;
	let showStyrkeSubmenu = false,
		loggingOut = false,
		logoutError = '';
	$: isAdmin = user.role === 'trener';
	$: username = user.name;
	$: currentUtoverNavn = athlete?.name ?? '';
	$: currentEditPlanSheet = athlete?.editPlanSheet ?? '';
	async function handleLogout() {
		loggingOut = true;
		logoutError = '';
		try {
			await api('/api/logout', { method: 'POST' });
			window.location.assign('/login');
		} catch (error) {
			logoutError = message(error);
			loggingOut = false;
		}
	}
</script>

<Dialog title="Profil og ressurser" variant="sidebar" {onClose}>
	<div class="bg-[var(--p1)] px-5 py-6 flex items-center gap-3">
		<User class="h-4 w-4 shrink-0 text-white" />
		<div class="flex-1 min-w-0">
			<p class="font-bold text-white capitalize">
				{isAdmin ? username.charAt(0).toUpperCase() + username.slice(1) : username}
			</p>
			{#if isAdmin && currentUtoverNavn}
				<p class="text-xs text-white truncate">Viser: {currentUtoverNavn}</p>
			{/if}
		</div>
		<button
			aria-label="Lukk profil"
			on:click={() => {
				onClose();
				showStyrkeSubmenu = false;
			}}
			class="quiet-focus flex h-8 w-8 shrink-0 items-center justify-center text-white"
		>
			<X class="h-5 w-5" />
		</button>
	</div>

	<div class="flex-1 overflow-y-auto p-3">
		<State error={logoutError} />
		{#if !showStyrkeSubmenu}
			{#if currentEditPlanSheet}
				<a
					href={currentEditPlanSheet}
					target="_blank"
					rel="noopener noreferrer"
					on:click={() => onClose()}
					class="flex items-center gap-3 min-h-11 w-full px-3 py-3 rounded-xl hover:bg-[var(--surface)]/50 transition-colors text-left mb-1"
				>
					<SquarePen class="h-4 w-4 shrink-0 text-green-700" />
					<span class="text-sm font-medium text-[var(--text1)] truncate">
						{isAdmin && currentUtoverNavn
							? `${currentUtoverNavn} – Google Sheet`
							: 'Min treningsplan (Rediger)'}
					</span>
				</a>
			{/if}

			<button
				on:click={() => (showStyrkeSubmenu = true)}
				class="flex items-center gap-3 min-h-11 w-full px-3 py-3 rounded-xl hover:bg-[var(--surface)]/50 transition-colors text-left mb-1"
			>
				<Dumbbell class="h-4 w-4 shrink-0 text-[var(--p1)]" />
				<span class="text-sm font-medium text-[var(--text1)] flex-1">Styrkeøkter</span>
				<ChevronRight class="h-4 w-4 shrink-0 text-[var(--text2)]" />
			</button>

			<a
				href="/pdf/Intensitessoner.pdf"
				target="_blank"
				rel="noopener noreferrer"
				on:click={() => onClose()}
				class="flex items-center gap-3 min-h-11 w-full px-3 py-3 rounded-xl hover:bg-[var(--surface)]/50 transition-colors text-left mb-1"
			>
				<FileText class="h-4 w-4 shrink-0 text-[var(--p1)]" />
				<span class="text-sm font-medium text-[var(--text1)]">Intensitetssoner</span>
			</a>

			<div class="flex items-center gap-3 min-h-11 w-full px-3 py-3 rounded-xl mb-1">
				<Moon class="h-4 w-4 shrink-0 text-[var(--p1)]" />
				<span class="text-sm font-medium text-[var(--text1)] flex-1">Mørkt tema</span>
				<button
					on:click|stopPropagation={() => (darkMode = !darkMode)}
					class="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
					aria-pressed={darkMode}
					style="background-color:{darkMode ? 'var(--p1)' : '#CBD5E1'}"
					aria-label="Bytt tema"
				>
					<span
						class="absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--card)] rounded-full shadow-sm transition-transform duration-200"
						style="transform:translateX({darkMode ? '20px' : '0px'})"
					></span>
				</button>
			</div>

			<div class="h-px bg-[var(--surface)] my-2"></div>

			<button
				disabled={loggingOut}
				on:click={handleLogout}
				class="flex items-center gap-3 min-h-11 w-full px-3 py-3 rounded-xl hover:bg-red-50 transition-colors text-left"
			>
				<LogOut class="h-4 w-4 shrink-0 text-red-600" />
				<span class="text-sm font-medium text-red-600">Logg ut</span>
			</button>
		{:else}
			<button
				on:click={() => (showStyrkeSubmenu = false)}
				class="flex items-center gap-2 text-sm font-semibold text-[var(--p1)] px-3 py-2 mb-2 hover:bg-[var(--p2)]/20 rounded-lg transition-colors"
			>
				<ArrowLeft class="h-4 w-4 shrink-0" /> Tilbake
			</button>
			<p class="text-xs font-bold text-[var(--text2)] uppercase tracking-widest px-3 mb-2">
				Styrkeøkter
			</p>
			{#each styrkeProgrammer as p (p.url)}
				<a
					href={p.url}
					target="_blank"
					rel="noopener noreferrer"
					on:click={() => onClose()}
					class="flex items-center gap-3 min-h-11 w-full px-3 py-3 rounded-xl hover:bg-[var(--surface)]/50 transition-colors text-left mb-1"
				>
					<FileText class="h-4 w-4 shrink-0 text-[var(--p1)]" />
					<span class="text-sm font-medium text-[var(--text1)]">{p.title}</span>
				</a>
			{/each}
		{/if}
	</div>
</Dialog>
