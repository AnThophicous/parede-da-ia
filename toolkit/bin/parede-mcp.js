#!/usr/bin/env node
// An MCP server (stdio) that exposes the toolkit as tools for agents.
import { launch } from './_launch.js';

await launch('main.js', null, 'mcp');
