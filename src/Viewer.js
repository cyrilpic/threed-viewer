import {AlwaysDepth, AmbientLight, Clock, DirectionalLight, GridHelper, Group,
  MathUtils, OrthographicCamera, Scene, sRGBEncoding, Vector3,
  WebGLRenderer} from 'three';

import {icon} from '@fortawesome/fontawesome-svg-core';
import {faUndo} from '@fortawesome/free-solid-svg-icons';

import {ArcballControls} from 'three/examples/jsm/controls/ArcballControls.js';
import {CSS2DRenderer} from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import {AxisHelper} from './AxisHelper.js';
import {Button} from './Button.js';

const perspectiveDistance = 25;

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
      camera_position: new Vector3( 1, 1, 1 ),
      camera_zoom: 1,
      camera_up: new Vector3( 0, 1, 0 ),
      toolbar: true,
      help: true,
    };
    if ( selectedOptions !== null ) {
      Object.assign( options, selectedOptions );
    }

    // Create scene
    this.scene = new Scene();

    // Create camera
    const opos = this.getOthographicPosition();
    this.camera = new OrthographicCamera( opos[0], opos[1], opos[2], opos[3], -2000, 2000 );
    this.camera.position.copy( options.camera_position );
    this.camera.position.multiplyScalar( perspectiveDistance );
    this.camera.zoom = options.camera_zoom;
    this.camera.up.copy( options.camera_up );
    this.camera.updateProjectionMatrix();
    this.scene.add( this.camera );

    //
    this.a_light = new AmbientLight( 0x404040, 0.3 );
    this.scene.add( this.a_light );
    // Directional light attached to camera
    this.d_light = new DirectionalLight( 0xffffff, 0.6, {castShadow: true} );
    this.camera.add( this.d_light );

    //
    this.renderer = new WebGLRenderer( {antialias: true} );
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.outputEncoding = sRGBEncoding;
    this.renderer.setSize( container.clientWidth, container.clientHeight );
    this.renderer.setClearColor( 0xcccccc );

    container.appendChild( this.renderer.domElement );

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize( container.clientWidth, container.clientHeight );
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0px';
    container.appendChild( this.labelRenderer.domElement );

    window.addEventListener( 'resize', (e) => {
      scope.resize();
    } );

    // Controls
    this.controls = new ArcballControls( this.camera, this.labelRenderer.domElement, this.scene );
    this.controls.enabled = options.controls;
    this.controls.setGizmosVisible( false );

    // Helpers
    this.grid = new Group();

    const grid1 = new GridHelper( 30, 30, 0x888888 );
    grid1.material.color.setHex( 0x888888 );
    grid1.material.vertexColors = false;
    this.grid.add( grid1 );

    const grid2 = new GridHelper( 30, 6, 0x222222 );
    grid2.material.color.setHex( 0x222222 );
    grid2.material.depthFunc = AlwaysDepth;
    grid2.material.vertexColors = false;
    this.grid.add( grid2 );

    this.grid.visible = options.grid;

    this.view_axes = new AxisHelper( this.camera, container );
    this.view_axes.controls = this.controls;
    this.view_axes.visible = options.axis_helper;
    //
    this.clock = new Clock();

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
  }

  getOthographicPosition() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    const halfFovV = MathUtils.DEG2RAD * 45 * 0.5;
    const halfFovH = Math.atan( ( aspect ) * Math.tan( halfFovV ) );
    const halfW = perspectiveDistance * Math.tan( halfFovH );
    const halfH = perspectiveDistance * Math.tan( halfFovV );
    return [- halfW, halfW, halfH, - halfH];
  }

  resize() {
    const opos = this.getOthographicPosition();
    this.camera.left = opos[0];
    this.camera.right = opos[1];
    this.camera.top = opos[2];
    this.camera.bottom = opos[3];
    this.camera.updateProjectionMatrix();

    this.renderer.setSize( this.container.clientWidth,
        this.container.clientHeight );
    this.labelRenderer.setSize( this.container.clientWidth,
        this.container.clientHeight );

    this.animating = true;
  }

  buildToolbar( options ) {
    this.toolbar = document.createElement( 'nav' );
    this.toolbar.setAttribute( 'id', 'toolbar' );
    this.container.appendChild( this.toolbar );

    this.buttons = {};

    const scope = this;

    this.handleEvents = (name, e) => {
      switch (name) {
        case 'reset-view':
          scope.controls.reset();
          scope.showMessage( 'Reset view' );
          break;
        default:
          break;
      }
    };

    // Reset
    const reset_btn = new Button( 'reset-view', this.handleEvents, icon( faUndo ).html );
    this.toolbar.appendChild( reset_btn.dom );
    this.buttons['reset_btn'] = reset_btn;
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
    this.scene.add( object );
    this.animating = true;
  }

  render() {
    this.scene.add( this.grid );
    this.renderer.setViewport( 0, 0, this.container.offsetWidth, this.container.offsetHeight );
    this.renderer.render( this.scene, this.camera );
    this.scene.remove( this.grid );

    this.labelRenderer.render( this.scene, this.camera );

    this.renderer.autoClear = false;
    this.view_axes.render( this.renderer );
    this.renderer.autoClear = true;
  }
}

export {Viewer};
