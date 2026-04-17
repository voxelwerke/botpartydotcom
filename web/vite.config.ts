import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		// gpu.js stringifies JS functions to compile GLSL shaders. If terser
		// mangles their variable names, its AST parser throws "Unhandled binary
		// expression between Array & Number" at runtime in production.
		// Use terser with mangling + function-body compression disabled so
		// NeuralNetworkGPU can still read its own code.
		minify: 'terser',
		terserOptions: {
			mangle: false,
			keep_fnames: true,
			keep_classnames: true,
			compress: {
				keep_fargs: true,
				keep_infinity: true
			}
		}
	}
});
