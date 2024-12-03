<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { handleKeyboardEvent } from '../stores/keyboardStore';

    onMount(() => {
        window.addEventListener('keydown', handleKeyboardEvent);
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeyboardEvent);
    });
</script>
