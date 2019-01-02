class Utils {
    constructor(globalVar) {
        /**
         *  Update given grid's state.
         *      @param {Object} globalVar - game global variabel.
         */
        this.globalVar = globalVar;
        this.tileSize = globalVar.tileSize;
        this.gridOffsetX = (globalVar.gridConfig.width / 2);
        this.gridOffsetZ = (globalVar.gridConfig.depth / 2);

        this.sceneToGamegrid = this.sceneToGamegrid.bind(this);
        this.gamegridToScene = this.gamegridToScene.bind(this);
        this.sceneToTile = this.sceneToTile.bind(this);
        this.gamegridToTile = this.gamegridToTile.bind(this);
        this.updateGameGrid = this.updateGameGrid.bind(this);
        this.updateGameGridArea = this.updateGameGridArea.bind(this);
    }
    sceneToGamegrid(position, isMax) {
        /**
         *  Convert dynamic scene position to game grid coordinate.
         *      @param {THREE.Vector3 like} position - dynamic scene position.
         *      @param {boolen} isMax - set to true to convert position to max point.
         */
        let p = {
            x: Math.floor(position.x + this.gridOffsetX),
            y: position.y,
            z: Math.floor(position.z + this.gridOffsetZ)
        }
        if (isMax === true) {
            if (position.x + this.gridOffsetX === p.x) p.x -= 1;
            if (position.z + this.gridOffsetZ === p.z) p.z -= 1;
        }

        return p;
    }
    gamegridToScene(coordinate) {
        /**
         *  Convert game grid coordinate to dynamic scene position.
         *      @param {THREE.Vector3 like} coordinate - game grid coordinate.
         */
        return {
            x: coordinate.x + 0.5 - this.gridOffsetX,
            y: coordinate.y,
            z: coordinate.z + 0.5 - this.gridOffsetZ
        }
    }
    sceneToTile(position, isMax) {
        /**
         *  Convert dynamic scene position to game tile coordinate.
         *      @param {THREE.Vector3 like} position - dynamic scene position.
         *      @param {boolen} isMax - set to true to convert position to max point.
         */
        let p = {
            x: Math.floor((position.x + this.gridOffsetX) / this.tileSize),
            y: position.y,
            z: Math.floor((position.z + this.gridOffsetZ) / this.tileSize)
        }
        if (isMax === true) {
            if ((position.x + this.gridOffsetX) % this.tileSize === 0) p.x -= 1;
            if ((position.z + this.gridOffsetZ) % this.tileSize === 0) p.z -= 1;
        }

        return p;
    }
    gamegridToTile(coordinate) {
        /**
         *  Convert game grid coordinate to tile coordinate.
         *      @param {THREE.Vector3 like} coordinate - game grid coordinate.
         */
        return {
            x: Math.floor(coordinate.x / this.tileSize),
            y: coordinate.y,
            z: Math.floor(coordinate.z / this.tileSize)
        }
    }
    updateGameGrid(x, z, walkable, grid) {
        /**
         *  Update given grid's state.
         *      @param {number} x - grid coordinate x.
         *      @param {number} z - grid coordinate z.
         *      @param {boolen} walkable - set to true to allow walkable on grid coordinate.
         *      @param {PF.Grid} grid - grid needs to update.
         */
        grid.setWalkableAt(x, z, walkable);
    }
    updateGameGridArea(min, max, walkable, grid) {
        /**
         *  Update given grid's state.
         *      @param {THREE.Vector3 like} min - min position in dynamicScene.
         *      @param {THREE.Vector3 like} max - max position in dynamicScene.
         *      @param {boolen} walkable - set to true to allow walkable on grid coordinate.
         *      @param {PF.Grid} grid - grid needs to update.
         */
        let gridMin = this.sceneToGamegrid(min);
        let gridMax = this.sceneToGamegrid(max, true);

        for (let i = gridMin.x; i <= gridMax.x; i++) {
            if (i < 0 || i >= this.globalVar.gridConfig.width)
                continue;

            for (let k = gridMin.z; k <= gridMax.z; k++) {
                if (k < 0 || k >= this.globalVar.gridConfig.depth)
                    continue;

                this.updateGameGrid(i, k, walkable, grid);
            }
        }
    }
}
