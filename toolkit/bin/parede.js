#!/usr/bin/env node
// parede <command> [...args] — a single entry point for every command.
import { launch } from './_launch.js';

await launch('main.js', null);
