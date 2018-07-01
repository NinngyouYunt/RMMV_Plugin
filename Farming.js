//=============================================================================
// Farming.js
//=============================================================================

/*:
 * @plugindesc A simple farming plugin
 * @author Yunt
 *
 * @help Use Farming farm plugin command to call out the menu on an event
 *
 * @param growtime
 * @desc Growtime
 * @default 0
 * 
 * @param Seed ID
 * @desc The id for all the seeds, seperate by a single space
 * Should match the order of Crop ID
 * @default 11 12
 * 
 * @param Crop ID
 * @desc The id for all the seeds, seperate by a single space
 * Should match the order of Seed ID
 * @default 13 14
 *  
 * 
 */
class Crop {
    constructor(seedId, cropId, eventId, mapId){
        this.MAX_STAGE = 2;
        this.stage = 0;
        this._eventID = eventId;
        this._mapID = mapId;
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
    class Farming_Window extends Window_Command {
        constructor(){
            super();
            this.initialize.apply(this, arguments);
        }
        initialize(x, y){
            super.initialize(x, y, 240, this.fittingHeight(4));
            this.refresh();
            this.activate();
        }
        makeCommandList(){
            let hasCrop = (this.getCrop() >= 0);
            this.addCommand('Plant', null, !hasCrop);
            this.addCommand('Fertilize', null, hasCrop);
            this.addCommand('Harvest', null, hasCrop);
            this.addCommand('Status', null, true);
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
                    break;
                case 2:
                    this.harvest();
                    break;
                case 3:
                    this.status();
                    break;
            }
            console.log(activeEventId, activeMapId);
            activeEventId = null;
            activeMapId = null;
            SceneManager.goto(Scene_Map);
            console.log(crops);
        }
        plant(){
            crops.push(new Crop(11, 12, activeEventId, activeMapId))
            $gameMessage.add('Planted');
        }   
        fertilize(){
            if (crops[this.getCrop()].harvest()){
                $gameMessage.add('It is ready to be harvested');
            }
            else{
                crops[this.getCrop()].grow();
                $gameMessage.add('Fertilized');
            }
        }
        harvest(){
            if (crops[this.getCrop()].harvest()){
                crops.splice(this.getCrop(), 1);
                $gameMessage.add('Harvest xx');
            }
            else{
                $gameMessage.add('It is still growing');
            }
        }
        status(){
            if (!(this.getCrop() >= 0)){
                $gameMessage.add('We can plant something here');
            }else{
                $gameMessage.add('It is growing: '+crops[this.getCrop()].stage+
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
            this._cropsWindow = new Farming_Window();
            this._cropsWindow.x = 0;
            this._cropsWindow.y = 0;
            this.addWindow(this._cropsWindow);
        }
        update () {
            super.update();
            if (Input.isTriggered('cancel')){
                SceneManager.goto(Scene_Map);
            }
        }
    }
})();