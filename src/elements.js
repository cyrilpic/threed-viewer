import {CylinderGeometry, Object3D, Mesh, MeshStandardMaterial, Quaternion,
  SphereGeometry, Vector3} from 'three';
import {CSS2DObject} from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import {Loader} from './Loader.js';
import {Viewer} from './Viewer.js';

const viewerTmpl = document.createElement('template');
viewerTmpl.innerHTML = `
  <style>
    :host { 
        display: block;
    }
    #viewer { width: 100%; height: 100%; position: relative; }
    #toolbar { 
        top: 10px;
        left: 10px;
        position: absolute;
        text-align: center;
        background-color: white;
        opacity: 0.75;
    }
    #toolbar a {
        display: block;
        padding: 6px 8px 0px;
        color: #495057;
    }
    #toolbar svg {
        width: 1.1em;
        height: 1.1em;
    }
    #message_wrapper {
        position: absolute;
        top: 0;
        left: 50%;
        padding: 1em;
        transform: translateX(-50%);
        transition: visibility 0.5s, opacity 0.5s;
    }
    #message_wrapper > div {
        background-color: white;
        opacity: 0.75;
        padding: 0.25rem;
    }
    .invisible {
        visibility: hidden;
    }
    .opacity-0 {
        opacity: 0;
    }
    .label {
        color: #FFF;
        padding: 2px;
        background: rgba( 0, 0, 0, .6 );
    }
    #help {
        position: absolute;
        bottom: 0;
        left: 5px;
        color: #495057;
        font-size:0.8rem;
    }
  </style>
  <div id="viewer"></div>
`;

// Custom events

class UpdateEvent extends Event {
  constructor() {
    super( 'updated', {bubbles: true} );
  }
}

// Custom elements

class ModelElement extends HTMLElement {
  constructor() {
    super();
    this.geometry = null;
    this.model = null;
    this._viewerDOM = null;
  }

  connectedCallback() {
    const scope = this;
    this._viewerDOM = this.parentElement;
    if ( this.model ) {
      this.parentElement.viewer.addContent( this.model );
    } else {
      new Loader( this, ( geometry, model ) => {
        scope.geometry = geometry;
        scope.model = model;
        const event = new CustomEvent('loaded', {geometry: scope.geometry});
        scope.dispatchEvent( event );
        scope._viewerDOM.viewer.addContent( model );
      } );
    }
  }

  disconnectedCallback() {
    if ( this.model ) {
      this.model.removeFromParent();
      if ( this._viewerDOM ) {
        this._viewerDOM.dispatchEvent( new UpdateEvent() );
        this._viewerDOM = null;
      }
    }
  }

  get loaded() {
    return this.model instanceof Object3D;
  }

  get src() {
    if ( !this.hasAttribute('src') || !!!this.getAttribute('src') ) {
      const aTag = this.querySelector( 'a' );
      if ( aTag ) {
        this.setAttribute( 'src', aTag.getAttribute( 'href' ) );
      }
    }
    return this.getAttribute('src');
  }

  get scale() {
    if ( this.hasAttribute( 'scale' ) ) {
      const v = this.getAttribute( 'scale' );
      if ( v === '' || v === 'true' ) {
        return true;
      } else {
        return v;
      }
    } else {
      return false;
    }
  }

  get center() {
    return this.hasAttribute('center');
  }
}

class AnnotationElement extends HTMLElement {
  constructor() {
    super();
    this._annotation = undefined;
    this._modelDOM = undefined;
  }

  connectedCallback() {
    this._modelDOM = this.parentElement;
    const scope = this;
    const add = () => {
      scope._modelDOM.model.add( scope.annotation );
      scope.dispatchEvent( new UpdateEvent() );
    };
    this._modelDOM.addEventListener( 'loaded', (event) => {
      this._annotation = undefined;
      add();
    });
    if ( this._modelDOM.loaded ) {
      add();
    }
  }
  disconnectedCallback() {
    if ( this._annotation ) {
      this._annotation.removeFromParent();
      if ( this._annotation instanceof Object3D ) {
        this._annotation.geometry.dispose();
        this._annotation.material.dispose();
      }
      this._annotation = undefined;
      if ( this._modelDOM ) {
        this._modelDOM.dispatchEvent( new UpdateEvent() );
      }
    }
  }

  get annotation() {
    if ( this._annotation ) {
      return this._annotation;
    }
    const annoteM = new MeshStandardMaterial( {color: this.color} );
    if ( this.kind === 'sphere' ) {
      const geometry = new SphereGeometry( 0.5 );
      const sphere = new Mesh( geometry, annoteM );
      sphere.position.copy( this.positionInGeometry() );
      this._annotation = sphere;
    } else if ( this.kind === 'label' ) {
      const labelDiv = document.createElement( 'div' );
      labelDiv.className = 'label';
      labelDiv.textContent = this.text;
      labelDiv.style.marginTop = '-1em';
      labelDiv.style.color = this.color;
      const label = new CSS2DObject( labelDiv );
      label.position.copy( this.positionInGeometry() );
      this._annotation = label;
    } else if ( this.kind === 'cylinder' ) {
      const position = this.positionInGeometry();
      if ( position.length != 2 ) {
        console.error( 'Invalid length' );
      }

      const geometry = new CylinderGeometry( 0.2, 0.2, position[0].distanceTo( position[1] ), 20 );
      const cylinder = new Mesh( geometry, annoteM );
      const midpoint = new Vector3();
      midpoint.addVectors( position[0], position[1] );
      midpoint.divideScalar( 2 );
      cylinder.position.set( midpoint.x, midpoint.y, midpoint.z );

      const normal = new Vector3();
      normal.subVectors( position[1], position[0] );
      normal.normalize();
      const rotation = new Quaternion();
      rotation.setFromUnitVectors( new Vector3( 0, 1, 0 ), normal );

      cylinder.applyQuaternion( rotation );

      this._annotation = cylinder;
    }

    if ( this._annotation ) {
      this._annotation.name = 'annotation';
    }

    return this._annotation;
  }

