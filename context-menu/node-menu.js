//const Menu = require( './menu/index');
const { createNode, traverse } = require( './utils');


  class Menu{

    constructor(editor, props, vueComponent) {
        const el = document.createElement('div');

        editor.view.container.appendChild(el);

        this.menu = new Vue({
            render: h => h(vueComponent || Menu, { props })
        }).$mount(el);
    }

    addItem(...args) {
        this.menu.$emit('additem', ...args);
    }

    show(...args) {
        this.menu.$emit('show', ...args);
    }

    hide() {
        this.menu.$emit('hide');
    }
}

class NodeMenu extends Menu {
    constructor(editor, props, vueComponent, nodeItems) {
        super(editor, props, vueComponent);

        if (nodeItems['Delete'] !== false) {
            this.addItem('Delete', ({ node }) => editor.removeNode(node));
        }
        if (nodeItems['Clone'] !== false) {
            this.addItem('Clone', async (args) => {
                const { name, position: [x, y], params } = args.node;
                const component = editor.components.get(name);
                const node = await createNode(component, { params, x: x + 10, y: y + 10 });

                editor.addNode(node);
            });
        }

        traverse(nodeItems, (name, func, path) => this.addItem(name, func, path))
    }
}
