# Implicit Conversion

## Arithmetic Operations

### Addition

#### `string` + `any`

##### String concatenation, non-`string` types are converted to `string`

#### `number` + primitive types except `string`

##### Non-`number` types are converted to `number`

#### `number` + non-primitive

##### Both sides are converted to `string`

### Subtraction, Multiplication, Division

#### Non-`number` types on either side are converted to `number`

## Logical Operations

### As standalone conditions

#### `null`, `undefined`, `''`, `NaN`, `±0`, `0n`, `false`

##### falsy <sup>[1](#falsy)</sup>

#### Others

##### Truthy

### Non-strict comparison `==`

#### `NaN` == `any`

##### false - including `NaN` == `NaN`

#### `boolean` == `other`

##### `boolean` converted to `number`

#### `string` == `number`

##### `string` converted to `number`

#### `null` == `any`

##### true when `any` is `null` or `undefined`

##### false otherwise

#### `undefined` == `any`

##### true when `any` is `null` or `undefined`

##### false otherwise

#### Primitive == Non-primitive

##### Non-primitive converted to primitive before comparison <sup>[2](#toPrimitive)</sup>
