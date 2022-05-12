# threed-viewer

Threed-viewer is a custom configuration of a [three.js](https://threejs.org) that uses HTML custom elements (v1) to ease the creation of scenes. It follows some ideas from [modelviewer](http://modelviewer.dev), but has a focus on rendering parts for a mechanical engineering CAD-alike context (for example with the use of an orthographic camera).

Getting started is straightforward:

```html
<threed-viewer controls axis-helper help>
    <threed-model src="docs/models/Form.stl" center scale></threed-model>
</threed-viewer>

...

<script type="javascript" src="threed-viewer.min.js">
```

## Custom elements

There are 3 custom elements: `<threed-viewer>`, `<threed-model>` and `<threed-annotation>`. Currently, they need to be children of each other (viewer > model > annotation). There can be several independent viewers per page, several models per viewer and several annotations per model.

Models and annotations can be added and removed dynamically by manipulating the DOM.

In the following, the attributes of each element are described. When attributes are marked as "observed", it means that changing their value will dynamically adapt the viewer. Other attributes need to be set before the javascript library is loaded.

### Viewer

These are the available attributes for the viewer:

| Attribute     | Observed | Type             | Description |
|---------------|:--------:|------------------|-------------|
| width, height | x        | pixel or percent | width and height of the rendering zone |
| camera-zoom | x | float | Value to set for the default camera zoom (default: 1) |
| grid | x | true if present | Show a grid centered at the origin |
| controls | | true if present | Allow the view to be controlled by the user |
| axis-helper | x | true if present | Show the reference coordinate system in the lower right corner |
| help | x | true if present | Show a usage guide for the controls at the bottom of the viewer |
| toolbar | | true if present | Show the toolbar |
| wireframe | x | true if present | Display the wireframe model on top of the actual model |

### Model

These are the available attributes for the model:

| Attribute     | Observed | Type             | Description |
|---------------|:--------:|------------------|-------------|
| src |          | URL | URL to the model (.stl, .gltf, .glb) |
| scale | | true if present / "true" / float | If true apply automatic scaling rule to have to model fit the view. If a value is provided, it is used as the scaling factor. |
| center | | true if present | Center the model at `(0,0,0)` |
| face-color | x | Color hex string | Color to apply to the faces (only for STL model, default: <span style="color:#9dc2cf">#9dc2cf</span>) |
| edge-color | x | Color hex string | Color to apply to the wireframe model (default: <span style="color:#ff0000">#ff0000</span>) |
| wireframe-angle | | integer | Angle threshold between faces above which the edge is included in the wireframe model (default: 5) |

The model is loaded the first time it is added to the DOM. To load compressed GLB models, the path to the KTX2 and/or DRACO libraries (see Three.js) must be configured manually.

```javascript
import {loader} from 'threed-viewer';
loader.loaders.ktx2.setTranscoderPath( './libs/basis/' );
loader.loaders.draco.setDecoderPath( './libs/draco/' );
```

### Annotation

These are the available attributes for annotations:

| Attribute     | Observed | Type             | Description |
|---------------|:--------:|------------------|-------------|
| kind |          | sphere, cylinder, label | Kind of annotation |
| position | | Position string | Position to show the annotation |
| color | x | Color hex string | Color of the annotation |
| text | x | string | String to display for label annotations |

The position can be absolute (`absolute=10,3,-9`) or be related to a vertex (`vertex=10`) of the model (not possible when a multi-object scene is loaded with GLTF or GLB). For cylinder annotation, the start and stop positions must be provided. Multiple positions are separated by a semicolon `;`.
