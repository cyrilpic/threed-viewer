import * as THREE from 'three';

import {icon} from '@fortawesome/fontawesome-svg-core';
import {faUndo, faEdit} from '@fortawesome/free-solid-svg-icons';
import {faEdit as farEdit} from '@fortawesome/free-regular-svg-icons';

import {ArcballControls} from 'three/examples/jsm/controls/ArcballControls.js';
import {CSS2DRenderer} from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import {AxisHelper} from './AxisHelper.js';
import {Button} from './Button.js';

/**
 * Main viewer class
 * @exports
 */
class Viewer {
  /**
   * @param {!HTMLElement} container DOM Element to contain the viewer.
   * @param {object} selectedOptions Options for the viewer.
   */
  constructor( container, selectedOptions ) {
    const scope = this;
    this.container = container;

    // Parse options
    const options = {
      grid: true,
      axis_helper: true,
      controls: true,
      camera_position: new THREE.Vector3( 1, 1, 1 ),
      camera_zoom: 1,
      camera_up: new THREE.Vector3( 0, 1, 0 ),
      toolbar: true,
      help: true,
    };
    if ( selectedOptions !== null ) {
      Object.assign( options, selectedOptions );
    }

    // Create scene
    this.scene = new THREE.Scene();

    // Create cameras
    // const orthographicDistance = 120;
    const perspectiveDistance = 25;

    const getOthographicPosition = () => {
      const aspect = container.clientWidth / container.clientHeight;
      const halfFovV = THREE.MathUtils.DEG2RAD * 45 * 0.5;
      const halfFovH = Math.atan( ( aspect ) * Math.tan( halfFovV ) );
      const halfW = perspectiveDistance * Math.tan( halfFovH );
      const halfH = perspectiveDistance * Math.tan( halfFovV );
      return [- halfW, halfW, halfH, - halfH];
    };
    const opos = getOthographicPosition();
    this.camera = new THREE.OrthographicCamera( opos[0], opos[1], opos[2], opos[3], -2000, 2000 );
    this.camera.position.copy( options.camera_position );
    this.camera.position.multiplyScalar( perspectiveDistance );
    this.camera.zoom = options.camera_zoom;
    this.camera.up.copy( options.camera_up );
    this.camera.updateProjectionMatrix();
    this.scene.add( this.camera );

    //
    this.a_light = new THREE.AmbientLight( 0x404040, 0.3 );
    this.scene.add( this.a_light );
    // Directional light attached to camera
    this.d_light = new THREE.DirectionalLight( 0xffffff, 0.6, {castShadow: true} );
    this.camera.add( this.d_light );

    //
    this.renderer = new THREE.WebGLRenderer( {antialias: true} );
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.setSize( container.clientWidth, container.clientHeight );
    this.renderer.setClearColor( 0xaaaaaa );

    container.appendChild( this.renderer.domElement );

    this.label_renderer = new CSS2DRenderer();
    this.label_renderer.setSize( container.clientWidth, container.clientHeight );
    this.label_renderer.domElement.style.position = 'absolute';
    this.label_renderer.domElement.style.top = '0px';
    container.appendChild( this.label_renderer.domElement );

    window.addEventListener( 'resize', (e) => {
      const opos = getOthographicPosition();
      scope.camera.left = opos[0];
      scope.camera.right = opos[1];
      scope.camera.top = opos[2];
      scope.camera.bottom = opos[3];
      scope.camera.updateProjectionMatrix();

      scope.renderer.setSize( scope.container.clientWidth, scope.container.clientHeight );
      scope.label_renderer.setSize( scope.container.clientWidth, scope.container.clientHeight );
    } );

    // Controls
    this.controls = new ArcballControls( this.camera, this.label_renderer.domElement, this.scene );
    this.controls.enabled = options.controls;
    this.controls.setGizmosVisible( false );

    // Helpers
    this.grid = new THREE.Group();

    const grid1 = new THREE.GridHelper( 30, 30, 0x888888 );
    grid1.material.color.setHex( 0x888888 );
    grid1.material.vertexColors = false;
    this.grid.add( grid1 );

    const grid2 = new THREE.GridHelper( 30, 6, 0x222222 );
    grid2.material.color.setHex( 0x222222 );
    grid2.material.depthFunc = THREE.AlwaysDepth;
    grid2.material.vertexColors = false;
    this.grid.add( grid2 );

    this.grid.visible = options.grid;

    this.view_axes = new AxisHelper( this.camera, container );
    this.view_axes.controls = this.controls;
    this.view_axes.visible = options.axis_helper;
    //
    this.clock = new THREE.Clock();

    this.animating = false;
    const animate = () => {
      let needsUpdate = scope.animating;
      const delta = scope.clock.getDelta();

      if ( scope.view_axes.animating === true ) {
        scope.view_axes.update(delta);
        needsUpdate = true;
      }

      if ( needsUpdate ) {
        scope.controls.update();
        scope.render();
        scope.animating = false;
      }
    };

    //
    // this.sphereInter = new THREE.Mesh( new THREE.SphereGeometry( 0.5 ), new THREE.MeshBasicMaterial( {color: 0x00ff00} ) );
    // this.sphereInter.visible = false;
    // this.scene.add( this.sphereInter );
    // Toolbar
    if ( ( options.toolbar !== false ) && ( options.toolbar !== null ) ) {
      this.buildToolbar( options );
    }


    // Message center
    this.message_dom = document.createElement( 'div' );
    this.message_dom.setAttribute( 'id', 'message_wrapper' );
    this.message_dom.className = 'invisible opacity-0';
    this.message_inner = document.createElement( 'div' );
    this.message_dom.appendChild( this.message_inner );
    this.message_timeout = null;
    this.container.appendChild( this.message_dom );

    // Help
    if ( ( options.help !== false ) && ( options.help !== null ) ) {
      this.helpDom = document.createElement( 'div' );
      this.helpDom.setAttribute( 'id', 'help' );
      this.helpDom.innerText = 'Scroll to zoom / Drag to rotate / Drag & left-click to pan';
      this.container.appendChild( this.helpDom );
    }

    this.animating = true;
    this.renderer.setAnimationLoop( animate );
    this.controls.addEventListener( 'change', () => {
      scope.render();
    } );

    this.objects = [];
  }
  buildToolbar( options ) {
    this.toolbar = document.createElement( 'nav' );
    this.toolbar.setAttribute( 'id', 'toolbar' );
    this.container.appendChild( this.toolbar );

    this.buttons = {};

    const scope = this;

    // this.pointer = new THREE.Vector2(-5, -5);
    // const editEvent = ( event ) => {
    //   // const opos = getOthographicPosition();
    //   scope.pointer.x = ( event.layerX / scope.label_renderer.domElement.clientWidth ) * 2 - 1;
    //   scope.pointer.y = - ( event.layerY / scope.label_renderer.domElement.clientHeight ) * 2 + 1;
    //   scope.animating = true;
    // };

    this.handleEvents = (name, e) => {
      switch (name) {
        case 'reset-view':
          scope.controls.reset();
          scope.showMessage( 'Reset view' );
          break;
        case 'toggle-ambient':
          scope.a_light.visible = !scope.a_light.visible;
          if ( scope.a_light.visible ) {
            scope.showMessage('Ambient light on');
          } else {
            scope.showMessage('Ambient light off');
          }
          this.animating = true;
          break;
        case 'toggle-dir':
          if ( scope.d_light.visible ) {
            if ( scope.d_light.position.z == 1 ) {
              scope.d_light.position.z = 0;
              scope.d_light.position.x = 1;
              scope.showMessage('Light from x');
            } else if ( scope.d_light.position.x == 1) {
              scope.d_light.position.x = 0;
              scope.d_light.position.y = 1;
              scope.showMessage('Light from y');
            } else if ( scope.d_light.position.y == 1) {
              scope.d_light.visible = false;
              scope.showMessage('Light off');
            }
          } else {
            scope.d_light.position.set( 0, 0, 1 );
            scope.d_light.visible = true;
            scope.showMessage('Light from z');
          }
          this.animating = true;
          break;
        default:
          break;
      }
    };

    // Reset
    const reset_btn = new Button( 'reset-view', this.handleEvents, icon( faUndo ).html );
    this.toolbar.appendChild( reset_btn.dom );
    this.buttons['reset_btn'] = reset_btn;

    // if ( options.selector ) {
    //   const selector_btn = new Button( 'toggle-selector', this.handleEvents, icon( farEdit ).html, icon( faEdit ).html );
    //   this.toolbar.appendChild( selector_btn.dom );
    //   selector_btn.controls = options.controls;
    //   this.buttons['selector_btn'] = selector_btn;
    // }

    // Ambient Light
    // const light_btn = new Button( 'toggle-ambient', this.handleEvents, icon( faSun ).html, icon( farSun ).html );
    // this.toolbar.appendChild( light_btn.dom );
    // this.buttons['light_btn'] = light_btn;

    // Directional light
    // const dir_btn = new Button ( 'toggle-dir', this.handleEvents, icon( faCube ).html);
    // this.toolbar.appendChild( dir_btn.dom );
    // this.buttons['dir_btn'] = dir_btn;
  }

  addSelector() {

  }

  showMessage( message ) {
    this.message_inner.innerText = message;
    this.message_dom.classList.remove( 'invisible' );
    this.message_dom.classList.remove( 'opacity-0' );

    const dom = this.message_dom;
    clearTimeout( this.message_timeout );
    this.message_timeout = setTimeout(() => {
      dom.classList.add( 'invisible' );
      dom.classList.add( 'opacity-0' );
    }, 2000);
  }

  addContent( object ) {
    this.objects.push( object );
    this.scene.add( object );
    this.animating = true;
  }

  render() {
    this.scene.add( this.grid );
    this.renderer.setViewport( 0, 0, this.container.offsetWidth, this.container.offsetHeight );
    this.renderer.render( this.scene, this.camera );
    this.scene.remove( this.grid );

    this.label_renderer.render( this.scene, this.camera );

    this.renderer.autoClear = false;
    this.view_axes.render( this.renderer );
    this.renderer.autoClear = true;
  }
}

export {Viewer};
