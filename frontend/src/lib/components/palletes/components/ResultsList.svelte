<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher<{
        select: any;
    }>();

    export let selectedIndex = 0;
    export let isEmpty = false;
    export let emptyMessage = 'No results found';

    function handleSelect(item: any) {
        dispatch('select', item);
    }
</script>

<div class="max-h-[60vh] overflow-y-auto">
    <div class="divide-y divide-gray-800">
        <slot {selectedIndex} />
    </div>
</div>

{#if isEmpty}
    <slot name="empty">
        <div class="px-4 py-8 text-center text-gray-500">
            {emptyMessage}
        </div>
    </slot>
{/if}
