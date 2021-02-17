const regeneratorRuntime = require("regenerator-runtime");


const Rete = require('rete');
const ConnectionPlugin = require('rete-connection-plugin');
const AlightRenderPlugin = require('rete-vue-render-plugin');
const AreaPlugin = require('rete-area-plugin');
//const TaskPlugin = require('rete-task-plugin');
//const ContextMenuPlugin = require('./context-menu/index.js');
const ContextMenuPlugin = require('./rete-context-menu-plugin');
//const { ContextMenuPlugin, Menu, Item, Search } = require('rete-context-menu-plugin');
const fs = require('fs');

var numSocket = new Rete.Socket('Number value');
var strSocket = new Rete.Socket('String value');

class NumControl extends Rete.Control {

    constructor(emitter, key, readonly) {
        super(key);
        this.emitter = emitter;
        //this.key = key;
        this.template = '<input type="number" :readonly="readonly" :value="value" @input="change($event)"/>';

       this.scope = {
            value: 0,
            readonly,
            change: this.change.bind(this)
        };
    }

    change(e){
        this.scope.value = +e.target.value;
        this.update();
    }

    update(){
        if(this.key)
            this.putData(this.key, this.scope.value)
        this.emitter.trigger('process');
        this._alight.scan();
    }

    mounted() {
        this.scope.value = this.getData(this.key) || 0;
        this.update();
    }

    setValue(val) {
        this.scope.value = val;
        this._alight.scan()
    }
}

class StringControl extends Rete.Control {

    constructor(emitter, key, readonly) {
        super(key);
        this.emitter = emitter;
        this.key = key;
        this.template = '<input type="text" :readonly="readonly" :value="value" @input="change($event)"/>';

       this.scope = {
            value: 0,
            readonly,
            change: this.change.bind(this)
        };
    }

    change(e){
        this.scope.value = +e.target.value;
        this.update();
    }

    update(){
        if(this.key)
            this.putData(this.key, this.scope.value)
        this.emitter.trigger('process');
        this._alight.scan();
    }

    mounted() {
        this.scope.value = this.getData(this.key) || 0;
        this.update();
    }

    setValue(val) {
        this.scope.value = val;
        this._alight.scan()
    }
}

class NumComponent extends Rete.Component {

    constructor(){
        super("Number");
    }

    builder(node) {
        var out1 = new Rete.Output("Number", numSocket);

        return node.addControl(new NumControl(this.editor, 'num')).addOutput(out1);
    }

    worker(node, inputs, outputs) {
        outputs[0] = node.data.num;
    }
}


class AddComponent extends Rete.Component {
    constructor(){
        super("Add");
    }

    builder(node) {
        const inp1 = new Rete.Input('num1', 'Number', numSocket);
        const inp2 = new Rete.Input('num2', 'Number', numSocket);
        const out = new Rete.Output('num', 'Number', numSocket);

        inp1.addControl(new NumControl(this.editor, 'num1'))
        inp2.addControl(new NumControl(this.editor, 'num2'))
        console.log(inp1);

        node.addInput(inp1)
            .addInput(inp2)
            .addControl(new NumControl(this.editor,'num', true))
            .addOutput(out);
        console.log(node);

    }

    worker(node, inputs, outputs) {
        var n1 = inputs[0].length?inputs[0][0]:node.data.num1;
        var n2 = inputs[1].length?inputs[1][0]:node.data.num2;
        var sum = n1 + n2;

        this.editor.nodes.find(n => n.id == node.id).controls[0].setValue(sum);
        outputs[0] = sum;
    }
}
var editor;
class NoAbstractComponent extends Rete.Component{
    constructor(name,variables,inputs,outputs){
        super(name);
        this.variablesData = variables;
        this.inputsData = inputs;
        this.outputsData = outputs;
    }
    builder(node) {
        if(this.variablesData != undefined){
            let i = 1;
            for(const v of this.variablesData)
            {
                console.log(v.varName);
                if(v.varType == "String"){
                    node.addControl(new StringControl(this.editor, 'num'))

                }
                if(v.varType == "Int"){
                    console.log(v.varName + "2");

                    node.addControl(new NumControl(this.editor, 'num'))
                }
            }
        }
        if(this.inputsData != undefined){
            let i = 1;
            for(const v of this.inputsData)
            {
                const inp = new Rete.Input('num'+i, 'Number'+i++, numSocket, true);
                console.log(inp);

                node.addInput(inp);
            }
        }

        if(this.outputsData != undefined){
            let i = 1;

            for(const v of this.outputsData)
            {
                console.log("ttttttt");
                const out = new Rete.Output('num'+i, 'Number'+i++, numSocket, false);
                console.log(out);

                node.addOutput(out);
            }
        }
        return node;
    }
    worker(node, inputs, outputs) {
        for(const o in outputs){
            this.outputs[o] = node.data.this.outputsData[o];
        }
    }
}

function loadModules(){
    var json = fs.readFileSync('./Modules.json');
    var data = JSON.parse(json);
    console.log(data);
    var modules = [];
    for (const m of data.Modules){
        console.log(m.Name);
        var name = m.Name;
        var variables = m.Variables;
        var inputs = m.IO.Inputs;
        var outputs = m.IO.Outputs;

        var newModule = new NoAbstractComponent(name,variables,inputs,outputs);
        modules.push(newModule);
    }
    console.log(modules[0].name);

    return modules;
}

exports.saveProject = function saveProject(){
    function download(content, fileName, contentType) {
        var a = document.createElement("a");
        var file = new Blob([content], {type: contentType});
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
    }
    download(JSON.stringify(editor.toJSON()), 'json.json', 'text/plain');
}

exports.readProject = function readProject(){
    console.log("leeeeeeeeeeeeee");
}

exports.createEditor = async (container) => {

    editor = new Rete.NodeEditor('JuliaVisual@0.1.0', container);
    editor.use(ConnectionPlugin.default, { curvature: 0.4 });
    editor.use(AlightRenderPlugin.default);
    editor.use(AreaPlugin);
    editor.use(ContextMenuPlugin.default);


    // editor.use(TaskPlugin);
    // editor.use(MinimapPlugin);
    var components = [new NumComponent(), new AddComponent()];

    var engine = new Rete.Engine('demo@0.1.0');

    components.map(c => {
        editor.register(c);
        engine.register(c);
    });

    const data = editor.toJSON();
    var modules = loadModules();

    modules.map(c => {
        editor.register(c);
        engine.register(c);
    });

    var myNode = await modules[0].createNode({Data:"ddw"});
    myNode.position = [80,200];
    editor.addNode(myNode);
    var myNode = await modules[2].createNode({Data:"ddw"});
    myNode.position = [80,100];
    editor.addNode(myNode);


    var n1 = await components[0].createNode({num: 2});
    var n2 = await components[0].createNode({num: 0});
    var add = await components[1].createNode();

    n1.position = [80, 200];
    n2.position = [80, 400];
    add.position = [500, 240];

    editor.addNode(n1);
    editor.addNode(n2);
    editor.addNode(add);
    console.log(n1.outputs[0]+"\n"+ add.inputs[0]);

    editor.connect(n1.outputs[0], add.inputs[0]);
    editor.connect(n2.outputs[0], add.inputs[1]);


    editor.on('process nodecreated noderemoved connectioncreated connectionremoved', async () => {
        await engine.abort();
        await engine.process(editor.toJSON());
    });

    editor.view.resize();
    editor.trigger('process');

    //console.log(data);

}
