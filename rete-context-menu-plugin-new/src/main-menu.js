const { createNode, traverse } = require( './utils');
//const Menu = require( './menu/index');
const Vue = require( 'vue');

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

 class MainMenu extends Menu {
    constructor(editor, props, vueComponent, { items, allocate, rename }) {
        super(editor, props, vueComponent);

        const mouse = { x: 0, y: 0 };

        editor.on('mousemove', ({ x, y }) => {
            mouse.x = x;
            mouse.y = y;
        });

        for(const component of editor.components.values()) {
            const path = allocate(component);

            if (Array.isArray(path)) { // add to the menu if path is array
                this.addItem(rename(component), async () => {
                    editor.addNode(await createNode(component, mouse));
                }, path);
            }
        }

        traverse(items, (name, func, path) => this.addItem(name, func, path))
    }
}
