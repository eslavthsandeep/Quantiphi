'use strict';

/**
 * Mock LLM provider for development and testing.
 * Streams contextual, tone-aware responses without any API keys.
 */

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    if (signal) {
      const onAbort = () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      };
      if (signal.aborted) {
        clearTimeout(timer);
        return reject(new DOMException('Aborted', 'AbortError'));
      }
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

/**
 * Detect tone from the system prompt.
 * @param {string} systemPrompt
 * @returns {'professional'|'casual'|'concise'}
 */
function detectTone(systemPrompt) {
  if (!systemPrompt) return 'professional';
  const lower = systemPrompt.toLowerCase();
  if (lower.includes('brief as possible') || lower.includes('straight to the point')) return 'concise';
  if (lower.includes('friendly') || lower.includes('conversationally') || lower.includes('emoji')) return 'casual';
  return 'professional';
}

/**
 * Build a contextual mock response based on tone and user message.
 * @param {string} tone
 * @param {string} userMessage
 * @returns {string}
 */
function buildResponse(tone, userMessage) {
  const lowerMsg = userMessage.toLowerCase();

  const isCode =
    lowerMsg.includes('code') ||
    lowerMsg.includes('function') ||
    lowerMsg.includes('javascript') ||
    lowerMsg.includes('python') ||
    lowerMsg.includes('program');
  const isQuestion =
    lowerMsg.includes('what') ||
    lowerMsg.includes('how') ||
    lowerMsg.includes('why') ||
    lowerMsg.includes('when') ||
    lowerMsg.includes('who') ||
    lowerMsg.includes('?');
  const isGreeting =
    lowerMsg.includes('hello') ||
    lowerMsg.includes('hi') ||
    lowerMsg.includes('hey') ||
    lowerMsg.includes('greet');
  const isHelp =
    lowerMsg.includes('help') ||
    lowerMsg.includes('assist') ||
    lowerMsg.includes('support');

  if (tone === 'concise') {
    if (isGreeting) return "Hello! How can I help?\n\n- Ask me anything\n- I'll keep it brief";
    if (isCode)
      return "Here's a quick example:\n\n```js\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n```\n\nAdjust as needed.";
    if (isQuestion)
      return "Great question. The short answer: it depends on context. Provide more details for a precise answer.";
    if (isHelp) return "Ready to help.\n\n- State your problem\n- I'll respond concisely";
    return `Understood. Key points:\n\n- **Point 1:** Address the core need\n- **Point 2:** Apply the simplest solution\n- **Point 3:** Verify the result`;
  }

  if (tone === 'casual') {
    if (isGreeting)
      return `Hey there! 👋 Great to meet you! I'm your AI assistant and I'm here to help with whatever you need. What's on your mind? 😊`;
    if (isCode) {
      return (
        `Oh nice, you're asking about code! 💻 I love this stuff!\n\n` +
        `Here's a fun little example:\n\n` +
        '```javascript\nfunction sayHello(name) {\n  return `Hey ${name}, what\'s up! 🎉`;\n}\n\n' +
        "console.log(sayHello('World'));\n// Output: Hey World, what's up! 🎉\n```\n\n" +
        `Feel free to tweak it however you like! Need more examples? Just ask 😄`
      );
    }
    if (isQuestion) {
      return (
        `Ooh, good question! 🤔 Let me think about that...\n\n` +
        `So basically, here's the deal:\n\n` +
        `1. **First thing** - context really matters here\n` +
        `2. **Second thing** - there's usually more than one way to look at it\n` +
        `3. **Third thing** - the best approach depends on what you're trying to do\n\n` +
        `Does that make sense? Feel free to ask follow-ups! 😊`
      );
    }
    if (isHelp) {
      return (
        `Of course I'll help! That's literally what I'm here for 😄\n\n` +
        `Just let me know:\n- What do you need?\n- Any specific details?\n- What have you tried so far?\n\n` +
        `We'll figure it out together! 💪`
      );
    }
    return (
      `Got it! That's a fun topic to explore 🙌\n\n` +
      `Here's my take:\n\n` +
      `1. **First off** - it's pretty interesting when you dig into it\n` +
      `2. **Also** - there are a few different ways to approach this\n` +
      `3. **And finally** - practice makes perfect!\n\n` +
      `Anything else you wanna know? I'm all ears! 👂`
    );
  }

  // Professional (default)
  if (isGreeting) {
    return (
      `Good day. I am your AI assistant, ready to provide comprehensive support.\n\n` +
      `**How I Can Assist You:**\n\n` +
      `- Answer questions on a wide range of topics\n` +
      `- Provide analysis and structured recommendations\n` +
      `- Assist with code, writing, and research\n\n` +
      `Please state your query and I will respond accordingly.`
    );
  }
  if (isCode) {
    return (
      `Certainly. Below is a well-structured code example addressing your request:\n\n` +
      "```javascript\n/**\n * A demonstrative function showcasing proper structure.\n * @param {string} input - The input parameter.\n * @returns {string} The processed result.\n */\n" +
      "function processInput(input) {\n  if (!input || typeof input !== 'string') {\n    throw new TypeError('Input must be a non-empty string.');\n  }\n  return input.trim().toUpperCase();\n}\n\n" +
      "// Example usage:\nconst result = processInput('hello world');\nconsole.log(result); // Output: HELLO WORLD\n```\n\n" +
      `**Key Considerations:**\n\n` +
      `- Ensure proper input validation is in place\n` +
      `- Handle edge cases explicitly\n` +
      `- Follow established coding standards for your project\n\n` +
      `Please let me know if you require further elaboration or modifications.`
    );
  }
  if (isQuestion) {
    return (
      `Thank you for your inquiry. I will address this comprehensively.\n\n` +
      `**Overview:**\n\n` +
      `This is a nuanced topic that benefits from structured analysis. The following points provide a thorough foundation:\n\n` +
      `1. **Context and Background** - Understanding the underlying principles is essential before drawing conclusions.\n` +
      `2. **Core Considerations** - Multiple factors must be evaluated to arrive at an accurate response.\n` +
      `3. **Recommended Approach** - Based on established best practices, the most effective strategy involves careful deliberation.\n\n` +
      `**Conclusion:**\n\n` +
      `The answer largely depends on the specific parameters of your situation. I recommend providing additional context so I may offer a more precise response.\n\n` +
      `Please do not hesitate to ask follow-up questions.`
    );
  }
  if (isHelp) {
    return (
      `I am pleased to assist you. To provide the most effective support, please consider the following:\n\n` +
      `**Available Assistance:**\n\n` +
      `- **Technical Support** - Code review, debugging, and architecture guidance\n` +
      `- **Research & Analysis** - In-depth exploration of topics\n` +
      `- **Writing & Communication** - Drafting, editing, and formatting documents\n` +
      `- **Problem-Solving** - Structured approaches to complex challenges\n\n` +
      `**Next Steps:**\n\n` +
      `Please describe your specific requirement in detail, and I will respond with a comprehensive, actionable solution.`
    );
  }
  return (
    `Thank you for your message. I have carefully reviewed your request and am prepared to provide a thorough response.\n\n` +
    `**Analysis:**\n\n` +
    `The topic you have raised encompasses several important dimensions:\n\n` +
    `1. **Primary Consideration** - The foundational aspect requires careful attention to detail and methodical evaluation.\n` +
    `2. **Secondary Factors** - Additional variables may influence the outcome and should be accounted for in your planning.\n` +
    `3. **Recommended Action** - Based on established principles and best practices, I recommend a structured, iterative approach.\n\n` +
    `**Summary:**\n\n` +
    `By addressing each of these components systematically, you will be well-positioned to achieve your objective effectively.\n\n` +
    `I welcome any additional questions or requests for clarification.`
  );
}

/**
 * Async generator that streams mock LLM responses word by word.
 * @param {{ systemPrompt: string, messages: Array<{role: string, content: string}>, signal: AbortSignal }} options
 */
async function* streamChat({ systemPrompt, messages, signal }) {
  const tone = detectTone(systemPrompt);
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const userText = lastUserMessage ? lastUserMessage.content : 'Hello';

  const fullResponse = buildResponse(tone, userText);

  // Split by spaces, keeping whitespace tokens for natural streaming
  const tokens = fullResponse.match(/\S+|\s+/g) || [];

  for (const token of tokens) {
    if (signal && signal.aborted) {
      throw new DOMException('Stream aborted by client', 'AbortError');
    }
    yield token;
    await sleep(process.env.NODE_ENV === 'test' ? 1 : 50, signal);
  }
}

module.exports = { streamChat };
