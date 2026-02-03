const CONFIG = {
    baseURL: 'https://pub-f92ec188234b4317a2692473956f6954.r2.dev/tintal/',
    objFile: 'Mesh.obj',
    mtlFile: 'Mesh.mtl',
    totalSize: 278 * 1024 * 1024,
    initialView: {
        azimuth: 40,
        elevation: 28,
        distanceMultiplier: 1.5
    }
};

const DEFAULTS = {
    rotation: { x: -91, y: 0, z: 53 },
    image: { opacity: 100, saturate: 100, contrast: 100, brightness: 100 }
};

const $ = (id) => document.getElementById(id);

const dom = {
    canvasContainer: $('canvas-container'),
    sidePanel: $('sidePanel'),
    bottomBar: $('bottomBar'),
    infoOverlay: $('infoOverlay'),
    helpHint: $('helpHint'),
    loadingScreen: $('loadingScreen'),
    progressFill: $('progressFill'),
    progressPercent: $('progressPercent'),
    progressSize: $('progressSize'),
    loadingStatus: $('loadingStatus'),
    errorScreen: $('errorScreen'),
    errorMessage: $('errorMessage'),
    vertexCount: $('vertexCount'),
    faceCount: $('faceCount'),
    textureCount: $('textureCount'),
    gridInfo: $('gridInfo'),
    cameraInfo: $('cameraInfo'),
    panelToggleBtn: $('panelToggleBtn'),
    panelCloseBtn: $('panelCloseBtn'),
    texturedBtn: $('texturedBtn'),
    wireBtn: $('wireBtn'),
    solidBtn: $('solidBtn'),
    fitViewBtn: $('fitViewBtn'),
    topViewBtn: $('topViewBtn'),
    frontViewBtn: $('frontViewBtn'),
    gridBtn: $('gridBtn'),
    rotX: $('rotX'),
    rotY: $('rotY'),
    rotZ: $('rotZ'),
    rotXVal: $('rotXVal'),
    rotYVal: $('rotYVal'),
    rotZVal: $('rotZVal'),
    resetTransformBtn: $('resetTransformBtn'),
    opacityRange: $('opacityRange'),
    saturateRange: $('saturateRange'),
    contrastRange: $('contrastRange'),
    brightnessRange: $('brightnessRange'),
    opacityVal: $('opacityVal'),
    saturateVal: $('saturateVal'),
    contrastVal: $('contrastVal'),
    brightnessVal: $('brightnessVal'),
    resetImageBtn: $('resetImageBtn'),
    exposureRange: $('exposureRange'),
    ambientRange: $('ambientRange'),
    dirRange: $('dirRange'),
    unlitToggle: $('unlitToggle'),
    exposureVal: $('exposureVal'),
    ambientVal: $('ambientVal'),
    dirVal: $('dirVal')
};

const state = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    currentModel: null,
    gridHelper: null,
    showGrid: true,
    modelRadius: 1,
    originalMaterials: new Map()
};

const visualizationButtons = [dom.texturedBtn, dom.wireBtn, dom.solidBtn].filter(Boolean);

function init() {
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x0b0f14);

    state.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 50000);
    state.camera.position.set(100, 100, 100);

    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    state.renderer.outputEncoding = THREE.sRGBEncoding;
    state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    state.renderer.toneMappingExposure = 0.4;
    dom.canvasContainer.appendChild(state.renderer.domElement);

    state.controls = new THREE.OrbitControls(state.camera, state.renderer.domElement);
    state.controls.enableDamping = true;
    state.controls.dampingFactor = 0.08;
    state.controls.minDistance = 1;
    state.controls.maxDistance = 10000;
    state.controls.zoomSpeed = 1.5;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    ambientLight.name = 'ambient';
    state.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    hemiLight.name = 'hemi';
    state.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.name = 'directional';
    dirLight.position.set(100, 200, 100);
    state.scene.add(dirLight);

    if (dom.sidePanel) dom.sidePanel.classList.add('collapsed');
    if (dom.panelToggleBtn) dom.panelToggleBtn.setAttribute('aria-pressed', 'false');
    bindUI();
    window.addEventListener('resize', onResize);
    animate();
    loadModel();
}

