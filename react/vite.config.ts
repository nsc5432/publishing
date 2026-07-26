import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import path from 'path';

export default defineConfig({
    plugins: [react(), svgr()],
    base: '/rui/',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'), // src 폴더를 @로 매핑
        },
    },
    server: {
        proxy: {
            '/pm': {
                target: 'http://localhost:8080',
                changeOrigin: true
            },
        },
    },
});
