import postcss from 'postcss';
const fs = require('fs');

let tokenColors = {};
/**
 * The function parses CSS and SCSS variables and returns an array of unique tokens.
 * @param css - The `css` parameter is a string containing CSS code that needs to be parsed to extract
 * all CSS and SCSS variables.
 * @returns The function `parseCss` returns an array of unique CSS and SCSS variable tokens found in
 * the input `css` string.
 */
const parseCss = (css) => {
  /**
   * Regex to match all CSS variables in the CSS file and SCSS variables
   * @type {RegExp}
   */
  const cssRegex = /var\(--\S+\)/g;
  const scssRegex = /\$[\w-]+/g;

  const cssMatches = css.match(cssRegex) || [];
  const scssMatches = css.match(scssRegex) || [];

  const cssTokens = [...new Set(cssMatches)];
  const scssTokens = [...new Set(scssMatches)];

  return cssTokens.concat(scssTokens);
};

/**
 * This is a TypeScript function that replaces hex or RGB colors in CSS declarations with the color-mod
 * function.
 * @returns A PostCSS plugin object with a `postcssPlugin` property set to `'color-mod'` and a
 * `Declaration` method that modifies CSS declarations containing hex or RGB colors by replacing them
 * with the `color-mod` function. The modified declarations are returned by the `Declaration` method.
 */
const colorMod = () => {
  return {
    postcssPlugin: 'color-mod',
    Declaration(decl) {
      const value = decl.value;
      const isColor =
        value.includes('#') ||
        value.includes('rgb(') ||
        value.includes('rgba(');

      if (decl.prop.startsWith('--') && isColor) {
        tokenColors[decl.prop] = decl.value;
      }

      /**
       * Check if the value contains a hex color or rgb color
       * If it does, replace it with the color-mod function
       */
      if (
        value.includes('#') ||
        value.includes('rgb(') ||
        value.includes('rgba(')
      ) {
        const node = value.includes('#')
          ? value.indexOf('#')
          : value.indexOf('rgb');
        const context = value.includes('#') ? '#' : 'rgb';
        const end = value.indexOf(')', node) + 1;

        console.log('mod', context, end, value);

        const hexOrRgba = value.slice(node, end);
        const mod = `color(${hexOrRgba})`;

        decl.value = value.replace(context + hexOrRgba, mod);
      }

      return decl;
    },
  };
};

const meta = {
  type: 'suggestion',
  docs: {
    description:
      'Utilize CSS tokenization for color values instead of static, pre-defined color codes in CSS/SCSS code.',
    category: 'Best Practices',
    recommended: true,
  },
  fixable: 'code',
  schema: [
    {
      type: 'object',
      properties: {
        cssFile: {
          type: 'string',
          description: 'Path to the CSS file containing the tokens.',
        },
      },
    },
  ],
};

/**
 * This is a TypeScript function that uses PostCSS and colorMod to check for hard-coded colors in CSS
 * files and suggests using tokens instead.
 * @param context - The `context` parameter is an object that contains information about the current
 * state of the ESLint rule being executed. It includes properties such as `options` (an array of
 * configuration options passed to the rule), `report` (a function used to report errors or warnings),
 * and `getSourceCode`
 * @returns A JavaScript object with a `Property` method that checks if a node's key name is `color`
 * and if its value matches a token in `tokenColors`. If it does not match, it reports a message to the
 * context with the node and a message.
 */
const create = (context) => {
  const options = context.options[0] || {};
  const cssFile = options.cssFile;

  const css = fs.readFileSync(cssFile, 'utf8');
  postcss().use(colorMod()).process(css, { from: cssFile }).content;

  const getToken = (token) => {
    return Object.keys(tokenColors).find((key) => tokenColors[key] === token);
  };

  return {
    Property: function (node) {
      if (node.key.name === 'color') {
        const value = node.value.value;

        if (getToken(value)) {
          context.report({
            node,
            message: `Use token '${getToken(
              value
            )}' instead of hard-coded color '${value}'.`,
          });
        }
      }
    },
  };
};

export default {
  rules: {
    'use-tokens': {
      meta,
      create,
    },
  },
};