function bindUI() {
    if (dom.panelToggleBtn && dom.sidePanel) {
        dom.panelToggleBtn.addEventListener('click', () => togglePanel());
    }
    if (dom.panelCloseBtn && dom.sidePanel) {
        dom.panelCloseBtn.addEventListener('click', () => togglePanel(true));
    }

    if (dom.texturedBtn) dom.texturedBtn.addEventListener('click', () => setVisualizationMode('textured'));
    if (dom.wireBtn) dom.wireBtn.addEventListener('click', () => setVisualizationMode('wireframe'));
    if (dom.solidBtn) dom.solidBtn.addEventListener('click', () => setVisualizationMode('solid'));
    if (dom.fitViewBtn) dom.fitViewBtn.addEventListener('click', fitCameraToModel);
    if (dom.topViewBtn) dom.topViewBtn.addEventListener('click', setTopView);
    if (dom.frontViewBtn) dom.frontViewBtn.addEventListener('click', setFrontView);
    if (dom.gridBtn) dom.gridBtn.addEventListener('click', toggleGrid);

    if (dom.rotX) dom.rotX.addEventListener('input', updateRotation);
    if (dom.rotY) dom.rotY.addEventListener('input', updateRotation);
    if (dom.rotZ) dom.rotZ.addEventListener('input', updateRotation);
    if (dom.resetTransformBtn) dom.resetTransformBtn.addEventListener('click', resetTransform);

    if (dom.opacityRange) dom.opacityRange.addEventListener('input', updateImageSettings);
    if (dom.saturateRange) dom.saturateRange.addEventListener('input', updateImageSettings);
    if (dom.contrastRange) dom.contrastRange.addEventListener('input', updateImageSettings);
    if (dom.brightnessRange) dom.brightnessRange.addEventListener('input', updateImageSettings);
    if (dom.resetImageBtn) dom.resetImageBtn.addEventListener('click', resetImageSettings);

    if (dom.exposureRange) dom.exposureRange.addEventListener('input', updateLighting);
    if (dom.ambientRange) dom.ambientRange.addEventListener('input', updateLighting);
    if (dom.dirRange) dom.dirRange.addEventListener('input', updateLighting);
    if (dom.unlitToggle) dom.unlitToggle.addEventListener('change', updateLighting);

    document.addEventListener('keydown', (event) => {
        if (!state.currentModel) return;
        switch (event.key.toLowerCase()) {
            case 'f':
                fitCameraToModel();
                break;
            case 't':
                setTopView();
                break;
            case 'y':
                setFrontView();
                break;
            case 'g':
                toggleGrid();
                break;
            case '1':
                setVisualizationMode('textured');
                break;
            case '2':
                setVisualizationMode('wireframe');
                break;
            case '3':
                setVisualizationMode('solid');
                break;
            default:
                break;
        }
    });

    updateRotationLabels();
    updateImageSettings();
}

function togglePanel(forceCollapse) {
    if (!dom.sidePanel) return;
    const shouldCollapse =
        typeof forceCollapse === 'boolean' ? forceCollapse : !dom.sidePanel.classList.contains('collapsed');
    dom.sidePanel.classList.toggle('collapsed', shouldCollapse);
    if (dom.panelToggleBtn) {
        dom.panelToggleBtn.setAttribute('aria-pressed', String(!shouldCollapse));
    }
}

function onResize() {
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    state.controls.update();
    updateCameraInfo();
    state.renderer.render(state.scene, state.camera);
}

function updateCameraInfo() {
    const dist = state.camera.position.distanceTo(state.controls.target);
    if (dom.cameraInfo) dom.cameraInfo.textContent = `CAM: ${dist.toFixed(1)}`;
}

