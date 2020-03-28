
const fs = require('fs')
const path = require('path')
const inq = require('inquirer')
const chalk = require('chalk')
const pascal = require('pascalcase')

const root = path.dirname(require.main.filename)
const configFile = path.join(root, 'cb.config.js')

const macros = {
  greenCheck: chalk.greenBright('\u2713'),
  redX: chalk.red('\u2717'),
  blueInfo: chalk.blue('\u2139'),
}

if (!fs.existsSync(configFile)) {
  console.log(macros.redX + ` Could not find the project configuration file at "${configFile}"`);
  console.log(' ')
  process.exit(1)
}

const config = require(configFile)

// Root of component tree
const componentRoot = path.resolve(__dirname, config.componentRoot)

// Default component recipe
const defaultRecipe = {
  type: null,
  location: null,
  name: null,
  properties: {}
}

// Transient recipe
let recipe = defaultRecipe

console.log(chalk.yellowBright('React Component Factory'))
console.log(`Working directory: ${root}\n`)

if (!fs.existsSync(componentRoot)) {
  console.log(macros.redX + ` Specified component root '${componentRoot} not found.`);
  createRoot().then(created => {
    if (!created) {
      console.log(macros.blueInfo + ` Component directory not created. Exiting...`);
      process.exit(0)
    } else {
      fs.mkdirSync(componentRoot)
      console.log(macros.blueInfo + ` Component directory created...`)
      requestComponent()
    }
  })
} else {
  requestComponent()
}

async function createRoot() {
  const res = await inq.prompt({
    type: 'confirm',
    name: 'create',
    message: `Create directory "${componentRoot}"?`
  })
  return res.create
}

/**
 * Whether or not the component exists
 * @param {object} r the current recipe
 * @returns {boolean}
 */
function componentExists(r) {
  return fs.existsSync(getDestLocation(r))
}

/**
 * Get the current destination path based on the provided recipe
 * @param {object} receipe the current recipe
 * @returns {string}
 */
function getDestLocation(receipe) {
  return path.join(componentRoot, receipe.location, `${receipe.name}.tsx`)
}

async function createFolder() {
  const res = await inq.prompt({
    type: 'input',
    name: 'folder',
    message: 'Choose new directory name',
  })
  const name = res.folder.toLowerCase().replace(/[\s_]/, '-')
  const folder = path.join(componentRoot, name)
  fs.mkdirSync(folder)
  return name
}

/**
 * Prompt for component type
 */
async function chooseType() {
  const res = await inq.prompt({
    type: 'list',
    name: 'type',
    message: 'Choose component type',
    choices: [
      {
        value: 'functional',
        name: 'Functional Component'
      },
      {
        value: 'class',
        name: 'Class component'
      },
    ]
  })
  return res.type
}

/**
 * Prompt for subfolder location in component
 * tree
 */
async function chooseLocation() {
  const folders = new Set(fs.readdirSync(componentRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name))

  const res = await inq.prompt({
    type: 'list',
    name: 'dir',
    message: 'Choose component location',
    choices: ['Create Directory', ...Array.from(folders.values())]
  })
  return res.dir
}

/**
 * Prompe for name
 */
async function chooseName() {
  const res = await inq.prompt({
    type: 'input',
    name: 'name',
    message: 'Choose component name (PascalCase)',
  })
  const name = pascal(res.name)
  if (componentExists({ ...recipe, name })) {
    const decision = await chooseOverwriteDecision(name)
    switch (decision) {
      case 'overwrite':
        return name
      case 'rename':
        return await chooseName()
      default:
        return null
    }
  }
  return name
}

async function chooseOverwriteDecision(name) {
  const loc = path.join(componentRoot, recipe.location)
  const confirm = await inq.prompt({
    type: 'expand',
    name: 'overwrite',
    message: `${name} component already exists in ${loc}. What would you like to do? Type 'h' or enter for options...`,
    choices: [
      {
        key: 'o',
        name: `Overwrite ${getDestLocation({ ...recipe, name })}`,
        value: 'overwrite'
      },
      {
        key: 'r',
        name: 'Choose new name',
        value: 'rename'
      },
      {
        key: 'x',
        name: 'Abort',
        value: 'abort'
      }
    ]
  })
  return confirm.overwrite
}

