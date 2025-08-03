import {
  ContainerBuilder,
  MessageFlags
} from 'discord.js';
import {
  handleMessage
} from '../../../helper.js';

export default {
  name: 'math',
  description: 'Evaluates a mathematical expression.',
  aliases: ['calc',
    'calculate'],
  cooldown: 10000,
  category: '🔧 Utility',

  execute: async (args, message) => {
    try {
      args.shift()
      
      const expr = args.join(' ');
      if (!expr) {
        return handleMessage(message, {
          content: '<:alert:1366050815089053808> Please provide an expression to calculate, e.g. `!math 2+2*3`.'
        });
      }

      // Sanitize: allow only numbers, operators, parentheses, decimals, spaces
      const sanitized = expr.replace(/\s+/g, '');
      if (!/^[0-9+\-*/().%^]+$/.test(sanitized)) {
        return handleMessage(message, {
          content: '<:alert:1366050815089053808> Invalid characters in expression.'
        });
      }

      // Safe evaluation
      let result;
      try {
        result = Function(`"use strict";return (${sanitized})`)();
      } catch {
        return handleMessage(message, {
          content: '<:warning:1366050875243757699> Could not evaluate the expression.'
        });
      }

      const container = new ContainerBuilder()
      .setAccentColor(0x00aaff)
      .addTextDisplayComponents(
        text => text.setContent('### <:task_list:1388844819035590706> Calculation Result'),
        text => text.setContent(`**Expression:** \`${expr}\``),
        text => text.setContent(`**Result:** **\` ${result} \`**`)
      );

      await handleMessage(message, {
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    } catch (e) {
      console.error('math command error:', e);
      await handleMessage(message, {
        content: '<:warning:1366050875243757699> An unexpected error occurred.'
      });
    }
  }
};