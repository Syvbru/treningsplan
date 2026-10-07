<script lang="ts">
	import { formatTime } from '$lib/domain/dates';
	import { classifyWorkout, sharedAthletes } from '$lib/domain/workouts';
	import type { Workout, SharedWorkout } from '$lib/domain/types';
	import { getWorkoutColor } from './presentation';
	export let date: string;
	export let sessions: Workout[];
	export let shared: SharedWorkout[];
	export let athleteName: string;
	$: comments = [...new Set(sessions.map((session) => session.description.trim()).filter(Boolean))];
	$: companions = sessions.map((session) => ({
		names:
			classifyWorkout(session.title) === 'rest'
				? []
				: sharedAthletes(shared, athleteName, date, session.title)
	}));
</script>

<div class="day-plan pt-8" aria-label="Dagens plan">
	{#if sessions.length}
		<div class="sessions flex flex-col gap-7">
			{#each sessions as session, index (index)}
				<div
					class="session relative pl-[1.125rem] before:content-[''] before:absolute before:inset-y-0 before:left-0 before:w-1 before:min-h-7 before:rounded-[3px] before:bg-[var(--session-color)]"
					style="--session-color:{getWorkoutColor(session.title)}"
				>
					<h3 class="text-[clamp(1.125rem,3.7vw,1.5rem)] font-[650] leading-[1.45] wrap-anywhere">
						{session.title}
					</h3>
					{#if session.durationMin === null}
						<p class="duration duration-error mt-1 text-[0.875rem] text-workout-hard wrap-anywhere">
							Feil i tidsformat, må endres i regneark
						</p>
					{:else if session.durationMin}
						<p class="duration mt-1 text-[0.875rem] text-muted">
							{formatTime(session.durationMin)}
						</p>
					{/if}
				</div>
			{/each}
		</div>
		{#if comments.length}
			<div class="day-comment mt-7" aria-label="Kommentar til dagen">
				<p
					class="detail-label mb-2 text-[0.75rem] text-primary font-semibold tracking-[0.08em] uppercase"
				>
					Kommentar
				</p>
				{#each comments as comment (comment)}<p
						class="comment-text text-muted text-base leading-[1.7] whitespace-pre-wrap wrap-anywhere [&+.comment-text]:mt-3"
					>
						{comment}
					</p>{/each}
			</div>
		{/if}
		{#if companions.some((session) => session.names.length)}
			<div class="companions mt-7" aria-label="Utøvere med samme økt">
				<p
					class="detail-label mb-2 text-[0.75rem] text-primary font-semibold tracking-[0.08em] uppercase"
				>
					Samme økt
				</p>
				{#each companions as session, index (index)}
					{#if session.names.length}
						{#if sessions.length > 1}<p
								class="companion-session mt-3.5 mb-1 text-[0.75rem] text-secondary"
							>
								Økt {index + 1}:
							</p>{/if}
						<ul
							class="companion-names flex flex-wrap gap-x-5 gap-y-2 text-[0.875rem] leading-[1.6]"
						>
							{#each session.names as name (name)}<li>{name}</li>{/each}
						</ul>
					{/if}
				{/each}
			</div>
		{/if}
	{:else}
		<p class="empty-day pt-4 pb-8 text-muted text-[0.9375rem] text-center">
			Ingen økter er lagt inn denne dagen.
		</p>
	{/if}
</div>
