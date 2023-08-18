// hex转rgba第一种
const hex2Rgb = (hexValue: string, alpha = 1) => {
  const rgx = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const hex = hexValue.replace(rgx, (_, r, g, b) => r + r + g + g + b + b);
  const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!rgb) {
    return hexValue;
  }
  const r = parseInt(rgb[1], 16),
      g = parseInt(rgb[2], 16),
      b = parseInt(rgb[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
};
// hex转rgba第二种
const hex2Rgba = (bgColor: string, alpha = 1) => {
  let color = bgColor.slice(1); // 去掉'#'号
  let rgba = [
    parseInt("0x" + color.slice(0, 2)),
    parseInt("0x" + color.slice(2, 4)),
    parseInt("0x" + color.slice(4, 6)),
    alpha
  ];
  return "rgba(" + rgba.toString() + ")";
};
//十进制转hex
const getred = (color: number) => {
  return (color & 0xff0000) >> 16;
};

const getgreen = (color: number) => {
  return (color & 0x00ff00) >> 8;
};

const getblue = (color: number) => {
  return color & 0x0000ff;
};
const Rgb2Hex = (color: number) => {
  const r = getred(color);
  const g = getgreen(color);
  const b = getblue(color);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * rgba转rgb
 * @param color
 */
const rgba2rgb =(color:string) =>{
  const reg = /rgba\((.+)\)/;
  const result = reg.exec(color);
  if(result){
    const arr = result[1].split(',');
    const r = arr[0];
    const g = arr[1];
    const b = arr[2];
    const a = arr[3];
    return {
      color: `rgb(${r},${g},${b})`,
      alpha: a
    };
  }
  return {
    color,
    alpha: 1
  };
}

/**
 * 颜色转换
 * @param color
 * @param alpha
 * @constructor
 */
function colorTransform(color: string, alpha: number = 1) {
  if (color?.startsWith('#')) {
    return hex2Rgba(color, alpha);
  }
  if (color?.startsWith('rgb') && !color?.startsWith('rgba')) {
    return color.replace('rgb', 'rgba').replace(')', `,${alpha})`);
  }
  return color.replace(/,\d\)/, `,${alpha})`);
}

export {
  colorTransform,
  Rgb2Hex,
  hex2Rgb,
  rgba2rgb
}