  positionInGeometry() {
    const geometry = this._modelDOM.geometry;
    const parts = this.position.split( ';' );
    const out = [];
    for ( const p of parts ) {
      const [reference, position] = p.split( '=' );
      if ( reference == 'absolute' ) {
        const [x, y, z] = position.split( ',' ).map( (el) => parseFloat(el) );
        out.push( new Vector3( x, y, z ) );
      } else if ( reference == 'vertex' ) {
        const p = parseInt( position );
        const x = geometry.getAttribute( 'position' ).getX( p );
        const y = geometry.getAttribute( 'position' ).getY( p );
        const z = geometry.getAttribute( 'position' ).getZ( p );
        out.push( new Vector3( x, y, z ) );
      }
    }
    if ( out.length === 1) {
      return out[0];
    }
    return out;
  }

  static get observedAttributes() {
    return ['color', 'text'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (this._annotation === undefined) {
      return;
    }
    switch ( name ) {
      case 'color':
        if ( this._annotation instanceof CSS2DObject ) {
          this._annotation.element.style.color = this.color;
        } else {
          this._annotation.material.color.setStyle(this.color);
        }
        break;
      case 'text':
        if ( this._annotation instanceof CSS2DObject ) {
          this._annotation.element.textContent = this.text;
        }
        break;
      default:
        break;
    }
    this.dispatchEvent( new UpdateEvent() );
  }

  get kind() {
    return this.getAttribute( 'kind' );
  }

  get position() {
    return this.getAttribute( 'position' );
  }

  get color() {
    return this.getAttribute( 'color' );
  }

  set color( c ) {
    if ( c ) {
      this.setAttribute( 'color', c );
    } else {
      this.removeAttribute( 'color' );
    }
  }

  get text() {
    return this.getAttribute( 'text' );
  }

  set text(t) {
    if ( t ) {
      this.setAttribute( 'text', t );
    } else {
      this.removeAttribute( 'text' );
    }
  }
}

class ViewerElement extends HTMLElement {
  constructor() {
    super(); // always call super() first in the constructor.

    // Prepare shadow DOM
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.appendChild(viewerTmpl.content.cloneNode(true));

    this.viewer = null;
    const scope = this;
    this.addEventListener( 'updated', () => {
      if ( scope.viewer ) scope.viewer.animating = true;
    } );
  }

  connectedCallback() {
    this.updateSize();

    const options = {
      grid: this.grid,
      axis_helper: this.axisHelper,
      controls: this.controls,
      camera_position: new Vector3( 1, 1, 1 ),
      camera_zoom: this.cameraZoom,
      camera_up: new Vector3( 0, 1, 0 ),
      toolbar: this.toolbar,
      help: this.help,
    };

    this.viewer = new Viewer( this.shadowRoot.getElementById('viewer'), options );
  }

  updateSize() {
    if ( this.shadowRoot.styleSheets.length > 0 ) {
      const viewerCssRule = this.shadowRoot.styleSheets[0].cssRules[0];
      viewerCssRule.style.height = this.getAttribute('height');
      viewerCssRule.style.width = this.getAttribute('width');
      if ( this.viewer ) this.viewer.resize();
    }
  }


  get src() {
    return this.getAttribute('src');
  }

  get cameraZoom() {
    if ( this.hasAttribute( 'camera-zoom' ) ) {
      return parseFloat( this.getAttribute( 'camera-zoom' ) );
    } else {
      return 1.0;
    }
  }

  get grid() {
    return this.hasAttribute('grid');
  }

  get axisHelper() {
    return this.hasAttribute('axis-helper');
  }

  get controls() {
    return this.hasAttribute('controls');
  }

  get toolbar() {
    return this.hasAttribute('toolbar');
  }

  get help() {
    return this.hasAttribute('help');
  }

  static get observedAttributes() {
    return ['width', 'height', 'axis-helper'];
  }
  // Monitor changes to HTML attributes
  attributeChangedCallback(name, oldValue, newValue) {
    switch ( name ) {
      case 'width':
      case 'height':
        this.updateSize();
        break;
      case 'axis-helper':
        if ( this.viewer ) {
          this.viewer.viewAxes.visible = !( newValue === null );
          this.viewer.animating = true;
        }
        break;
      default:
        break;
    }
  }
}

customElements.define( 'threed-viewer', ViewerElement );
customElements.define( 'threed-annotation', AnnotationElement );
customElements.define( 'threed-model', ModelElement );

export {AnnotationElement, ModelElement, ViewerElement};
