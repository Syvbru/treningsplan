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

<div class="day-plan" aria-label="Dagens plan">
	{#if sessions.length}
		<div class="sessions">
			{#each sessions as session, index (index)}
				<div class="session" style="--session-color:{getWorkoutColor(session.title)}">
					<h3>{session.title}</h3>
					{#if session.durationMin}<p class="duration">{formatTime(session.durationMin)}</p>{/if}
				</div>
			{/each}
		</div>
		{#if comments.length}
			<div class="day-comment" aria-label="Kommentar til dagen">
				<p class="detail-label">Kommentar</p>
				{#each comments as comment (comment)}<p class="comment-text">{comment}</p>{/each}
			</div>
		{/if}
		{#if companions.some((session) => session.names.length)}
			<div class="companions" aria-label="Utøvere med samme økt">
				<p class="detail-label">Samme økt</p>
				{#each companions as session, index (index)}
					{#if session.names.length}
						{#if sessions.length > 1}<p class="companion-session">
								Økt {index + 1}:
							</p>{/if}
						<ul class="companion-names">
							{#each session.names as name (name)}<li>{name}</li>{/each}
						</ul>
					{/if}
				{/each}
			</div>
		{/if}
	{:else}
		<p class="empty-day">Ingen økter er lagt inn denne dagen.</p>
	{/if}
</div>

<style>
	.day-plan {
		padding-top: 2rem;
	}
	.sessions {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
	}
	.session {
		position: relative;
		padding-left: 1.125rem;
	}
	.session::before {
		content: '';
		position: absolute;
		inset: 0 auto 0 0;
		width: 4px;
		min-height: 1.75rem;
		border-radius: 3px;
		background: var(--session-color);
	}
	h3 {
		font-size: clamp(1.125rem, 3.7vw, 1.5rem);
		font-weight: 650;
		line-height: 1.45;
		overflow-wrap: anywhere;
	}
	.duration {
		margin-top: 0.25rem;
		color: var(--text2);
		font-size: 0.875rem;
	}
	.day-comment,
	.companions {
		margin-top: 1.75rem;
	}
	.detail-label {
		margin-bottom: 0.5rem;
		color: var(--p1);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.comment-text {
		color: var(--text2);
		font-size: 1rem;
		line-height: 1.7;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.comment-text + .comment-text {
		margin-top: 0.75rem;
	}
	.companion-session {
		margin-top: 0.875rem;
		margin-bottom: 0.25rem;
		font-size: 0.75rem;
		color: var(--p2);
	}
	.companion-names {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		font-size: 0.875rem;
		line-height: 1.6;
	}
	.empty-day {
		padding: 1rem 0 2rem;
		color: var(--text2);
		font-size: 0.9375rem;
		text-align: center;
	}
</style>
