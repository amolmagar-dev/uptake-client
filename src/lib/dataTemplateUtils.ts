/**
 * Data Template Utilities
 * 
 * Handle $DATA placeholder in Advanced ECharts configurations.
 * Allows users to write configs with $DATA which gets replaced with actual dataset at runtime.
 */

import type { EChartsOption } from 'echarts';

/**
 * Check if config contains $DATA placeholder (template mode)
 */
export function isTemplateConfig(config: unknown): boolean {
  const str = typeof config === 'string' ? config : JSON.stringify(config);
  return str.includes('$DATA');
}

/**
 * Replace $DATA placeholder with actual dataset rows.
 * Supports both JSON format ("$DATA") and raw JavaScript ($DATA).
 * 
 * For simple replacements, uses string replacement.
 * For configs with JavaScript expressions on $DATA (filter, map, etc),
 * evaluates the entire config as a function.
 */
export function interpolateData(configString: string, data: unknown[]): EChartsOption {
  // Check if it's using JavaScript expressions on $DATA (e.g., $DATA.filter(...))
  const hasExpressions = /\$DATA\s*\./.test(configString) || 
                         /\$DATA\s*\[/.test(configString) ||
                         configString.includes('...$DATA');
  
  if (hasExpressions) {
    // Evaluate as JavaScript with $DATA in scope
    try {
      // Create a function that takes $DATA and returns the option
      // Handle both "option = {...}" format and raw object format
      let code = configString;
      
      // If it starts with "option = ", extract the object
      const optionMatch = code.match(/option\s*=\s*/);
      if (optionMatch) {
        code = code.replace(/option\s*=\s*/, 'return ');
      } else if (!code.trim().startsWith('return') && !code.trim().startsWith('{')) {
        // If there's JavaScript before the option object, wrap it
        code = `return (function() { ${code}; return option; })()`;
      } else if (code.trim().startsWith('{')) {
        code = `return ${code}`;
      }
      
      // eslint-disable-next-line no-new-func
      const fn = new Function('$DATA', code);
      return fn(data);
    } catch (error) {
      console.error('Failed to evaluate config with $DATA expressions:', error);
      // Fall back to simple replacement
    }
  }
  
  // Simple replacement for configs without expressions
  const replaced = configString.replace(/"\$DATA"/g, JSON.stringify(data))
                               .replace(/\$DATA/g, JSON.stringify(data));
  
  try {
    // Try to parse as JSON first
    return JSON.parse(replaced);
  } catch {
    // If not valid JSON, try to evaluate as JavaScript
    try {
      // Handle "option = {...}" format
      const optionMatch = replaced.match(/option\s*=\s*/);
      if (optionMatch) {
        const code = replaced.replace(/option\s*=\s*/, 'return ');
        // eslint-disable-next-line no-new-func
        const fn = new Function(code);
        return fn();
      }
      // eslint-disable-next-line no-new-func
      const fn = new Function(`return ${replaced}`);
      return fn();
    } catch (evalError) {
      console.error('Failed to parse interpolated config:', evalError);
      return {};
    }
  }
}

/**
 * Prepare config for storage - replace embedded data with $DATA placeholder.
 * This ensures we don't store large data arrays in the database.
 */
export function prepareConfigForStorage(config: unknown): unknown {
  if (!config) return config;
  
  // If it's a string (raw config text), check for $DATA
  if (typeof config === 'string') {
    // If already using $DATA template, keep as-is
    if (config.includes('$DATA')) return config;
    return config;
  }
  
  // If it's an object, check dataset.source
  const obj = config as Record<string, unknown>;
  
  // If already using $DATA template, keep as-is
  if (isTemplateConfig(obj)) return obj;
  
  // If dataset.source has actual data, replace with $DATA marker
  if (obj.dataset && typeof obj.dataset === 'object') {
    const dataset = obj.dataset as Record<string, unknown>;
    if (Array.isArray(dataset.source) && dataset.source.length > 0) {
      return {
        ...obj,
        dataset: { ...dataset, source: '$DATA' }
      };
    }
  }
  
  return config;
}

/**
 * Generate default Advanced config template with $DATA placeholder
 */
export function getDefaultAdvancedTemplate(): string {
  return `option = {
  dataset: { source: $DATA },
  xAxis: { type: 'category' },
  yAxis: { type: 'value' },
  series: [
    { 
      type: 'bar', 
      encode: { x: 0, y: 1 } 
    }
  ]
}`;
}
