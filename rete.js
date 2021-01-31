
const Rete = require('rete');
const ConnectionPlugin = require('rete-connection-plugin');
const AlightRenderPlugin = require('rete-alight-render-plugin');
const AreaPlugin = require('rete-area-plugin');
const fs = require('fs');

var numSocket = new Rete.Socket('Number value');
var strSocket = new Rete.Socket('String value');

class NumControl extends Rete.Control {

    constructor(emitter, key, readonly) {
        super();
        this.emitter = emitter;
        this.key = key;
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
        super();
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
        var inp1 = new Rete.Input("Number", numSocket);
        var inp2 = new Rete.Input("Number", numSocket);
        var out = new Rete.Output("Number", numSocket);

        inp1.addControl(new NumControl(this.editor, 'num1'))
        inp2.addControl(new NumControl(this.editor, 'num2'))

        return node
            .addInput(inp1)
            .addInput(inp2)
            .addControl(new NumControl(this.editor, null, true))
            .addOutput(out);
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
        var vars=[];
        var inps=[];
        var i = 0;
        if(this.variablesData != undefined){
            for(const v of this.variablesData)
            {
                console.log(v.varName);
                vars[i] = new Rete.Input(v.varName, new Rete.Socket(v.varType + ' value') );
                if(v.varType == "String"){
                    //vars[i].addControl(new StringControl(this.editor, v.varName));
                    node
                        .addControl(new StringControl(this.editor, null))
                        //.addInput(vars[i]);

                }
                if(v.varType == "Int"){
                    vars[i].addControl(new NumControl(this.editor, v.varName));
                    node
                        .addControl(new NumControl(this.editor, v.VarName))
                        //.addInput(vars[i]);
                }
                i++;
            }
        }
        i=0;
        if(this.inputsData != undefined){
            for(const v of this.inputsData)
            {
                inps[i] = new Rete.Input(v.VarName, new Rete.Socket(v.PortType + ' value') );
                if(v.PortType == "String")
                    inps[i].addControl(new StringControl(this.editor, v.VarName));
                if(v.PortType == "Int")
                    inps[i].addControl(new NumControl(this.editor, v.VarName));
                node
                    .addControl(new StringControl(this.editor, null))
                    .addInput(inps[i]);
                i++;
            }
        }
        i=0;

        if(this.outputsData != undefined){
            console.log("ttttttt");

            for(const v of this.outputsData)
            {
                console.log("ttttttt");
                const out = new Rete.Output(v.VarName, new Rete.Socket(v.PortType + ' value') );
                //out.addControl(new NumControl(this.editor, v.VarName));

                node
                    .addControl(new NumControl(this.editor, v.VarName))
                    .addOutput(out);
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
    var json = fs.readFileSync('./Modules.json'); //(with path)
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
    console.log("leeeeeeeeeeeeee");
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

    var components = [new NumComponent(), new AddComponent()];

    editor = new Rete.NodeEditor('demo@0.1.0', container);
    editor.use(ConnectionPlugin, { curvature: 0.4 });
    editor.use(AlightRenderPlugin);
    editor.use(AreaPlugin);
    //editor.use(MinimapPlugin);

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
    myNode.position = [80,100];
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

    editor.connect(n1.outputs[0], add.inputs[0]);
    editor.connect(n2.outputs[0], add.inputs[1]);


    editor.on('process nodecreated noderemoved connectioncreated connectionremoved', async () => {
        await engine.abort();
        await engine.process(editor.toJSON());
    });

    editor.view.resize();
    editor.trigger('process');

    console.log(data);

}
