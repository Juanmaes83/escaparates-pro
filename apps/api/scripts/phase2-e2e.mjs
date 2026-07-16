#!/usr/bin/env node
import { randomBytes } from 'node:crypto';
const base=String(process.argv[2]||process.env.API_BASE_URL||'http://127.0.0.1:8080').replace(/\/+$/,'');
const previewOrigin='https://escaparates-pro-git-feature-pr-cf2d77-juanma-espinosas-projects.vercel.app';
const id=`${Date.now()}-${random