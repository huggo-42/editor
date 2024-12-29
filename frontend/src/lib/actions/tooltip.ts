import { keyBindings, formatKeybinding } from '../../stores/keyboardStore';
import type { KeyBinding } from '../../types/keyboard';

let tooltipElement: HTMLElement | null = null;

function createTooltip() {
    const tooltip = document.createElement('div');
    tooltip.className = 'fixed bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs z-[9999] pointer-events-none';
    document.body.appendChild(tooltip);
    return tooltip;
}

function getShortcutForCommand(command: string): string | null {
    let shortcut: string | null = null;
    keyBindings.subscribe(bindings => {
        if (bindings[command]) {
            shortcut = formatKeybinding(bindings[command]);
        }
    })();
    return shortcut;
}

export function tooltip(node: HTMLElement, params: { show?: boolean; text?: string; command?: string }) {
    if (params.show === false || !params.text) {
        return;
    }

    let text = params.text || '';
    const shortcut = params.command ? getShortcutForCommand(params.command) : null;

    function updatePosition(rect: DOMRect) {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const tooltipRect = tooltipElement!.getBoundingClientRect();

        // Calculate initial position (centered above the element)
        let x = rect.left + (rect.width - tooltipRect.width) / 2;
        let y = rect.top - tooltipRect.height - 8; // 8px gap

        // Check horizontal positioning
        if (x + tooltipRect.width > screenWidth) {
            x = screenWidth - tooltipRect.width - 8;
        }
        if (x < 8) {
            x = 8;
        }

        // Check vertical positioning
        // If tooltip would go above screen, show it below the element instead
        if (y < 8) {
            y = rect.bottom + 8;
        }

        tooltipElement!.style.left = `${x}px`;
        tooltipElement!.style.top = `${y}px`;
    }

    function showTooltip(event: MouseEvent) {
        if (!tooltipElement) {
            tooltipElement = createTooltip();
        }

        const content = shortcut ? `${text} (${shortcut})` : text;
        tooltipElement!.textContent = content!;
        tooltipElement!.style.display = 'block';
        tooltipElement!.style.border = '1px solid rgba(229, 231, 235, .1)';

        // Get element position and update tooltip position
        const rect = node.getBoundingClientRect();
        updatePosition(rect);
    }

    function hideTooltip() {
        if (tooltipElement) {
            tooltipElement.style.display = 'none';
        }
    }

    node.addEventListener('mouseenter', showTooltip);
    node.addEventListener('mouseleave', hideTooltip);
    window.addEventListener('resize', () => {
        if (tooltipElement?.style.display !== 'none') {
            const rect = node.getBoundingClientRect();
            updatePosition(rect);
        }
    });

    return {
        update(newParams: { text: string; command?: string }) {
            text = newParams.text;
        },
        destroy() {
            node.removeEventListener('mouseenter', showTooltip);
            node.removeEventListener('mouseleave', hideTooltip);
            hideTooltip();
            tooltipElement?.remove();
            tooltipElement = null;
        }
    };
}
