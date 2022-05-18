import {CylinderGeometry, Object3D, Mesh, MeshStandardMaterial, Quaternion,
  SphereGeometry, Vector3} from 'three';
import {CSS2DObject} from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import {loader} from './Loader.js';
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
    svg.svg-inline--fa.selected {
      color: #76D6FF;
    }
    /* -------------------------------------------------------------------
    Microtip
    Modern, lightweight css-only tooltips
    Just 1kb minified and gzipped
    @author Ghosh
    @package Microtip
    ----------------------------------------------------------------------*/
    [aria-label][role~="tooltip"]{position:relative}[aria-label][role~="tooltip"]::before,[aria-label][role~="tooltip"]::after{transform:translate3d(0,0,0);-webkit-backface-visibility:hidden;backface-visibility:hidden;will-change:transform;opacity:0;pointer-events:none;transition:all var(--microtip-transition-duration,.18s) var(--microtip-transition-easing,ease-in-out) var(--microtip-transition-delay,0s);position:absolute;box-sizing:border-box;z-index:10;transform-origin:top}[aria-label][role~="tooltip"]::before{background-size:100% auto!important;content:""}[aria-label][role~="tooltip"]::after{background:rgba(17,17,17,.9);border-radius:4px;color:#fff;content:attr(aria-label);font-size:var(--microtip-font-size,13px);font-weight:var(--microtip-font-weight,normal);text-transform:var(--microtip-text-transform,none);padding:.5em 1em;white-space:nowrap;box-sizing:content-box}[aria-label][role~="tooltip"]:hover::before,[aria-label][role~="tooltip"]:hover::after,[aria-label][role~="tooltip"]:focus::before,[aria-label][role~="tooltip"]:focus::after{opacity:1;pointer-events:auto}[role~="tooltip"][data-microtip-position|="top"]::before{background:url(data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2236px%22%20height%3D%2212px%22%3E%3Cpath%20fill%3D%22rgba%2817,%2017,%2017,%200.9%29%22%20transform%3D%22rotate%280%29%22%20d%3D%22M2.658,0.000%20C-13.615,0.000%2050.938,0.000%2034.662,0.000%20C28.662,0.000%2023.035,12.002%2018.660,12.002%20C14.285,12.002%208.594,0.000%202.658,0.000%20Z%22/%3E%3C/svg%3E) no-repeat;height:6px;width:18px;margin-bottom:5px}[role~="tooltip"][data-microtip-position|="top"]::after{margin-bottom:11px}[role~="tooltip"][data-microtip-position|="top"]::before{transform:translate3d(-50%,0,0);bottom:100%;left:50%}[role~="tooltip"][data-microtip-position|="top"]:hover::before{transform:translate3d(-50%,-5px,0)}[role~="tooltip"][data-microtip-position|="top"]::after{transform:translate3d(-50%,0,0);bottom:100%;left:50%}[role~="tooltip"][data-microtip-position="top"]:hover::after{transform:translate3d(-50%,-5px,0)}[role~="tooltip"][data-microtip-position="top-left"]::after{transform:translate3d(calc(-100% + 16px),0,0);bottom:100%}[role~="tooltip"][data-microtip-position="top-left"]:hover::after{transform:translate3d(calc(-100% + 16px),-5px,0)}[role~="tooltip"][data-microtip-position="top-right"]::after{transform:translate3d(calc(0% + -16px),0,0);bottom:100%}[role~="tooltip"][data-microtip-position="top-right"]:hover::after{transform:translate3d(calc(0% + -16px),-5px,0)}[role~="tooltip"][data-microtip-position|="bottom"]::before{background:url(data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2236px%22%20height%3D%2212px%22%3E%3Cpath%20fill%3D%22rgba%2817,%2017,%2017,%200.9%29%22%20transform%3D%22rotate%28180%2018%206%29%22%20d%3D%22M2.658,0.000%20C-13.615,0.000%2050.938,0.000%2034.662,0.000%20C28.662,0.000%2023.035,12.002%2018.660,12.002%20C14.285,12.002%208.594,0.000%202.658,0.000%20Z%22/%3E%3C/svg%3E) no-repeat;height:6px;width:18px;margin-top:5px;margin-bottom:0}[role~="tooltip"][data-microtip-position|="bottom"]::after{margin-top:11px}[role~="tooltip"][data-microtip-position|="bottom"]::before{transform:translate3d(-50%,-10px,0);bottom:auto;left:50%;top:100%}[role~="tooltip"][data-microtip-position|="bottom"]:hover::before{transform:translate3d(-50%,0,0)}[role~="tooltip"][data-microtip-position|="bottom"]::after{transform:translate3d(-50%,-10px,0);top:100%;left:50%}[role~="tooltip"][data-microtip-position="bottom"]:hover::after{transform:translate3d(-50%,0,0)}[role~="tooltip"][data-microtip-position="bottom-left"]::after{transform:translate3d(calc(-100% + 16px),-10px,0);top:100%}[role~="tooltip"][data-microtip-position="bottom-left"]:hover::after{transform:translate3d(calc(-100% + 16px),0,0)}[role~="tooltip"][data-microtip-position="bottom-right"]::after{transform:translate3d(calc(0% + -16px),-10px,0);top:100%}[role~="tooltip"][data-microtip-position="bottom-right"]:hover::after{transform:translate3d(calc(0% + -16px),0,0)}[role~="tooltip"][data-microtip-position="left"]::before,[role~="tooltip"][data-microtip-position="left"]::after{bottom:auto;left:auto;right:100%;top:50%;transform:translate3d(10px,-50%,0)}[role~="tooltip"][data-microtip-position="left"]::before{background:url(data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212px%22%20height%3D%2236px%22%3E%3Cpath%20fill%3D%22rgba%2817,%2017,%2017,%200.9%29%22%20transform%3D%22rotate%28-90%2018%2018%29%22%20d%3D%22M2.658,0.000%20C-13.615,0.000%2050.938,0.000%2034.662,0.000%20C28.662,0.000%2023.035,12.002%2018.660,12.002%20C14.285,12.002%208.594,0.000%202.658,0.000%20Z%22/%3E%3C/svg%3E) no-repeat;height:18px;width:6px;margin-right:5px;margin-bottom:0}[role~="tooltip"][data-microtip-position="left"]::after{margin-right:11px}[role~="tooltip"][data-microtip-position="left"]:hover::before,[role~="tooltip"][data-microtip-position="left"]:hover::after{transform:translate3d(0,-50%,0)}[role~="tooltip"][data-microtip-position="right"]::before,[role~="tooltip"][data-microtip-position="right"]::after{bottom:auto;left:100%;top:50%;transform:translate3d(-10px,-50%,0)}[role~="tooltip"][data-microtip-position="right"]::before{background:url(data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212px%22%20height%3D%2236px%22%3E%3Cpath%20fill%3D%22rgba%2817,%2017,%2017,%200.9%29%22%20transform%3D%22rotate%2890%206%206%29%22%20d%3D%22M2.658,0.000%20C-13.615,0.000%2050.938,0.000%2034.662,0.000%20C28.662,0.000%2023.035,12.002%2018.660,12.002%20C14.285,12.002%208.594,0.000%202.658,0.000%20Z%22/%3E%3C/svg%3E) no-repeat;height:18px;width:6px;margin-bottom:0;margin-left:5px}[role~="tooltip"][data-microtip-position="right"]::after{margin-left:11px}[role~="tooltip"][data-microtip-position="right"]:hover::before,[role~="tooltip"][data-microtip-position="right"]:hover::after{transform:translate3d(0,-50%,0)}[role~="tooltip"][data-microtip-size="small"]::after{white-space:initial;width:80px}[role~="tooltip"][data-microtip-size="medium"]::after{white-space:initial;width:150px}[role~="tooltip"][data-microtip-size="large"]::after{white-space:initial;width:260px}
  </style>
  <div id="viewer"></div>
`;

// Custom events

class UpdateEvent extends Event {
  constructor() {
    super( 'updated', {bubbles: true} );
  }
}


class ModelElement extends HTMLElement {
  constructor() {
    super();
    this.geometry = null;
    this.model = null;
    this._viewerDOM = null;
  }

  static defaultFaceColor = '#9dc2cf';
  static defaultEdgeColor = '#ff0000';

  connectedCallback() {
    const scope = this;
    this._viewerDOM = this.parentElement;
    if ( this.model ) {
      this.parentElement.viewer.addContent( this.model );
    } else {
      loader.load( this, ( geometry, model ) => {
        scope.geometry = geometry;
        scope.model = model;
        const event = new CustomEvent( 'loaded' );
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

  static get observedAttributes() {
    return ['face-color', 'edge-color'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if ( !this.loaded ) {
      return;
    }
    switch ( name ) {
      case 'face-color':
        this.model.getObjectByName('main-mesh').material.color.setStyle(this.faceColor);
        break;
      case 'edge-color':
        this.model.getObjectByName('edges').material.color.setStyle(this.edgeColor);
        break;
      default:
        break;
    }
    this.dispatchEvent( new UpdateEvent() );
  }

  get src() {
    if ( !this.hasAttribute('src') || !!!this.getAttribute('src') ) {
      const aTag = this.querySelector( 'a' );
      if ( aTag ) {
        return aTag.getAttribute( 'href' );
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

  get faceColor() {
    if ( this.hasAttribute( 'face-color' ) ) {
      return this.getAttribute( 'face-color' );
    }
    return null;
  }

  get edgeColor() {
    if ( this.hasAttribute( 'edge-color' ) ) {
      return this.getAttribute( 'edge-color' );
    }
    return null;
  }

  get wireframeAngle() {
    if ( this.hasAttribute( 'wireframe-angle' ) ) {
      return parseInt( this.getAttribute( 'wireframe-angle' ) );
    }
    return 5;
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
    } else {
      console.warn( 'Annotation kind is unknown' );
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
      wireframe: this.wireframe,
    };

    this.viewer = new Viewer( this.shadowRoot.getElementById('viewer'), options );
    // Set up loader
    if ( loader.loaders.ktx2.workerConfig === null ) {
      loader.loaders.ktx2.detectSupport( this.viewer.renderer );
    }
  }

  updateSize() {
    if ( this.shadowRoot.styleSheets.length > 0 ) {
      const viewerCssRule = this.shadowRoot.styleSheets[0].cssRules[0];
      viewerCssRule.style.height = this.getAttribute('height');
      viewerCssRule.style.width = this.getAttribute('width');
      if ( this.viewer ) this.viewer.needsResize = true;
    }
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

  get wireframe() {
    return this.hasAttribute('wireframe');
  }

  static get observedAttributes() {
    return ['width', 'height', 'axis-helper', 'grid', 'help', 'camera-zoom', 'wireframe'];
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
      case 'grid':
        if ( this.viewer ) {
          this.viewer.grid.visible = !( newValue === null );
          this.viewer.animating = true;
        }
        break;
      case 'help':
        if ( this.viewer ) {
          this.viewer.helpDom.style.visibility = !( newValue === null ) ? 'visible ' : 'hidden';
        }
        break;
      case 'camera-zoom':
        if ( this.viewer ) {
          this.viewer.camera.zoom = this.cameraZoom;
          this.viewer.camera.updateProjectionMatrix();
          this.viewer.controls._zoom0 = this.cameraZoom;
          this.viewer.animating = true;
        }
        break;
      case 'wireframe':
        if ( this.viewer ) {
          this.viewer.buttons['wiref_btn'].toggle( this.wireframe );
          this.viewer.toggleWireframeVisibility( this.wireframe );
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