function updateProgress(loaded, total, status) {
    const percent = Math.round((loaded / total) * 100);
    if (dom.progressFill) dom.progressFill.style.width = `${percent}%`;
    if (dom.progressPercent) dom.progressPercent.textContent = `${percent}%`;
    if (dom.progressSize) {
        dom.progressSize.textContent = `${(loaded / 1024 / 1024).toFixed(1)} / ${(total / 1024 / 1024).toFixed(0)} MB`;
    }
    if (status && dom.loadingStatus) dom.loadingStatus.textContent = status;
}

function showError(message) {
    if (dom.errorMessage) dom.errorMessage.textContent = message;
    if (dom.errorScreen) dom.errorScreen.classList.add('visible');
    if (dom.loadingScreen) dom.loadingScreen.classList.add('hidden');
}

async function loadModel() {
    try {
        updateProgress(0, CONFIG.totalSize, 'Cargando materiales...');

        const mtlLoader = new THREE.MTLLoader();
        mtlLoader.setPath(CONFIG.baseURL);

        const materials = await new Promise((resolve, reject) => {
            mtlLoader.load(CONFIG.mtlFile, resolve, undefined, reject);
        });

        materials.preload();
        updateProgress(CONFIG.totalSize * 0.02, CONFIG.totalSize, 'Descargando geometr\u00eda...');

        const objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath(CONFIG.baseURL);

        const object = await new Promise((resolve, reject) => {
            objLoader.load(
                CONFIG.objFile,
                resolve,
                (xhr) => {
                    if (xhr.lengthComputable) {
                        updateProgress(xhr.loaded, xhr.total, 'Descargando geometr\u00eda...');
                    }
                },
                reject
            );
        });

        updateProgress(CONFIG.totalSize, CONFIG.totalSize, 'Procesando modelo...');
        await new Promise((resolve) => setTimeout(resolve, 100));

        state.originalMaterials.clear();
        object.traverse((child) => {
            if (child.isMesh) {
                if (Array.isArray(child.material)) {
                    state.originalMaterials.set(child.uuid, child.material.map((m) => m.clone()));
                    child.material.forEach((m) => {
                        m.side = THREE.DoubleSide;
                    });
                } else {
                    state.originalMaterials.set(child.uuid, child.material.clone());
                    child.material.side = THREE.DoubleSide;
                }
            }
        });

        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        state.modelRadius = size.length() / 2;

        const pivotGroup = new THREE.Group();
        pivotGroup.add(object);
        object.position.set(-center.x, -center.y, -center.z);

        state.scene.add(pivotGroup);
        state.currentModel = pivotGroup;

        const gridSize = Math.max(size.x, size.z) * 1.5;
        state.gridHelper = new THREE.GridHelper(gridSize, 20, 0x00ff88, 0x222225);
        state.gridHelper.position.y = -size.y / 2;
        state.gridHelper.visible = state.showGrid;
        state.scene.add(state.gridHelper);

        state.camera.near = state.modelRadius * 0.001;
        state.camera.far = state.modelRadius * 50;
        state.camera.updateProjectionMatrix();
        state.controls.minDistance = state.modelRadius * 0.01;
        state.controls.maxDistance = state.modelRadius * 10;

        setInitialView();
        updateModelInfo(object);

        if (dom.loadingScreen) dom.loadingScreen.classList.add('hidden');
        if (dom.sidePanel) dom.sidePanel.classList.add('visible');
        if (dom.bottomBar) dom.bottomBar.classList.add('visible');
        if (dom.infoOverlay) dom.infoOverlay.classList.add('visible');
        if (dom.helpHint) dom.helpHint.classList.add('visible');

        updateRotation();
        syncGridUI();
        updateLighting();
        updateImageSettings();
    } catch (error) {
        console.error('Error loading model:', error);
        showError('No se pudo cargar el modelo. Verifica tu conexi\u00f3n a internet.');
    }
}

function updateModelInfo(object) {
    let vertices = 0;
    let faces = 0;
    object.traverse((child) => {
        if (child.isMesh && child.geometry) {
            const geo = child.geometry;
            vertices += geo.attributes.position?.count || 0;
            faces += geo.index ? geo.index.count / 3 : (geo.attributes.position?.count || 0) / 3;
        }
    });

    if (dom.vertexCount) dom.vertexCount.textContent = vertices.toLocaleString();
    if (dom.faceCount) dom.faceCount.textContent = Math.floor(faces).toLocaleString();
}