async function chooseProprties() {
  const choices = [
    {
      value: 'props',
      name: 'With React Props',
      checked: true
    },
    {
      value: 'observer',
      name: 'Wrap as @observer',
      checked: recipe.type == 'class'
    }
  ]

  if (recipe.type == 'class') {
    choices.push({
      value: 'observables',
      name: 'Make @observer'
    })
    choices.push({
      value: 'constructor',
      name: 'Create constructor'
    })
  }

  const res = await inq.prompt({
    type: 'checkbox',
    name: 'properties',
    message: 'Select component properties',
    choices
  })
  return res.properties
}

async function confirmRecipe() {
  console.log('')
  console.log(macros.greenCheck + chalk.yellowBright(' Building a component:'))
  console.log(macros.greenCheck + chalk.yellowBright(` Build '${recipe.name}' at ${getDestLocation(recipe)}`))
  console.log('')
  const res = await inq.prompt({
    type: 'confirm',
    name: 'accept',
    message: 'Accept and build?'
  })
  return res.accept
}

async function build() {

  const lines = [
    '',
    `import React from 'react'`
  ]

  if (recipe.properties.indexOf('observables') > -1)
    lines.push(`import { observable } from 'mobx'`)
  if (recipe.properties.indexOf('observer') > -1)
    lines.push(`import { observer } from ${recipe.type == 'class' ? `'mobx-react'` : `'mobx-react-lite'`}`)

  if (recipe.properties.indexOf('props') > -1) {
    lines.push('')
    lines.push(`export interface ${recipe.name}Props {`)
    lines.push('')
    lines.push('}')
  }

  lines.push('')

  if (recipe.properties.indexOf('observer') > -1 && recipe.type == 'class')
    lines.push('@observer')

  const decl = []
  if (recipe.type == 'class') {
    decl.push(`export class ${recipe.name} extends React.Component`)
    if (recipe.properties.indexOf('props') > -1) {
      decl.push(`<${recipe.name}Props>`)
    } else {
      decl.push(`<{}>`)
    }
    decl.push(' {')
  } else {
    decl.push(`export function ${recipe.name}`)
    decl.push(recipe.properties.indexOf('props') > -1 ? `(props: ${recipe.name}Props)` : '()')
    decl.push(': React.ReactElement {')
  }

  lines.push(decl.join(''))
  lines.push('')

  if (recipe.properties.indexOf('constructor') > -1 && recipe.type == 'class') {
    const ctor = []
    ctor.push('  constructor(')
    if (recipe.properties.indexOf('props') > -1) {
      ctor.push(`props: ${recipe.name}Props)`)
    } else {
      ctor.push(`props: {})`)
    }

    ctor.push(` {`)
    lines.push(ctor.join(''))
    lines.push(`    super(props)`)
    lines.push('  }')
    lines.push('')
  }

  if (recipe.type == 'class') {
    lines.push('  render() {')
    lines.push('    return (')
    lines.push('      <React.Fragment />')
    lines.push('    )')
    lines.push('  }')
  } else {
    lines.push(`  return (`)
    lines.push(`    <React.Fragment />`)
    lines.push(`  )`)
  }

  lines.push('}')
  lines.push('')

  if (recipe.type == 'functional' && recipe.properties.indexOf('observer') > -1) {
    lines.push(`export observer(${recipe.name})`)
    lines.push('')
  }

  const content = lines.join('\n')
  const dest = getDestLocation(recipe)
  try {
    fs.writeFileSync(dest, content)
    return content
  } catch (e) {
    throw new Error('Could not write destination file')
  }
}

async function requestComponent() {
  recipe.type = await chooseType()
  recipe.location = await chooseLocation()
  if (recipe.location == 'Create Directory') {
    recipe.location = await createFolder()
  }


  recipe.name = await chooseName()
  if (recipe.name == null) {
    console.log(macros.redX + ' Aborted')
    return
  }

  recipe.properties = await chooseProprties()
  const accept = await confirmRecipe()
  if (accept) {
    try {
      const content = await build()
      console.log('')
      console.log(macros.greenCheck + chalk.yellowBright(` Built component ${getDestLocation(recipe)}:`))
      console.log('')
      console.log(content)
      console.log('')
      recipe = defaultRecipe
      return
    } catch {
      console.log(macros.redX + ' Build Error')
      return
    }
  } else {
    console.log(macros.redX + ' Rejected build...')
    return
  }
}
