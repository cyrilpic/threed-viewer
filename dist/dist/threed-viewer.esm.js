import { Object3D, Color, Raycaster, Vector2, OrthographicCamera, BoxBufferGeometry as BoxGeometry, Mesh, MeshBasicMaterial, Sprite, SpriteMaterial, Vector3, Quaternion, LoadingManager, LineBasicMaterial, MeshPhysicalMaterial, CanvasTexture, Euler, MeshStandardMaterial, SphereBufferGeometry as SphereGeometry, CylinderBufferGeometry as CylinderGeometry, Group, LineSegments, EdgesGeometry, Matrix4, Box3, Scene, AmbientLight, DirectionalLight, WebGLRenderer, sRGBEncoding, GridHelper, AlwaysDepth, Clock, Math as MathUtils } from '../node_modules/three/build/three.module.js';
import * as three_module from '../node_modules/three/build/three.module.js';
export { three_module as THREE };
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { STLLoader } from '../node_modules/three/examples/jsm/loaders/STLLoader.js';
import { KTX2Loader } from '../node_modules/three/examples/jsm/loaders/KTX2Loader.js';
import { DRACOLoader } from '../node_modules/three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from '../node_modules/three/examples/jsm/libs/meshopt_decoder.module.js';
import { icon } from '../node_modules/@fortawesome/fontawesome-svg-core/index.es.js';
import { faUndo } from '../node_modules/@fortawesome/free-solid-svg-icons/index.es.js';
import { faSquare } from '../node_modules/@fortawesome/free-regular-svg-icons/index.es.js';
import { ArcballControls } from '../node_modules/three/examples/jsm/controls/ArcballControls.js';
import { CSS2DObject, CSS2DRenderer } from '../node_modules/three/examples/jsm/renderers/CSS2DRenderer.js';

function _countMeshes( group ) {
  let count = 0;
  group.traverse( (el) => {
    if ( el.type === 'Mesh' ) {
      count += 1;
    }
  } );
  return count;
}

class Loader {
  constructor() {
    this.manager = new LoadingManager();
    this.loaders = {
      stl: new STLLoader( this.manager ),
      gltf: new GLTFLoader( this.manager ),
      ktx2: new KTX2Loader( this.manager ),
      draco: new DRACOLoader( this.manager ),
    };
    this.loaders.gltf.setMeshoptDecoder( MeshoptDecoder );
    this.loaders.gltf.setKTX2Loader( this.loaders.ktx2 );
    this.loaders.gltf.setDRACOLoader( this.loaders.draco );
  }

  load( options, onLoad ) {
    const wireM = new LineBasicMaterial( {
      color: options.edgeColor || options.constructor.defaultEdgeColor,
      linewidth: 1} );

    const process = ( geom, mesh ) => {
      // Scale down to match view
      const size = new Vector3();
      let model;

      if ( geom !== null ) {
        // Mesh
        model = new Group();
        model.add( mesh );

        if ( options.center ) {
          geom.center();
        }

        if ( options.scale === true ) {
          if ( geom.boundingBox === null ) {
            geom.computeBoundingBox();
          }
          geom.boundingBox.getSize(size);
          const l = Math.max(size.x, size.y, size.z);
          geom.scale( 12/l, 12/l, 12/l );
        } else if ( options.scale !== false ) {
          geom.scale( options.scale, options.scale, options.scale );
        }

        const edges = new LineSegments(
            new EdgesGeometry( geom, options.wireframeAngle ), wireM );
        edges.name = 'edges';
        model.add( edges );
      } else {
        // Scene
        model = mesh;
        if ( options.center || options.scale !== false ) {
          const m1 = new Matrix4();
          const boundingBox = new Box3();
          boundingBox.expandByObject( mesh );

          if ( options.scale === true ) {
            boundingBox.getSize(size);
            const l = Math.max(size.x, size.y, size.z);
            m1.makeScale( 12/l, 12/l, 12/l );
            mesh.applyMatrix4( m1 );
            boundingBox.applyMatrix4( m1 );
          } else if ( options.scale !== false ) {
            m1.makeScale( options.scale, options.scale, options.scale );
            mesh.applyMatrix4( m1 );
            boundingBox.applyMatrix4( m1 );
          }

          if ( options.center ) {
            boundingBox.getCenter( size ).negate();
            m1.makeTranslation( size.x, size.y, size.z );
            mesh.applyMatrix4( m1 );
            // boundingBox.applyMatrix4( m1 );
          }
        }

        mesh.traverse( (el) => {
          if ( el.type === 'Mesh' ) {
            const edges = new LineSegments(
                new EdgesGeometry( el.geometry, options.wireframeAngle ), wireM );
            edges.name = 'edges';
            el.parent.add( edges );
          }
        } );
      }

      onLoad( geom, model );
    };

    if ( options.src.endsWith( '.stl' ) ) {
      const facesM = new MeshPhysicalMaterial( {
        color: options.faceColor || options.constructor.defaultFaceColor,
        clearcoat: 0.5, clearcoatRoughness: 0.5} );

      this.loaders.stl.load( options.src, (geom) => {
        if ( geom.hasColors ) {
          facesM.opacity = geom.alpha;
          facesM.vertexColors = true;
        }
        const mesh = new Mesh( geom, facesM );
        mesh.name = 'main-mesh';
        process( geom, mesh );
      } );
    } else if ( options.src.endsWith( '.gltf' ) ||
        options.src.endsWith( '.glb' ) ) {
      this.loaders.gltf.load( options.src, (gltf) => {
        const count = _countMeshes(gltf.scene);
        if ( count == 1 ) {
          const mesh = gltf.scene.getObjectByProperty( 'type', 'Mesh' );
          mesh.name = 'main-mesh';
          process( mesh.geometry, mesh );
        } else if ( count > 1 ) {
          gltf.scene.name = 'main-mesh';
          // Add wireframe?
          process( null, gltf.scene );
        } else {
          console.error( 'No mesh found in scene' );
        }
      } );
    } else {
      console.error( 'Model must be STL or GLTB' );
    }
  }
}

