// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// https://docs.astro.build/en/reference/configuration-reference/
// Replace 'New-SimDev_Website' with your actual repository name
export default defineConfig({
  site: 'https://your-username.github.io',
  base: '/New-SimDev_Website',

  // Astro 7 defaults to 'jsx', which drops the whitespace between inline
  // elements on separate lines ("<b>x</b>⏎text" renders "xtext"). The
  // templates are written for the previous behaviour, so keep it.
  compressHTML: true,

  markdown: {
    // The remark/rehype pipeline, so $…$ and $$…$$ in Markdown (the tool
    // READMEs) are rendered to HTML by KaTeX when the site builds, with no
    // math library loaded in the browser.
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex]
    })
  }
});
