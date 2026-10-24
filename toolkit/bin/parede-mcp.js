#!/usr/bin/env node
// Servidor MCP (stdio) que expõe a toolkit como ferramentas para agentes.
import { launch } from './_launch.js';

await launch('main.js', null, 'mcp');
