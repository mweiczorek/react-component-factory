# React Component Factory

Just a simple CLI program to create React components for my projects.

## Define Root Component Directory

Create a file called `rcf.config.js` and place in project root.

```
const path = require('path')
module.exports = {
  componentRoot: path.join(__dirname, 'src/views')
}
```

## Installation

Install globally.

`npm i -g @nolawnchairs/react-component-factory`

## Usage

Simple call `rcf` and follow the instructions

### Choose Component Type

* Functional (create a `React.FC` component)
* Class (create a class component)

### Choose component Location

Choose the location from the list of directories (all of which are found under the root directory established by the config file).

If the component needs to be placed in a new directory, you can create one using the first option **Create Directory**

### Choose component Name

Choose the name of the component, which must be in `PascalCase`. The `pascal-case` library will convert automatically.

### Select Component Properties

Check the options that apply:

* **With React props** - this option adds a props interface where you can define the expected props
* **Wrap with mobx observer** (functional only) - this wraps the component with Mobx's `observer` function so it will react to `@observable` changes
* **Decorate as mobx @observer** (class only) - this decorates the component class with Mobx's `@observer` decorator so it will react to `@observable` changes
* **Create constructor** (class only) - create the class component with a constructor

### Choose React Props options
This option is only presented if *With React props* was selected in the previous step.

* **Props contain children** - this option will wrap the prop interface in the function/class props with `React.PropsWithChildred<T>`. This will add `children` to the prop definitions so it can be added to the component.
* **Include default props** - this will add a default props object to the module (for functional components) or to the class as a static member (for class components). It will be typed as `Partial<Props>`

## Accept and build?

Default option is `y` and will create the component! Choosing `n` will abort its creation.

