<script>
    import { link } from 'svelte-spa-router';
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
    <h1 class="text-4xl font-bold mb-8">Welcome to EditAI</h1>

    <div class="flex gap-4">
        <a 
            href="/editor" 
            use:link 
            class="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
            Editor
        </a>
        <a 
            href="/configs" 
            use:link 
            class="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
        >
            Configs
        </a>
    </div>
</div>