// function loadGLTF( options, onLoad ) {
//   _gltfLoader.load( options.src, ( gltf ) => {
//     const scene = gltf.scene;
//     const boundingBox = new Box3();
//     const center = new Vector3(0, 0, 0);
//     const scale = new Vector3(1, 1, 1);
//     const rot = new Quaternion();
//     const trans = new Matrix4();
//     boundingBox.expandByObject( scene );

//     if ( options.center ) {
//       boundingBox.getCenter( center ).negate();
//     }

//     if ( options.scale === true ) {
//       boundingBox.getSize(scale);
//       const l = Math.max(scale.x, scale.y, scale.z);
//       scale.set(10/l, 10/l, 10/l);
//     } else if ( options.scale !== false ) {
//       scale.set( options.scale, options.scale, options.scale );
//     }

//     trans.compose( center, rot, scale );
//     scene.applyMatrix4(trans);

//     onLoad( scene );
//   } );
// }

const loader = new Loader();

/**
 * Helper class adding a 3D-axis visualizer in the bottom left corner.
 * @export
 */
class AxisHelper extends Object3D {
  /**
   * @param {!Camera} editorCamera camera object from the main viewer.
   * @param {!HTMLElement} container DOM element to add the axis.
   */
  constructor( editorCamera, container ) {
    super();

    this.animating = false;
    this.controls = null;

    const panel = document.createElement( 'div' );
    panel.setAttribute( 'id', 'axisHelper' );
    panel.setAttribute( 'style', 'position: absolute; right: 0px; bottom: 0px; height: 128px; width: 128px' );

    const scope = this;

    panel.addEventListener( 'pointerup', ( event ) => {
      event.stopPropagation();

      scope.handleClick( event );
    } );

    panel.addEventListener( 'pointerdown', ( event ) => {
      event.stopPropagation();
    } );

    panel.addEventListener( 'pointermove', ( event ) => {
      scope.handleMove( event );
    } );

    container.appendChild( panel );

    const color1 = new Color( '#ff3653' );
    const color2 = new Color( '#8adb00' );
    const color3 = new Color( '#2c8fff' );

    const interactiveObjects = [];
    const raycaster = new Raycaster();
    const mouse = new Vector2();
    const dummy = new Object3D();

    const camera = new OrthographicCamera( - 2, 2, 2, - 2, 0, 4 );
    camera.position.set( 0, 0, 2 );

    const geometry = new BoxGeometry( 0.8, 0.05, 0.05 ).translate( 0.4, 0, 0 );

    const getAxisMaterial = ( color ) => new MeshBasicMaterial( {color: color, toneMapped: false} );

    const xAxis = new Mesh( geometry, getAxisMaterial( color1 ) );
    const yAxis = new Mesh( geometry, getAxisMaterial( color2 ) );
    const zAxis = new Mesh( geometry, getAxisMaterial( color3 ) );

    yAxis.rotation.z = Math.PI / 2;
    zAxis.rotation.y = - Math.PI / 2;

    this.add( xAxis );
    this.add( zAxis );
    this.add( yAxis );

    const getSpriteMaterial = ( color, text = null ) => {
      const canvas = document.createElement( 'canvas' );
      canvas.width = 64;
      canvas.height = 64;

      const context = canvas.getContext( '2d' );
      context.beginPath();
      context.arc( 32, 32, 16, 0, 2 * Math.PI );
      context.closePath();
      context.fillStyle = color.getStyle();
      context.fill();

      if ( text !== null ) {
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.fillStyle = '#000000';
        context.fillText( text, 32, 41 );
      }

      const texture = new CanvasTexture( canvas );

      return new SpriteMaterial( {map: texture, toneMapped: false} );
    };

    const posXAxisHelper = new Sprite( getSpriteMaterial( color1, 'X' ) );
    posXAxisHelper.userData.type = 'posX';
    const posYAxisHelper = new Sprite( getSpriteMaterial( color2, 'Y' ) );
    posYAxisHelper.userData.type = 'posY';
    const posZAxisHelper = new Sprite( getSpriteMaterial( color3, 'Z' ) );
    posZAxisHelper.userData.type = 'posZ';
    const negXAxisHelper = new Sprite( getSpriteMaterial( color1 ) );
    negXAxisHelper.userData.type = 'negX';
    const negYAxisHelper = new Sprite( getSpriteMaterial( color2 ) );
    negYAxisHelper.userData.type = 'negY';
    const negZAxisHelper = new Sprite( getSpriteMaterial( color3 ) );
    negZAxisHelper.userData.type = 'negZ';

    posXAxisHelper.position.x = 1;
    posYAxisHelper.position.y = 1;
    posZAxisHelper.position.z = 1;
    negXAxisHelper.position.x = - 1;
    negXAxisHelper.scale.setScalar( 0.8 );
    negYAxisHelper.position.y = - 1;
    negYAxisHelper.scale.setScalar( 0.8 );
    negZAxisHelper.position.z = - 1;
    negZAxisHelper.scale.setScalar( 0.8 );

    this.add( posXAxisHelper );
    this.add( posYAxisHelper );
    this.add( posZAxisHelper );
    this.add( negXAxisHelper );
    this.add( negYAxisHelper );
    this.add( negZAxisHelper );

    interactiveObjects.push( posXAxisHelper );
    interactiveObjects.push( posYAxisHelper );
    interactiveObjects.push( posZAxisHelper );
    interactiveObjects.push( negXAxisHelper );
    interactiveObjects.push( negYAxisHelper );
    interactiveObjects.push( negZAxisHelper );

    const point = new Vector3();
    const dim = 128;
    const turnRate = 2 * Math.PI; // turn rate in angles per second

    this.render = ( renderer ) => {
      this.quaternion.copy( editorCamera.quaternion ).invert();
      this.updateMatrixWorld();

      point.set( 0, 0, 1 );
      point.applyQuaternion( editorCamera.quaternion );

      if ( point.x >= 0 ) {
        posXAxisHelper.material.opacity = 1;
        negXAxisHelper.material.opacity = 0.5;
      } else {
        posXAxisHelper.material.opacity = 0.5;
        negXAxisHelper.material.opacity = 1;
      }

      if ( point.y >= 0 ) {
        posYAxisHelper.material.opacity = 1;
        negYAxisHelper.material.opacity = 0.5;
      } else {
        posYAxisHelper.material.opacity = 0.5;
        negYAxisHelper.material.opacity = 1;
      }

      if ( point.z >= 0 ) {
        posZAxisHelper.material.opacity = 1;
        negZAxisHelper.material.opacity = 0.5;
      } else {
        posZAxisHelper.material.opacity = 0.5;
        negZAxisHelper.material.opacity = 1;
      }

      //

      const x = container.offsetWidth - dim;

      renderer.clearDepth();
      renderer.setViewport( x, 0, dim, dim );
      renderer.render( this, camera );
    };

    const targetPosition = new Vector3();
    const targetQuaternion = new Quaternion();
    const targetCameraUp = new Vector3( 0, 1, 0 );

    const q1 = new Quaternion();
    const q2 = new Quaternion();
    let radius = 0;
    const p3 = new Vector3();

    const prepareAnimationData = ( object, focusPoint ) => {
      switch ( object.userData.type ) {
        case 'posX':
          targetPosition.set( 1, 0, 0 );
          targetQuaternion.setFromEuler( new Euler( 0, Math.PI * 0.5, 0 ) );
          break;

        case 'posY':
          targetPosition.set( 0, 1, 0 );
          targetQuaternion.setFromEuler( new Euler( - Math.PI * 0.5, 0, 0 ) );
          break;

        case 'posZ':
          targetPosition.set( 0, 0, 1 );
          targetQuaternion.setFromEuler( new Euler() );
          break;

        case 'negX':
          targetPosition.set( - 1, 0, 0 );
          targetQuaternion.setFromEuler( new Euler( 0, - Math.PI * 0.5, 0 ) );
          break;

        case 'negY':
          targetPosition.set( 0, - 1, 0 );
          targetQuaternion.setFromEuler( new Euler( Math.PI * 0.5, 0, 0 ) );
          break;

        case 'negZ':
          targetPosition.set( 0, 0, - 1 );
          targetQuaternion.setFromEuler( new Euler( 0, Math.PI, 0 ) );
          break;

        default:
          console.error( 'ViewHelper: Invalid axis.' );
      }

      //

      radius = editorCamera.position.distanceTo( focusPoint );
      targetPosition.multiplyScalar( radius ).add( focusPoint );

      dummy.position.copy( focusPoint );

      dummy.lookAt( editorCamera.position );
      q1.copy( dummy.quaternion );

      dummy.lookAt( targetPosition );
      q2.copy( dummy.quaternion );

      p3.copy( targetCameraUp );
      p3.sub( editorCamera.up );
    };

    this.handleClick = ( event ) => {
      if ( this.animating === true ) {
        return false;
      }

      const rect = container.getBoundingClientRect();
      const offsetX = rect.left + ( container.offsetWidth - dim );
      const offsetY = rect.top + ( container.offsetHeight - dim );
      mouse.x = ( ( event.clientX - offsetX ) / ( dim ) ) * 2 - 1;
      mouse.y = - ( ( event.clientY - offsetY ) / ( dim ) ) * 2 + 1;

      raycaster.setFromCamera( mouse, camera );

      const intersects = raycaster.intersectObjects( interactiveObjects );

      if ( intersects.length > 0 ) {
        const intersection = intersects[0];
        const object = intersection.object;

        prepareAnimationData( object, this.controls.target );

        this.animating = true;

        return true;
      }
      return false;
    };

    this.handleMove = ( event ) => {
      const rect = container.getBoundingClientRect();
      const offsetX = rect.left + ( container.offsetWidth - dim );
      const offsetY = rect.top + ( container.offsetHeight - dim );
      mouse.x = ( ( event.clientX - offsetX ) / ( dim ) ) * 2 - 1;
      mouse.y = - ( ( event.clientY - offsetY ) / ( dim ) ) * 2 + 1;

      raycaster.setFromCamera( mouse, camera );

      const intersects = raycaster.intersectObjects( interactiveObjects );

      if ( intersects.length > 0 ) {
        container.style.cursor = 'pointer';
      } else {
        container.style.cursor = null;
      }
    };

    this.update = ( delta ) => {
      const step = delta * turnRate;
      const focusPoint = this.controls.target;

      // animate position by doing a slerp and then scaling the position on the unit sphere

      q1.rotateTowards( q2, step );
      editorCamera.position.set( 0, 0, 1 ).applyQuaternion( q1 ).multiplyScalar( radius ).add( focusPoint );

      // animate orientation

      editorCamera.quaternion.rotateTowards( targetQuaternion, step );

      const d = editorCamera.up.distanceTo( targetCameraUp );
      const stepD = Math.min(1, step / d);
      editorCamera.up.addScaledVector( p3, stepD );
      p3.multiplyScalar( 1 - stepD );

      if ( q1.angleTo( q2 ) === 0 ) {
        this.animating = false;
      }
    };
  }
}