function setInitialView() {
    if (!state.currentModel) return;

    const box = new THREE.Box3().setFromObject(state.currentModel);
    const size = box.getSize(new THREE.Vector3());
    const radius = size.length() / 2;

    const fov = state.camera.fov * (Math.PI / 180);
    const dist = (radius / Math.sin(fov / 2)) * CONFIG.initialView.distanceMultiplier;
    const azimuth = THREE.MathUtils.degToRad(CONFIG.initialView.azimuth);
    const elevation = THREE.MathUtils.degToRad(CONFIG.initialView.elevation);

    const x = dist * Math.cos(elevation) * Math.sin(azimuth);
    const y = dist * Math.sin(elevation);
    const z = dist * Math.cos(elevation) * Math.cos(azimuth);

    state.camera.position.set(x, y, z);
    state.controls.target.set(0, 0, 0);
    state.controls.update();
}

function fitCameraToModel() {
    if (!state.currentModel) return;

    const box = new THREE.Box3().setFromObject(state.currentModel);
    const size = box.getSize(new THREE.Vector3());
    const radius = size.length() / 2;

    const fov = state.camera.fov * (Math.PI / 180);
    const dist = (radius / Math.sin(fov / 2)) * 1.2;
    const angle = Math.PI / 4;

    state.camera.position.set(dist * Math.sin(angle), dist * 0.4, dist * Math.cos(angle));
    state.controls.target.set(0, 0, 0);
    state.controls.update();
}

function setTopView() {
    if (!state.currentModel) return;
    const box = new THREE.Box3().setFromObject(state.currentModel);
    const size = box.getSize(new THREE.Vector3());
    const dist = Math.max(size.x, size.z) * 1.2;

    state.camera.position.set(0, dist, 0.001);
    state.controls.target.set(0, 0, 0);
    state.controls.update();
}

function setFrontView() {
    if (!state.currentModel) return;
    const box = new THREE.Box3().setFromObject(state.currentModel);
    const size = box.getSize(new THREE.Vector3());
    const dist = Math.max(size.x, size.y) * 1.2;

    state.camera.position.set(0, 0, dist);
    state.controls.target.set(0, 0, 0);
    state.controls.update();
}

function toggleGrid() {
    state.showGrid = !state.showGrid;
    if (state.gridHelper) state.gridHelper.visible = state.showGrid;
    syncGridUI();
}

function syncGridUI() {
    if (dom.gridInfo) dom.gridInfo.textContent = `GRID: ${state.showGrid ? 'ON' : 'OFF'}`;
    if (dom.gridBtn) dom.gridBtn.classList.toggle('active', state.showGrid);
}

function setVisualizationMode(mode) {
    if (!state.currentModel) return;

    visualizationButtons.forEach((btn) => btn.classList.remove('active'));

    state.currentModel.traverse((child) => {
        if (!child.isMesh) return;

        switch (mode) {
            case 'textured': {
                const original = state.originalMaterials.get(child.uuid);
                if (original) {
                    child.material = Array.isArray(original) ? original.map((m) => m.clone()) : original.clone();
                }
                if (dom.texturedBtn) dom.texturedBtn.classList.add('active');
                break;
            }
            case 'wireframe':
                child.material = new THREE.MeshBasicMaterial({ color: 0x00ff88, wireframe: true });
                if (dom.wireBtn) dom.wireBtn.classList.add('active');
                break;
            case 'solid':
                child.material = new THREE.MeshStandardMaterial({
                    color: 0x888888,
                    roughness: 0.6,
                    metalness: 0.1,
                    side: THREE.DoubleSide
                });
                if (dom.solidBtn) dom.solidBtn.classList.add('active');
                break;
            default:
                break;
        }
    });
}

