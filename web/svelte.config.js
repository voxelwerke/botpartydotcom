import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		// csp: {
		// 	mode: 'auto',
		// 	directives: {
		// 		'default-src': ['self'],
		// 		'connect-src': ['self'],
		// 		'img-src': ['self', 'data:', 'blob:'],
		// 		'style-src': ['self'],
		// 		'font-src': ['self'],
		// 		'script-src': ['self', 'trusted-types-eval', 'unsafe-eval'],
		// 		'object-src': ['none'],
		// 		'base-uri': ['none'],
		// 		'form-action': ['self'],
		// 		'frame-ancestors': ['none']
		// 	}
		// }
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) => ({ runes: !filename.includes('node_modules') })
	}
};

export default config;
