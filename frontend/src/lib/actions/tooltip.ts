import { keyBindings, formatKeybinding } from '../stores/keyboardStore';
import type { KeyBinding } from '../types/keyboard';

let tooltipElement: HTMLElement | null = null;

function createTooltip() {
    const tooltip = document.createElement('div');
    tooltip.className = 'fixed px-2 py-1 text-xs text-gray-300 bg-gray-800 rounded shadow-lg border border-gray-700 z-50 pointer-events-none opacity-0 transition-opacity duration-150 ease-in-out';
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

export function tooltip(node: HTMLElement, params: { text: string; command?: string }) {
    let text = params.text;
    const shortcut = params.command ? getShortcutForCommand(params.command) : null;

    function showTooltip(event: MouseEvent) {
        if (!tooltipElement) {
            tooltipElement = createTooltip();
        }

        const content = shortcut ? `${text} (${shortcut})` : text;
        tooltipElement.textContent = content;

        const rect = node.getBoundingClientRect();
        const tooltipRect = tooltipElement.getBoundingClientRect();

        tooltipElement.style.left = `${rect.left + (rect.width - tooltipRect.width) / 2}px`;
        tooltipElement.style.top = `${rect.bottom + 8}px`;
        tooltipElement.classList.add('opacity-100');
    }

    function hideTooltip() {
        if (tooltipElement) {
            tooltipElement.classList.remove('opacity-100');
        }
    }

    node.addEventListener('mouseenter', showTooltip);
    node.addEventListener('mouseleave', hideTooltip);

    return {
        update(newParams: { text: string; command?: string }) {
            text = newParams.text;
        },
        destroy() {
            node.removeEventListener('mouseenter', showTooltip);
            node.removeEventListener('mouseleave', hideTooltip);
            tooltipElement?.remove();
            tooltipElement = null;
        }
    };
}
