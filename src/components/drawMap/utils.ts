/**
 * 加载远程css
 * 可根据 :root 变量判断 防止重复添加
 * @param {string|string[]} url
 * @param {() => boolean} [checkFunc]
 * @param {string} prop
 */
export function loadRemoteCss(url: string | string[], checkFunc: Function, prop: string) {
  return new Promise(async (resolve, reject) => {
    if (typeof url === 'string') {
      fn(url).then(() => {
        resolve(true)
      }).catch(() => {
        reject('样式文件加载失败!,地址链接:' + url)
      })
    } else {
      for (const item of url) {
        if (checkFunc && checkFunc()) {
          break;
        }
        await fn(item)
      }
      if (checkFunc && checkFunc()) {
        resolve(true)
      } else {
        reject('样式文件加载失败!,地址链接:' + url.join(','))
      }
    }

  })

  function fn(path: string) {
    return new Promise((resolve, reject) => {
      let link = document.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = path;
      // @ts-ignore
      link.dataset[prop] = 1
      document.head.appendChild(link);
      link.onload = function (ev) {
        console.log(ev);
        console.log(link.TEXT_NODE);
        resolve(true)
      }
      link.onerror = function (e) {
        reject(e)
      }

    })
  }
}

/**
 * 动态加载脚本
 * @param url 脚本地址
 * @param check 检验是否引入
 * @param prop window属性
 */
export function loadScript(url: string, check = false, prop: string) {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    let document1 = window?.rawWindow?.document || window?.document
    try {
      // @ts-ignore
      if (check) resolve(true)
      let script = document1.createElement("script");
      script.type = "text/javascript";
      // @ts-ignore
      if (script.readyState) {
        // @ts-ignore
        script.onreadystatechange = function () {
          // @ts-ignore
          if (script.readyState == "loaded" || script.readyState == "complete") {
            // @ts-ignore
            script.onreadystatechange = null;
            resolve(true)
          }
        };
      } else {
        script.onload = function () {
          // @ts-ignore
          if (prop && !window[prop] && window.rawWindow && window.rawWindow[prop]) {
            // @ts-ignore
            window[prop] = window.rawWindow[prop]
          }
          resolve(true)

        };
        script.onerror = function (r: any) {
          reject(r)
        }
      }

      script.src = url;
      document1.head.appendChild(script);
    } catch (e) {
      reject(false)
    }
  })

}

/**
 *
 * @param urls 数组
 * @param check 检验是否引入
 * @param prop window属性
 */
export function loadScriptByUrls(urls: string[], prop: string, check: Function) {
  return new Promise((resolve, reject) => {
    fn()

    function fn(urlIndex = 0) {

      let url = urls[urlIndex]
      // @ts-ignore
      let bool1 = !!(window?.rawWindow?.[prop] || window?.[prop])
      if (check) {
        bool1 = check()
      }
      loadScript(url, bool1, prop)
          .then(() => {
            // @ts-ignore
            let value = window.rawWindow?.[prop] || window?.[prop]
            resolve(value)
          })
          .catch(() => {
            if (urlIndex + 1 > urls.length - 1) {
              reject(false)
            } else {
              fn(urlIndex + 1)
            }
          })
    }
  })

}


export function initDefaultProps<T extends object>(props: object, defaultProps: T): T {
  // @ts-ignore
  let obj: T = {...props}
  Object.keys(defaultProps).forEach(key => {
    // @ts-ignore
    if (props[key] === undefined && typeof defaultProps[key] !== "object") {
      // @ts-ignore
      obj[key] = defaultProps[key]
      //@ts-ignore
    } else if (Array.isArray(defaultProps[key]) && defaultProps[key].length > 0 && (!props[key] || props[key].length === 0)) {
      // @ts-ignore
      obj[key] = [...defaultProps[key]]
      // @ts-ignore
    } else if (Array.isArray(props[key])) {
      // @ts-ignore
      obj[key] = [...props[key]]
      // @ts-ignore
    } else if (typeof defaultProps[key] === "object" && defaultProps[key] !== null) {
      // @ts-ignore
      obj[key] = initDefaultProps(obj[key] || {}, defaultProps[key])
    }
  })
  return obj
}
