//=============================================================================
// Farming.js
//=============================================================================

/*:
 * @plugindesc A simple farming plugin
 * @author Yunt
 *
 * @help Use Farming farm plugin command to call out the menu on an event
 * @param Seed ID
 * @desc ID for all the seeds, seperate by a single space
 * Should match the order of Crop ID
 * @default 11 12
 * 
 * @param Crop ID
 * @desc ID for all the seeds, seperate by a single space
 * Should match the order of Seed ID
 * @default 13 14
 *  
 * @param Fertilizer ID
 * @desc The ID for Fertilizer
 * @default 20
 * 
 */
class Crop {
    constructor(seedId, cropId, eventId, mapId){
        this.MAX_STAGE = 2;
        this.stage = 0;
        this._eventID = eventId;
        this._mapID = mapId;
        this.seedID = seedId;
        this.cropID = cropId;
    }
    grow(){
        if (this.stage < this.MAX_STAGE)
            this.stage++;
    }
    harvest(){
        return this.stage === this.MAX_STAGE;
    }
    equals(eventId, mapId){
        return eventId === this._eventID && mapId === this._mapID;
    }
}
let params = PluginManager.parameters('Farming');
let seedIds = String(params['Seed ID']).split(' ').map(x=>Number(x));
let cropIds = String(params['Crop ID']).split(' ').map(x=>Number(x));
let fertilizerId = String(params['Fertilizer ID']);

(function(){
    // Fields
    let crops = [];
    let activeEventId = null;
    let activeMapId = null
    let _temp_pluginCommand = 
        Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = (command, args)=>{
        _temp_pluginCommand.call(this, command, args);
        if (command === 'Farming'){
            switch (args[0]){
                case 'farm':
                    activeEventId = $gameMap.eventIdXy($gamePlayer.x, $gamePlayer.y);
                    activeMapId = $gameMap._mapId;
                    SceneManager.push(Farming_Scene);
                    break;
            }
        }
    }
    class Seed_Window extends Window_Command{
        constructor(){
            super();
            this.initialize.apply(this, arguments);
        }
        initialize(x, y){
            super.initialize(x, y, 240, this.fittingHeight(4));
            this.refresh();
        }
        makeCommandList(){
            for (let i=0; i<seedIds.length; i++){
                this.addCommand($dataItems[seedIds[i]].name, null, 
                                ($gameParty.numItems($dataItems[seedIds[i]]) > 0));
            }
        }
        maxCols(){
            return 2;
        }
        callOkHandler(){
            super.callOkHandler();
            let index = this.index();
            activeEventId = $gameMap.eventIdXy($gamePlayer.x, $gamePlayer.y);
            activeMapId = $gameMap._mapId;
            if ($gameParty.numItems($dataItems[seedIds[index]]) > 0){
                crops.push(new Crop(seedIds[index], cropIds[index],
                                    activeEventId, activeMapId))
                $gameParty.loseItem($dataItems[seedIds[index]], 1);             
                $gameMessage.add('Planted ' + $dataItems[seedIds[index]].name);
            } else{
                $gameMessage.add('You do not have any seeds');
            }
            SceneManager.goto(Scene_Map);
            console.log(crops);
        }
    }
    class Farming_Window extends Window_Command {
        constructor(){
            super();
            this.initialize.apply(this, arguments);
        }
        initialize(x, y){
            super.initialize(x, y, 240, this.fittingHeight(4));
            this.refresh();
            this.select(0);
            this.activate();
        }
        makeCommandList(){
            let hasCrop = (this.getCrop() >= 0);
            this.addCommand('Plant', 'plant', !hasCrop);
            this.addCommand('Fertilize', 'fertilize', hasCrop && !crops[this.getCrop()].harvest());
            this.addCommand('Harvest', 'harvest', hasCrop && crops[this.getCrop()].harvest());
            this.addCommand('Status', 'status', true);
        }
        maxItems(){
            return 4;
        }
        callOkHandler(){
            super.callOkHandler();
            switch(this.index()){
                case 0:
                    this.plant();
                    break;
                case 1:
                    this.fertilize();
                    SceneManager.goto(Scene_Map);
                    break;
                case 2:
                    this.harvest();
                    SceneManager.goto(Scene_Map);
                    break;
                case 3:
                    this.status();
                    SceneManager.goto(Scene_Map);
                    break;
            }
            activeEventId = null;
            activeMapId = null;
        }
        plant(){
            this.callHandler('plant');
        }   
        fertilize(){
            if ($gameParty.numItems($dataItems[fertilizerId]) > 0){
                $gameParty.loseItem($dataItems[fertilizerId], 1);
                crops[this.getCrop()].grow();
                $gameMessage.add('Used 1 fertilizer (' + 
                                $gameParty.numItems($dataItems[fertilizerId]) + 
                                ' left)');
            } else{
                $gameMessage.add('You do not have any fertilizer');
            }
        }
        harvest(){
            $gameMessage.add('Harvest ' + 
                                $dataItems[crops[this.getCrop()].cropID].name);
            $gameParty.gainItem($dataItems[crops[this.getCrop()].cropID], 1);
            crops.splice(this.getCrop(), 1);
        }
        status(){
            if (!(this.getCrop() >= 0)){
                $gameMessage.add('We can plant something here');
            }else{
                $gameMessage.add($dataItems[crops[this.getCrop()].seedID].name + 
                                 ' is growing here: '+crops[this.getCrop()].stage+
                                 '/'+crops[this.getCrop()].MAX_STAGE);
            }
        }
        getCrop(){
            for (let i=0; i<crops.length; i++){
                if (crops[i].equals(activeEventId, activeMapId)){
                    return i;
                }
            }
            return -1;
        }
    }
    class Farming_Scene extends Scene_MenuBase {
        constructor () {
            super();
            this.initialize.apply(this, arguments);
        }
        create () {
            super.create();
            this._cropsWindow = new Farming_Window(0,0);
            this._seedWindow = new Seed_Window(240,0);
            this._cropsWindow.setHandler('plant', this.plant.bind(this));
            this.addWindow(this._cropsWindow);
            this.addWindow(this._seedWindow);
            this._seedWindow.deactivate();
            this._seedWindow.deselect();
        }
        plant(){
            console.log('here');
            this._cropsWindow.deselect();
            this._seedWindow.activate();
            this._seedWindow.select(0);
        }
        update () {
            super.update();
            if (Input.isTriggered('cancel')){
                SceneManager.goto(Scene_Map);
            }
        }
    }
})();