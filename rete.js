
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
        this.variables = variables;
        this.inputs = inputs;
        this.outputs = outputs;
    }
    builder(node) {
        var vars[];
        var inps[];
        var outs[];
        var i = 0;
        for(const var of this.Variables)
        {
            vars[i] = new Rete.Input(var.varName, new Rete.Socket(var.varType + ' value') );
            if(var.varType == "String")
                vars[i].addControl(new StringControl(this.editor, varName));
            if(var.varType == "Int")
                vars[i].addControl(new NumControl(this.editor, varName));
                node.addInput(var[i]);
            i++;
        }
        i=0;
        for(const in of this.Inputs)
        {
            vars[i] = new Rete.Input(var.varName, new Rete.Socket(var.varType + ' value') );
            if(var.varType == "String")
                inps[i].addControl(new StringControl(this.editor, varName));
            if(var.varType == "Int")
                inps[i].addControl(new NumControl(this.editor, varName));
                node.addInput(inps[i]);
            i++;
        }
        i=0;
        for(const out of this.Outputs)
        {
            outs[i] = new Rete.Input(var.varName, new Rete.Socket(var.PortType + ' value') );
            node.addInput(outs[i]);
            i++;
        }
        return node;
    }

}

function loadModules(){
    var json = fs.readFileSync('./Modules.json'); //(with path)
    var data = JSON.parse(json);
    console.log(data);
    for (const m of data.Modules){
        console.log(data.Modules[m].Name);
        var name = m.Name;
        var variables = m.Variables;
        var inputs = m.Inputs;
        var outputs = m.Outputs;

        var newModule = new Rete.Component(name,variables,inputs,outputs);
    }

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

    const data = editor.toJSON();
    loadModules();

    editor.on('process nodecreated noderemoved connectioncreated connectionremoved', async () => {
        await engine.abort();
        await engine.process(editor.toJSON());
    });

    editor.view.resize();
    editor.trigger('process');

    console.log(data);

}
