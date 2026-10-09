<div
	role="status"
	aria-busy="true"
	class="bg-card rounded-[1.75rem] px-5 pt-6 pb-7 sm:px-10 sm:pt-8 sm:pb-10 max-[360px]:px-4"
>
	<span class="sr-only">Laster treningsplan…</span>
	<div aria-hidden="true" class="mx-auto max-w-[43rem] animate-pulse motion-reduce:animate-none">
		<div class="flex min-h-11 items-center justify-between gap-4">
			<div class="h-6 w-36 rounded bg-gray-200 sm:w-48"></div>
			<div class="h-8 w-28 shrink-0 sm:h-11 sm:w-34"></div>
		</div>
		<div class="mt-0.5 h-3 w-40 rounded bg-gray-200"></div>
		<div class="mt-6 -mx-1.5 mb-[1.625rem] grid grid-cols-7 sm:mt-8">
			{#each Array(7) as _, index (index)}
				<div class="flex min-w-0 flex-col items-center">
					<div class="mb-3 h-4"></div>
					<div class="size-10 rounded-full bg-gray-200 sm:size-12 max-[360px]:size-[34px]"></div>
					<div class="h-3"></div>
				</div>
			{/each}
		</div>
		<div class="min-h-[14rem] border-t border-divider pt-8">
			<div class="space-y-7">
				{#each Array(2) as _, index (index)}
					<div class="flex gap-3.5">
						<div class="w-1 shrink-0 rounded bg-gray-200"></div>
						<div class="flex-1 space-y-2">
							<div class="h-6 w-3/4 rounded bg-gray-200"></div>
							<div class="h-4 w-20 rounded bg-gray-200"></div>
						</div>
					</div>
				{/each}
			</div>
			<div class="mt-7 space-y-2">
				<div class="h-3 w-24 rounded bg-gray-200"></div>
				<div class="h-4 w-full rounded bg-gray-200"></div>
				<div class="h-4 w-2/3 rounded bg-gray-200"></div>
			</div>
		</div>
	</div>
</div>
