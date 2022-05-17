# Pure CSS toggle switch

## [demo](https://magic-akari.github.io/toggle-switch)

## install

```
npm i toggle-switch-css
```

or

```
yarn add toggle-switch-css
```

## use

```html
<label class="toggle-switch my-toggle-switch">
    <input type="checkbox" id="toggle-switch-input" class="toggle-switch-input" />
    <label for="toggle-switch-input" class="toggle-switch-label"></label>
    toggle
</label>
```

default css variables

```css
.toggle-switch {
    --bar-height: 14px;
    --bar-width: 32px;
    --bar-color: #eee;
    --knob-size: 20px;
    --knob-color: #fff;
    --switch-offset: calc(var(--knob-size) - var(--bar-height));
    --switch-width: calc(var(--bar-width) + var(--switch-offset));
    --transition-duration: 200ms;
    --switch-transition: all var(--transition-duration) ease-in-out;
    --switch-theme-rgb: 26, 115, 232;
    --switch-theme-color: rgb(var(--switch-theme-rgb));
    --switch-box-shadow: 0 0 var(--switch-offset) #11111180;
    --switch-margin: 8px;
}
```
