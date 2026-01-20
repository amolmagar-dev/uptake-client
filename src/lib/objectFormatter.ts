import echarts from './echarts';

/**
 * Convert an object to a JavaScript object literal string
 */
export function toJavaScriptObject(obj: any, indent = 2): string {
  const spaces = ' '.repeat(indent);
  
  function format(value: any, depth = 0): string {
    const currentIndent = ' '.repeat(depth * indent);
    const nextIndent = ' '.repeat((depth + 1) * indent);
    
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'function') return value.toString();
    
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      const items = value.map(item => `${nextIndent}${format(item, depth + 1)}`).join(',\n');
      return `[\n${items}\n${currentIndent}]`;
    }
    
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) return '{}';
      
      const items = keys.map(key => {
        const formattedValue = format(value[key], depth + 1);
        // Use quotes only if key has special characters
        const keyStr = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
        return `${nextIndent}${keyStr}: ${formattedValue}`;
      }).join(',\n');
      
      return `{\n${items}\n${currentIndent}}`;
    }
    
    return String(value);
  }
  
  return format(obj, 0);
}

/**
 * Parse a JavaScript object literal string back to an object
 * Makes echarts library available for constructs like echarts.graphic.RadialGradient
 */
export function fromJavaScriptObject(jsString: string): any {
  try {
    // Strip TypeScript type annotations more carefully
    let cleanedString = jsString;
    
    // Remove type annotations from function parameters: function (param: type) -> function (param)
    cleanedString = cleanedString.replace(/function\s*\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*[^)]+\)/g, 'function ($1)');
    
    // Remove 'as type' assertions: value as string -> value
    cleanedString = cleanedString.replace(/\s+as\s+[a-zA-Z_$][a-zA-Z0-9_$<>[\]|&,\s]*/g, '');
    
    // Remove type annotations from arrow function params: (param: type) -> (param)
    cleanedString = cleanedString.replace(/\(([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*[^)]+\)/g, '($1)');

    // Debug: log the cleaned string to see what we're trying to parse
    console.log('Cleaned JS string:', cleanedString.substring(0, 500));

    // Create a safe evaluation function with echarts in scope
    // This allows ECharts-specific constructs like:
    // - new echarts.graphic.RadialGradient()
    // - new echarts.graphic.LinearGradient()
    const func = new Function('echarts', `
      'use strict';
      return (${cleanedString});
    `);
    
    return func(echarts);
  } catch (error: any) {
    // Provide more detailed error message with context
    console.error('JavaScript object parsing error:', error);
    console.error('Input string (first 500 chars):', jsString.substring(0, 500));
    throw new Error(`Parse error: ${error.message}`);
  }
}
