import {loader, THREE} from 'threed-viewer';
import Prism from 'prismjs';
import {html} from 'simply-beautiful';

// CSS
import '../node_modules/normalize.css/normalize.css'
import '../node_modules/prismjs/themes/prism.css';
import './style.css';

loader.loaders.ktx2.setTranscoderPath( '/libs/basis/' );
loader.loaders.draco.setDecoderPath( '/libs/draco/' );

const syncEditor = (container, code) => {
  const node = container.cloneNode(true);
  node.removeAttribute( 'id' );
  Array.from(node.children).forEach( (el) => el.removeAttribute( 'name' ) );
  code.innerHTML = Prism.highlight(
      html(node.outerHTML),
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


export {loader, Prism, THREE};
