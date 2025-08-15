// Temporary script to run server without TypeScript checking
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    skipLibCheck: true,
    noImplicitAny: false,
    strict: false
  }
});

require('./src/index.ts');
