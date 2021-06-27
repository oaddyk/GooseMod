let css = '';
let toSaveNext = false;

export const init = () => {
  injectHooks();

  setInterval(() => { // Use interval to only save every 10s max
    if (!toSaveNext) return;
    toSaveNext = false;

    save();
  }, 10000);
};

const save = () => {
  [...document.body.classList].forEach((x) => { // A lot of (old) GM css relies on body classes for settings, so replace all body.<existing_class> to body
    css = css.replace(new RegExp(`body.${x}`, 'g'), `body`)
  });

  localStorage.setItem('goosemodCSSCache', css);

  // goosemod.showToast('Saved', { subtext: 'CSS Cache' });
};

const injectHooks = () => {
  const triggerSave = () => toSaveNext = true;

  const _insertRule = CSSStyleSheet.prototype.insertRule;
  const _appendChild = Node.prototype.appendChild;

  CSSStyleSheet.prototype.insertRule = function(cssText) {
    _insertRule.apply(this, arguments);

    css += cssText;
    triggerSave();
  };

  const elementsToAppendHook = [ document.body, document.head ];

  const hookElement = (parentEl) => {
    parentEl.appendChild = function (el) {
      _appendChild.apply(this, arguments);

      if (el.tagName === 'STYLE') { // Style element
        if (el.id.startsWith('ace')) return; // Ignore Ace editor styles

        console.log('caught style element being appended, hooking and catching');

        hookElement(el); // Hook so future appends to the style are caught

        for (const t of el.childNodes) { // Catch current CSS
          css += t.textContent;

          console.log('caught current CSS in style element');
        }

        triggerSave();
      }

      if (el.data) { // Text node being appended to style
        css += el.textContent;

        console.log('text node appended to style');

        triggerSave();
      }
    };
  };

  for (const el of elementsToAppendHook) {
    hookElement(el);
  }
};

export const load = () => {
  css = localStorage.getItem('goosemodCSSCache');
  if (!css) return;

  const el = document.createElement('style');
  el.id = `gm-css-cache`;

  el.appendChild(document.createTextNode(css));

  document.body.appendChild(el);

  // goosemod.showToast('Loaded', { subtext: 'CSS Cache' });

  init();
};

export const removeStyle = () => {
  const el = document.getElementById(`gm-css-cache`);
  if (!el) return;

  el.remove();
};