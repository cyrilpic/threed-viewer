/* eslint-disable require-jsdoc */
import * as THREE from 'three';
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
        color: #0d6efd;
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
        color: white;
        font-size:0.8rem;
    }
  </style>
  <div id="viewer"></div>
`;

class ModelElement extends HTMLElement {
  constructor() {
    super();
    this.geometry = null;
  }

  connectedCallback() {
    const scope = this;
    new Loader( this, ( geometry, model ) => {
      scope.geometry = geometry;
      for ( const a of scope.querySelectorAll( 'threed-annotation' ) ) {
        model.add( a.annotation( geometry ) );
      }
      scope.parentElement.viewer.addContent( model );
    } );
  }

  get src() {
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
  annotation( model_geometry ) {
    const annote_m = new THREE.MeshStandardMaterial( {color: this.color} );
    if ( this.kind === 'sphere' ) {
      const geometry = new THREE.SphereGeometry( 0.5 );
      const sphere = new THREE.Mesh( geometry, annote_m );
      const position = this.positionInGeometry( model_geometry );
      sphere.position.set( position.x, position.y, position.z );
      return sphere;
    } else if ( this.kind === 'label' ) {
      const labelDiv = document.createElement( 'div' );
      labelDiv.className = 'label';
      labelDiv.textContent = this.text;
      labelDiv.style.marginTop = '-1em';
      labelDiv.style.color = this.color;
      const label = new CSS2DObject( labelDiv );
      const position = this.positionInGeometry( model_geometry );
      label.position.set( position.x, position.y, position.z );
      return label;
    } else if ( this.kind === 'cylinder' ) {
      const position = this.positionInGeometry( model_geometry );
      if ( position.length != 2 ) {
        console.error( 'Invalid length' );
      }

      const geometry = new THREE.CylinderGeometry( 0.2, 0.2, position[0].distanceTo( position[1] ), 20 );
      const cylinder = new THREE.Mesh( geometry, annote_m );
      const midpoint = new THREE.Vector3();
      midpoint.addVectors( position[0], position[1] );
      midpoint.divideScalar( 2 );
      cylinder.position.set( midpoint.x, midpoint.y, midpoint.z );

      const normal = new THREE.Vector3();
      normal.subVectors( position[1], position[0] );
      normal.normalize();
      const rotation = new THREE.Quaternion();
      rotation.setFromUnitVectors( new THREE.Vector3( 0, 1, 0 ), normal );

      cylinder.applyQuaternion( rotation );

      return cylinder;
    }
  }

  positionInGeometry( geometry ) {
    const parts = this.position.split( ';' );
    const out = [];
    for ( const p of parts ) {
      const [reference, position] = p.split( '=' );
      if ( reference == 'absolute' ) {
        const [x, y, z] = position.split( ',' );
        out.push( new THREE.Vector3( x, y, z ) );
      } else if ( reference == 'vertex' ) {
        const x = geometry.getAttribute( 'position' ).getX( parseInt( position ) );
        const y = geometry.getAttribute( 'position' ).getY( parseInt( position ) );
        const z = geometry.getAttribute( 'position' ).getZ( parseInt( position ) );
        out.push( new THREE.Vector3( x, y, z ) );
      }
    }
    if ( out.length === 1) {
      return out[0];
    }
    return out;
  }

  get kind() {
    return this.getAttribute( 'kind' );
  }

  get reference() {
    return this.getAttribute( 'reference' );
  }

  get position() {
    return this.getAttribute( 'position' );
  }

  get color() {
    return this.getAttribute( 'color' );
  }

  get text() {
    return this.getAttribute( 'text' );
  }
}

class ViewerElement extends HTMLElement {
  constructor() {
    super(); // always call super() first in the constructor.
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.appendChild(viewerTmpl.content.cloneNode(true));
  }

  connectedCallback() {
    this.shadowRoot.styleSheets[0].cssRules[0].style.height = this.getAttribute('height');
    this.shadowRoot.styleSheets[0].cssRules[0].style.width = this.getAttribute('width');

    const options = {
      grid: this.grid,
      axis_helper: this.axis_helper,
      controls: this.controls,
      camera_position: new THREE.Vector3( 1, 1, 1 ),
      camera_zoom: this.camera_zoom,
      camera_up: new THREE.Vector3( 0, 1, 0 ),
      toolbar: this.toolbar,
      help: this.help,
    };

    this.viewer = new Viewer( this.shadowRoot.getElementById('viewer'), options );
  }


  get src() {
    return this.getAttribute('src');
  }

  get camera_zoom() {
    if ( this.hasAttribute( 'camera-zoom' ) ) {
      return parseFloat( this.getAttribute( 'camera-zoom' ) );
    } else {
      return 1.0;
    }
  }

  get grid() {
    return this.hasAttribute('grid');
  }

  get axis_helper() {
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

  // Monitor changes to HTML attributes
  attributeChangedCallback(name, oldValue, newValue) {
  }
}

export {AnnotationElement, ModelElement, ViewerElement};