AxisHelper.prototype.isViewHelper = true;

class Button {
  constructor( name, action, icon, iconSelected, description ) {
    this.name = name;
    this.action = action;
    this.icon = icon;
    this.iconSelected = iconSelected;

    this.dom = document.createElement( 'a' );
    this.dom.setAttribute( 'data-action', this.name );
    this.dom.setAttribute( 'href', '#' );
    this.dom.innerHTML = this.icon;
    this.dom.setAttribute( 'title', this.name );
    this.state = false;

    if ( description !== undefined ) {
      this.dom.setAttribute( 'aria-label', description );
      this.dom.setAttribute( 'role', 'tooltip' );
      this.dom.setAttribute( 'data-microtip-position', 'right' );
    }

    const scope = this;
    this.dom.addEventListener( 'click', (e) => {
      scope.toggle();

      scope.action( this.name, e );

      e.stopPropagation();
      e.preventDefault();
    }, false );
  }

  toggle( target ) {
    if ( this.iconSelected !== undefined ) {
      if ( target !== undefined ) {
        this.state = target;
      } else {
        this.state = !this.state;
      }
      if ( this.state === false ) {
        this.dom.innerHTML = this.icon;
      } else {
        this.dom.innerHTML = this.iconSelected;
      }
    }
  }
}

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
      wireframe: true,
    };
    if ( selectedOptions !== null ) {
      Object.assign( options, selectedOptions );
    }

    this.wireframeVisible = options.wireframe;
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

    this.needsResize = false;

    if (typeof window.ResizeObserver !== 'undefined') {
      const obs = new window.ResizeObserver( (entries) => {
        scope.needsResize = true;
      } );
      obs.observe( this.container );
    } else {
      window.addEventListener( 'resize', (e) => {
        scope.needsResize = true;
      } );
    }

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

    this.viewAxes = new AxisHelper( this.camera, container );
    this.viewAxes.controls = this.controls;
    this.viewAxes.visible = options.axis_helper;
    //
    this.clock = new Clock();

    this.animating = false;
    const animate = () => {
      let needsUpdate = scope.animating;

      if ( scope.needsResize ) {
        scope.resize();
        scope.needsResize = false;
        needsUpdate = true;
      }

      const delta = scope.clock.getDelta();

      if ( scope.viewAxes.animating === true ) {
        scope.viewAxes.update(delta);
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
    this.helpDom = document.createElement( 'div' );
    this.helpDom.setAttribute( 'id', 'help' );
    this.helpDom.innerText = 'Scroll to zoom / Drag to rotate / Drag & left-click to pan';
    this.helpDom.style.visibility = ( ( options.help !== false ) && ( options.help !== null ) );
    this.container.appendChild( this.helpDom );

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
        case 'wireframe':
          this.toggleWireframeVisibility();
          scope.showMessage( 'Toggle wireframe visibility' );
          break;
      }
    };

    // Reset
    const resetBtn = new Button( 'reset-view', this.handleEvents, icon( faUndo ).html, undefined, 'Reset view' );
    this.toolbar.appendChild( resetBtn.dom );
    this.buttons['reset_btn'] = resetBtn;

    // View wireframe
    const _selectedSquare = icon( faSquare ).node[0];
    _selectedSquare.classList.add( 'selected' );
    const wirefBtn = new Button( 'wireframe', this.handleEvents, icon( faSquare ).html, _selectedSquare.outerHTML, 'Toggle wireframe' );
    wirefBtn.toggle( this.wireframeVisible );
    this.toolbar.appendChild( wirefBtn.dom );
    this.buttons['wiref_btn'] = wirefBtn;
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
    object.traverse( (el) => {
      if ( el.name == 'edges' ) {
        el.visible = this.wireframeVisible;
      }
    } );
    this.scene.add( object );
    this.animating = true;
  }

  toggleWireframeVisibility( targetValue ) {
    if ( targetValue !== undefined ) {
      this.wireframeVisible = targetValue;
    } else {
      this.wireframeVisible = !this.wireframeVisible;
    }
    this.scene.traverse( (el) => {
      if ( el.name == 'edges' ) {
        el.visible = this.wireframeVisible;
      }
    } );
    this.animating = true;
  }

  render() {
    this.scene.add( this.grid );
    this.renderer.setViewport( 0, 0, this.container.offsetWidth, this.container.offsetHeight );
    this.renderer.render( this.scene, this.camera );
    this.scene.remove( this.grid );

    this.labelRenderer.render( this.scene, this.camera );

    this.renderer.autoClear = false;
    this.viewAxes.render( this.renderer );
    this.renderer.autoClear = true;
  }
}

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
    }
    this.dispatchEvent( new UpdateEvent() );
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
    }
  }
}

customElements.define( 'threed-viewer', ViewerElement );
customElements.define( 'threed-annotation', AnnotationElement );
customElements.define( 'threed-model', ModelElement );

export { Viewer, loader };
