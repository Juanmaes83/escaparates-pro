#!/usr/bin/env node

import { randomBytes } from 'node:crypto';

const base = String(process.argv[2] || process.env.API_BASE_URL || 'http://127.0.0.1:8080').replace(/\/+$/, '');
const runId = `${Date.now()}-${randomBytes(3).toString('hex')}`;
const email = `railway-phase2-${runId}@example.test`;
const password = randomBytes(24).toString('base64url');
const createdProjectIds = [];
let token =