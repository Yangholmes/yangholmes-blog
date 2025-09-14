# 隐式转换

## 算术运算

### 加法

#### `string` + `any`

##### 字符串拼接，非 `string` 类型转换成 `string`

#### `number` + 除了 `string` 外其他原始量

##### 非 `number` 类型转换成 `number` 类型

#### `number` + 非原始量

##### `+` 两边都转换成 `string` 类型

### 减法、乘法、除法

#### 符号两边非 `number` 转换成 `number`

## 逻辑运算

### 作为单独的条件

#### `null`, `undefined`, `''`, `NaN`, `∓0`, `0n`, `false`

##### falsy <sup>[1](#falsy)</sup>

#### 其他

##### true

### 非严格比较 `==`

#### `NaN` == `any`

##### false ，`NaN` == `NaN` 也是 false

#### `boolean` == `else`

##### `boolean` 转换成 `number`

#### `string` == `number`

##### `string` 转换成 `number`

#### `null` == `any`

##### `any` 是 `null` 或 `undefined` 时 true

##### `any` 是其他时 false

#### `undefined` == `any`

##### `any` 是 `null` 或 `undefined` 时 true

##### `any` 是其他时 false

#### 原始量 == 非原始量

##### 非原始量 转换成 原始量 再对比<sup>[2](#toPrimitive)</sup>
