import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

class CurveGeometry
{
    t_max;
    t;
    geometry;
    data;
    f_data;
    printed;

    constructor(data_)
    {
        this.printed = 0;
        this.t = 0;
        this.data = data_;
        this.t_max = 10;

        // Can change the function f later, write now it is for z^2 transformation
        function f(z)
        {
            let u = z.x ** 2 - z.y ** 2;
            let v = 2* z.x * z.y;
            return new THREE.Vector2(u,v);
        }

        this.f_data = this.data.map((z) => f(z));
        
        this.geometry = new THREE.BufferGeometry();
        this.update_geometry();
    }

    interpolate(z, f_z, t, t_max)
    {
        // Curve goes from 0 to t_max
        let u = (t_max - t) * z.x + t * f_z.x;
        let v = (t_max - t) * z.y + t * f_z.y;
        
        u /= t_max;
        v /= t_max;
        return new THREE.Vector2(u, v);
    }
        
    update_geometry()
    {
        const spline_points = this.data.map((z, index) => 
            this.interpolate(z, this.f_data[index], this.t, this.t_max));
            
        const spline_curve = new THREE.SplineCurve(spline_points);
        this.geometry = new THREE.BufferGeometry().setFromPoints(spline_curve.getPoints(50));
    }

    set_time(new_time)
    {
        this.t = Math.max(0, new_time);
        this.t = Math.min(this.t, this.t_max);
        this.update_geometry();
    }
            
    update(delta)
    {
        if (delta === 0) return;
        if (this.t >= this.t_max) return;
        this.t = this.t + delta;
        this.update_geometry();
    }

    reset()
    {
        this.t = 0;
        this.update_geometry();
    }
};

// Ideas for this widget:

// Can choose animation as circles and squares, change where the shapes are centered.
// Use slider to freeze frames (choose t). A reset button for t.
// Can choose from a preset number of functions.
// Different colours for the lines. For the square, maybe horizontal and vertical lines should be different colours
// since they map differently.
// How to support 1/z or more generally, functions that have poles? hmm.

// An interesting idea is that I can colour vertices based on their position...

// Should also organize this code a little better.

// Initialize scene
const canvas = document.querySelector('#c');
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 10;
const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
renderer.setClearColor( 0x001010, 0.7  );

const scene = new THREE.Scene();

// GUI
const gui = new GUI();

function make_curves()
{
    let data = [-3, -2, -1, 0, 1, 2, 3];
    let geometries = [
        new CurveGeometry(data.map((x) => new THREE.Vector2(-2, x))),
        new CurveGeometry(data.map((x) => new THREE.Vector2(-1, x))),
        new CurveGeometry(data.map((x) => new THREE.Vector2(0, x))),
        new CurveGeometry(data.map((x) => new THREE.Vector2(1, x))),
        new CurveGeometry(data.map((x) => new THREE.Vector2(2, x))),
        new CurveGeometry(data.map((x) => new THREE.Vector2(x, -2))),
        new CurveGeometry(data.map((x) => new THREE.Vector2(x, -1))),
        new CurveGeometry(data.map((x) => new THREE.Vector2(x, 0))),
        new CurveGeometry(data.map((x) => new THREE.Vector2(x, 1))),
        new CurveGeometry(data.map((x) => new THREE.Vector2(x, 2)))
    ]

    const vertical_mat = new THREE.LineBasicMaterial({color: 0x00ff00 });
    const horizontal_mat = new THREE.LineBasicMaterial({color: 0xff0000 });
}

function main() {
        
    let data = [-3, -2, -1, 0, 1, 2, 3];
        
    let geometries = [
        new CurveGeometry(data.map((x) => new THREE.Vector2(-2, x))),
        new CurveGeometry(data.map((x) => new THREE.Vector2(-1, x))),
        new CurveGeometry(data.map((x) => new THREE.Vector2(0, x))),
        new CurveGeometry(data.map((x) => new THREE.Vector2(1, x))),
        new CurveGeometry(data.map((x) => new THREE.Vector2(2, x))),
        new CurveGeometry(data.map((x) => new THREE.Vector2(x, -2))),
        new CurveGeometry(data.map((x) => new THREE.Vector2(x, -1))),
        new CurveGeometry(data.map((x) => new THREE.Vector2(x, 0))),
        new CurveGeometry(data.map((x) => new THREE.Vector2(x, 1))),
        new CurveGeometry(data.map((x) => new THREE.Vector2(x, 2)))
    ]

    function reset_curves() { geometries.forEach((c) => c.reset()); }
    let params = { reset: reset_curves }
    gui.add(params, 'reset').name("Reset Animation");

    
    const material = new THREE.LineBasicMaterial({color: 0x00ff00, linewidth: 1 });        

    // New version should produce a new version of curves (Scene objects) and CurveGeometry objects.
    // I want: half a square, full square, and circles of varius radii.
    // Also I want the colour to change based on their position. So users can see which line mapped to where.
    let curves = geometries.map((g) => new THREE.Line(g.geometry, material));

    curves.forEach((curve) => scene.add(curve));
    let last = 0;
    
    function draw(time) {
        
        time *= 0.001;
        const delta = time - last;
        last = time;
        
        // App logic here
        curves.forEach((curve, index) => {
            curve.geometry.dispose();
            geometries[index].update(delta);
            curve.geometry = geometries[index].geometry;
        });        
                
        // On resize
        if (need_resize(renderer)) {
            // Call this 'on_resize' or something?
            renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        // The draw command
        renderer.render(scene, camera);
        requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
}

function need_resize(renderer) {
    const canvas = renderer.domElement;
    return canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight
}

main();
