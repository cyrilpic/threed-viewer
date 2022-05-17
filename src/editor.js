import {html} from 'simply-beautiful';
import {loader, Prism, THREE} from './main.js';
import * as FilePond from 'filepond';

// CSS
import '../node_modules/filepond/dist/filepond.min.css';
import '../node_modules/toggle-switch-css/build/toggle-switch.css';


class Editor {
  constructor( container, viewer ) {
    this.container = container;
    this.viewer = viewer;

    this.changed = false;

    this.raycaster = new THREE.Raycaster();

    const scope = this;

    // Prepare marker
    this.sphereInter = new THREE.Mesh( new THREE.SphereGeometry( 0.5 ), new THREE.MeshBasicMaterial( {color: 0x00ff00} ) );
    this.sphereInter.visible = false;
    this.viewer.scene.add( this.sphereInter );
    this.pointer = new THREE.Vector2( -5, -5 );

    // Prepare info DOM
    this.domInfo = document.createElement( 'div' );
    this.domInfo.style = 'position: absolute; background-color: white; bottom: 30px; font-size: 0.8rem;';
    this.viewer.container.appendChild( this.domInfo );

    this.container.addEventListener( 'pointermove', (event) => {
      scope.pointer.x = ( event.offsetX / scope.container.clientWidth ) * 2 - 1;
      scope.pointer.y = - ( event.offsetY / scope.container.clientHeight ) * 2 + 1;
      scope.changed = true;
    } );

    const animate = () => {
      requestAnimationFrame( animate );
      if ( scope.changed ) {
        scope.raycaster.setFromCamera( scope.pointer, scope.viewer.camera );
        scope.changed = false;
        const getMainMesh = ( el ) => {
          if ( el.model.type == 'Group' ) {
            return el.model.getObjectByName( 'main-mesh' );
          } else {
            return el.model;
          }
        };
        const models = Array.from(scope.container.querySelectorAll( 'threed-model' )).flatMap( getMainMesh );
        const intersects = scope.raycaster.intersectObjects( models );
        if (intersects.length > 0) {
          scope.sphereInter.position.copy( intersects[0].point );
          scope.sphereInter.visible = true;

          scope.domInfo.innerText = 'Object: ' + intersects[0].object.type + ' Point: ' + JSON.stringify(intersects[0].point) + ' index ' + intersects[0].index + ' faceIndex ' + intersects[0].faceIndex;
        } else {
          scope.sphereInter.visible = false;
          scope.domInfo.innerText = '';
        }
        scope.viewer.animating = true;
      }
    };
    requestAnimationFrame( animate );
  }
}

document.addEventListener( 'DOMContentLoaded', (event) => {
  const container = document.querySelector('threed-viewer');
  const input = document.querySelector('input[type="file"]');
  const viewer = container.viewer;
  const editor = new Editor( container, viewer );

  const files = {};
  loader.manager.setURLModifier( ( url ) => {
    if ( url in files === false ) {
      return url;
    }
    const blob = URL.createObjectURL( files[url] );
    files[url].blobUrl = blob;
    return blob;
  } );

  // create a FilePond instance at the input element location
  const pond = FilePond.create(input, {
    server: {
      process: (fieldName, file, metadata, load, error, progress, abort, transfer, options) => {
        const tag = document.createElement('threed-model');
        if ( document.getElementById( 'face-color' ).value !== tag.constructor.defaultFaceColor ) {
          tag.setAttribute( 'face-color', document.getElementById( 'face-color' ).value );
        }
        if ( document.getElementById( 'edge-color' ).value !== tag.constructor.defaultEdgeColor ) {
          tag.setAttribute( 'edge-color', document.getElementById( 'edge-color' ).value );
        }
        files[file.name] = file;
        tag.setAttribute( 'src', file.name );
        if ( document.getElementById('center').checked ) {
          tag.setAttribute( 'center', true );
        }
        if ( document.getElementById('scale').checked ) {
          tag.setAttribute( 'scale', true );
        }
        progress( true, file.size/2, file.size);
        tag.addEventListener( 'loaded', (e) => {
          URL.revokeObjectURL( file.blobUrl );
          tag.setAttribute( 'name', e.target.model.uuid );
          progress( true, file.size, file.size);
          load( e.target.model.uuid );
          pond.removeFile();
        } );
        container.appendChild( tag );
      },
      revert: (uniqueFileId, load, error) => {
        const model = document.querySelector( 'threed-model[name="' + uniqueFileId + '"]' );
        model.remove();
        load();
      },
    },
  });

  document.querySelector( '#axis-helper' ).addEventListener( 'change', (ev) => {
    if ( ev.target.checked ) {
      container.setAttribute( 'axis-helper', '' );
    } else {
      container.removeAttribute( 'axis-helper' );
    }
  } );
  document.querySelector( '#help' ).addEventListener( 'change', (ev) => {
    if ( ev.target.checked ) {
      container.setAttribute( 'help', '' );
    } else {
      container.removeAttribute( 'help' );
    }
  } );
  document.querySelector( '#wireframe' ).addEventListener( 'change', (ev) => {
    if ( ev.target.checked ) {
      container.setAttribute( 'wireframe', '' );
    } else {
      container.removeAttribute( 'wireframe' );
    }
  } );
  document.querySelector( '#zoom' ).addEventListener( 'change', (ev) => {
    container.setAttribute( 'camera-zoom', ev.target.value );
  } );
  document.querySelector( '#clearview' ).addEventListener( 'click', (ev) => {
    container.querySelectorAll( 'threed-model' ).forEach( (el) => el.remove() );
  } );
} );
