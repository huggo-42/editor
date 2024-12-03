<script lang="ts">
  import { Send } from 'lucide-svelte';

  export let collapsed: boolean;

  interface Message {
    role: 'assistant' | 'user';
    content: string;
  }

  let messages: Message[] = [
    { role: 'assistant', content: 'Hello! How can I assist you with your code today?' },
    { role: 'user', content: 'Can you explain how to use React hooks?' },
  ];

  let newMessage = '';

  function sendMessage() {
    if (newMessage.trim()) {
      messages = [...messages, { role: 'user', content: newMessage.trim() }];
      newMessage = '';
      // Here you would typically send the message to an AI service and await a response
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      sendMessage();
    }
  }
</script>

{#if !collapsed}
  <div class="bg-gray-900 h-full w-64 flex flex-col overflow-hidden border-l border-gray-800">
    <div class="h-[35px] flex items-center px-4 border-b border-gray-800">
      <h2 class="font-medium">AI Assistant</h2>
    </div>

    <div class="flex-grow overflow-y-auto p-4">
      {#each messages as message, index}
        <div class="mb-4 {message.role === 'user' ? 'text-right' : ''}">
          <div class="inline-block bg-gray-800 rounded-sm p-2 max-w-[80%] text-gray-300">
            {message.content}
          </div>
        </div>
      {/each}
    </div>

    <div class="p-4 border-t border-gray-800">
      <select class="w-full bg-gray-800 text-gray-200 p-1 rounded-sm text-xs mb-2">
        <option>GPT-4</option>
        <option>GPT-3.5-turbo</option>
        <option>Codex</option>
      </select>

      <div class="flex">
        <input
          type="text"
          bind:value={newMessage}
          on:keypress={handleKeyPress}
          placeholder="Type your message..."
          class="flex-grow bg-gray-800 text-gray-200 p-2 rounded-sm"
        />
        <button
          on:click={sendMessage}
          class="bg-gray-700 hover:bg-gray-600 text-gray-100 p-2 rounded-sm transition-colors duration-200 ml-2"
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  </div>
{/if}
