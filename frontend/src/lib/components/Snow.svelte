<script lang="ts">
    import { onMount, onDestroy } from 'svelte';

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let animationFrame: number;
    let snowflakes: Array<{
        x: number;
        y: number;
        radius: number;
        speed: number;
        wind: number;
    }> = [];

    const SNOWFLAKE_COUNT = 100;

    function createSnowflake(width: number) {
        return {
            x: Math.random() * width,
            y: 0,
            radius: Math.random() * 3 + 1,
            speed: Math.random() * 2 + 1,
            wind: Math.random() * 0.5 - 0.25
        };
    }

    function resize() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Reset snowflakes for new dimensions
        snowflakes = Array(SNOWFLAKE_COUNT)
            .fill(null)
            .map(() => createSnowflake(canvas.width));
    }

    function draw() {
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

        snowflakes.forEach((flake, i) => {
            ctx.beginPath();
            ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
            ctx.fill();

            // Update position
            flake.y += flake.speed;
            flake.x += flake.wind;

            // Reset if snowflake goes off screen
            if (flake.y > canvas.height) {
                snowflakes[i] = createSnowflake(canvas.width);
            } else if (flake.x > canvas.width) {
                flake.x = 0;
            } else if (flake.x < 0) {
                flake.x = canvas.width;
            }
        });

        animationFrame = requestAnimationFrame(draw);
    }

    onMount(() => {
        if (!canvas) return;
        ctx = canvas.getContext('2d')!;
        
        resize();
        window.addEventListener('resize', resize);
        draw();
    });

    onDestroy(() => {
        window.removeEventListener('resize', resize);
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
    });
</script>

<canvas
    bind:this={canvas}
    class="fixed top-0 left-0 w-full h-full pointer-events-none z-50"
/>
