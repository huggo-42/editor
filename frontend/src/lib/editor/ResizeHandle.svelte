<script lang="ts">
    import { ChevronLeft, ChevronRight } from 'lucide-svelte';
    import { fade } from 'svelte/transition';
    
    export let side: 'left' | 'right';
    export let onResize: (width: number) => void;
    export let currentWidth: number;
    
    let isDragging = false;
    let isHovering = false;
    let hoverTimeout: NodeJS.Timeout;
    let showHandle = false;
    let startX: number;
    let startWidth: number;
    
    function handleMouseDown(e: MouseEvent) {
        e.preventDefault();
        isDragging = true;
        startX = e.clientX;
        startWidth = currentWidth;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'ew-resize';
            
        const mouseMoveHandler = (e: MouseEvent) => {
            if (!isDragging) return;
            e.preventDefault();
            const dx = e.clientX - startX;
            const newWidth = side === 'left' 
                ? Math.max(200, Math.min(600, startWidth + dx))
                : Math.max(200, Math.min(600, startWidth - dx));
            onResize(newWidth);
        };
        
        const mouseUpHandler = () => {
            isDragging = false;
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };
        
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    }
    
    function handleMouseEnter() {
        isHovering = true;
        hoverTimeout = setTimeout(() => {
            showHandle = true;
        }, 1500);
    }
    
    function handleMouseLeave() {
        isHovering = false;
        showHandle = false;
        clearTimeout(hoverTimeout);
    }
</script>

<div
    class="relative w-1 hover:w-[5px] transition-all duration-200 ease-out cursor-ew-resize group select-none"
    class:border-sky-500={isDragging}
    class:border-2={isDragging}
    on:mousedown={handleMouseDown}
    on:mouseenter={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
>
    <div 
        class="absolute inset-0 bg-gray-700 opacity-0 group-hover:opacity-20 transition-opacity duration-200"
        class:opacity-40={isDragging}
        transition:fade={{ duration: 150 }}
    />
    
    {#if (showHandle || isDragging) && side === 'left'}
        <div 
            class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-0 bg-gray-700 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            class:opacity-100={isDragging}
        >
            <ChevronLeft size={16} class="text-gray-300" />
        </div>
    {/if}
    
    {#if (showHandle || isDragging) && side === 'right'}
        <div 
            class="absolute top-1/2 -translate-y-1/2 translate-x-1/2 right-0 bg-gray-700 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            class:opacity-100={isDragging}
        >
            <ChevronRight size={16} class="text-gray-300" />
        </div>
    {/if}
    
    <div 
        class="absolute top-1/2 -translate-y-1/2 {side === 'left' ? 'left-4' : 'right-4'} whitespace-nowrap bg-gray-800 text-gray-300 text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none select-none"
        class:opacity-100={isDragging}
    >
        Drag to resize
    </div>
</div>
