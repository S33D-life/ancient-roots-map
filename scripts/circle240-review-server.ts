import { createReadStream, realpathSync, statSync } from 'node:fs';
import { isAbsolute, resolve, sep } from 'node:path';
import type { Plugin } from 'vite';

const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
const modulePrefix = '/src/review/circle240/';
const assetPrefix = '/__circle240_review/';
const assetPattern = /^(catalogue\.json|(?:portraits|reverses)\/[a-z0-9-]+\.png)$/;
const browserModules = new Set(['spatial.js', 'frame.js', 'edition.js']);

export function circle240ReviewServer(directory: string | undefined): Plugin {
  return {
    name: 'circle240-private-review',
    apply: 'serve',
    configureServer(server) {
      if (!directory) return;
      if (server.config.server.host !== '127.0.0.1' || !isAbsolute(directory)) {
        throw new Error('Circle 240 review requires --host 127.0.0.1 and an absolute external derivative directory');
      }
      const root = realpathSync(directory);
      const checkout = realpathSync(server.config.root);
      if (root === checkout || root.startsWith(checkout + sep)) {
        throw new Error('Circle 240 review derivatives must be outside the checkout');
      }
      server.middlewares.use((request, response, next) => {
        const url = new URL(request.url ?? '/', 'http://127.0.0.1');
        const isModule = url.pathname.startsWith(modulePrefix) && browserModules.has(url.pathname.slice(modulePrefix.length));
        if (!isModule && !url.pathname.startsWith(assetPrefix)) return next();
        try {
          const host = new URL('http://' + request.headers.host).hostname;
          const name = url.pathname.slice(assetPrefix.length);
          if (!localHosts.has(host) || !['GET', 'HEAD'].includes(request.method ?? '') ||
              (!isModule && !assetPattern.test(name))) throw new Error('Unavailable');
          const file = isModule ? resolve(checkout, url.pathname.slice(1)) : realpathSync(resolve(root, name));
          if ((!isModule && !file.startsWith(root + sep)) || !statSync(file).isFile()) throw new Error('Unavailable');
          response.setHeader('Cache-Control', 'no-store');
          response.setHeader('Content-Type', isModule ? 'text/javascript' : name.endsWith('.png') ? 'image/png' : 'application/json');
          if (request.method === 'HEAD') return response.end();
          const stream = createReadStream(file);
          stream.on('error', () => response.destroy());
          stream.pipe(response);
        } catch {
          response.statusCode = 404;
          response.end();
        }
      });
    },
  };
}
