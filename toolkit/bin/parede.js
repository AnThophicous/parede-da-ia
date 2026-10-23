#!/usr/bin/env node
// parede <comando> [...args] — ponto de entrada único para todos os comandos.
import { launch } from './_launch.js';

await launch('cli.js', null);
