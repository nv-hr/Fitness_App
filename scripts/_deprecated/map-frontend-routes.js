import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';
import parser from '@babel/parser';
import _traverse from '@babel/traverse';

// Deal with babel/traverse default export issue in pure ESM
const traverse = _traverse.default || _traverse;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const FRONTEND_SRC = path.join(PROJECT_ROOT, 'frontend', 'src');
const OUTPUT_DIR = path.join(PROJECT_ROOT, '.planning', 'phases', '02-frontend-static-analysis-mapping');

const TARGET_CALLEES = [
  'apiGet',
  'apiPost',
  'apiPut',
  'apiDelete',
  'apiFetch',
  'fetchSseStream',
  'fetch' // Also catch raw fetch calls
];

const routes = [];

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Map known API wrappers to likely HTTP methods
const METHOD_MAP = {
  apiGet: 'GET',
  apiPost: 'POST',
  apiPut: 'PUT',
  apiDelete: 'DELETE',
  apiFetch: 'UNKNOWN',
  fetchSseStream: 'GET',
  fetch: 'UNKNOWN'
};

function normalizeTemplateLiteral(node) {
  let route = '';
  // Template literals have quasis (string parts) and expressions (interpolated vars)
  // They interleave: quasi0, expr0, quasi1, expr1, ..., quasiN
  const quasis = node.quasis;
  
  for (let i = 0; i < quasis.length; i++) {
    route += quasis[i].value.raw;
    if (i < quasis.length - 1) {
      route += ':param';
    }
  }
  return route;
}

function scanFiles() {
  const files = globSync('**/*.{js,jsx}', { cwd: FRONTEND_SRC, absolute: true });

  files.forEach(file => {
    const code = fs.readFileSync(file, 'utf-8');
    let ast;
    try {
      ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx']
      });
    } catch (err) {
      console.warn(`Could not parse ${file}: ${err.message}`);
      return;
    }

    traverse(ast, {
      CallExpression(pathNode) {
        const callee = pathNode.node.callee;
        let calleeName = '';

        if (callee.type === 'Identifier') {
          calleeName = callee.name;
        } else if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
           // E.g., window.fetch
           calleeName = callee.property.name;
        }

        if (TARGET_CALLEES.includes(calleeName)) {
          const arg = pathNode.node.arguments[0];
          let route = '';

          if (!arg) return;

          if (arg.type === 'StringLiteral') {
            route = arg.value;
          } else if (arg.type === 'TemplateLiteral') {
            route = normalizeTemplateLiteral(arg);
          } else {
             // Expression or variable we can't statically analyze easily
             route = '<dynamic_expression>';
          }

          routes.push({
            method: METHOD_MAP[calleeName] || 'UNKNOWN',
            route,
            file: path.relative(PROJECT_ROOT, file).replace(/\\/g, '/'),
            line: pathNode.node.loc?.start.line || 0,
            callee: calleeName
          });
        }
      }
    });
  });

  generateOutputs();
}

function generateOutputs() {
  const jsonPath = path.join(OUTPUT_DIR, 'frontend-routes.json');
  const mdPath = path.join(OUTPUT_DIR, 'frontend-routes.md');

  // Sort routes by route then method
  routes.sort((a, b) => {
    if (a.route !== b.route) return a.route.localeCompare(b.route);
    return a.method.localeCompare(b.method);
  });

  fs.writeFileSync(jsonPath, JSON.stringify(routes, null, 2), 'utf-8');

  let md = `# Frontend API Routes Mapping\n\n`;
  md += `| Method | Route | File | Line | Function |\n`;
  md += `|--------|-------|------|------|----------|\n`;

  routes.forEach(r => {
    md += `| ${r.method} | \`${r.route}\` | \`${r.file}\` | ${r.line} | \`${r.callee}\` |\n`;
  });

  fs.writeFileSync(mdPath, md, 'utf-8');

  console.log(`Successfully mapped ${routes.length} frontend routes.`);
  console.log(`JSON output: ${jsonPath}`);
  console.log(`Markdown output: ${mdPath}`);
}

scanFiles();
