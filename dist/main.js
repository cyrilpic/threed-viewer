import { loader } from './dist/threed-viewer.esm.js';
export { loader } from './dist/threed-viewer.esm.js';
import Prism from './docs/node_modules/prismjs/prism.js';
export { default as Prism } from './docs/node_modules/prismjs/prism.js';
import './docs/node_modules/simply-beautiful/index.js';
import { s as simplyBeautiful } from './_virtual/index.js_commonjs-module.js';
import * as three_module from './node_modules/three/build/three.module.js';
export { three_module as THREE };

loader.loaders.ktx2.setTranscoderPath( './libs/basis/' );
loader.loaders.draco.setDecoderPath( './libs/draco/' );

const syncEditor = (container, code) => {
  const node = container.cloneNode(true);
  node.removeAttribute( 'id' );
  Array.from(node.children).forEach( (el) => el.removeAttribute( 'name' ) );
  code.innerHTML = Prism.highlight(
      simplyBeautiful.exports.html(node.outerHTML),
      Prism.languages.html, 'html' );
};

document.addEventListener( 'DOMContentLoaded', (event) => {
  const codeContainers = document.querySelectorAll( 'code.output' );
  codeContainers.forEach( (code) => {
    const container = document.querySelector(code.getAttribute('data-viewer-id'));
    syncEditor(container, code);
    if ( code.classList.contains( 'dynamic' ) ) {
      const obs = new MutationObserver( (mutations, observer) => {
        syncEditor(container, code);
      });
      obs.observe(container, { attributes: true, childList: true, subtree: true });
    }
  });
});
