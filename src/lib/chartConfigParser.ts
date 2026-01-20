import echarts from './echarts';

/**
 * Parse advanced chart configuration that supports full JavaScript syntax.
 * Handles formats including:
 * - Standard object literals: { title: {...}, series: [...] }
 * - Variable assignment: option = { title: {...}, series: [...] }
 * - Variable declarations: var/let/const option = { ... }
 * - Full JavaScript code with variables, loops, and computations
 */
export function parseChartConfig(configString: string): Record<string, any> {
  if (!configString || typeof configString !== 'string') {
    throw new Error('Invalid configuration: expected a string');
  }

  const trimmed = configString.trim();
  if (!trimmed) {
    throw new Error('Invalid configuration: empty string');
  }

  try {
    // Clean up TypeScript annotations
    const cleanedString = cleanTypeScriptAnnotations(trimmed);
    
    // Try different parsing strategies in order of complexity
    
    // Strategy 1: Full JavaScript execution (handles variables, loops, etc.)
    const fullJsResult = tryFullJavaScriptExecution(cleanedString);
    if (fullJsResult) {
      console.log('Parsed using full JavaScript execution');
      return fullJsResult;
    }
    
    // Strategy 2: Extract and evaluate option object
    const extractedResult = tryExtractOptionObject(cleanedString);
    if (extractedResult) {
      console.log('Parsed using option extraction');
      return extractedResult;
    }
    
    // Strategy 3: Direct object literal
    const directResult = tryDirectObjectLiteral(cleanedString);
    if (directResult) {
      console.log('Parsed using direct object literal');
      return directResult;
    }
    
    throw new Error('Could not find a valid chart configuration object');
  } catch (error: any) {
    console.error('Chart config parsing error:', error);
    throw new Error(`Failed to parse chart configuration: ${error.message}`);
  }
}

/**
 * Remove TypeScript type annotations from the string
 */
function cleanTypeScriptAnnotations(str: string): string {
  let cleaned = str;
  
  // Remove function parameter type annotations: (param: type) -> (param)
  cleaned = cleaned.replace(/function\s*\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*[^)]+\)/g, 'function ($1)');
  
  // Remove 'as type' assertions
  cleaned = cleaned.replace(/\s+as\s+[a-zA-Z_$][a-zA-Z0-9_$<>[\]|&,\s]*/g, '');
  
  // Remove arrow function param type annotations: (param: type) -> (param)
  cleaned = cleaned.replace(/\(([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*[^)]+\)/g, '($1)');
  
  // Remove interface/type declarations
  cleaned = cleaned.replace(/^(interface|type)\s+[^{]+\{[^}]*\}\s*;?\s*/gm, '');
  
  return cleaned;
}

/**
 * Strategy 1: Execute the full JavaScript code and extract 'option'
 * This handles complex cases with variables, loops, computations, etc.
 */
function tryFullJavaScriptExecution(code: string): Record<string, any> | null {
  // Check if code contains 'option' assignment
  if (!code.includes('option')) {
    return null;
  }
  
  try {
    // Create a function that executes the code and returns the option
    // We wrap the code to capture the 'option' variable
    // $DATA is provided as a placeholder - will be replaced with actual data at runtime
    const wrappedCode = `
      'use strict';
      let option;
      ${code}
      return option;
    `;
    
    // Provide $DATA as a placeholder string that will be serialized
    const $DATA = '$DATA';
    const func = new Function('echarts', '$DATA', wrappedCode);
    const result = func(echarts, $DATA);
    
    if (result && typeof result === 'object') {
      return result;
    }
    return null;
  } catch (error) {
    console.log('Full JS execution failed:', error);
    return null;
  }
}

/**
 * Strategy 2: Extract the option object from assignment patterns and evaluate
 */
function tryExtractOptionObject(code: string): Record<string, any> | null {
  // Pattern: option = { ... } at the end
  const patterns = [
    /(?:var|let|const)\s+option\s*=\s*(\{[\s\S]*\})\s*;?\s*$/,
    /option\s*=\s*(\{[\s\S]*\})\s*;?\s*$/,
    /(?:var|let|const)\s+config\s*=\s*(\{[\s\S]*\})\s*;?\s*$/,
    /config\s*=\s*(\{[\s\S]*\})\s*;?\s*$/,
  ];

  // Provide $DATA as a placeholder string
  const $DATA = '$DATA';

  for (const pattern of patterns) {
    const match = code.match(pattern);
    if (match && match[1]) {
      try {
        const func = new Function('echarts', '$DATA', `
          'use strict';
          return (${match[1].trim()});
        `);
        return func(echarts, $DATA);
      } catch {
        continue;
      }
    }
  }
  
  return null;
}

/**
 * Strategy 3: Try to parse as a direct object literal
 */
function tryDirectObjectLiteral(code: string): Record<string, any> | null {
  let objectString = code;
  
  // Provide $DATA as a placeholder string
  const $DATA = '$DATA';
  
  // If starts with { and ends with } or };
  if (objectString.startsWith('{')) {
    if (objectString.endsWith('};')) {
      objectString = objectString.slice(0, -1);
    }
    if (objectString.endsWith('}')) {
      try {
        const func = new Function('echarts', '$DATA', `
          'use strict';
          return (${objectString});
        `);
        return func(echarts, $DATA);
      } catch {
        return null;
      }
    }
  }
  
  // Try to find object between first { and last }
  const firstBrace = code.indexOf('{');
  const lastBrace = code.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const extracted = code.slice(firstBrace, lastBrace + 1);
    try {
      const func = new Function('echarts', '$DATA', `
        'use strict';
        return (${extracted});
      `);
      return func(echarts, $DATA);
    } catch {
      return null;
    }
  }
  
  return null;
}

/**
 * Convert an ECharts option object back to a formatted string
 * using the "option = { ... }" format
 */
export function stringifyChartConfig(option: Record<string, any>, indent = 2): string {
  const formatted = formatObject(option, indent);
  return `option = ${formatted};`;
}

/**
 * Format an object to a readable JavaScript object literal string
 */
function formatObject(obj: any, indent = 2, depth = 0): string {
  const spaces = ' '.repeat(indent);
  const currentIndent = spaces.repeat(depth);
  const nextIndent = spaces.repeat(depth + 1);

  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (typeof obj === 'string') return `'${obj.replace(/'/g, "\\'")}'`;
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
  if (typeof obj === 'function') return obj.toString();

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    
    // Check if array contains simple values (can be inline)
    const isSimpleArray = obj.every(item => 
      item === null || 
      typeof item === 'string' || 
      typeof item === 'number' || 
      typeof item === 'boolean'
    );
    
    if (isSimpleArray && obj.length <= 5) {
      const items = obj.map(item => formatObject(item, indent, depth)).join(', ');
      return `[${items}]`;
    }
    
    const items = obj.map(item => `${nextIndent}${formatObject(item, indent, depth + 1)}`).join(',\n');
    return `[\n${items}\n${currentIndent}]`;
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';

    const items = keys.map(key => {
      const formattedValue = formatObject(obj[key], indent, depth + 1);
      // Use quotes only if key has special characters
      const keyStr = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
      return `${nextIndent}${keyStr}: ${formattedValue}`;
    }).join(',\n');

    return `{\n${items}\n${currentIndent}}`;
  }

  return String(obj);
}

/**
 * Validate if a string is a parseable chart configuration
 */
export function isValidChartConfig(configString: string): boolean {
  try {
    parseChartConfig(configString);
    return true;
  } catch {
    return false;
  }
}

export default {
  parseChartConfig,
  stringifyChartConfig,
  isValidChartConfig
};
