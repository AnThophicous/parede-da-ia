#!/usr/bin/env node
import { launch } from './_launch.js';

await launch('main.js', 'web-wait-page-load');
