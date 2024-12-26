<script lang="ts">
    import {
        Book,
        ExternalLink,
        Github,
        Rocket,
        Sparkles,
        Keyboard,
    } from "lucide-svelte";
    import { BrowserOpenURL } from "@/lib/wailsjs/runtime/runtime";
    import RecentProjects from "@/lib/components/RecentProjects.svelte";
    import { onMount } from "svelte";
    import Snow from "@/lib/components/Snow.svelte";

    const documentationLinks = [
        {
            title: "Getting Started",
            description: "Learn the basics of EditAI",
            url: "https://docs.edit4i.com/getting-started",
            icon: Rocket,
        },
        {
            title: "Key Features",
            description: "Explore what EditAI can do",
            url: "https://docs.edit4i.com/features",
            icon: Sparkles,
        },
        {
            title: "Keyboard Shortcuts",
            description: "Boost your productivity",
            url: "https://docs.edit4i.com/shortcuts",
            icon: Keyboard,
        },
    ];

    function openExternalUrl(url: string) {
        BrowserOpenURL(url);
    }

    // Check if it's Christmas
    const today = new Date();
    const isChristmas = today.getMonth() === 11 && today.getDate() === 25;

    const christmasEmojis = "🎄 ❄️ ⛄";
</script>

{#if isChristmas}
    <Snow />
{/if}

<div class="min-h-screen bg-gray-900 text-gray-200 p-8">
    <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-12">
            <h1
                class="text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent"
            >
                Welcome to Edit4I {isChristmas ? christmasEmojis : ""}
            </h1>
            <p class="text-gray-400 mt-4 text-lg">
                Your intelligent coding companion
            </p>
        </div>

        <!-- Main Content -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Left Column - Recent projects -->
            <RecentProjects/>

            <!-- Right Column - Documentation -->
            <div class="space-y-8">
                <!-- Quick Links -->
                <div
                    class="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700"
                >
                    <h2
                        class="text-xl font-semibold flex items-center gap-2 mb-6"
                    >
                        <Book size={20} /> Documentation
                    </h2>

                    <div class="space-y-4">
                        {#each documentationLinks as link}
                            <button
                                on:click={() => openExternalUrl(link.url)}
                                class="block w-full bg-gray-800 hover:bg-gray-700 p-4 rounded-lg transition-all border border-gray-700 hover:border-gray-600 text-left"
                            >
                                <div class="flex justify-between items-start">
                                    <div class="flex items-start gap-3">
                                        <svelte:component
                                            this={link.icon}
                                            size={18}
                                            class="text-blue-400 mt-0.5"
                                        />
                                        <div class="flex-1">
                                            <h3 class="font-medium text-blue-400 leading-tight text-left">
                                                {link.title}
                                            </h3>
                                            <p class="text-sm text-gray-400 mt-1 leading-normal text-left">
                                                {link.description}
                                            </p>
                                        </div>
                                    </div>
                                    <ExternalLink
                                        size={16}
                                        class="text-gray-500 mt-1 flex-shrink-0"
                                    />
                                </div>
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- Community Section -->
                <div
                    class="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700"
                >
                    <h2 class="text-xl font-semibold mb-4 text-left">
                        Join the Community
                    </h2>
                    <p class="text-gray-400 mb-4 text-left">
                        Get involved with EditAI's growing community of
                        developers.
                    </p>

                    <div class="flex gap-4">
                        <button
                            on:click={() =>
                                openExternalUrl(
                                    "https://github.com/edit4i/editor",
                                )}
                            class="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-all"
                        >
                            <Github size={18} />
                            GitHub
                        </button>
                        <button
                            on:click={() =>
                                openExternalUrl("https://community.edit4i.com")}
                            class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all"
                        >
                            <ExternalLink size={18} />
                            Community
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
