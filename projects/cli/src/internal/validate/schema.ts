const globalAttrs = new Set([
  'class',
  'id',
  'style',
  'title',
  'lang',
  'dir',
  'hidden',
  'tabindex',
  'accesskey',
  'draggable',
  'spellcheck',
  'translate',
  'autofocus',
  'contenteditable',
  'enterkeyhint',
  'inputmode',
  'is',
  'itemid',
  'itemprop',
  'itemref',
  'itemscope',
  'itemtype',
  'nonce',
  'slot',
  'part',
  'exportparts',
  'popover',
  'popovertarget',
  'popovertargetaction',
  'inert',
  'role'
]);

const nativeEventHandlers = new Set([
  'onabort',
  'onauxclick',
  'onbeforeinput',
  'onbeforematch',
  'onbeforetoggle',
  'onblur',
  'oncancel',
  'oncanplay',
  'oncanplaythrough',
  'onchange',
  'onclick',
  'onclose',
  'oncontextlost',
  'oncontextmenu',
  'oncontextrestored',
  'oncopy',
  'oncuechange',
  'oncut',
  'ondblclick',
  'ondrag',
  'ondragend',
  'ondragenter',
  'ondragleave',
  'ondragover',
  'ondragstart',
  'ondrop',
  'ondurationchange',
  'onemptied',
  'onended',
  'onerror',
  'onfocus',
  'onformdata',
  'ongotpointercapture',
  'oninput',
  'oninvalid',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onload',
  'onloadeddata',
  'onloadedmetadata',
  'onloadstart',
  'onlostpointercapture',
  'onmousedown',
  'onmouseenter',
  'onmouseleave',
  'onmousemove',
  'onmouseout',
  'onmouseover',
  'onmouseup',
  'onpaste',
  'onpause',
  'onplay',
  'onplaying',
  'onpointercancel',
  'onpointerdown',
  'onpointerenter',
  'onpointerleave',
  'onpointermove',
  'onpointerout',
  'onpointerover',
  'onpointerup',
  'onprogress',
  'onratechange',
  'onreset',
  'onresize',
  'onscroll',
  'onscrollend',
  'onsecuritypolicyviolation',
  'onseeked',
  'onseeking',
  'onselect',
  'onslotchange',
  'onstalled',
  'onsubmit',
  'onsuspend',
  'ontimeupdate',
  'ontoggle',
  'ontouchcancel',
  'ontouchend',
  'ontouchmove',
  'ontouchstart',
  'ontransitioncancel',
  'ontransitionend',
  'ontransitionrun',
  'ontransitionstart',
  'onvolumechange',
  'onwaiting',
  'onwheel'
]);

export function isGlobalAttr(name: string): boolean {
  if (globalAttrs.has(name)) return true;
  if (name.startsWith('data-')) return true;
  if (name.startsWith('aria-')) return true;
  if (nativeEventHandlers.has(name)) return true;
  return false;
}

export function isCustomElement(tag: string): boolean {
  return tag.includes('-');
}

export function parseEventName(attrName: string): {
  name: string;
  isEvent: boolean;
} {
  if (attrName.startsWith('@')) {
    return { name: attrName.slice(1), isEvent: true };
  }
  if (attrName.startsWith('(') && attrName.endsWith(')')) {
    return { name: attrName.slice(1, -1), isEvent: true };
  }
  if (attrName.startsWith('on-')) {
    return { name: attrName.slice(3), isEvent: true };
  }
  if (nativeEventHandlers.has(attrName)) {
    return { name: attrName.slice(2), isEvent: true };
  }
  return { name: '', isEvent: false };
}

export function parseAttrValues(typeText: string): string[] | undefined {
  if (!typeText) return undefined;

  const parts = typeText.split('|');
  const values: string[] = [];

  for (let part of parts) {
    part = part.trim();
    if ((part.startsWith("'") && part.endsWith("'")) || (part.startsWith('"') && part.endsWith('"'))) {
      values.push(part.slice(1, -1));
    } else {
      return undefined;
    }
  }

  return values;
}