function updateRotationLabels() {
    if (dom.rotXVal) dom.rotXVal.textContent = `${dom.rotX.value}\u00b0`;
    if (dom.rotYVal) dom.rotYVal.textContent = `${dom.rotY.value}\u00b0`;
    if (dom.rotZVal) dom.rotZVal.textContent = `${dom.rotZ.value}\u00b0`;
}

function updateRotation() {
    updateRotationLabels();
    if (!state.currentModel) return;

    state.currentModel.rotation.x = THREE.MathUtils.degToRad(parseFloat(dom.rotX.value));
    state.currentModel.rotation.y = THREE.MathUtils.degToRad(parseFloat(dom.rotY.value));
    state.currentModel.rotation.z = THREE.MathUtils.degToRad(parseFloat(dom.rotZ.value));
}

function resetTransform() {
    dom.rotX.value = DEFAULTS.rotation.x;
    dom.rotY.value = DEFAULTS.rotation.y;
    dom.rotZ.value = DEFAULTS.rotation.z;
    updateRotation();
}

function updateImageSettings() {
    const s = dom.saturateRange.value;
    const c = dom.contrastRange.value;
    const b = dom.brightnessRange.value;

    dom.canvasContainer.style.filter = `saturate(${s}%) contrast(${c}%) brightness(${b}%)`;

    if (dom.saturateVal) dom.saturateVal.textContent = `${s}%`;
    if (dom.contrastVal) dom.contrastVal.textContent = `${c}%`;
    if (dom.brightnessVal) dom.brightnessVal.textContent = `${b}%`;

    const o = dom.opacityRange.value / 100;
    if (dom.opacityVal) dom.opacityVal.textContent = `${dom.opacityRange.value}%`;

    if (!state.currentModel) return;

    state.currentModel.traverse((child) => {
        if (child.isMesh) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat) => {
                mat.transparent = o < 1.0;
                mat.opacity = o;
                mat.depthWrite = o > 0.5;
            });
        }
    });
}

function resetImageSettings() {
    dom.opacityRange.value = DEFAULTS.image.opacity;
    dom.saturateRange.value = DEFAULTS.image.saturate;
    dom.contrastRange.value = DEFAULTS.image.contrast;
    dom.brightnessRange.value = DEFAULTS.image.brightness;
    updateImageSettings();
}

function updateLighting() {
    const exp = dom.exposureRange.value / 100;
    const amb = dom.ambientRange.value / 100;
    const dir = dom.dirRange.value / 100;
    const isUnlit = dom.unlitToggle.checked;

    if (dom.exposureVal) dom.exposureVal.textContent = exp.toFixed(1);
    if (dom.ambientVal) dom.ambientVal.textContent = amb.toFixed(1);
    if (dom.dirVal) dom.dirVal.textContent = dir.toFixed(1);

    state.renderer.toneMappingExposure = exp;

    state.scene.traverse((child) => {
        if (child.isAmbientLight && child.name === 'ambient') child.intensity = amb;
        if (child.isDirectionalLight && child.name === 'directional') child.intensity = dir;
    });

    if (!state.currentModel) return;

    state.currentModel.traverse((child) => {
        if (!child.isMesh) return;
        const originalMats = state.originalMaterials.get(child.uuid);
        if (!originalMats) return;

        const updateMaterial = (currentMat, originalMat) => {
            if (isUnlit) {
                if (currentMat.type !== 'MeshBasicMaterial') {
                    return new THREE.MeshBasicMaterial({
                        map: originalMat.map || null,
                        color: 0xffffff,
                        side: originalMat.side,
                        transparent: originalMat.transparent || false,
                        opacity: typeof originalMat.opacity === 'number' ? originalMat.opacity : 1
                    });
                }
                return currentMat;
            }

            if (currentMat.type === 'MeshBasicMaterial') {
                return originalMat.clone();
            }
            return currentMat;
        };

        if (Array.isArray(child.material) && Array.isArray(originalMats)) {
            child.material = child.material.map((m, i) => updateMaterial(m, originalMats[i]));
        } else if (!Array.isArray(child.material) && !Array.isArray(originalMats)) {
            child.material = updateMaterial(child.material, originalMats);
        }
    });

    updateImageSettings();
}

init();
